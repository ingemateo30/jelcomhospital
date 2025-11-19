# Cancelación de Citas por WhatsApp - Integración con Salud360

## 📋 Descripción

Implementación de la funcionalidad para cancelar citas médicas a través de WhatsApp, integrándose directamente con la API SOAP de Salud360. Esta funcionalidad permite que cuando un paciente responde "NO" o "CANCELAR" al recordatorio, la cita se cancele automáticamente en el sistema hospitalario.

## 🚀 Funcionalidades Implementadas

### 1. Cliente SOAP Genérico
**Archivo**: `/backend/services/salud360Client.js`

Cliente reutilizable para interactuar con todos los WebServices SOAP de Salud360:
- Conexión automática a servicios WSDL
- Gestión de credenciales
- Manejo centralizado de errores
- Logging detallado

### 2. Servicio de Gestión de Citas
**Archivo**: `/backend/services/salud360CitasService.js`

Servicio especializado que implementa:

#### `obtenerProximasCitas(tipoId, numeroId)`
- Consulta las próximas citas de un paciente en Salud360
- Utiliza el WebService `WSProximasCitas`
- Retorna array de citas con todos los detalles incluyendo `CitNum`

#### `buscarCitaPorFechaHora(tipoId, numeroId, fecha, hora)`
- Busca una cita específica por fecha y hora
- Filtra las próximas citas del paciente
- Retorna la cita que coincide con los parámetros

#### `cancelarCita(citNum, motivo)`
- Cancela una cita en Salud360
- Utiliza el WebService `WSCancelarCita`
- Requiere el número de cita (CitNum)

#### `buscarYCancelarCita(datosPaciente, motivo)`
- **Flujo completo**: Busca la cita por datos del paciente y la cancela
- Soluciona el problema de que el Excel no contiene el CitNum
- Realiza todo el proceso en un solo método

### 3. Integración con Chatbot de WhatsApp
**Archivo**: `/backend/controllers/chatbotController.js`

Mejoras implementadas:
- Detección de respuestas "NO" o "CANCELAR"
- Llamada automática al servicio de Salud360
- Actualización de estado en BD local (tabla `citas`)
- Mensajes diferenciados según éxito o fallo de la cancelación
- Manejo robusto de errores

## 🔄 Flujo de Cancelación

```
1. Paciente responde "NO" o "CANCELAR" en WhatsApp
   ↓
2. Chatbot obtiene datos de la cita desde BD local (tabla citas)
   - NUMERO_IDE
   - TIPO_IDE_PACIENTE
   - FECHA_CITA
   - HORA_CITA
   ↓
3. Llamada a Salud360 - WSProximasCitas
   - Envía: Tipo ID, Número ID
   - Recibe: Array de próximas citas con CitNum
   ↓
4. Filtrado de cita específica
   - Busca coincidencia por FECHA_CITA y HORA_CITA
   - Obtiene el CitNum de la cita correcta
   ↓
5. Llamada a Salud360 - WSCancelarCita
   - Envía: CitNum + Motivo
   - Cancela la cita en Salud360
   ↓
6. Actualización en BD local
   - UPDATE tabla citas SET ESTADO = 'cancelada'
   - UPDATE tabla mensajes SET estado = 'cancelada'
   ↓
7. Confirmación al paciente por WhatsApp
   - ✅ Éxito: "Cita cancelada exitosamente en el sistema"
   - ⚠️ Error: "Solicitud registrada, confirmar por teléfono"
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Salud360 SOAP WebServices
SALUD360_BASE_URL=https://hs.salud360.app/Salud360Hs/servlet/
SALUD360_USER=CITAWEB
SALUD360_PASS=Abc123*
SALUD360_EMPRESA_COD=36
SALUD360_SEDE_COD=1
SALUD360_HOMSEDCIUCLI=1
```

### Dependencias

```json
{
  "soap": "^1.0.0"
}
```

**Instalación**:
```bash
cd backend
npm install soap
```

## 📊 Estructura de Base de Datos

### Tabla: citas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| NUMERO_IDE | VARCHAR(50) | Número de identificación del paciente |
| TIPO_IDE_PACIENTE | VARCHAR(50) | Tipo de identificación (CC, TI, etc.) |
| FECHA_CITA | DATE | Fecha de la cita (YYYY-MM-DD) |
| HORA_CITA | TIME | Hora de la cita (HH:MM:SS) |
| ESTADO | VARCHAR(50) | Estado: 'pendiente', 'confirmada', 'cancelada' |

### Tabla: mensajes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| numero | VARCHAR(20) | Teléfono del paciente |
| estado | VARCHAR(50) | Estado del mensaje/cita |

## 🧪 Pruebas

### Escenario 1: Cancelación Exitosa
```
1. Paciente recibe recordatorio de cita
2. Responde: "no"
3. Sistema busca cita en Salud360
4. Cancela cita exitosamente
5. Actualiza BD local
6. Envía confirmación: "✅ Tu cita ha sido cancelada exitosamente"
```

