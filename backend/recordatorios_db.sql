-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 19-11-2025 a las 22:38:31
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `recordatorios_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `ID` int(11) NOT NULL,
  `ATENCION` varchar(255) NOT NULL,
  `FECHA_CITA` date NOT NULL,
  `HORA_CITA` time NOT NULL,
  `SERVICIO` varchar(255) NOT NULL,
  `PROFESIONAL` varchar(255) NOT NULL,
  `TIPO_IDE_PACIENTE` varchar(50) NOT NULL,
  `NUMERO_IDE` varchar(50) NOT NULL,
  `NOMBRE` varchar(255) NOT NULL,
  `TELEFONO_FIJO` varchar(20) DEFAULT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT current_timestamp(),
  `EMAIL` varchar(255) DEFAULT NULL,
  `ESTADO` varchar(50) DEFAULT 'pendiente' COMMENT 'pendiente/recordatorio enviado/confirmada/cancelada',
  `llamada_id` varchar(50) DEFAULT NULL,
  `estado_llamada` enum('pendiente','completada','fallida','no-contesta') DEFAULT 'pendiente',
  `intentos_llamada` int(11) DEFAULT 0,
  `fecha_llamada` datetime DEFAULT NULL,
  `duracion_llamada` int(11) DEFAULT NULL,
  `MOTIVO_CANCELACION` text DEFAULT NULL,
  `FECHA_CANCELACION` datetime DEFAULT NULL,
  `CANCELADO_POR` varchar(50) DEFAULT NULL COMMENT 'paciente/sistema/administrador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`ID`, `ATENCION`, `FECHA_CITA`, `HORA_CITA`, `SERVICIO`, `PROFESIONAL`, `TIPO_IDE_PACIENTE`, `NUMERO_IDE`, `NOMBRE`, `TELEFONO_FIJO`, `CREATED_AT`, `EMAIL`, `ESTADO`, `llamada_id`, `estado_llamada`, `intentos_llamada`, `fecha_llamada`, `duracion_llamada`, `MOTIVO_CANCELACION`, `FECHA_CANCELACION`, `CANCELADO_POR`) VALUES
(2, 'PRINCIPAL', '2025-10-08', '09:20:00', 'ADULTO MAYOR', 'SIZA CUADROS MICHELLE NICOLE', 'CC', '1100962179', 'MARIA FERNANDA', '3007015239', '2025-02-25 22:00:16', 'mateo.s3009@gmail.com', 'pendiente', 'CA4f16d41b3b335a35a1c7cd76f4cdf59c', '', 0, '2025-05-22 10:52:45', 0, NULL, NULL, NULL),
(3, 'PRINCIPAL', '2025-10-08', '09:20:00', 'ADULTO MAYOR 45', 'ACEVEDO CALDERON DIANA PATRICIA', 'CC', '79819861', 'johana torres', '3007015239', '2025-02-25 22:00:16', NULL, 'recordatorio enviado', 'CA98c0a6c0645afac20c22efcbc738f18b', '', 0, '2025-05-22 10:52:40', 0, NULL, NULL, NULL),
(4, 'PRINCIPAL', '2025-05-23', '09:40:00', 'ADULTO MAYOR 45', 'SIZA CUADROS MICHELLE NICOLE', 'CC', '1100952281', 'PRICILA DE JESUS PEREZ MEDINA', '3007015239', '2025-02-25 22:00:16', NULL, 'recordatorio enviado', 'CAc32c66aee58e9647fb4488778ac19847', '', 3, '2025-05-22 10:52:27', 0, NULL, NULL, NULL),
(5, 'PRINCIPAL', '2025-05-23', '10:40:00', 'ADULTO MAYOR 45', 'SIZA CUADROS MICHELLE NICOLE', 'CC', '37895226', 'SANDRA MILENA MANRIQUE OLARTE', '3007015239', '2025-02-25 22:00:16', NULL, 'recordatorio enviado', 'CAf91506672d5a0b43a2882279c4e02119', '', 3, '2025-05-22 10:52:45', 0, NULL, NULL, NULL),
(6, 'PRINCIPAL', '2025-05-20', '11:20:00', 'ADULTO MAYOR 45', 'SIZA CUADROS MICHELLE NICOLE', 'CC', '1101694409', 'OLGA  QUECHO GOMEZ', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA28f46772001868647806e5463fffeb68', '', 5, '2025-05-19 09:04:09', 9, NULL, NULL, NULL),
(7, 'PRINCIPAL', '2025-05-18', '16:40:00', 'ADULTO MAYOR 45', 'SIZA CUADROS MICHELLE NICOLE', 'CC', '37900446', 'ANGELA  SARMIENTO FERREIRA', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CAaf7d5859eb00d2d74400e8c989774669', '', 5, '2025-05-17 11:29:54', 10, NULL, NULL, NULL),
(8, 'PRINCIPAL', '2025-05-18', '07:00:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '1098407288', 'LUZ DARY CHACON ', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA1f87eaf8bd6b5dcc965801c92f25c528', '', 5, '2025-05-17 11:45:46', 20, NULL, NULL, NULL),
(9, 'PRINCIPAL', '2025-05-20', '07:10:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '37817325', 'ALONSO  RUIZ QUIÑONEZ', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CAb811325fea5f7d59cbf522584bb772cb', '', 5, '2025-05-19 08:59:33', 9, NULL, NULL, NULL),
(10, 'PRINCIPAL', '2025-05-20', '07:20:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '37897329', 'JOSE MIGUEL JOVITO CASTELLANOS', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA79539fa3ac20eb303045a0294e659750', '', 5, '2025-05-19 08:38:07', 21, NULL, NULL, NULL),
(11, 'PRINCIPAL', '2025-05-18', '07:30:00', 'ANESTESIOLOGIA', 'OSCAR EDUARDO PIRACUN MORALES', 'CC', '1100954414', 'CARLOS ARTURO GONZALEZ GONZALEZ', '3136217487', '2025-02-25 22:00:16', NULL, 'pendiente', 'CAef96c9cfdf14ac60b0c0dfd76cd69615', '', 5, '2025-05-17 11:55:38', 21, NULL, NULL, NULL),
(12, 'PRINCIPAL', '2025-05-18', '07:40:00', 'ANESTESIOLOGIA', 'LINA MARIA ORTIZ PEREIRA ', 'CC', '11306456', 'JORGE  DURAN  SANCHEZ', '3227897967', '2025-02-25 22:00:16', NULL, 'pendiente', 'CAcec1a00c58d52bce222e9392d790153c', '', 6, '2025-05-17 11:55:44', 21, NULL, NULL, NULL),
(13, 'PRINCIPAL', '2025-05-18', '07:50:00', 'ANESTESIOLOGIA', 'MATEO SALAZAR ORTIZ', 'CC', '8679507', 'GABRIELA  SAAVEDRA GUAJE', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CAd0f783e2b014bf5a6df37a932ca972e4', '', 5, '2025-05-17 11:55:54', 22, NULL, NULL, NULL),
(14, 'PRINCIPAL', '2025-05-20', '08:00:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '28089824', 'MARTHA LUCIA JIMENEZ GUALDRON', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA75180b89121e9655739f15b09d0c1d65', '', 6, '2025-05-19 08:52:41', 20, NULL, NULL, NULL),
(15, 'PRINCIPAL', '2025-05-20', '08:10:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '5743896', 'MIGUEL ANGEL ESCOBAR URBINA', '3011780208', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA26c5beaa896ae6128b12997454b16ffb', '', 6, '2025-05-19 08:43:26', 24, NULL, NULL, NULL),
(16, 'PRINCIPAL', '2025-05-20', '08:20:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '91069472', 'MARIA ALEJANDRA RUEDA SILVA', '', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA9ed2ceb6340cfc78968b828d16740aca', '', 5, '2025-05-17 12:03:27', 22, NULL, NULL, NULL),
(17, 'PRINCIPAL', '2025-05-18', '08:30:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '1100959768', 'LINA MARIA ORTIZ PEREIRA', '3136217487', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA5e42f19811a6d812a770b771ade782fc', '', 4, '2025-05-17 12:03:28', 22, NULL, NULL, NULL),
(18, 'PRINCIPAL', '2025-05-18', '08:40:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '37896896', 'MATEO SALAZAR ORTIZ', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA79ba4a02ab7647a248e28b004ed37e65', '', 4, '2025-05-17 12:03:30', 20, NULL, NULL, NULL),
(19, 'PRINCIPAL', '2025-05-22', '08:50:00', 'MEDICINA GENERAL', 'TORRES DURÁN CARMENZA ', 'CC', '91078954', 'MATEO SALAZAR ORTIZ', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', 'CA390937f116eb8b2227df9feff7810155', '', 4, '2025-05-21 10:20:14', 18, NULL, NULL, NULL),
(20, 'PRINCIPAL', '2025-05-22', '09:00:00', 'ANESTESIOLOGIA', 'TORRES DURÁN CARMENZA ', 'CC', '28262489', 'MATEO SALAZAR ORTIZ', '3011780208', '2025-02-25 22:00:16', NULL, 'Recordatorio enviado', 'CA269e63900d64eab7a2eada043e46441a', '', 4, '2025-05-21 10:11:44', 18, NULL, NULL, NULL),
(747, 'CES', '2025-07-25', '06:05:00', 'MEDICINA GENERAL', 'FAYSURY RAMIREZ', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA', '3007015239', '2025-07-23 15:58:20', NULL, 'recordatorio enviado', 'CA078a3fd4c5e50fe66887c3af1da36062', '', 4, '2025-07-23 11:42:39', 26, NULL, NULL, NULL),
(748, 'HOSPITAL', '2025-07-24', '07:45:00', 'CARDIOLOGIA', 'FROILAN RINCON', 'CC', '52485671', 'JORGE ARGUELLO', '3007015239', '2025-07-23 15:58:20', NULL, 'recordatorio enviado', 'CA91188d4e38d5c19a6c36cd4470e408ee', '', 3, '2025-07-23 11:37:34', 0, NULL, NULL, NULL),
(749, 'CES', '2025-07-24', '15:05:00', 'PEDIATRIA', 'NOHORA VARGAS', 'RC', '114568792', 'KAREN TRIANA', '3007015239', '2025-07-23 15:58:20', NULL, 'recordatorio enviado', 'CA869b4192652b60cfca311007ae196885', '', 3, '2025-07-23 11:37:37', 0, NULL, NULL, NULL),
(750, 'CES', '2025-07-24', '16:25:00', 'ODONTOLOGIA', 'ZAYDA URQUIJO', 'CC', '4147624623', 'DANIEL', '3007015239', '2025-07-23 15:58:20', NULL, 'recordatorio enviado', 'CA83f44c307d53323fb597a547bae91fa7', '', 3, '2025-07-23 11:37:41', 0, NULL, NULL, NULL),
(751, 'HOSPITAL', '2025-10-10', '08:00:00', 'ANESTESIOLOGIA', 'FABIO ARGUELLO', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3102211034', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(752, 'HOSPITAL', '2025-10-10', '07:00:00', 'CARDIOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3172306753', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(753, 'CALLE 16 NO 9- 76', '2025-10-10', '06:00:00', 'CARDIOLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3163377540', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(754, 'CALLE 16 NO 9- 76', '2025-10-10', '11:00:00', 'CARDIOLOGIA PEDIATRICA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3134995242', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(755, 'HOSPITAL', '2025-10-10', '10:00:00', 'CARDIOLOGIA PEDIATRICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3113105720', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(756, 'CES', '2025-10-10', '13:00:00', 'CIRUGIA GENERAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(757, 'CES', '2025-10-10', '14:00:00', 'CIRUGIA PEDIATRICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3115719027', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(758, 'CES', '2025-10-10', '15:00:00', 'CIRUGIA MAXILOFACIAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3045967700', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(759, 'CES', '2025-10-10', '16:00:00', 'CITOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3102211034', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(760, 'HOSPITAL', '2025-10-10', '15:30:00', 'COLONOSCOPIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3172306753', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(761, 'CES', '2025-10-10', '09:00:00', 'CONTROL PRENATAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3163377540', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(762, 'CES', '2025-10-10', '10:00:00', 'DERMATOLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3134995242', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(763, 'CES', '2025-10-10', '11:00:00', 'DERMATOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3113105720', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(764, 'HOSPITAL', '2025-10-10', '12:00:00', 'ECOGRAFIAS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(765, 'EDIFICIO PSI LOCAL 2 CRA 14 A NO 29-27', '2025-10-10', '08:15:00', 'ENDODONCIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3007015239', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(766, 'EDIFICIO PSI LOCAL 2 CRA 14 A NO 29-27', '2025-10-10', '08:25:00', 'ENDODONCIA ', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(767, 'HOSPITAL', '2025-10-10', '09:45:00', 'FONOAUDIOLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3115719027', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(768, 'HOSPITAL', '2025-10-10', '06:45:00', 'GASTROENTERLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212631673', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(769, 'CES', '2025-10-10', '07:30:00', 'NEUMOLOGA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3007015239', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(770, 'HOSPITAL', '2025-10-10', '08:40:00', 'ENDOSCOPIAS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3172306753', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(771, 'CES', '2025-10-10', '09:10:00', 'EXAMEN DE SENO', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3163377540', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(772, 'CES', '2025-10-10', '08:25:00', 'GINECOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3134995242', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(773, 'CES', '2025-10-10', '06:10:00', 'MEDICINA FAMILIAR', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3113105720', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(774, 'CES', '2025-10-10', '07:20:00', 'MEDICINA GENERAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3007015239', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(775, 'CES', '2025-10-10', '08:20:00', 'MEDICINA INTERNA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(776, 'HOSPITAL', '2025-10-10', '09:20:00', 'NEUMOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(777, 'HOSPITAL', '2025-10-10', '10:20:00', 'NEUROLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(778, 'CES', '2025-10-10', '11:20:00', 'NEUROLOGIA', 'FAYSURY', 'CC', '1098734130', 'DRA KAREN PRUEBA', '3182098738', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(779, 'CES', '2025-10-10', '12:20:00', 'NEUMOLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212631673', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(780, 'CES', '2025-10-10', '13:20:00', 'NEUROCIRUGIA', 'FAYSURY', 'CC', '1098734130', 'YEISON FABIAN PRUEBA', '3212565367', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(781, 'CES', '2025-10-10', '14:20:00', 'NUTRICION', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(782, 'CES', '2025-10-10', '15:20:00', 'OBSTETRICIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(783, 'CES', '2025-10-10', '16:20:00', 'ODONTOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(784, 'CES', '2025-10-10', '17:20:00', 'OPTOMETRIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:52', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(785, 'CES', '2025-10-10', '18:20:00', 'OFTALMOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(786, 'CES', '2025-10-10', '19:20:00', 'ORTOPEDIA Y/O TRAUMATOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(787, 'HOSPITAL', '2025-10-10', '20:20:00', 'OTORRINOLARINGOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(788, 'CES', '2025-10-10', '21:20:00', 'PEDIATRIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(789, 'CES', '2025-10-10', '22:20:00', 'PLANIFICACION FAMILIAR', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(790, 'CES', '2025-10-10', '23:20:00', 'POS PARTO', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(791, 'CALLE 9 NO 9-41', '2025-10-10', '24:20:00', 'PERIODONCIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(792, 'CES', '2025-10-10', '25:20:00', 'PRIMERA INFANCIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(793, 'CES', '2025-10-10', '26:20:00', 'PSICOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(794, 'HOSPITAL', '2025-10-10', '27:20:00', 'TRABAJO SOCIAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(795, 'CES', '2025-10-10', '28:20:00', 'PSIQUIATRIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(796, 'HOSPITAL', '2025-10-10', '29:20:00', 'QX OTORRINO', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(797, 'HOSPITAL', '2025-10-10', '30:20:00', 'QX GINECOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(798, 'HOSPITAL', '2025-10-10', '31:20:00', 'QX ORTOPEDIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(799, 'HOSPITAL', '2025-10-10', '32:20:00', 'QX UROLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(800, 'HOSPITAL', '2025-10-10', '33:20:00', 'QX GENERAL ', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(801, 'HOSPITAL', '2025-10-10', '34:20:00', 'QX PEDIATRICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(802, 'HOSPITAL', '2025-10-10', '35:20:00', 'QX NEUROCIRUGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(803, 'HOSPITAL', '2025-10-10', '36:20:00', 'QX OFTALMOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(804, 'HOSPITAL', '2025-10-10', '37:20:00', 'QX DERMATOLOGICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(805, 'CES', '2025-10-10', '38:20:00', 'RIESGO CARDIOVASCULAR', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(806, 'CES', '2025-10-10', '39:20:00', 'SALUD ORAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(807, 'CES', '2025-10-10', '40:20:00', 'VEJEZ', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(808, 'CES', '2025-10-10', '41:20:00', 'UROLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(809, 'CES', '2025-10-10', '42:20:00', 'TERAPIA FISICA Y RESPIRATORIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-09 20:20:53', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(810, 'CES', '2025-10-17', '08:00:00', 'ADULTEZ', 'FABIO ARGUELLO', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(811, 'CES', '2025-10-17', '07:00:00', 'RIESGO CARDIOVASCULAR', 'FABIO ARGUELLO', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212631673', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(812, 'CES', '2025-10-17', '06:00:00', 'AGUDEZA VISUAL', 'FABIO ARGUELLO', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3007015239', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(813, 'HOSPITAL', '2025-10-17', '08:00:00', 'ANESTESIOLOGIA', 'FABIO ARGUELLO', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3245675766', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(814, 'HOSPITAL', '2025-10-17', '07:00:00', 'CARDIOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3165395169', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(815, 'CALLE 16 NO 9- 76', '2025-10-17', '06:00:00', 'CARDIOLOGIA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3156127158', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(816, 'CALLE 16 NO 9- 76', '2025-10-17', '11:00:00', 'CARDIOLOGIA PEDIATRICA PROCEDIMIENTOS', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3142050431', '2025-10-16 14:26:19', NULL, 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(817, 'HOSPITAL', '2025-10-18', '10:00:00', 'CARDIOLOGIA PEDIATRICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212812061', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(818, 'CES', '2025-10-18', '13:00:00', 'CIRUGIA GENERAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3212631673', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(819, 'CES', '2025-10-18', '14:00:00', 'CIRUGIA PEDIATRICA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3007015239', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(820, 'CES', '2025-10-18', '15:00:00', 'CIRUGIA MAXILOFACIAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3245675766', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(821, 'CES', '2025-10-18', '16:00:00', 'CITOLOGIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3165395169', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(822, 'HOSPITAL', '2025-10-18', '15:30:00', 'COLONOSCOPIA', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3156127158', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(823, 'CES', '2025-10-18', '09:00:00', 'CONTROL PRENATAL', 'FAYSURY', 'CC', '1098734130', 'MARIA FERNANDA SALAMANCA ', '3142050431', '2025-10-16 14:26:19', NULL, 'pendiente', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL),
(824, 'PRINCIPAL', '2025-11-20', '08:00:00', 'prueba', 'DR. JUAN PEREZ GOMEZ', 'CC', '1000000001', 'MARIA LOPEZ GARCIA [PRUEBA]', '3007015239', '2025-11-19 17:52:35', 'maria.test@example.com', 'recordatorio enviado', NULL, 'pendiente', 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas_historico`
--

