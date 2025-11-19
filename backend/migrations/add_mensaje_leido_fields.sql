-- Agregar campos para control de lectura de mensajes
-- Fecha: 2025-11-19
-- Propósito: Implementar trazabilidad de mensajes leídos/no leídos

USE recordatorios_db;

-- Agregar campo leido (booleano, por defecto false para mensajes entrantes)
ALTER TABLE mensajes
ADD COLUMN leido BOOLEAN DEFAULT FALSE COMMENT 'Indica si el mensaje ha sido leído por el administrador';

-- Agregar campo fecha_leido (timestamp, nullable)
ALTER TABLE mensajes
ADD COLUMN fecha_leido DATETIME DEFAULT NULL COMMENT 'Fecha y hora en que se marcó como leído';

-- Crear índice para optimizar consultas de mensajes no leídos
CREATE INDEX idx_mensajes_leido ON mensajes(leido, tipo);

-- Marcar todos los mensajes salientes como leídos (fueron enviados por el sistema)
UPDATE mensajes SET leido = TRUE WHERE tipo = 'saliente';

-- Los mensajes entrantes quedan como no leídos por defecto (leido = FALSE)
