-- Script para corregir citas que deberían estar marcadas como canceladas
-- basándose en mensajes con estado 'cancelada'
--
-- Este script actualiza las citas en la BD que tienen mensajes de cancelación
-- pero que no fueron marcadas correctamente como canceladas debido al bug
-- en el flujo de cancelación.

-- Ver citas afectadas ANTES de actualizar
SELECT
    c.ID,
    c.NOMBRE,
    c.TELEFONO_FIJO,
    c.FECHA_CITA,
    c.HORA_CITA,
    c.ESTADO as estado_actual,
    m.estado as estado_mensaje,
    m.fecha as fecha_mensaje
FROM citas c
INNER JOIN mensajes m ON c.TELEFONO_FIJO = m.numero
WHERE m.estado = 'cancelada'
  AND c.ESTADO != 'cancelada'
ORDER BY m.fecha DESC;

-- Actualizar citas que tienen mensajes de cancelación
-- pero no están marcadas como canceladas
UPDATE citas c
INNER JOIN mensajes m ON c.TELEFONO_FIJO = m.numero
SET
    c.ESTADO = 'cancelada',
    c.MOTIVO_CANCELACION = 'Cancelado por paciente vía WhatsApp',
    c.FECHA_CANCELACION = m.fecha,
    c.CANCELADO_POR = 'paciente'
WHERE m.estado = 'cancelada'
  AND c.ESTADO != 'cancelada'
  AND (m.mensaje LIKE '%CANCELAR%' OR m.mensaje LIKE '%cancelar%');

-- Ver resultado DESPUÉS de actualizar
SELECT
    c.ID,
    c.NOMBRE,
    c.TELEFONO_FIJO,
    c.FECHA_CITA,
    c.HORA_CITA,
    c.ESTADO,
    c.MOTIVO_CANCELACION,
    c.FECHA_CANCELACION,
    c.CANCELADO_POR
FROM citas c
WHERE c.ESTADO = 'cancelada'
ORDER BY c.FECHA_CANCELACION DESC;