CREATE TABLE `citas_historico` (
  `ID` int(11) NOT NULL,
  `ATENCION` varchar(255) NOT NULL,
  `FECHA_CITA` date NOT NULL,
  `HORA_CITA` time NOT NULL,
  `SERVICIO` varchar(255) NOT NULL,
  `PROFESIONAL` varchar(255) NOT NULL,
  `TIPO_IDE_PACIENTE` varchar(50) NOT NULL,
  `NUMERO_IDE` varchar(50) NOT NULL,
  `NOMBRE` varchar(255) NOT NULL,
  `TELEFONO_FIJO` varchar(20) DEFAULT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT current_timestamp(),
  `EMAIL` varchar(255) DEFAULT NULL,
  `ESTADO` varchar(50) DEFAULT 'pendiente',
  `MOTIVO_CANCELACION` text DEFAULT NULL,
  `FECHA_CANCELACION` datetime DEFAULT NULL,
  `CANCELADO_POR` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas_historico`
--

INSERT INTO `citas_historico` (`ID`, `ATENCION`, `FECHA_CITA`, `HORA_CITA`, `SERVICIO`, `PROFESIONAL`, `TIPO_IDE_PACIENTE`, `NUMERO_IDE`, `NOMBRE`, `TELEFONO_FIJO`, `CREATED_AT`, `EMAIL`, `ESTADO`, `MOTIVO_CANCELACION`, `FECHA_CANCELACION`, `CANCELADO_POR`) VALUES
(1, 'PRINCIPAL', '2025-02-27', '07:20:00', 'ADULTO MAYOR 45', 'ACEVEDO CALDERON DIANA PATRICIA', 'PT', '1836662', 'CLAUDIA  GALVIS WANDURRAGA', '3007015239', '2025-02-25 22:00:16', NULL, 'pendiente', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones`
--

CREATE TABLE `configuraciones` (
  `id` int(11) NOT NULL,
  `clave` varchar(255) NOT NULL,
  `valor` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuraciones`
--

INSERT INTO `configuraciones` (`id`, `clave`, `valor`, `created_at`, `updated_at`) VALUES
(1, 'api_labsmobile_key', 'TU_API_KEY_AQUI', '2025-02-28 16:39:27', '2025-02-28 16:39:27'),
(2, 'limite_diario_sms', '1000', '2025-02-28 16:39:27', '2025-02-28 16:39:27'),
(3, 'horario_envio_inicio', '08:00', '2025-02-28 16:39:27', '2025-02-28 16:39:27'),
(4, 'horario_envio_fin', '18:00', '2025-02-28 16:39:27', '2025-02-28 16:39:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

CREATE TABLE `mensajes` (
  `id` varchar(200) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `tipo` varchar(200) NOT NULL,
  `estado` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes`
--

INSERT INTO `mensajes` (`id`, `numero`, `mensaje`, `fecha`, `tipo`, `estado`) VALUES
('wamid.HBgMNTczMDA1MTEyNjc3FQIAEhggQUNCQTdEODhCQzYyMkZEQjEwMzU3MTY3ODcwMTVDQzUA', '3005112677', '👍', '2025-11-19 21:11:16', 'entrante', 'pendiente'),
('wamid.HBgMNTczMDA3MDE1MjM5FQIAEhgUM0FGMERDMDYwODI0MkU1NDk3NzcA', '3007015239', 'CANCELAR_CITA', '2025-11-19 20:55:25', 'entrante', 'cancelada'),
('wamid.HBgMNTczMDE3Nzg4Mzc2FQIAEhgUM0ExODU0RDc4QkZCNDM5MjEyRkIA', '3017788376', 'Equivocado', '2025-11-19 20:46:55', 'entrante', 'pendiente'),
('wamid.HBgMNTczMjEzMDI4MDUxFQIAEhgUM0E4NzhCRTdFQjNCNjFEMzMzMzIA', '3213028051', 'Está bien confirmar por favor', '2025-11-19 20:48:01', 'entrante', 'pendiente'),
('wamid.HBgMNTczMjMyMzI1MTQ2FQIAEhggQUMwMDU0NTk1RTM5MTAxRENDRTg3Q0E5MUZFMEM5OUMA', '3232325146', 'Si voy', '2025-11-19 20:46:59', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTA3MTI1NDg0FQIAEhggQUMxQkYwNjRCNjhDQkM1RTVEOTVEMTEzREQ3MjQ4ODgA', '3107125484', 'Por favor si  hire hala sita', '2025-11-19 21:09:49', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTczNzg1ODg2FQIAEhggQUM4MjdERjQ0ODI3MTM4QkNFOTY1MjNBNjQzREE2QkUA', '3173785886', 'Muchas gracias. Bendiciones', '2025-11-19 20:41:42', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTczNzMzNTYxFQIAEhggQTVDOEY1Q0IwNTQwQzVBMjlDQTAyQzgzMkJCMzFDQkQA', '3173733561', 'Gracias por comunicarte con Andre\'Style. ¿Cómo podemos ayudarte?', '2025-11-19 20:34:25', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTczOTQwODcyFQIAEhgUM0FERDUxNzY1MTNEOUJGNDg2QkEA', '3173940872', 'Allá estar', '2025-11-19 21:36:27', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTE0MjU4NjA4FQIAEhggQUMyNDdFMzU4RDg5NzhBMUNFNkI2MEQ1NTc3NDM4RUIA', '3114258608', 'La aplastamos  porque nos falta los resultados del cardiologo regalénos  nueva  sita gracias', '2025-11-19 21:21:41', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTE2MTIxMDU4FQIAEhggQUNFRDkxRDI1NTgyM0I0Qzk2QUNDNUEyMjUxMjE3MDgA', '3116121058', 'Gracias', '2025-11-19 20:44:30', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTEyMjI4MTI1FQIAEhggQUM5NkQ3RTg2Mjk5MTg3RkIxNzNEMEZGMDE4NUI3NTAA', '3112228125', 'Muchas gracias...', '2025-11-19 20:37:30', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTEyMzYwMDk0FQIAEhggQUNEMjNFN0MwRjhDRThEQzFGRUEzMUQ5QjczMDg2RjIA', '3112360094', 'Si señorargrasias mañana si Dios me lo permite allí estaré en ka cita', '2025-11-19 21:20:11', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTgzMjEyMDI3FQIAEhggQUMwQzFFQTcwQTE0NzhCQTNCMTM2QTczNTdCNTZCRTIA', '3183212027', 'Ningun paciente es mio', '2025-11-19 21:02:12', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTI0MDYyMDg0FQIAEhggQUMwQjU4RDZCQzg3NDMxQkEyRTg5NTNFNzM3MzA5NEUA', '3124062084', '👍', '2025-11-19 20:58:21', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTQ0MzYzNzkzFQIAEhggQUM3QzY2MkY5MzVGMzc3NzFBNEQ0MDkyODYxMzNGOUUA', '3144363793', 'Con el favor de Dios.  si asistiré ala consulta gracias', '2025-11-19 21:03:37', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTQ0Njg2OTk0FQIAEhggQUNBMDgwMUVGMUQzN0REOTg5RDNCNzc3MTlBM0E3MjMA', '3144686994', 'La niña a esa hora no puede', '2025-11-19 21:18:50', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTU0NTYzNzc2FQIAEhggQTUxQzlGNTkwNkY1RjU4NkZCMUI3MjczREI5NEE0MkUA', '3154563776', '¡Hola! 👋\n\nQueremos contarte que hemos actualizado nuestra plataforma de comunicaciones para atenderte mejor. 🙌\n\n📅 Desde el miércoles 12 de noviembre de 2025 , todas tus consultas, seguimientos y mensajes los atenderemos únicamente por nuestra nueva línea nacional:\n📞 333 603 3306 (llamadas y WhatsApp).\n\n⚠️ Este número dejará de estar disponible a partir de hoy, así que guarda el nuevo contacto para seguir en comunicación con nosotros.\n\nGracias por confiar en Enlace Vida – IPS Imed Health 👩🏻‍⚕️\n¡Seguimos acompañán', '2025-11-19 21:03:42', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTU2NDEwODM5FQIAEhggQUNEQzZFRjIzMjdGREIyNDcxNDE5REZGMjg1NEE3RDMA', '3156410839', 'Ya la cancelé gracias', '2025-11-19 21:28:06', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTU4NjQxNDA5FQIAEhggQUMwRDYxMzU2MUQ5ODNBMTIwNUFFRkQyQTQ0QUI4MUQA', '3158641409', 'Entendido 👍', '2025-11-19 21:34:44', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTUzNTM5Nzc2FQIAEhggQUNDNzBEMjkwRTY0NUJCRTVGQjhBNjdDRDg3M0Y0NDcA', '3153539776', 'Si asisto ala cita', '2025-11-19 20:59:55', 'entrante', 'pendiente'),
('wamid.HBgMNTczMTY3MDc2MTM3FQIAEhggQUM2NTk3QTY3N0YwQUZFMEUxNDg0Q0ZFMTc0QjYwMUEA', '3167076137', '👍👍👍', '2025-11-19 20:33:41', 'entrante', 'pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','usuario') DEFAULT 'usuario',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiration` datetime DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `creado_en`, `reset_token`, `reset_token_expiration`, `estado`) VALUES
(2, 'Juan Pérez', 'msalazar5@udi.edu.co', '$2b$12$YGPoJmBzDHcTiuUT.khzruLRzYsJllQwrkGNHtMatuHUwNMQPFtOS', 'admin', '2025-02-19 13:48:07', NULL, NULL, 'activo'),
(4, 'mateo salazar ortiz', 'mateo.s3009@gmail.com', '$2b$10$PlMVqkrw9L5nco8FyNsma.h8LZRmC4ttMpJuEepsgkLAvVEmK7tKa', 'usuario', '2025-02-20 13:39:20', NULL, NULL, 'activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `whatsapp_conversaciones`
--

CREATE TABLE `whatsapp_conversaciones` (
  `id` int(11) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `cita_id` int(11) NOT NULL,
  `estado_conversacion` varchar(50) NOT NULL DEFAULT 'esperando_respuesta' COMMENT 'esperando_respuesta/esperando_motivo/completada/cancelada',
  `mensaje_id` varchar(255) DEFAULT NULL COMMENT 'ID del mensaje de WhatsApp de Meta',
  `ultimo_mensaje` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idx_estado_fecha` (`ESTADO`,`FECHA_CITA`),
  ADD KEY `idx_cancelacion` (`FECHA_CANCELACION`);

--
-- Indices de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clave` (`clave`);

--
-- Indices de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `whatsapp_conversaciones`
--
ALTER TABLE `whatsapp_conversaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_telefono` (`telefono`),
  ADD KEY `idx_estado` (`estado_conversacion`),
  ADD KEY `idx_cita_id` (`cita_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=832;

--
-- AUTO_INCREMENT de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `whatsapp_conversaciones`
--
ALTER TABLE `whatsapp_conversaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `whatsapp_conversaciones`
--
ALTER TABLE `whatsapp_conversaciones`
  ADD CONSTRAINT `whatsapp_conversaciones_ibfk_1` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`ID`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `mover_citas_a_historico` ON SCHEDULE EVERY 1 DAY STARTS '2025-02-24 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    -- Insertar en la tabla histórica las citas del día anterior
    INSERT INTO citas_historico
    SELECT * FROM citas WHERE FECHA_CITA = CURDATE() - INTERVAL 1 DAY;
    
    -- Eliminar de la tabla principal las citas del día anterior
    DELETE FROM citas WHERE FECHA_CITA = CURDATE() - INTERVAL 1 DAY;
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
