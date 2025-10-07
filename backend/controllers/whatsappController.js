require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const Cita = require("../models/Cancelacion");
const db = require("../config/db");

const usuariosEnEsperaDeMotivo = new Map();

// Configuración mejorada de UltraMsg
const getUltraMsgConfig = () => ({
  instance_id: process.env.ULTRAMSG_INSTANCE_ID,
  token: process.env.ULTRAMSG_TOKEN,
  base_url: 'https://api.ultramsg.com'
});

// Función para enviar imagen + texto (basada en NORCAM)
async function enviarImagenTexto(numero, mensaje, rutaImagen = null) {
  try {
    console.log(`🖼️ Enviando mensaje a ${numero}...`);

    const config = getUltraMsgConfig();

    if (rutaImagen && fs.existsSync(rutaImagen)) {
      // Envío con imagen
      const imageBuffer = fs.readFileSync(rutaImagen);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = obtenerMimeType(rutaImagen);
      const imagenUrl = `data:${mimeType};base64,${imageBase64}`;

      const url = `${config.base_url}/${config.instance_id}/messages/image`;
      const postData = {
        token: config.token,
        to: numero,
        image: imagenUrl,
        caption: mensaje
      };

      const response = await axios.post(url, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 45000
      });

      return procesarRespuesta(response, numero);
    } else {
      // Envío solo texto
      const url = `${config.base_url}/${config.instance_id}/messages/chat`;
      const postData = {
        token: config.token,
        to: numero,
        body: mensaje
      };

      const response = await axios.post(url, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      return procesarRespuesta(response, numero);
    }

  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`❌ Error enviando a ${numero}: ${errorMsg}`);
    return { success: false, numero, error: errorMsg };
  }
}

// Función para procesar respuesta de la API
function procesarRespuesta(response, numero) {
  console.log(`📤 Respuesta de ${numero}:`, response.data);

  const esExitoso = response.data.sent === "true" ||
    response.data.sent === true ||
    response.data.id ||
    response.data.message === "ok";

  if (esExitoso) {
    console.log(`✅ Mensaje enviado a ${numero}`);
    return { success: true, numero, response: response.data };
  } else {
    console.log(`❌ Error: ${response.data.error || 'Respuesta inesperada'}`);
    return { success: false, numero, error: response.data.error };
  }
}

