

DELETE FROM citas
WHERE (FECHA_CITA, NUMERO_IDE) IN (
    SELECT FECHA_CITA, NUMERO_IDE
    FROM citas
    GROUP BY FECHA_CITA, NUMERO_IDE
    HAVING COUNT(*) > 1
);


WITH duplicados AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY FECHA_CITA, NUMERO_IDE 
               ORDER BY FECHA_CITA 
           ) AS fila_num
    FROM citas
)
SELECT *
FROM duplicados
WHERE fila_num > 1;


CREATE TABLE IF NOT EXISTS citas_historico LIKE citas;

CREATE EVENT IF NOT EXISTS mover_citas_a_historico
ON SCHEDULE EVERY 1 DAY 
STARTS TIMESTAMP(CURDATE() + INTERVAL 1 DAY)
DO 
BEGIN
    INSERT INTO citas_historico
    SELECT * FROM citas WHERE FECHA_CITA = CURDATE() - INTERVAL 1 DAY;
    DELETE FROM citas WHERE FECHA_CITA = CURDATE() - INTERVAL 1 DAY;
END $$

DELIMITER ;

/*SMS enviados por día (últimos 7 días)*/
SELECT DATE(fecha_envio) as fecha, COUNT(*) as enviados
FROM citas_historico
WHERE fecha_envio >= CURDATE() - INTERVAL 7 DAY
GROUP BY fecha;

/*Estados de mensajes en el mes actual*/
SELECT estado, COUNT(*) as cantidad
FROM citas_historico
WHERE MONTH(fecha_envio) = MONTH(CURDATE())
GROUP BY estado;

/*SMS Enviados Hoy (Métrica)*/
SELECT COUNT(*) AS enviados_hoy
FROM citas_historico
WHERE DATE(fecha_envio) = CURDATE();

/*Citas Programadas (Métrica)*/
SELECT COUNT(*) AS citas_programadas
FROM citas_historico
WHERE DATE(fecha_cita) = CURDATE();

/*Confirmaciones y Cancelaciones (Métrica)*/
SELECT 
  SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS confirmaciones,
  SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS cancelaciones
FROM citas_historico
WHERE DATE(fecha_cita) = CURDATE();

/*Estado de Mensajes (Gráfico de Torta)*/
SELECT 
  SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS entregados,
  SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
FROM citas_historico
WHERE DATE(fecha_envio) = CURDATE();


/*Respuestas de Pacientes por Mes (Gráfico de Barras)*/
SELECT 
  MONTHNAME(fecha_cita) AS mes, 
  SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS confirmados,
  SUM(CASE WHEN estado = 'recordatorio enviado' THEN 1 ELSE 0 END) AS cancelados
FROM citas
WHERE YEAR(fecha_cita) = YEAR(CURDATE())
GROUP BY MONTH(fecha_cita)
ORDER BY MONTH(fecha_cita);

/*Porcentaje de Pacientes No Contactados (Gráfico de Torta)*/
SELECT 
  (SUM(CASE WHEN s.estado = 'pendiente' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS porcentaje_no_contactados
FROM sms_logs s
WHERE DATE(s.fecha_envio) = CURDATE();


/*Ranking de Días con Más Confirmaciones (Gráfico de Líneas)*/
SELECT 
  DAYNAME(fecha_cita) AS dia,
  COUNT(*) AS confirmaciones
FROM citas
WHERE estado = 'recordatorio enviado' AND fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY dia
ORDER BY FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo');

/*recordatorio enviado*/







