const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarRol } = require('../middlewares/auth');

// Obtener historial completo con filtros
router.get('/historial', verificarRol(['admin', 'usuario']), async (req, res) => {
  try {
    const { tipo, estado, fechaDesde, fechaHasta, busqueda, limit = 100 } = req.query;

    // Construir condiciones dinámicas para ambas tablas
    let whereConditions = [];
    const params = [];

    // Filtro por búsqueda
    if (busqueda) {
      whereConditions.push(`(NOMBRE LIKE ? OR TELEFONO_FIJO LIKE ?)`);
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    // Filtro por fechas
    if (fechaDesde) {
      whereConditions.push(`DATE(CREATED_AT) >= ?`);
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      whereConditions.push(`DATE(CREATED_AT) <= ?`);
      params.push(fechaHasta);
    }

    const whereClause = whereConditions.length > 0
      ? `AND ${whereConditions.join(' AND ')}`
      : '';

    // UNION de ambas tablas para obtener historial completo
    let query = `
      (SELECT
        ID as id,
        'whatsapp' as tipo,
        NOMBRE as paciente,
        TELEFONO_FIJO as numero,
        SERVICIO as servicio,
        FECHA_CITA as fecha_cita,
        CREATED_AT as fecha,
        ESTADO as estado,
        1 as intentos,
        'citas' as origen
      FROM citas
      WHERE ESTADO IN ('recordatorio enviado', 'pendiente', 'cancelada', 'bloqueado')
      ${whereClause})
      UNION ALL
      (SELECT
        ID as id,
        'whatsapp' as tipo,
        NOMBRE as paciente,
        TELEFONO_FIJO as numero,
        SERVICIO as servicio,
        FECHA_CITA as fecha_cita,
        CREATED_AT as fecha,
        ESTADO as estado,
        1 as intentos,
        'historico' as origen
      FROM citas_historico
      WHERE ESTADO IN ('recordatorio enviado', 'pendiente', 'cancelada', 'bloqueado')
      ${whereClause})
      ORDER BY fecha DESC
      LIMIT ?
    `;

    // Duplicar los parámetros para ambas partes del UNION
    const allParams = [...params, ...params, parseInt(limit)];

    const [envios] = await db.query(query, allParams);
    
    // Transformar estados
    const enviosTransformados = envios.map(envio => {
      let estadoTransformado = 'fallido';
      if (envio.estado === 'recordatorio enviado') {
        estadoTransformado = 'exitoso';
      } else if (envio.estado === 'bloqueado') {
        estadoTransformado = 'bloqueado';
      }

      return {
        ...envio,
        estado: estadoTransformado,
        fecha: envio.fecha || envio.fecha_cita
      };
    });
    
    // Filtrar por tipo si se especifica
    let enviosFiltrados = enviosTransformados;
    if (tipo && tipo !== 'todos') {
      // Por ahora solo tenemos WhatsApp en la BD, pero podrías agregar una tabla para llamadas
      enviosFiltrados = enviosTransformados.filter(e => e.tipo === tipo);
    }
    
    // Filtrar por estado si se especifica
    if (estado && estado !== 'todos') {
      enviosFiltrados = enviosFiltrados.filter(e => e.estado === estado);
    }
    
    // Calcular estadísticas
    const stats = {
      total: enviosFiltrados.length,
      exitosos: enviosFiltrados.filter(e => e.estado === 'exitoso').length,
      fallidos: enviosFiltrados.filter(e => e.estado === 'fallido').length,
      bloqueados: enviosFiltrados.filter(e => e.estado === 'bloqueado').length,
      tasaExito: enviosFiltrados.length > 0
        ? ((enviosFiltrados.filter(e => e.estado === 'exitoso').length / enviosFiltrados.length) * 100).toFixed(1)
        : 0
    };
    
    res.json({
      envios: enviosFiltrados,
      stats
    });
    
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: "Error al obtener el historial" });
  }
});

// Obtener estadísticas por rango de fechas
router.get('/estadisticas', verificarRol(['admin', 'usuario']), async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    let whereConditions = ['1=1'];
    const params = [];

    if (fechaDesde) {
      whereConditions.push(`DATE(CREATED_AT) >= ?`);
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      whereConditions.push(`DATE(CREATED_AT) <= ?`);
      params.push(fechaHasta);
    }

    const whereClause = whereConditions.join(' AND ');

    // UNION de ambas tablas para estadísticas completas
    let query = `
      SELECT
        DATE(CREATED_AT) as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN ESTADO = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN ESTADO != 'recordatorio enviado' THEN 1 ELSE 0 END) as fallidos
      FROM (
        SELECT CREATED_AT, ESTADO FROM citas WHERE ${whereClause}
        UNION ALL
        SELECT CREATED_AT, ESTADO FROM citas_historico WHERE ${whereClause}
      ) AS combined
      GROUP BY DATE(CREATED_AT)
      ORDER BY fecha DESC
    `;

    // Duplicar parámetros para ambas partes del UNION
    const allParams = [...params, ...params];

    const [estadisticas] = await db.query(query, allParams);

    res.json(estadisticas);

  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// Obtener detalle de un envío específico
router.get('/historial/:id', verificarRol(['admin', 'usuario']), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar primero en citas
    let [citas] = await db.query(
      `SELECT
        ID as id,
        NOMBRE as paciente,
        TELEFONO_FIJO as numero,
        SERVICIO as servicio,
        PROFESIONAL,
        FECHA_CITA as fecha_cita,
        HORA_CITA as hora_cita,
        CREATED_AT as fecha_envio,
        ESTADO as estado,
        'citas' as origen
      FROM citas
      WHERE ID = ?`,
      [id]
    );

    // Si no se encuentra, buscar en citas_historico
    if (citas.length === 0) {
      [citas] = await db.query(
        `SELECT
          ID as id,
          NOMBRE as paciente,
          TELEFONO_FIJO as numero,
          SERVICIO as servicio,
          PROFESIONAL,
          FECHA_CITA as fecha_cita,
          HORA_CITA as hora_cita,
          CREATED_AT as fecha_envio,
          ESTADO as estado,
          'historico' as origen
        FROM citas_historico
        WHERE ID = ?`,
        [id]
      );
    }

    if (citas.length === 0) {
      return res.status(404).json({ error: "Envío no encontrado" });
    }

    res.json(citas[0]);

  } catch (error) {
    console.error("Error obteniendo detalle:", error);
    res.status(500).json({ error: "Error al obtener el detalle" });
  }
});

// Reintentar envío fallido
router.post('/reintentar/:id', verificarRol(['admin', 'usuario']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Aquí podrías reiniciar el proceso de envío
    // Por ahora solo actualizamos el estado
    await db.query(
      `UPDATE citas SET ESTADO = 'pendiente' WHERE ID = ?`,
      [id]
    );
    
    res.json({ message: "Envío programado para reintentar" });
    
  } catch (error) {
    console.error("Error reintentando envío:", error);
    res.status(500).json({ error: "Error al reintentar el envío" });
  }
});

module.exports = router;