// Función auxiliar para MIME type
function obtenerMimeType(rutaArchivo) {
  const extension = path.extname(rutaArchivo).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

// Función para esperar (con mejor control)
function esperar(milisegundos) {
  return new Promise(resolve => setTimeout(resolve, milisegundos));
}

// Función para buscar imagen automáticamente
function buscarImagen(nombreBase = 'recordatorio_cita') {
  const extensiones = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const carpetas = [__dirname, path.join(__dirname, '..'), path.join(__dirname, '../public/images')];

  for (const carpeta of carpetas) {
    for (const ext of extensiones) {
      const rutaCompleta = path.join(carpeta, nombreBase + ext);
      if (fs.existsSync(rutaCompleta)) {
        return rutaCompleta;
      }
    }
  }
  return null;
}

// Función principal mejorada para recordatorios
function obtenerDireccionPorEspecialidad(servicio) {
  const servicioLower = servicio.toLowerCase().trim();

  // Procedimientos de cardiología - dirección específica
  if (servicioLower.includes('cardiologia') && servicioLower.includes('procedimiento')) {
    return {
      direccion: "Calle 16 No. 9-76",
      sede: "Procedimientos de Cardiología"
    };
  }

  // Hospital sede principal - Carrera 5 # 9-102
  const especialidadesSedePrincipal = [
    'otorrino', 'otorrinolaringologia',
    'anestesia', 'anestesiologia',
    'cardiologia consulta', 'Cardiología',
    'endoscopia',
    'colonoscopia',
    'gastroenterologia',
    'fonoaudiologia procedimientos', 'fonoaudiologia','Qx dermatológica ',
    'Qx general'

  ];

  const esSedePrincipal = especialidadesSedePrincipal.some(esp =>
    servicioLower.includes(esp)
  );

  if (esSedePrincipal) {
    return {
      direccion: "Carrera 5 # 9-102",
      sede: "Hospital Regional de San Gil - Sede Principal"
    };
  }

  // CES Avenida Santander 24A-48
  const especialidadesCES = [
    'Adulto mayor 45',
    'Citología',
    'Control prenatal',
    'Planificación familiar',
    'Pos parto',
    'medicina general',
    'odontologia',
    'Ecografias',
    'Examen de seno',
    'cirugia general',
    'cirugia maxilofacial',
    'cirugia pediatrica',
    'dermatologia',
    'ginecologia',
    'medicina familiar',
    'nutricion',
    'neurologia',
    'neurocirugia',
    'oftalmologia',
    'optometria',
    'obstetricia',
    'ortopedia y traumatologia',
    'pediatria',
    'psiquiatria',
    'urologia',
    'psicologia',
    'post parto',
    'crecimiento y desarrollo',
    'joven',
    'adulto',
    'citologia',
    'salud oral',
    'riesgo cardiovascular',
    'planificacion'
  ];

  const esCES = especialidadesCES.some(esp =>
    servicioLower.includes(esp)
  );

  if (esCES) {
    return {
      direccion: "Avenida Santander 24A-48",
      sede: "consulta externa CES Hospital Regional de San Gil"
    };
  }

  // Endodoncia - dirección especial
  if (servicioLower.includes('endodoncia')) {
    return {
      direccion: "Cra 14A # 29A-27 Edificio PSI Local 2 Exterior, Barrio Porvenir",
      sede: "Consulta Especializada de Endodoncia",
      nota: "⚠️ *IMPORTANTE:* Debe dirigirse primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección."
    };
  }

  // Por defecto - Sede Principal
  return {
    direccion: "Carrera 5 # 9-102",
    sede: "Hospital Regional de San Gil - Sede Principal"
  };
}


// Función principal mejorada para recordatorios con direcciones
const sendWhatsAppReminder = async (req, res) => {
  try {
    console.log('🚀 INICIANDO ENVÍO DE RECORDATORIOS MASIVOS\n');

    const reminders = await WhatsAppReminder.getRemindersForTomorrow();

    if (reminders.length === 0) {
      return res.status(200).json({ message: "No hay citas para mañana." });
    }

    // Buscar imagen opcional
    const rutaImagen = buscarImagen('recordatorio_hospital');
    if (rutaImagen) {
      console.log(`✅ Imagen encontrada: ${rutaImagen}`);
    } else {
      console.log('ℹ️ No se encontró imagen, enviando solo texto');
    }

    console.log(`📱 Enviando recordatorios a ${reminders.length} pacientes`);
    console.log(`⏱️ Pausa entre envíos: 20 segundos\n`);

    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: []
    };

    // Enviar con pausas inteligentes (máximo 20 por minuto)
    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];

      // Obtener dirección según especialidad
      const infoUbicacion = obtenerDireccionPorEspecialidad(reminder.servicio);

      // Mensaje personalizado y mejorado con dirección
      let mensaje = `

*Paciente:* ${reminder.nombre_paciente}
*Fecha:* ${reminder.fecha}
*Hora:* ${reminder.hora}
*Servicio:* ${reminder.servicio}
*Profesional:* ${reminder.profesional}

📍 *DIRECCIÓN:*
${infoUbicacion.sede}
${infoUbicacion.direccion}
San Gil, Santander`;

      if (infoUbicacion.nota) {
        mensaje += `\n\n📌 ${infoUbicacion.nota}`;
      }

      mensaje += `

⚠️ *IMPORTANTE:* 
• Llegar con al menos *40 minutos de anticipación*
• Traer orden,autorización y exámenes previos
• Documento de identidad original

📞 *¿No puede asistir o desea reagendar?*
Comuníquese al 607 7249701

*Gracias por su puntualidad y confianza.*

────────────────────
🔒 *Tratamiento de Datos Personales:*
Este mensaje se envía con base en nuestra política de tratamiento de datos publicada en: 
www.hregionalsangil.gov.co

Si no desea seguir recibiendo este tipo de mensajes, puede solicitarlo al correo:
protecciondatos.hrsg@gmail.com
`;

      console.log(`[${i + 1}/${reminders.length}] Enviando a ${reminder.telefono} (${reminder.nombre_paciente})`);
      console.log(`   📍 Dirección: ${infoUbicacion.direccion}`);

      // Formatear número (agregar +57 si no lo tiene)
      let numeroFormateado = reminder.telefono;
      if (!numeroFormateado.startsWith('57')) {
        numeroFormateado = `57${numeroFormateado}`;
      }
      if (!numeroFormateado.startsWith('+')) {
        numeroFormateado = `+${numeroFormateado}`;
      }

      try {
        const resultado = await enviarImagenTexto(numeroFormateado, mensaje, rutaImagen);

        if (resultado.success) {
          resultados.exitosos++;
          await WhatsAppReminder.updateReminderStatus(reminder.id, "recordatorio enviado");
          console.log(`   ✅ Enviado exitosamente`);
        } else {
          resultados.fallidos++;
          resultados.errores.push({
            numero: numeroFormateado,
            paciente: reminder.nombre_paciente,
            error: resultado.error
          });
          console.log(`   ❌ Error: ${resultado.error}`);
        }
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          numero: numeroFormateado,
          paciente: reminder.nombre_paciente,
          error: error.message
        });
        console.error(`   ❌ Error inesperado: ${error.message}`);
      }

      // Pausa inteligente entre envíos
      if (i < reminders.length - 1) {
        // Pausa de 3 segundos (20 mensajes por minuto)
        console.log('   ⏳ Pausa de 20 segundos...');
        await esperar(20000);

        // Pausa extra cada 10 mensajes (para mayor seguridad)
        if ((i + 1) % 10 === 0) {
          console.log('   ⏸️ Pausa extendida de 60 segundos cada 10 mensajes...');
          await esperar(60000);
        }
      }
    }

    // Resumen detallado
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL DE RECORDATORIOS:');
    console.log(`✅ Recordatorios enviados: ${resultados.exitosos}`);
    console.log(`❌ Recordatorios fallidos: ${resultados.fallidos}`);
    console.log(`📱 Total procesados: ${reminders.length}`);
    console.log(`📈 Tasa de éxito: ${((resultados.exitosos / reminders.length) * 100).toFixed(1)}%`);

    if (resultados.errores.length > 0) {
      console.log('\n🔍 ERRORES DETALLADOS:');
      resultados.errores.forEach(error => {
        console.log(`- ${error.paciente} (${error.numero}): ${error.error}`);
      });
    }

    // Guardar reporte detallado
    const reporte = {
      fecha: new Date().toISOString(),
      tipo: 'recordatorios_citas',
      total: reminders.length,
      exitosos: resultados.exitosos,
      fallidos: resultados.fallidos,
      tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + '%',
      imagen_utilizada: rutaImagen || 'sin_imagen',
      errores: resultados.errores,
      reminders_procesados: reminders.map(r => ({
        id: r.id,
        paciente: r.nombre_paciente,
        telefono: r.telefono,
        fecha: r.fecha,
        hora: r.hora,
        servicio: r.servicio,
        direccion_asignada: obtenerDireccionPorEspecialidad(r.servicio)
      }))
    };

    const nombreReporte = `reporte_recordatorios_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(nombreReporte, JSON.stringify(reporte, null, 2));
    console.log(`\n💾 Reporte guardado en: ${nombreReporte}`);

    res.status(200).json({
      message: "Recordatorios enviados",
      enviados: resultados.exitosos,
      fallidos: resultados.fallidos,
      total: reminders.length,
      tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + '%'
    });

  } catch (error) {
    console.error("❌ Error general en el envío de recordatorios:", error);
    res.status(500).json({ error: "Error al enviar recordatorios." });
  }
};

// Función mejorada para procesar respuestas
const processWhatsAppReply = async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT 
                id, 
                numero, 
                mensaje, 
                fecha, 
                tipo,
                DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha_formateada
            FROM mensajes 
            ORDER BY fecha DESC
        `);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay mensajes en la base de datos." });
    }

    const responses = rows.map(row => ({
      id: row.id,
      telefono: row.numero,
      nombre_paciente: row.numero, // Podrías hacer un JOIN con tabla de pacientes
      fecha_cita: row.fecha_formateada,
      respuesta: row.mensaje,
      motivo: row.tipo,
      estado: clasificarRespuesta(row.mensaje)
    }));

    console.log(`📨 ${responses.length} respuestas obtenidas de la base de datos`);
    return res.json(responses);
  } catch (error) {
    console.error("❌ Error al obtener los mensajes:", error);
    return res.status(500).json({ error: "Error al obtener los mensajes." });
  }
};

