# Funcionalidades Implementadas: Multimedia y Contador de Bloqueados

## Resumen

Se han implementado dos funcionalidades principales:

1. **Soporte para mensajes multimedia** (WhatsApp)
2. **Contador de bloqueados** en reportes de llamadas de voz y WhatsApp

---

## 1. Mensajes Multimedia

### Descripción

El sistema ahora puede recibir, descargar y almacenar archivos multimedia enviados por los usuarios a través de WhatsApp, incluyendo:

- Imágenes (JPG, PNG, GIF, WebP)
- Audio/Notas de voz (MP3, OGG, Opus, AAC, AMR)
- Videos (MP4, 3GP, MOV)
- Documentos (PDF, DOC, DOCX, XLS, XLSX, etc.)

### Archivos Modificados/Creados

#### Backend

1. **`backend/migrations/add_multimedia_fields.sql`** (Nuevo)
   - Agrega campos multimedia a la tabla `mensajes`
   - Crea tabla `multimedia_descargas` para tracking

2. **`backend/services/mediaService.js`** (Nuevo)
   - Servicio completo para manejo de multimedia
   - Descarga archivos desde la API de Meta
   - Almacena archivos localmente
   - Registra metadata en base de datos

3. **`backend/controllers/whatsappController.js`** (Modificado)
   - Detecta tipos de mensaje multimedia
   - Procesa y descarga archivos automáticamente
   - Emite eventos Socket.io con información de media

4. **`backend/index.js`** (Modificado)
   - Configuración de archivos estáticos (`/media`)
   - Creación automática de directorio de uploads

### Campos Agregados a la Tabla `mensajes`

```sql
- tipo_media: VARCHAR(50) - Tipo de multimedia (image, audio, video, document)
- url_media: TEXT - URL del archivo almacenado localmente
- url_meta: TEXT - URL original de Meta API
- media_id: VARCHAR(255) - ID del media en Meta API
- mime_type: VARCHAR(100) - Tipo MIME del archivo
- tamaño_archivo: INT - Tamaño en bytes
- metadata: JSON - Metadata adicional (dimensiones, duración, etc.)
```

### Tabla Nueva: `multimedia_descargas`

Registra el proceso de descarga de archivos multimedia para tracking y debugging.

### Cómo Funciona

1. Usuario envía un mensaje multimedia a WhatsApp
2. Meta API envía webhook con información del mensaje
3. Sistema detecta el tipo de media (image, audio, video, document)
4. Se obtiene información del media desde Meta API
5. Se descarga el archivo y se guarda en `backend/uploads/media/`
6. Se actualiza la BD con toda la información
7. Frontend puede acceder al archivo vía `/media/{filename}`

### Variables de Entorno

```bash
# Opcional: Personalizar directorio de multimedia
MEDIA_DIR=/ruta/personalizada/para/media
```

### Rutas de Acceso

- **Archivos multimedia**: `http://localhost:3001/media/{filename}`
- **API de Meta**: Configurada en `META_WA_BASE_URL` (v21.0 por defecto)

### Funciones Útiles del Servicio

```javascript
const mediaService = require('./services/mediaService');

// Procesar y descargar multimedia
await mediaService.processMediaMessage({
  messageId: 'id_del_mensaje',
  mediaId: 'id_del_media_en_meta',
  phone: '3001234567',
  mediaType: 'image'
});

// Obtener estadísticas de multimedia
const stats = await mediaService.getMediaStats();

// Limpiar archivos antiguos (>90 días)
await mediaService.cleanupOldMedia(90);
```

---

## 2. Contador de Bloqueados en Reportes

### Descripción

Los reportes ahora muestran un contador separado para números bloqueados (en lista negra), diferenciándolos de los fallidos por otros motivos.

### Archivos Modificados

#### Backend

1. **`backend/controllers/whatsappController.js`** (Modificado)
   - Marca citas como "bloqueado" cuando el número está en lista negra
   - Línea 327: `await WhatsAppReminder.updateReminderStatus(reminder.id, "bloqueado")`

