const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

router.get('/stats', async (req, res) => {
  try {
    // Estadísticas principales
    const [stats] = await db.query(`
     SELECT
       (SELECT COUNT(*) FROM citas WHERE DATE(fecha_cita) = CURDATE() + INTERVAL 1 DAY) AS sms_enviados,
       (SELECT COUNT(*) FROM citas_historico WHERE DATE(fecha_cita) = CURDATE()) AS citas_programadas,
       (SELECT COUNT(*) FROM citas_historico WHERE estado = 'recordatorio enviado') AS confirmaciones,
       (SELECT COUNT(*) FROM citas_historico WHERE estado = 'pendiente') AS cancelaciones,
       (SELECT COUNT(*) FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())) AS total_mes_actual,
       (SELECT COUNT(*) FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE() - INTERVAL 1 MONTH)) AS total_mes_anterior
    `);

    // KPIs Ejecutivos
    const [kpis] = await db.query(`
      SELECT
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS tasa_exito,
        ROUND((SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS tasa_no_contacto,
        COUNT(DISTINCT DATE(fecha_cita)) AS dias_activos,
        ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT DATE(fecha_cita)), 0), 2) AS promedio_diario
      FROM citas_historico
      WHERE MONTH(fecha_cita) = MONTH(CURDATE())
    `);

    // Comparativa mensual
    const [comparativaMensual] = await db.query(`
      SELECT
        DATE_FORMAT(fecha_cita, '%Y-%m') AS mes,
        COUNT(*) AS total_envios,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS tasa_exito
      FROM citas_historico
      WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes DESC
    `);

    // Envíos por hora (distribución del día)
    const [enviosPorHora] = await db.query(`
      SELECT
        HOUR(fecha_cita) AS hora,
        COUNT(*) AS enviados,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos
      FROM citas_historico
      WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY hora
      ORDER BY hora
    `);

    // Estado de mensajes del mes
    const [estadoMensajes] = await db.query(`
      SELECT
        estado AS nombre,
        COUNT(*) AS valor,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())), 2) AS porcentaje
      FROM citas_historico
      WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      GROUP BY estado
    `);

    // Respuestas por mes (año actual)
    const [respuestasPacientes] = await db.query(`
      SELECT
        DATE_FORMAT(fecha_cita, '%Y-%m') AS mes,
        MONTHNAME(fecha_cita) AS nombre_mes,
        SUM(estado = 'recordatorio enviado') AS confirmados,
        SUM(estado = 'pendiente') AS cancelados,
        COUNT(*) AS total
      FROM citas_historico
      WHERE YEAR(fecha_cita) = YEAR(CURDATE())
      GROUP BY mes, nombre_mes
      ORDER BY mes
    `);

    // SMS por día (últimos 30 días)
    const [smsPorDia] = await db.query(`
      SELECT
        DATE(fecha_cita) as fecha,
        COUNT(*) as enviados,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
      FROM citas_historico
      WHERE fecha_cita >= CURDATE() - INTERVAL 30 DAY
      GROUP BY fecha
      ORDER BY fecha
    `);

    // Porcentaje de no contactados
    const [porcentajeNoContactados] = await db.query(`
      SELECT
        (SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS porcentaje_no_contactados
      FROM citas_historico
      WHERE MONTH(fecha_cita) = MONTH(CURDATE())
    `);

    // Ranking de días con más confirmaciones
    const [rankingConfirmaciones] = await db.query(`
      SELECT
        DAYNAME(fecha_cita) AS dia,
        COUNT(*) AS confirmaciones,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM citas_historico WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 2) AS porcentaje
      FROM citas_historico
      WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY dia
      ORDER BY confirmaciones DESC
    `);

    // Análisis por canal de comunicación
    const [analisisCanales] = await db.query(`
      SELECT
        'SMS' AS canal,
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos
      FROM citas_historico
      WHERE MONTH(fecha_cita) = MONTH(CURDATE())
    `);

    // Top pacientes con más citas
    const [topPacientes] = await db.query(`
      SELECT
        nombre_paciente,
        COUNT(*) AS total_citas,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM citas_historico
      WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY nombre_paciente
      ORDER BY total_citas DESC
      LIMIT 10
    `);

    // Resumen ejecutivo del día
    const [resumenDiario] = await db.query(`
      SELECT
        DATE(fecha_cita) as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as tasa_exito
      FROM citas_historico
      WHERE DATE(fecha_cita) = CURDATE()
    `);

    // Tendencias semanales
    const [tendenciasSemana] = await db.query(`
      SELECT
        YEARWEEK(fecha_cita) as semana,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as tasa_exito
      FROM citas_historico
      WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY semana
      ORDER BY semana
    `);

    res.json({
      stats: stats[0],
      kpis: kpis[0],
      comparativaMensual,
      enviosPorHora,
      estadoMensajes,
      respuestasPacientes,
      smsPorDia,
      porcentajeNoContactados: porcentajeNoContactados[0],
      rankingConfirmaciones,
      analisisCanales,
      topPacientes,
      resumenDiario: resumenDiario[0] || {},
      tendenciasSemana
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

module.exports = router;

