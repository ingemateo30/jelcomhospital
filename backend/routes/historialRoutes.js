const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarRol } = require('../middlewares/auth');

// Obtener historial completo con filtros
router.get('/historial', verificarRol(['admin', 'usuario']), async (req, res) => {
  try {
    const { tipo, estado, fechaDesde, fechaHasta, busqueda, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        ID as id,
        'whatsapp' as tipo,
        NOMBRE as paciente,
        TELEFONO_FIJO as numero,
        SERVICIO as servicio,
        FECHA_CITA as fecha_cita,
        CREATED_AT as fecha,
        ESTADO as estado,
        1 as intentos
      FROM citas 
      WHERE ESTADO IN ('recordatorio enviado', 'pendiente', 'cancelada')
    `;
    
    const params = [];
    
    // Filtro por búsqueda
    if (busqueda) {
      query += ` AND (NOMBRE LIKE ? OR TELEFONO_FIJO LIKE ?)`;
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }
    
    // Filtro por fechas
    if (fechaDesde) {
      query += ` AND DATE(CREATED_AT) >= ?`;
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      query += ` AND DATE(CREATED_AT) <= ?`;
      params.push(fechaHasta);
    }
    
    query += ` ORDER BY CREATED_AT DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [envios] = await db.query(query, params);
    
    // Transformar estados
    const enviosTransformados = envios.map(envio => ({
      ...envio,
      estado: envio.estado === 'recordatorio enviado' ? 'exitoso' : 'fallido',
      fecha: envio.fecha || envio.fecha_cita
    }));
    
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
    
    let query = `
      SELECT 
        DATE(CREATED_AT) as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN ESTADO = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN ESTADO != 'recordatorio enviado' THEN 1 ELSE 0 END) as fallidos
      FROM citas
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fechaDesde) {
      query += ` AND DATE(CREATED_AT) >= ?`;
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      query += ` AND DATE(CREATED_AT) <= ?`;
      params.push(fechaHasta);
    }
    
    query += ` GROUP BY DATE(CREATED_AT) ORDER BY fecha DESC`;
    
    const [estadisticas] = await db.query(query, params);
    
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
    
    const [citas] = await db.query(
      `SELECT 
        ID as id,
        NOMBRE as paciente,
        TELEFONO_FIJO as numero,
        SERVICIO as servicio,
        PROFESIONAL,
        FECHA_CITA as fecha_cita,
        HORA_CITA as hora_cita,
        CREATED_AT as fecha_envio,
        ESTADO as estado
      FROM citas 
      WHERE ID = ?`,
      [id]
    );
    
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