2. **`backend/controllers/programarllamadas.js`** (Modificado)
   - Marca citas como "bloqueado" para llamadas de voz
   - Líneas 76-79: Actualización de estado a "bloqueado"

3. **`backend/routes/historialRoutes.js`** (Modificado)
   - Incluye estado "bloqueado" en consultas SQL
   - Agrega contador `bloqueados` a las estadísticas
   - Transformación de estados preserva "bloqueado"

#### Frontend

1. **`frontend/src/pages/HistorialEnvios.js`** (Modificado)
   - Nueva tarjeta de estadísticas para "Bloqueados"
   - Grid cambiado de 4 a 5 columnas
   - Icono Shield para representar bloqueados
   - Color naranja (orange-400) para distinguirlos

### Nuevos Estados de Cita

- **"bloqueado"**: Número está en lista negra, no se intenta envío
- **"recordatorio enviado"**: Envío exitoso
- **"pendiente"**: Por enviar
- **"cancelada"**: Cita cancelada

### Estructura de Estadísticas

```json
{
  "total": 100,
  "exitosos": 75,
  "fallidos": 15,
  "bloqueados": 10,
  "tasaExito": "75.0"
}
```

### Visualización

**Antes:**
```
[Total] [Exitosos] [Fallidos] [Tasa de Éxito]
```

**Después:**
```
[Total] [Exitosos] [Fallidos] [Bloqueados] [Tasa de Éxito]
```

La tarjeta de bloqueados muestra:
- Icono: 🛡️ (Shield)
- Color: Naranja
- Contador: Cantidad de números bloqueados

---

## Migración de Base de Datos

### Ejecutar Migraciones

```bash
# Conectar a MySQL
mysql -u usuario -p nombre_base_datos

# Ejecutar migración de multimedia
source backend/migrations/add_multimedia_fields.sql;
```

### Verificar Cambios

```sql
-- Ver nuevos campos
DESCRIBE mensajes;

-- Ver tabla de descargas
DESCRIBE multimedia_descargas;

-- Contar bloqueados
SELECT COUNT(*) FROM citas WHERE ESTADO = 'bloqueado';
```

---

## Testing

### Probar Multimedia

1. Envía una imagen a tu número de WhatsApp Business
2. Verifica logs del servidor:
   ```
   🖼️ Imagen recibida - ID: {media_id}
   📥 Procesando archivo multimedia...
   ✅ Multimedia procesado: /media/{filename}
   ```
3. Accede al archivo: `http://localhost:3001/media/{filename}`

### Probar Contador de Bloqueados

1. Agrega un número a la lista negra
2. Programa envío de recordatorios
3. Verifica que aparezca en reportes con estado "bloqueado"
4. Verifica que el contador se actualice en el frontend

---

## Consideraciones

### Seguridad

- Los archivos multimedia se almacenan localmente en `backend/uploads/media/`
- Solo archivos descargados desde Meta API son confiables
- Se validan tipos MIME antes de guardar

### Almacenamiento

- Los archivos multimedia ocupan espacio en disco
- Considerar implementar limpieza automática de archivos antiguos
- Usar `mediaService.cleanupOldMedia(dias)` para mantenimiento

### Rendimiento

- Las descargas de multimedia son asíncronas
- No bloquean el procesamiento de mensajes
- Se registran errores sin detener el flujo

---

## Próximos Pasos (Opcional)

1. **Visualización de multimedia en ChatView**
   - Mostrar imágenes inline
   - Reproductor de audio
   - Preview de documentos

2. **Límites de almacenamiento**
   - Configurar límite de tamaño por archivo
   - Limpieza automática programada
   - Compresión de imágenes

3. **CDN/Cloud Storage**
   - Migrar a S3, Cloudinary, etc.
   - URLs públicas permanentes

4. **Análisis de multimedia**
   - OCR en imágenes
   - Transcripción de audio
   - Detección de contenido

---

## Soporte

Para problemas o preguntas:
- Revisar logs del servidor: `console.log` con emojis identificadores
- Verificar permisos de escritura en `backend/uploads/media/`
- Confirmar variables de entorno `META_TOKEN` y `META_PHONE_NUMBER_ID`