### Escenario 2: Cita No Encontrada en Salud360
```
1. Paciente responde: "no"
2. Sistema busca cita en Salud360
3. No encuentra coincidencia (fecha/hora)
4. Marca como cancelada en BD local
5. Envía: "⚠️ Solicitud registrada, confirmar por teléfono"
```

### Escenario 3: Error de Conexión
```
1. Paciente responde: "no"
2. Sistema intenta conectar con Salud360
3. Falla la conexión (timeout, credenciales, etc.)
4. Marca como cancelada en BD local
5. Envía: "⚠️ Solicitud registrada, confirmar por teléfono"
```

## 📝 Logs

El sistema genera logs detallados para debugging:

```
[Salud360] Conectando a: https://hs.salud360.app/Salud360Hs/servlet/awsproximascitas?wsdl
[Salud360] Cliente SOAP creado para: awsproximascitas
[Salud360Citas] Consultando próximas citas para CC 1112769409
[Salud360Citas] Se encontraron 2 citas próximas
[Salud360Citas] Buscando cita para 2025-07-01 07:00:00
[Salud360Citas] Cita encontrada: CitNum 1120845
[Salud360Citas] Cancelando cita 1120845
✅ Cita cancelada en Salud360: CitNum 1120845
✅ Estado de cita actualizado en BD: 1112769409 - 2025-07-01 07:00:00 -> cancelada
```

## 🔐 Seguridad

- Credenciales almacenadas en variables de entorno
- Validación de datos antes de enviar a Salud360
- Manejo seguro de errores sin exponer información sensible
- Logs sanitizados (no se registran contraseñas)

## 🐛 Manejo de Errores

### Códigos de Error de Salud360

| Código | Descripción | Acción |
|--------|-------------|--------|
| S01 | Operación exitosa | Continuar flujo |
| S02 | Credenciales incorrectas | Revisar .env |
| S03 | Cita inexistente | Mensaje de confirmación manual |
| S04 | Paciente no encontrado | Mensaje de confirmación manual |

### Estrategia de Fallback

Si falla la cancelación en Salud360:
1. ✅ Se marca como cancelada en BD local
2. ✅ Se notifica al paciente
3. ✅ Se genera log detallado del error
4. ⚠️ Se solicita confirmación manual

Esto asegura que **nunca se pierde la intención del paciente** de cancelar.

## 🚦 Estados de Cita

| Estado | Origen | Descripción |
|--------|--------|-------------|
| pendiente | Excel | Cita cargada, sin recordatorio enviado |
| recordatorio enviado | WhatsApp | Recordatorio enviado, esperando respuesta |
| confirmada | WhatsApp | Paciente confirmó asistencia |
| cancelada | WhatsApp + Salud360 | Paciente canceló, sincronizado con hospital |
| reagendamiento solicitado | WhatsApp | Paciente solicita cambiar fecha |

## 📚 Referencias API Salud360

### WSProximasCitas
- **URL**: `https://hs.salud360.app/Salud360Hs/servlet/awsproximascitas?wsdl`
- **Método**: Execute
- **Input**: Homsedciucli, Pactipidecod, Pacnumide, Usulog, Usupas
- **Output**: JSON con array de citas (CitNum, CitFec, CitHor, etc.)

### WSCancelarCita
- **URL**: `https://hs.salud360.app/Salud360Hs/servlet/awscancelarcita?wsdl`
- **Método**: Execute
- **Input**: Citempcod, Citnum, Citobscan, Usulog, Usupas
- **Output**: Código de respuesta (S01 = éxito)

## 🎯 Solución al Problema Principal

### ❌ Problema Original
El archivo Excel cargado **NO contiene el CitNum** (número de cita de Salud360), por lo que no se podía cancelar directamente.

### ✅ Solución Implementada
1. Usar `WSProximasCitas` para obtener todas las citas del paciente
2. Filtrar por FECHA_CITA y HORA_CITA (que SÍ están en el Excel)
3. Extraer el CitNum de la cita coincidente
4. Usar ese CitNum para cancelar con `WSCancelarCita`

## 🔮 Mejoras Futuras

- [ ] Implementar reintentos automáticos en caso de fallo de red
- [ ] Cache de resultados de `WSProximasCitas` para optimizar
- [ ] Dashboard para ver cancelaciones en tiempo real
- [ ] Notificaciones al personal médico sobre cancelaciones
- [ ] Integración con otros WebServices de Salud360 (reagendamiento)
- [ ] Tests unitarios y de integración
- [ ] Métricas de tasa de éxito de cancelaciones

## 👥 Autor

Implementado por: Claude AI
Fecha: Noviembre 2025
Proyecto: Sistema de Recordatorios JELCOM - Hospital Regional de San Gil

## 📄 Licencia

Este código es propiedad del Hospital Regional de San Gil y JELCOM.