// Función para clasificar respuestas automáticamente
function clasificarRespuesta(mensaje) {
  const mensajeLower = mensaje.toLowerCase().trim();

  if (mensajeLower.includes('sí') || mensajeLower.includes('si') || mensajeLower.includes('confirmo')) {
    return 'confirmada';
  } else if (mensajeLower.includes('no') || mensajeLower.includes('cancelo') || mensajeLower.includes('cancelar')) {
    return 'cancelada';
  } else if (mensajeLower.includes('reagendar') || mensajeLower.includes('cambiar') || mensajeLower.includes('reprogramar')) {
    return 'reagendar';
  } else {
    return 'pendiente_clasificacion';
  }
}

// Función mejorada para envío individual
const sendMessage = async (to, message, rutaImagen = null) => {
  try {
    // Formatear número
    let numeroFormateado = to;
    if (!numeroFormateado.startsWith('57') && !numeroFormateado.startsWith('+57')) {
      numeroFormateado = `57${numeroFormateado}`;
    }
    if (!numeroFormateado.startsWith('+')) {
      numeroFormateado = `+${numeroFormateado}`;
    }

    const resultado = await enviarImagenTexto(numeroFormateado, message, rutaImagen);

    if (resultado.success) {
      console.log(`✅ Mensaje individual enviado a ${numeroFormateado}`);
    } else {
      console.log(`❌ Error enviando mensaje individual a ${numeroFormateado}: ${resultado.error}`);
    }

    return resultado;
  } catch (error) {
    console.error("❌ Error al enviar mensaje individual:", error);
    return { success: false, error: error.message };
  }
};

