-- ============================================================
-- MIGRACIÓN COMPLETA - recordatorios_db
-- Ejecutar este script para sincronizar la BD con el código
-- Fecha: 2026-03-16
-- ============================================================

USE recordatorios_db;

-- ============================================================
-- 1. TABLA: blacklist (faltante en la BD)
-- ============================================================
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `telefono` varchar(20) NOT NULL,
  `razon` text DEFAULT NULL COMMENT 'Razón por la cual se bloqueó el número',
  `bloqueado_por` varchar(100) DEFAULT NULL COMMENT 'Usuario que bloqueó el número',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `telefono_unique` (`telefono`),
  KEY `idx_telefono` (`telefono`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 2. TABLA: chats_anclados (faltante en la BD)
-- ============================================================
CREATE TABLE IF NOT EXISTS `chats_anclados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero` VARCHAR(20) NOT NULL UNIQUE,
  `fecha_anclado` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `orden` INT DEFAULT 0,
  INDEX `idx_numero` (`numero`),
  INDEX `idx_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 3. TABLA: mensajes - columnas faltantes
-- ============================================================

-- Campo: leido (para mensajes no leídos)
ALTER TABLE mensajes
  ADD COLUMN IF NOT EXISTS `leido` BOOLEAN DEFAULT FALSE
  COMMENT 'Indica si el mensaje ha sido leído por el administrador';

-- Campo: fecha_leido
ALTER TABLE mensajes
  ADD COLUMN IF NOT EXISTS `fecha_leido` DATETIME DEFAULT NULL
  COMMENT 'Fecha y hora en que se marcó como leído';

-- Campos de multimedia
ALTER TABLE mensajes
  ADD COLUMN IF NOT EXISTS `tipo_media` VARCHAR(50) DEFAULT NULL
    COMMENT 'Tipo de multimedia: image, audio, video, document',
  ADD COLUMN IF NOT EXISTS `url_media` TEXT DEFAULT NULL
    COMMENT 'URL del archivo multimedia almacenado localmente',
  ADD COLUMN IF NOT EXISTS `url_meta` TEXT DEFAULT NULL
    COMMENT 'URL original de Meta API',
  ADD COLUMN IF NOT EXISTS `media_id` VARCHAR(255) DEFAULT NULL
    COMMENT 'ID del media en Meta API',
  ADD COLUMN IF NOT EXISTS `mime_type` VARCHAR(100) DEFAULT NULL
    COMMENT 'Tipo MIME del archivo',
  ADD COLUMN IF NOT EXISTS `tamaño_archivo` INT DEFAULT NULL
    COMMENT 'Tamaño del archivo en bytes',
  ADD COLUMN IF NOT EXISTS `metadata` JSON DEFAULT NULL
    COMMENT 'Metadata adicional del archivo';

-- Índices para mensajes (solo si no existen)
CREATE INDEX IF NOT EXISTS `idx_mensajes_leido`     ON mensajes(`leido`, `tipo`);
CREATE INDEX IF NOT EXISTS `idx_mensajes_tipo_media` ON mensajes(`tipo_media`);
CREATE INDEX IF NOT EXISTS `idx_mensajes_media_id`   ON mensajes(`media_id`);

-- Marcar mensajes salientes como leídos
UPDATE mensajes SET leido = TRUE WHERE tipo = 'saliente' AND leido = FALSE;

-- ============================================================
-- 4. TABLA: multimedia_descargas (faltante en la BD)
-- ============================================================
CREATE TABLE IF NOT EXISTS `multimedia_descargas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `mensaje_id` VARCHAR(200) NOT NULL,
    `media_id` VARCHAR(255) NOT NULL,
    `url_original` TEXT NOT NULL,
    `url_local` TEXT DEFAULT NULL,
    `estado` VARCHAR(50) DEFAULT 'pending'
      COMMENT 'pending, downloading, completed, failed',
    `intentos` INT DEFAULT 0,
    `error_mensaje` TEXT DEFAULT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`mensaje_id`) REFERENCES `mensajes`(`id`) ON DELETE CASCADE,
    INDEX `idx_estado` (`estado`),
    INDEX `idx_media_id` (`media_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RESUMEN DE CAMBIOS APLICADOS:
--
-- TABLAS NUEVAS:
--   - blacklist              (números bloqueados)
--   - chats_anclados         (chats fijados al inicio)
--   - multimedia_descargas   (tracking de descargas de media)
--
-- COLUMNAS AÑADIDAS A mensajes:
--   - leido          (BOOLEAN)
--   - fecha_leido    (DATETIME)
--   - tipo_media     (VARCHAR 50)
--   - url_media      (TEXT)
--   - url_meta       (TEXT)
--   - media_id       (VARCHAR 255)
--   - mime_type      (VARCHAR 100)
--   - tamaño_archivo (INT)
--   - metadata       (JSON)
-- ============================================================
