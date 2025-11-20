const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

router.get('/stats', async (req, res) => {
  try {
    // Estadísticas principales - combinando citas actuales y históricas
    const [stats] = await db.query(`
     SELECT
       (SELECT COUNT(*) FROM citas WHERE DATE(fecha_cita) = CURDATE() + INTERVAL 1 DAY) AS sms_enviados,
       (SELECT COUNT(*) FROM citas WHERE DATE(fecha_cita) = CURDATE()) AS citas_programadas,
       (SELECT COUNT(*) FROM (
         SELECT 1 FROM citas WHERE estado = 'recordatorio enviado'
         UNION ALL
         SELECT 1 FROM citas_historico WHERE estado = 'recordatorio enviado'
       ) AS combined) AS confirmaciones,
       (SELECT COUNT(*) FROM (
         SELECT 1 FROM citas WHERE estado = 'pendiente'
         UNION ALL
         SELECT 1 FROM citas_historico WHERE estado = 'pendiente'
       ) AS combined) AS cancelaciones,
       (SELECT COUNT(*) FROM (
         SELECT 1 FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
         UNION ALL
         SELECT 1 FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
       ) AS combined) AS total_mes_actual,
       (SELECT COUNT(*) FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE() - INTERVAL 1 MONTH)) AS total_mes_anterior
    `);

    // KPIs Ejecutivos - combinando ambas tablas
    const [kpis] = await db.query(`
      SELECT
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) AS tasa_exito,
        ROUND((SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) AS tasa_no_contacto,
        COUNT(DISTINCT DATE(fecha_cita)) AS dias_activos,
        ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT DATE(fecha_cita)), 0), 2) AS promedio_diario
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      ) AS combined
    `);

    // Comparativa mensual - combinando ambas tablas
    const [comparativaMensual] = await db.query(`
      SELECT
        DATE_FORMAT(fecha_cita, '%Y-%m') AS mes,
        COUNT(*) AS total_envios,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) AS tasa_exito
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      ) AS combined
      GROUP BY mes
      ORDER BY mes DESC
    `);

    // Envíos por hora (distribución del día) - últimos 7 días
    const [enviosPorHora] = await db.query(`
      SELECT
        HOUR(fecha_cita) AS hora,
        COUNT(*) AS enviados,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ) AS combined
      GROUP BY hora
      ORDER BY hora
    `);

    // Estado de mensajes del mes - combinando ambas tablas
    const [estadoMensajes] = await db.query(`
      SELECT
        estado AS nombre,
        COUNT(*) AS valor,
        ROUND((COUNT(*) * 100.0) / NULLIF((SELECT COUNT(*) FROM (
          SELECT 1 FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
          UNION ALL
          SELECT 1 FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
        ) AS total_combined), 0), 2) AS porcentaje
      FROM (
        SELECT estado FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
        UNION ALL
        SELECT estado FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      ) AS combined
      GROUP BY estado
    `);

    // Respuestas por mes (año actual) - combinando ambas tablas
    const [respuestasPacientes] = await db.query(`
      SELECT
        DATE_FORMAT(fecha_cita, '%Y-%m') AS mes,
        MONTHNAME(fecha_cita) AS nombre_mes,
        SUM(estado = 'recordatorio enviado') AS confirmados,
        SUM(estado = 'pendiente') AS cancelados,
        COUNT(*) AS total
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE YEAR(fecha_cita) = YEAR(CURDATE())
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE YEAR(fecha_cita) = YEAR(CURDATE())
      ) AS combined
      GROUP BY mes, nombre_mes
      ORDER BY mes
    `);

    // SMS por día (últimos 30 días) - combinando ambas tablas
    const [smsPorDia] = await db.query(`
      SELECT
        DATE(fecha_cita) as fecha,
        COUNT(*) as enviados,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE fecha_cita >= CURDATE() - INTERVAL 30 DAY
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE fecha_cita >= CURDATE() - INTERVAL 30 DAY
      ) AS combined
      GROUP BY fecha
      ORDER BY fecha
    `);

    // Porcentaje de no contactados - del mes actual
    const [porcentajeNoContactados] = await db.query(`
      SELECT
        (SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS porcentaje_no_contactados
      FROM (
        SELECT estado FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
        UNION ALL
        SELECT estado FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      ) AS combined
    `);

    // Ranking de días con más confirmaciones - últimos 30 días
    const [rankingConfirmaciones] = await db.query(`
      SELECT
        DAYNAME(fecha_cita) AS dia,
        COUNT(*) AS confirmaciones,
        ROUND((COUNT(*) * 100.0) / NULLIF((SELECT COUNT(*) FROM (
          SELECT 1 FROM citas WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          UNION ALL
          SELECT 1 FROM citas_historico WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) AS total_combined), 0), 2) AS porcentaje
      FROM (
        SELECT fecha_cita FROM citas WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        UNION ALL
        SELECT fecha_cita FROM citas_historico WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ) AS combined
      GROUP BY dia
      ORDER BY confirmaciones DESC
    `);

    // Análisis por canal de comunicación - del mes actual
    const [analisisCanales] = await db.query(`
      SELECT
        'SMS' AS canal,
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS exitosos
      FROM (
        SELECT estado FROM citas WHERE MONTH(fecha_cita) = MONTH(CURDATE())
        UNION ALL
        SELECT estado FROM citas_historico WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      ) AS combined
    `);

    // Top pacientes con más citas - últimos 3 meses
    const [topPacientes] = await db.query(`
      SELECT
        NOMBRE as nombre_paciente,
        COUNT(*) AS total_citas,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM (
        SELECT NOMBRE, estado FROM citas WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        UNION ALL
        SELECT NOMBRE, estado FROM citas_historico WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      ) AS combined
      GROUP BY NOMBRE
      ORDER BY total_citas DESC
      LIMIT 10
    `);

    // Resumen ejecutivo del día - datos de hoy (principalmente de tabla citas)
    const [resumenDiario] = await db.query(`
      SELECT
        DATE(fecha_cita) as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) as tasa_exito
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE DATE(fecha_cita) = CURDATE()
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE DATE(fecha_cita) = CURDATE()
      ) AS combined
    `);

    // Tendencias semanales - últimas 12 semanas
    const [tendenciasSemana] = await db.query(`
      SELECT
        YEARWEEK(fecha_cita) as semana,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) as exitosos,
        ROUND((SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) as tasa_exito
      FROM (
        SELECT fecha_cita, estado FROM citas WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
        UNION ALL
        SELECT fecha_cita, estado FROM citas_historico WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      ) AS combined
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