// Función para envío masivo personalizado (similar a NORCAM)
const sendMassiveMessage = async (numeros, mensaje, rutaImagen = null) => {
  console.log('🚀 INICIANDO ENVÍO MASIVO PERSONALIZADO\n');

  if (!Array.isArray(numeros) || numeros.length === 0) {
    throw new Error('Se requiere un array de números válido');
  }

  console.log(`📱 Enviando a ${numeros.length} números`);
  console.log(`📝 Mensaje: "${mensaje.substring(0, 100)}..."`);
  console.log(`⏱️ Pausa entre envíos: 3 segundos\n`);

  const resultados = {
    exitosos: 0,
    fallidos: 0,
    errores: []
  };

  for (let i = 0; i < numeros.length; i++) {
    const numero = numeros[i];
    console.log(`[${i + 1}/${numeros.length}] Enviando a ${numero}...`);

    const resultado = await enviarImagenTexto(numero, mensaje, rutaImagen);

    if (resultado.success) {
      resultados.exitosos++;
      console.log(`   ✅ Enviado exitosamente`);
    } else {
      resultados.fallidos++;
      resultados.errores.push({ numero, error: resultado.error });
      console.log(`   ❌ Error: ${resultado.error}`);
    }

    // Pausa entre envíos
    if (i < numeros.length - 1) {
      console.log('   ⏳ Pausa de 3 segundos...');
      await esperar(3000);
    }
  }

  return resultados;
};

module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
  sendMessage,
  sendMassiveMessage,
  enviarImagenTexto
};




