const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
     SELECT (SELECT COUNT(*) FROM citas WHERE DATE(fecha_cita) = CURDATE() + INTERVAL 1 DAY) AS sms_enviados, (SELECT COUNT(*) FROM citas_historico WHERE DATE(fecha_cita) = CURDATE()) AS citas_programadas, (SELECT COUNT(*) FROM citas_historico WHERE estado = 'recordatorio enviado') AS confirmaciones, (SELECT COUNT(*) FROM citas_historico WHERE estado = 'pendiente') AS cancelaciones; 
    `);

    const [enviosPorHora] = await db.query(`
      SELECT HOUR(fecha_cita) AS hora, COUNT(*) AS enviados
      FROM citas_historico
      WHERE DATE(fecha_cita) = CURDATE()
      GROUP BY hora
    `);

    const [estadoMensajes] = await db.query(`
      SELECT estado AS nombre, COUNT(*) AS valor 
      FROM citas_historico
      WHERE MONTH(fecha_cita) = MONTH(CURDATE())
      GROUP BY estado
    `);

    const [respuestasPacientes] = await db.query(`
      SELECT MONTHNAME(fecha_cita) AS mes, 
        SUM(estado = 'recordatorio enviado') AS confirmados, 
        SUM(estado = 'pendiente') AS cancelados
      FROM citas_historico
      WHERE YEAR(fecha_cita) = YEAR(CURDATE())
      GROUP BY MONTH(fecha_cita)
      ORDER BY MONTH(fecha_cita)
    `);

    const [smsPorDia] = await db.query(`
      SELECT DATE(fecha_cita) as fecha, COUNT(*) as enviados
      FROM citas_historico
      WHERE fecha_cita >= CURDATE() - INTERVAL 7 DAY and estado = 'recordatorio enviado'
      GROUP BY fecha
    `);

    const [porcentajeNoContactados] = await db.query(` SELECT 
        (SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS porcentaje_no_contactados
      FROM citas_historico
      WHERE DATE(fecha_cita) = CURDATE()
    `);

    const [rankingConfirmaciones] = await db.query(`
      SELECT 
        DAYNAME(fecha_cita) AS dia,
        COUNT(*) AS confirmaciones
      FROM citas_historico
      WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY dia
      ORDER BY FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
    `);

    res.json({
      stats: stats[0],
      enviosPorHora,
      estadoMensajes,
      respuestasPacientes,
      smsPorDia,
      porcentajeNoContactados: porcentajeNoContactados[0],
      rankingConfirmaciones
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

module.exports = router;

