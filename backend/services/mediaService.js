/**
 * Servicio para manejar descarga y almacenamiento de archivos multimedia
 * desde la API de Meta (WhatsApp)
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const META_TOKEN = process.env.META_TOKEN;
const META_WA_BASE_URL = process.env.META_WA_BASE_URL || "https://graph.facebook.com/v21.0";

// Directorio donde se guardarán los archivos multimedia
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(__dirname, '../uploads/media');

// Asegurar que el directorio de media existe
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  console.log(`📁 Directorio de multimedia creado: ${MEDIA_DIR}`);
}

/**
 * Obtener información del archivo multimedia desde Meta API
 */
async function getMediaInfo(mediaId) {
  try {
    const url = `${META_WA_BASE_URL}/${mediaId}`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    console.log(`📋 Info del media ${mediaId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error obteniendo info del media ${mediaId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Descargar archivo multimedia desde la URL de Meta
 */
async function downloadMediaFile(mediaUrl, mediaId, mimeType) {
  try {
    const extension = getFileExtension(mimeType);
    const filename = `${mediaId}${extension}`;
    const filepath = path.join(MEDIA_DIR, filename);

    const response = await axios.get(mediaUrl, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` },
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Archivo descargado: ${filepath}`);
        resolve(filepath);
      });
      writer.on('error', (error) => {
        console.error(`❌ Error escribiendo archivo ${filepath}:`, error);
        reject(error);
      });
    });
  } catch (error) {
    console.error(`❌ Error descargando archivo desde ${mediaUrl}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener extensión de archivo según el MIME type
 */
function getFileExtension(mimeType) {
  const mimeMap = {
    // Imágenes
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',

    // Audio
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/ogg': '.ogg',
    'audio/opus': '.opus',
    'audio/wav': '.wav',
    'audio/aac': '.aac',
    'audio/amr': '.amr',

    // Video
    'video/mp4': '.mp4',
    'video/3gpp': '.3gp',
    'video/quicktime': '.mov',

    // Documentos
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',

    // Otros
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/octet-stream': '.bin'
  };

  return mimeMap[mimeType] || '';
}

/**
 * Procesar y guardar archivo multimedia completo.
 * El tracking en multimedia_descargas es opcional — si falla (tabla inexistente,
 * FK, etc.) el flujo continúa y los datos críticos se guardan en mensajes.
 */
async function processMediaMessage(params) {
  const { messageId, mediaId, phone, mediaType } = params;
  let trackingInserted = false;

  try {
    console.log(`🎬 Procesando media ${mediaType} - ID: ${mediaId}`);

    // 1. Obtener información del media desde Meta API
    const mediaInfo = await getMediaInfo(mediaId);
    const { url: mediaUrl, mime_type, sha256, file_size } = mediaInfo;

    // 2. Registrar descarga en BD (estado: downloading) — opcional
    try {
      await db.execute(
        `INSERT INTO multimedia_descargas
         (mensaje_id, media_id, url_original, estado, intentos)
         VALUES (?, ?, ?, 'downloading', 1)`,
        [messageId, mediaId, mediaUrl]
      );
      trackingInserted = true;
    } catch (trackErr) {
      console.warn(`⚠️ No se pudo registrar en multimedia_descargas: ${trackErr.message}`);
    }

    // 3. Descargar el archivo
    const localPath = await downloadMediaFile(mediaUrl, mediaId, mime_type);

    // 4. Obtener tamaño real del archivo descargado
    const stats = fs.statSync(localPath);
    const fileSize = stats.size;

    // 5. Generar URL pública para acceso (relativa al servidor)
    const publicUrl = `/media/${path.basename(localPath)}`;

    // 6. Preparar metadata
    const metadata = {
      sha256,
      original_size: file_size,
      downloaded_size: fileSize,
      downloaded_at: new Date().toISOString()
    };

    // 7. Actualizar mensaje en BD con información del media (crítico)
    await db.execute(
      `UPDATE mensajes
       SET tipo_media = ?,
           url_media  = ?,
           url_meta   = ?,
           media_id   = ?,
           mime_type  = ?,
           \`tamaño_archivo\` = ?,
           metadata   = ?
       WHERE id = ?`,
      [mediaType, publicUrl, mediaUrl, mediaId, mime_type, fileSize, JSON.stringify(metadata), messageId]
    );

    // 8. Actualizar estado de descarga a completado (opcional)
    if (trackingInserted) {
      try {
        await db.execute(
          `UPDATE multimedia_descargas
           SET estado = 'completed',
               url_local = ?,
               fecha_actualizacion = NOW()
           WHERE mensaje_id = ? AND media_id = ?`,
          [publicUrl, messageId, mediaId]
        );
      } catch (trackErr) {
        console.warn(`⚠️ No se pudo actualizar multimedia_descargas: ${trackErr.message}`);
      }
    }

    console.log(`✅ Media procesado exitosamente: ${publicUrl}`);

    return {
      success: true,
      mediaType,
      mimeType: mime_type,
      localPath,
      publicUrl,
      fileSize,
      metadata
    };

  } catch (error) {
    console.error(`❌ Error procesando media ${mediaId}:`, error.message);

    // Registrar error en BD (opcional)
    if (trackingInserted) {
      try {
        await db.execute(
          `UPDATE multimedia_descargas
           SET estado = 'failed',
               error_mensaje = ?,
               intentos = intentos + 1,
               fecha_actualizacion = NOW()
           WHERE mensaje_id = ? AND media_id = ?`,
          [error.message, messageId, mediaId]
        );
      } catch (trackErr) {
        // silencioso
      }
    }

    throw error;
  }
}

/**
 * Limpiar archivos antiguos de multimedia (mantenimiento)
 */
async function cleanupOldMedia(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [rows] = await db.execute(
      `SELECT url_media, media_id
       FROM mensajes
       WHERE fecha < ? AND tipo_media IS NOT NULL`,
      [cutoffDate]
    );

    let deletedCount = 0;
    for (const row of rows) {
      try {
        const filename = path.basename(row.url_media);
        const filepath = path.join(MEDIA_DIR, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          deletedCount++;
          console.log(`🗑️ Archivo eliminado: ${filepath}`);
        }
      } catch (err) {
        console.error(`⚠️ Error eliminando archivo ${row.media_id}:`, err);
      }
    }

    console.log(`🧹 Limpieza completada: ${deletedCount} archivos eliminados`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error en limpieza de archivos:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de multimedia
 */
async function getMediaStats() {
  try {
    const [stats] = await db.execute(`
      SELECT
        tipo_media,
        COUNT(*) as total,
        SUM(\`tamaño_archivo\`) as total_bytes,
        ROUND(AVG(\`tamaño_archivo\`)) as promedio_bytes
      FROM mensajes
      WHERE tipo_media IS NOT NULL
      GROUP BY tipo_media
    `);

    const [downloadStats] = await db.execute(`
      SELECT estado, COUNT(*) as total
      FROM multimedia_descargas
      GROUP BY estado
    `);

    return {
      mediaByType: stats,
      downloadsByStatus: downloadStats
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de media:', error);
    throw error;
  }
}

module.exports = {
  getMediaInfo,
  downloadMediaFile,
  processMediaMessage,
  cleanupOldMedia,
  getMediaStats,
  MEDIA_DIR
};
