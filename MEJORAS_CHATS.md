# Mejoras Implementadas en Sistema de Chats

## 🕐 Corrección de Timestamps (Zona Horaria)

### Problema Identificado
- Las fechas/horas se guardaban en formato UTC usando `.toISOString()`
- Colombia está en GMT-5, causando un desfase de 5 horas
- Ejemplo: 3:00 PM en Colombia se guardaba como 8:00 PM en la BD

### Solución Implementada
- Se ajustan todos los timestamps a zona horaria de Colombia (GMT-5)
- Archivos modificados:
  - `backend/controllers/whatsappController.js` (función `saveMessageToDb`)
  - `backend/controllers/whatsappController.js` (función `markMessagesAsRead`)

### Código Implementado
```javascript
// Convertir timestamp a fecha/hora local de Colombia (GMT-5)
const date = new Date(timestamp);
const colombiaOffset = -5 * 60; // -5 horas en minutos
const localDate = new Date(date.getTime() + (colombiaOffset * 60 * 1000));
const fecha = localDate.toISOString().slice(0, 19).replace("T", " ");
```

---

## ✅ Sistema de Mensajes Leídos/No Leídos

### Nuevas Funcionalidades

#### 1. Campos de Base de Datos
Se agregaron dos nuevos campos a la tabla `mensajes`:
- `leido` (BOOLEAN): Indica si el mensaje ha sido leído por el administrador
- `fecha_leido` (DATETIME): Timestamp de cuándo se marcó como leído

#### 2. Backend - Nuevos Endpoints

**Endpoint para marcar como leído:**
```
PUT /api/whatsapp/chats/:numero/marcar-leido
```
- Marca todos los mensajes entrantes no leídos de un chat como leídos
- Emite evento Socket.io para actualizar otros clientes en tiempo real

**Modificaciones en endpoints existentes:**
- `GET /api/whatsapp/chats`: Incluye contador `mensajes_no_leidos`
- `GET /api/whatsapp/chats/:numero`: Incluye campos `leido` y `fecha_leido`

#### 3. Frontend - Indicadores Visuales

**En ChatList.js:**
- Badge rojo con número de mensajes no leídos
- Se actualiza en tiempo real cuando llegan nuevos mensajes

**En ChatView.js:**
- Al abrir un chat, automáticamente marca los mensajes como leídos
- Iconos de check (✓) para mensajes no leídos
- Iconos de doble check (✓✓) en azul para mensajes leídos
- Tooltip mostrando fecha/hora de lectura

#### 4. Tiempo Real (Socket.io)

Nuevos eventos:
- `chat:mensajes_leidos`: Se emite cuando se marcan mensajes como leídos
- Listeners actualizados en `ChatList.js` y `ChatView.js`

---

## 📦 Archivos Creados

1. **backend/migrations/add_mensaje_leido_fields.sql**
   - Script SQL para agregar campos a la tabla `mensajes`
   - Crea índice `idx_mensajes_leido` para optimizar consultas
   - Marca mensajes salientes existentes como leídos

2. **backend/migrations/run_migration.js**
   - Script Node.js para ejecutar la migración automáticamente
   - Usa variables de entorno para conectarse a la BD

---

## 🚀 Instrucciones de Instalación

### 1. Ejecutar la Migración SQL

**Opción A: Usando el script Node.js (recomendado)**
```bash
node backend/migrations/run_migration.js
```

**Opción B: Ejecutar SQL manualmente**
```bash
mysql -u [usuario] -p [base_de_datos] < backend/migrations/add_mensaje_leido_fields.sql
```

O importar el archivo SQL desde phpMyAdmin / MySQL Workbench.

### 2. Reiniciar el Backend
```bash
cd backend
npm restart
# o si usas PM2:
pm2 restart all
```

### 3. Limpiar Caché del Frontend
```bash
cd frontend
npm start
# O si está en producción:
npm run build
```

---

## 🎨 Características Visuales

### Indicadores de Lectura en Mensajes Entrantes

- **No leído**: ✓ (check gris)
- **Leído**: ✓✓ (doble check azul)

### Badge de Mensajes No Leídos

- Círculo rojo con número blanco
- Solo aparece si hay mensajes no leídos
- Se oculta automáticamente al abrir el chat

---

## 🔄 Flujo de Funcionamiento

1. **Nuevo mensaje entrante**
   - Se guarda con `leido = 0` (no leído)
   - Se emite evento Socket.io `chat:nuevo_mensaje`
   - ChatList muestra badge con contador

2. **Usuario abre el chat**
   - `ChatView.js` carga los mensajes
   - Automáticamente llama a `markMessagesAsRead()`
   - Mensajes se marcan como `leido = 1`
   - Se actualiza `fecha_leido` con timestamp local

3. **Actualización en tiempo real**
   - Socket.io emite `chat:mensajes_leidos`
   - Otros clientes conectados actualizan sus contadores
   - Badge desaparece de ChatList

---

## 📊 Consultas SQL Útiles

### Ver mensajes no leídos por chat
```sql
SELECT numero, COUNT(*) as no_leidos
FROM mensajes
WHERE tipo = 'entrante' AND leido = 0
GROUP BY numero;
```

### Marcar todos los mensajes como leídos
```sql
UPDATE mensajes
SET leido = 1, fecha_leido = NOW()
WHERE tipo = 'entrante' AND leido = 0;
```

### Ver estadísticas de lectura
```sql
SELECT
  tipo,
  SUM(leido = 1) as leidos,
  SUM(leido = 0) as no_leidos,
  COUNT(*) as total
FROM mensajes
GROUP BY tipo;
```

---

## 🐛 Troubleshooting

### El contador no se actualiza
- Verificar que Socket.io esté conectado en el frontend
- Revisar la consola del navegador para errores
- Reiniciar el servidor backend

### Los timestamps siguen incorrectos
- Verificar la zona horaria del servidor MySQL: `SELECT @@global.time_zone;`
- Si el servidor está en UTC, ajustar el offset en el código si es necesario

### La migración falla
- Verificar credenciales de base de datos en `.env`
- Asegurar que el usuario tenga permisos de ALTER TABLE
- Ejecutar manualmente desde phpMyAdmin si es necesario

---

## 📝 Notas Adicionales

- Los mensajes **salientes** siempre se marcan como leídos automáticamente (fueron enviados por el sistema)
- Los mensajes **entrantes** comienzan como no leídos hasta que el usuario abra el chat
- El sistema es compatible con múltiples usuarios simultáneos gracias a Socket.io
- Todas las fechas se guardan en hora local de Colombia (GMT-5)

---

## 🎯 Mejoras Futuras Sugeridas

1. Filtro en ChatList para mostrar solo chats con mensajes no leídos
2. Sonido de notificación cuando llega un nuevo mensaje
3. Notificaciones de escritorio (Desktop Notifications API)
4. Indicador de "escribiendo..." cuando el paciente está escribiendo
5. Exportar conversaciones a PDF
6. Búsqueda dentro de las conversaciones

---

**Fecha de implementación:** 2025-11-19
**Desarrollador:** Claude Code
**Branch:** `claude/fix-chat-timestamps-read-status-014V3GWNPgCKaqFUkDMGJpXZ`
