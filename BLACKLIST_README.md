# Lista Negra de Números - Documentación

## 📋 Descripción

Sistema completo para gestionar una lista negra de números telefónicos y bloquear automáticamente el envío de recordatorios (SMS y WhatsApp) a estos números.

## 🚀 Instalación

### 1. Ejecutar el script de migración de base de datos

Antes de usar el sistema, debes ejecutar el script SQL para crear la tabla `blacklist`:

```bash
# Desde MySQL o phpMyAdmin, ejecuta:
mysql -u tu_usuario -p recordatorios_db < backend/blacklist_migration.sql

# O desde phpMyAdmin:
# - Ve a la base de datos "recordatorios_db"
# - Haz clic en "SQL"
# - Copia y pega el contenido de backend/blacklist_migration.sql
# - Ejecuta
```

### 2. Reiniciar el servidor backend

```bash
cd backend
npm start
```

### 3. Reiniciar el frontend (si está corriendo)

```bash
cd frontend
npm start
```

## ✨ Características

### Backend
- ✅ **API RESTful completa** para gestionar la lista negra
- ✅ **Verificación automática** antes de enviar SMS o WhatsApp
- ✅ **Logs detallados** de números bloqueados
- ✅ **Validación de duplicados** al agregar números
- ✅ **Compatibilidad** con diferentes formatos de números

### Frontend
- ✅ **Interfaz moderna y fácil de usar**
- ✅ **Búsqueda en tiempo real** por número o razón
- ✅ **Modal intuitivo** para agregar números
- ✅ **Confirmación** antes de eliminar números
- ✅ **Alertas visuales** de éxito/error
- ✅ **Responsive design** para todos los dispositivos

## 🎯 Uso

### Agregar un número a la lista negra

1. Inicia sesión en el sistema
2. Ve al menú lateral y haz clic en **"Lista Negra"** (icono de prohibición 🚫)
3. Haz clic en el botón **"Agregar Número"**
4. Ingresa el número de teléfono (ej: 3001234567)
5. Opcionalmente, agrega una razón para el bloqueo
6. Haz clic en **"Agregar"**

### Eliminar un número de la lista negra

1. En la página de Lista Negra, busca el número que deseas eliminar
2. Haz clic en el botón **"Eliminar"** al lado del número
3. Confirma la eliminación

### Buscar números

Usa la barra de búsqueda en la parte superior para filtrar por:
- Número de teléfono
- Razón del bloqueo

## 🔧 Endpoints de la API

### Obtener todos los números bloqueados
```http
GET /api/blacklist
Authorization: Bearer {token}
```

### Agregar número a la lista negra
```http
POST /api/blacklist
Authorization: Bearer {token}
Content-Type: application/json

{
  "telefono": "3001234567",
  "razon": "Cliente solicitó no recibir mensajes",
  "bloqueadoPor": "Nombre del usuario"
}
```

### Verificar si un número está bloqueado
```http
GET /api/blacklist/verificar/:telefono
Authorization: Bearer {token}
```

### Eliminar número de la lista negra (por ID)
```http
DELETE /api/blacklist/:id
Authorization: Bearer {token}
```

### Eliminar número de la lista negra (por teléfono)
```http
DELETE /api/blacklist/telefono/:telefono
Authorization: Bearer {token}
```

### Actualizar razón del bloqueo
```http
PUT /api/blacklist/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "razon": "Nueva razón del bloqueo"
}
```

## 🔒 Comportamiento del Sistema

### Envío Automático de Recordatorios
- Al ejecutarse el cron job de recordatorios (8:00 AM), el sistema:
  1. Obtiene todas las citas del día siguiente
  2. Para cada cita, verifica si el número está en la lista negra
  3. Si está bloqueado, **omite el envío** y registra en los logs
  4. Si no está bloqueado, procede con el envío normal
  5. Muestra estadísticas al final: Total, Enviados, Bloqueados

### Envío Manual de SMS/WhatsApp
- Al intentar enviar un mensaje manual:
  1. El sistema verifica si el número está en la lista negra
  2. Si está bloqueado, retorna error 403 con mensaje descriptivo
  3. Si no está bloqueado, procede con el envío

## 📊 Estructura de la Tabla `blacklist`

```sql
CREATE TABLE `blacklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `telefono` varchar(20) NOT NULL,
  `razon` text DEFAULT NULL,
  `bloqueado_por` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `telefono_unique` (`telefono`),
  KEY `idx_telefono` (`telefono`)
);
```

## 📝 Logs del Sistema

### Ejemplo de logs durante envío automático:
```
📢 Enviando recordatorio de citas...
📋 Citas obtenidas: 50
📩 Procesando recordatorio para: Juan Pérez con Dr. García
🚫 Número bloqueado: 3001234567 - No se enviará recordatorio
📩 Procesando recordatorio para: María López con Dr. Rodríguez
📲 Enviando SMS a 573007654321...
✅ Recordatorio enviado a: 3007654321
...
🚀 Recordatorios procesados. Total: 50 | Bloqueados: 5 | Enviados: 45
```

## ⚠️ Notas Importantes

1. **Formatos de número**: El sistema es flexible con los formatos de número:
   - Acepta: `3001234567`, `573001234567`, `+573001234567`
   - Normaliza automáticamente antes de comparar

2. **Duplicados**: No se pueden agregar números duplicados. El sistema valida antes de insertar.

3. **Autenticación**: Todas las rutas requieren token JWT válido.

4. **Permisos**: Cualquier usuario autenticado puede gestionar la lista negra.

## 🐛 Solución de Problemas

### Error: "Tabla blacklist no existe"
**Solución**: Ejecuta el script de migración `backend/blacklist_migration.sql`

### Error: "No se encontró el token de autenticación"
**Solución**: Cierra sesión y vuelve a iniciar sesión

### El número bloqueado sigue recibiendo mensajes
**Solución**:
1. Verifica que el número esté correctamente agregado en la lista
2. Revisa los logs del backend para ver si se está verificando
3. Asegúrate de que el servidor backend se haya reiniciado después de los cambios

## 🎨 Capturas de Pantalla

### Interfaz de Lista Negra
- Vista de tabla con todos los números bloqueados
- Búsqueda en tiempo real
- Información de fecha y usuario que bloqueó
- Botones de acción intuitivos

### Modal de Agregar Número
- Formulario simple con validación
- Campo de teléfono obligatorio
- Campo de razón opcional
- Feedback visual inmediato

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa los logs del backend para errores detallados
2. Verifica que la tabla `blacklist` exista en la base de datos
3. Asegúrate de que el servidor backend esté corriendo
4. Revisa la consola del navegador para errores del frontend

## 🔄 Próximas Mejoras (Opcional)

- [ ] Importar/exportar lista negra desde Excel
- [ ] Historial de cambios en la lista negra
- [ ] Bloqueo temporal con fecha de expiración
- [ ] Categorías de bloqueo (spam, solicitud cliente, etc.)
- [ ] Dashboard con estadísticas de bloqueos
