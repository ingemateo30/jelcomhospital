# Configuración de Botones Interactivos en WhatsApp

## ⚠️ IMPORTANTE: Configuración de la Plantilla en Meta Business Suite

Los cambios realizados en el código requieren que actualices la plantilla de WhatsApp en Meta Business Suite para incluir botones interactivos.

## Pasos para configurar la plantilla

### 1. Accede a Meta Business Suite
- Ve a [Meta Business Suite](https://business.facebook.com/)
- Selecciona tu cuenta de WhatsApp Business
- Ve a la sección "Plantillas de Mensajes"

### 2. Edita la plantilla "recordatorio_citas"
- Busca la plantilla existente `recordatorio_citas`
- Haz clic en "Editar" o crea una nueva si es necesario

### 3. Configuración de botones
La plantilla debe tener 3 botones:

#### Botón 1: Confirmar Cita (Quick Reply)
- **Tipo**: Quick Reply
- **Texto del botón**: "✅ Confirmar Cita"
- **Payload**: `CONFIRMAR_CITA`

#### Botón 2: Cancelar Cita (Quick Reply)
- **Tipo**: Quick Reply
- **Texto del botón**: "❌ Cancelar Cita"
- **Payload**: `CANCELAR_CITA`

#### Botón 3: Reagendar (Phone Number)
- **Tipo**: Phone Number (Call Phone Number)
- **Texto del botón**: "📞 Llamar para Reagendar"
- **Número de teléfono**: `+576077249701`

### 4. Estructura completa de la plantilla

```
HEADER:
- Tipo: Imagen
- Contenido: Logo del hospital

BODY:
Hola {{1}}, te recordamos que tienes una cita médica programada para:

📅 Fecha: {{2}}
🕐 Hora: {{3}}
🏥 Servicio: {{4}}
👨‍⚕️ Profesional: {{5}}

📍 Dirección: {{6}}
🏢 {{7}}

{{8}}

Por favor, confirma tu asistencia.

BUTTONS:
1. [Quick Reply] ✅ Confirmar Cita
2. [Quick Reply] ❌ Cancelar Cita
3. [Phone Number] 📞 Llamar para Reagendar (+576077249701)
```

### 5. Enviar para aprobación
- Una vez configurada, envía la plantilla para revisión de Meta
- El proceso de aprobación puede tomar hasta 24 horas

## Funcionamiento del Sistema

### Cuando el paciente hace clic en "Confirmar Cita":
- El webhook recibe el payload `CONFIRMAR_CITA`
- El sistema actualiza el estado de la cita a "confirmada"
- Se envía un mensaje de confirmación al paciente

### Cuando el paciente hace clic en "Cancelar Cita":
- El webhook recibe el payload `CANCELAR_CITA`
- El sistema:
  1. Cancela la cita en Salud360
  2. Actualiza el estado en la base de datos local
  3. Envía un mensaje de confirmación de cancelación

### Cuando el paciente hace clic en "Llamar para Reagendar":
- Se abre automáticamente el marcador del teléfono con el número 6077249701
- El paciente puede llamar directamente para reagendar

## Compatibilidad con respuestas de texto

El sistema también sigue aceptando respuestas de texto:
- "Sí", "Si", "Confirmo" → Confirma la cita
- "No", "Cancelar" → Cancela la cita
- "Reagendar", "Reprogramar", "Cambiar" → Solicita reagendamiento

## Notas adicionales

- Los botones Quick Reply solo se pueden usar una vez por mensaje
- Los botones de tipo Phone Number permiten múltiples clics
- El sistema registra todas las interacciones en la tabla `mensajes`
- Las respuestas y citas se pueden ver en el frontend en la sección "Respuestas y Citas"
