-- Migración para agregar soporte de mensajes multimedia
-- Fecha: 2025-11-20

-- Agregar campos para manejo de multimedia en la tabla mensajes
ALTER TABLE mensajes
ADD COLUMN IF NOT EXISTS tipo_media VARCHAR(50) DEFAULT NULL COMMENT 'Tipo de multimedia: image, audio, video, document',
ADD COLUMN IF NOT EXISTS url_media TEXT DEFAULT NULL COMMENT 'URL del archivo multimedia almacenado',
ADD COLUMN IF NOT EXISTS url_meta TEXT DEFAULT NULL COMMENT 'URL original de Meta API',
ADD COLUMN IF NOT EXISTS media_id VARCHAR(255) DEFAULT NULL COMMENT 'ID del media en Meta API',
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) DEFAULT NULL COMMENT 'Tipo MIME del archivo',
ADD COLUMN IF NOT EXISTS tamaño_archivo INT DEFAULT NULL COMMENT 'Tamaño del archivo en bytes',
ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT NULL COMMENT 'Metadata adicional del archivo (dimensiones, duración, etc)';

-- Crear índice para búsquedas por tipo de media
CREATE INDEX IF NOT EXISTS idx_mensajes_tipo_media ON mensajes(tipo_media);
CREATE INDEX IF NOT EXISTS idx_mensajes_media_id ON mensajes(media_id);

-- Crear tabla para tracking de descargas de multimedia
CREATE TABLE IF NOT EXISTS multimedia_descargas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensaje_id VARCHAR(200) NOT NULL,
    media_id VARCHAR(255) NOT NULL,
    url_original TEXT NOT NULL,
    url_local TEXT,
    estado VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, downloading, completed, failed',
    intentos INT DEFAULT 0,
    error_mensaje TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mensaje_id) REFERENCES mensajes(id) ON DELETE CASCADE,
    INDEX idx_estado (estado),
    INDEX idx_media_id (media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
