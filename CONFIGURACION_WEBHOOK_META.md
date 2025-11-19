# Configuración del Webhook de Meta API para WhatsApp

## 🎯 Objetivo

Este documento explica cómo configurar el webhook de Meta API para recibir respuestas de botones interactivos en los recordatorios de citas de WhatsApp.

## ⚠️ Problema Identificado

**Antes de esta corrección:**
- ❌ Los botones interactivos no funcionaban al presionarlos
- ❌ El sistema no recibía notificaciones cuando los pacientes presionaban "Confirmar" o "Cancelar"
- ❌ Mensajes duplicados llegaban a los pacientes
- ❌ El webhook estaba configurado solo para UltraMsg, no para Meta API

**Después de esta corrección:**
- ✅ Webhook de Meta API implementado y funcional
- ✅ Los botones interactivos ahora procesan correctamente las respuestas
- ✅ Sistema detecta cuando se presionan botones de confirmar/cancelar
- ✅ Integración completa con Salud360 para cancelaciones

---

## 🔧 Cambios Implementados

### 1. Nuevo Webhook de Meta API
**Archivo**: `/backend/controllers/whatsappController.js`

Se agregaron las siguientes funciones:

- `verifyWebhook()` - Verificación requerida por Meta
- `handleMetaWebhook()` - Recibe notificaciones de Meta
- `processMetaMessage()` - Procesa mensajes y botones interactivos
- `processUserResponse()` - Maneja la lógica de confirmación/cancelación
- `sendWhatsAppMessage()` - Envía respuestas vía Meta API

### 2. Nuevas Rutas
**Archivo**: `/backend/routes/whatsappRoutes.js`

```javascript
// Webhook de Meta API
router.get("/webhook-meta", verifyWebhook);    // Verificación
router.post("/webhook-meta", handleMetaWebhook); // Mensajes
```

### 3. Detección de Botones Interactivos

El webhook ahora detecta correctamente:
- ✅ Botones interactivos (`type: "interactive"`)
- ✅ Botones legacy (`type: "button"`)
- ✅ Mensajes de texto normales (`type: "text"`)

---

## 📋 Configuración Paso a Paso

### Paso 1: Configurar Variable de Entorno

Verifica que tu archivo `.env` tenga la siguiente variable:

```bash
# Token de verificación del webhook de Meta
META_VERIFY_TOKEN=mi_token_secreto_12345
```

> **Nota:** Esta variable ya debería estar configurada. Si no existe, agrégala al archivo `.env`.

---

### Paso 2: Configurar el Webhook en Meta Business Suite

1. **Accede a Meta for Developers**
   - Ve a: https://developers.facebook.com/apps/
   - Selecciona tu aplicación de WhatsApp Business

2. **Configurar Webhook**
   - Ve a: **Configuración > WhatsApp > Configuración**
   - En la sección "Webhook", haz clic en **Configurar**

3. **Datos del Webhook**

   **URL del Callback:**
   ```
   https://tu-dominio.com/api/whatsapp/webhook-meta
   ```

   **Token de verificación:**
   ```
   mi_token_secreto_12345
   ```
   _(El mismo que configuraste en `.env`)_

4. **Suscribirse a Eventos**

   Marca las siguientes opciones:
   - ✅ `messages` - Para recibir mensajes entrantes
   - ✅ `message_status` - Para estado de mensajes (opcional)

5. **Verificar Webhook**
   - Haz clic en **Verificar y guardar**
   - Meta enviará una petición GET a tu endpoint para validar
   - Deberías ver en los logs: `✅ Webhook verificado correctamente`

---

### Paso 3: Verificar la Configuración

#### Probar el Webhook Localmente (Desarrollo)

Si estás desarrollando localmente, necesitas exponer tu servidor con **ngrok**:

```bash
# Instalar ngrok (si no lo tienes)
npm install -g ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Usa la URL de ngrok como webhook:
```
https://abc123.ngrok.io/api/whatsapp/webhook-meta
```

#### Probar en Producción

Simplemente usa tu dominio público:
```
https://tu-servidor.com/api/whatsapp/webhook-meta
```

---

## 🧪 Pruebas

### 1. Enviar Recordatorio de Prueba

```bash
GET /api/whatsapp/enviar-recordatorios
```

### 2. Presionar Botón de Confirmación

Cuando el paciente presiona **"Confirmar Cita"**:

**Logs esperados:**
```
📨 Webhook Meta recibido: {...}
📱 Procesando mensaje de 3001234567
   Tipo: interactive
   🔘 Botón presionado: CONFIRMAR_CITA
   📝 Mensaje guardado en BD
   ✅ Cita confirmada
   ✅ Mensaje enviado a 573001234567
   💾 Estado actualizado: confirmada
```

### 3. Presionar Botón de Cancelación

Cuando el paciente presiona **"Cancelar Cita"**:

**Logs esperados:**
```
📨 Webhook Meta recibido: {...}
📱 Procesando mensaje de 3001234567
   Tipo: interactive
   🔘 Botón presionado: CANCELAR_CITA
   🔄 Iniciando cancelación para 3001234567
   📋 Datos para cancelación: {...}
   ✅ Cita cancelada en Salud360: CitNum 12345
   ✅ Mensaje enviado a 573001234567
   💾 Estado actualizado: cancelada
