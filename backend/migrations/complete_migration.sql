-- ============================================================
-- MIGRACIÓN COMPLETA - recordatorios_db
-- Compatible con MySQL 5.7+
-- Fecha: 2026-03-26
-- ============================================================

USE recordatorios_db;

-- ============================================================
-- 1. TABLA: blacklist
-- ============================================================
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `telefono` varchar(20) NOT NULL,
  `razon` text DEFAULT NULL COMMENT 'Razón por la cual se bloqueó el número',
  `bloqueado_por` varchar(100) DEFAULT NULL COMMENT 'Usuario que bloqueó el número',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telefono_unique` (`telefono`),
  KEY `idx_telefono` (`telefono`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 2. TABLA: chats_anclados
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
-- 3. TABLA: mensajes - columnas faltantes (MySQL 5.7 compatible)
-- ============================================================

DROP PROCEDURE IF EXISTS _agregar_columna;
DELIMITER //
CREATE PROCEDURE _agregar_columna(
  IN p_tabla VARCHAR(64),
  IN p_columna VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_tabla
      AND COLUMN_NAME  = p_columna
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN `', p_columna, '` ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL _agregar_columna('mensajes', 'leido',
  "BOOLEAN DEFAULT FALSE COMMENT 'Indica si el mensaje ha sido leído por el administrador'");

CALL _agregar_columna('mensajes', 'fecha_leido',
  "DATETIME DEFAULT NULL COMMENT 'Fecha y hora en que se marcó como leído'");

CALL _agregar_columna('mensajes', 'tipo_media',
  "VARCHAR(50) DEFAULT NULL COMMENT 'Tipo de multimedia: image, audio, video, document'");

CALL _agregar_columna('mensajes', 'url_media',
  "TEXT DEFAULT NULL COMMENT 'URL del archivo multimedia almacenado localmente'");

CALL _agregar_columna('mensajes', 'url_meta',
  "TEXT DEFAULT NULL COMMENT 'URL original de Meta API'");

CALL _agregar_columna('mensajes', 'media_id',
  "VARCHAR(255) DEFAULT NULL COMMENT 'ID del media en Meta API'");

CALL _agregar_columna('mensajes', 'mime_type',
  "VARCHAR(100) DEFAULT NULL COMMENT 'Tipo MIME del archivo'");

CALL _agregar_columna('mensajes', 'tamanio_archivo',
  "INT DEFAULT NULL COMMENT 'Tamaño del archivo en bytes'");

CALL _agregar_columna('mensajes', 'metadata',
  "JSON DEFAULT NULL COMMENT 'Metadata adicional del archivo'");

DROP PROCEDURE IF EXISTS _agregar_columna;

-- ============================================================
-- 4. ÍNDICES para mensajes (MySQL 5.7 compatible)
-- ============================================================

DROP PROCEDURE IF EXISTS _agregar_indice;
DELIMITER //
CREATE PROCEDURE _agregar_indice(
  IN p_tabla VARCHAR(64),
  IN p_indice VARCHAR(64),
  IN p_columnas TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_tabla
      AND INDEX_NAME   = p_indice
  ) THEN
    SET @sql = CONCAT('CREATE INDEX `', p_indice, '` ON `', p_tabla, '` (', p_columnas, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL _agregar_indice('mensajes', 'idx_mensajes_leido',     '`leido`, `tipo`');
CALL _agregar_indice('mensajes', 'idx_mensajes_tipo_media', '`tipo_media`');
CALL _agregar_indice('mensajes', 'idx_mensajes_media_id',   '`media_id`');

DROP PROCEDURE IF EXISTS _agregar_indice;

-- Marcar mensajes salientes como leídos
UPDATE mensajes SET leido = TRUE WHERE tipo = 'saliente' AND leido = FALSE;

-- ============================================================
-- 5. TABLA: multimedia_descargas
-- ============================================================
CREATE TABLE IF NOT EXISTS `multimedia_descargas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `mensaje_id` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
