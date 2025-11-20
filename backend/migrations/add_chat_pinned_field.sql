-- Migración: Agregar campo anclado para chats
-- Fecha: 2025-11-20
-- Descripción: Permite anclar chats importantes al inicio de la lista

-- Agregar tabla para gestionar chats anclados
CREATE TABLE IF NOT EXISTS `chats_anclados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero` VARCHAR(20) NOT NULL UNIQUE,
  `fecha_anclado` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `orden` INT DEFAULT 0,
  INDEX `idx_numero` (`numero`),
  INDEX `idx_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
