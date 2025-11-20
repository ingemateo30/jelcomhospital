-- Tabla para almacenar números bloqueados (Lista Negra)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Lista negra de números bloqueados para recordatorios';