```

---

## 🔍 Estructura de Mensajes de Meta API

### Botón Interactivo (Quick Reply)

Cuando un usuario presiona un botón:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "from": "573001234567",
          "id": "wamid.xyz==",
          "timestamp": "1700000000",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": {
              "id": "CONFIRMAR_CITA",
              "title": "Confirmar Cita"
            }
          }
        }]
      }
    }]
  }]
}
```

### Mensaje de Texto Normal

```json
{
  "messages": [{
    "from": "573001234567",
    "type": "text",
    "text": {
      "body": "Sí, confirmo"
    }
  }]
}
```

---

## 📊 Flujo Completo

```
┌─────────────────────┐
│   Sistema Backend   │
│  Envía Recordatorio │
│   con Plantilla     │
│   (Meta Template)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paciente Recibe    │
│   Recordatorio con  │
│   Botones:          │
│   [Confirmar]       │
│   [Cancelar]        │
└──────────┬──────────┘
           │
           ▼ (presiona botón)
┌─────────────────────┐
│  Meta API Envía     │
│  Notificación al    │
│  Webhook Backend    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ handleMetaWebhook() │
│   Procesa Respuesta │
│   - Detecta botón   │
│   - Valida cita     │
│   - Ejecuta acción  │
└──────────┬──────────┘
           │
           ├─── CONFIRMAR ──┐
           │                │
           │                ▼
           │      ┌─────────────────┐
           │      │ Actualiza estado│
           │      │ a "confirmada"  │
           │      │ Envía mensaje   │
           │      │ de confirmación │
           │      └─────────────────┘
           │
           └─── CANCELAR ───┐
                            │
                            ▼
                  ┌─────────────────┐
                  │ Cancela en      │
                  │ Salud360        │
                  │ Actualiza BD    │
                  │ Envía mensaje   │
                  │ de cancelación  │
                  └─────────────────┘
```

---

## 🐛 Solución de Problemas

### Problema 1: Webhook no recibe notificaciones

**Causa:** Meta no puede alcanzar tu servidor

**Solución:**
1. Verifica que tu servidor esté público (no localhost)
2. Asegúrate de que el puerto esté abierto
3. Revisa que la URL termine en `/api/whatsapp/webhook-meta`
4. Verifica certificado SSL (Meta requiere HTTPS)

### Problema 2: Verificación falla (403 Forbidden)

**Causa:** Token de verificación incorrecto

**Solución:**
1. Verifica que `META_VERIFY_TOKEN` en `.env` coincida
2. Reinicia el servidor después de cambiar `.env`
3. Revisa los logs: `❌ Token de verificación incorrecto`

### Problema 3: Los botones no hacen nada

**Causa:** Webhook configurado en Meta apunta a UltraMsg

**Solución:**
1. Cambia la URL del webhook en Meta Business Suite
2. Debe apuntar a: `/api/whatsapp/webhook-meta`
3. NO debe apuntar a: `/api/whatsapp/webhook-ultramsg`

### Problema 4: Mensajes duplicados

**Causa:** Puede haber flujos automáticos configurados en Meta

**Solución:**
1. Revisa los flujos (flows) en Meta Business Suite
2. Desactiva cualquier flujo automático de seguimiento
3. Verifica que no haya plantillas configuradas para envío automático

---

## 📞 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/whatsapp/webhook-meta` | Verificación del webhook |
| POST | `/api/whatsapp/webhook-meta` | Recibir mensajes y botones |
| GET | `/api/whatsapp/enviar-recordatorios` | Enviar recordatorios |
| GET | `/api/whatsapp/respuestas` | Ver respuestas de pacientes |
| GET | `/api/whatsapp/citas-canceladas` | Ver citas canceladas |

---

## ✅ Checklist de Configuración

Marca cada paso al completarlo:

- [ ] Variable `META_VERIFY_TOKEN` verificada en `.env`
- [ ] Servidor reiniciado después de verificar variable
- [ ] Webhook configurado en Meta Business Suite
- [ ] URL del webhook apunta a `/api/whatsapp/webhook-meta`
- [ ] Token de verificación coincide con `.env`
- [ ] Webhook verificado correctamente (check verde en Meta)
- [ ] Suscrito a evento `messages`
- [ ] Prueba enviando recordatorio de prueba
- [ ] Prueba presionando botón de confirmación
- [ ] Prueba presionando botón de cancelación
- [ ] Verificar logs en consola del servidor
- [ ] Verificar mensajes en base de datos

---

## 📝 Notas Importantes

1. **HTTPS Requerido:** Meta API solo acepta webhooks HTTPS, no HTTP
2. **Respuesta Rápida:** El webhook debe responder en menos de 20 segundos
3. **Idempotencia:** Meta puede reenviar el mismo mensaje, el sistema detecta duplicados
4. **Estado de Citas:** Una vez procesada, la cita no se puede cambiar de estado
5. **Integración Salud360:** Las cancelaciones se sincronizan automáticamente

---

## 🚀 Próximos Pasos

Después de configurar el webhook:

1. **Realizar pruebas exhaustivas** con números de prueba
2. **Monitorear logs** durante las primeras horas
3. **Revisar mensajes duplicados** en la BD
4. **Validar cancelaciones** en Salud360
5. **Documentar errores** encontrados para mejoras futuras

---

## 📞 Contacto

Si encuentras problemas con la configuración, revisa:
- Logs del servidor backend
- Consola de Meta for Developers
- Base de datos (tabla `mensajes`)

**Número de soporte configurado:** 6077249701
