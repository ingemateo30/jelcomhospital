require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const db = require("../config/db");

const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_WA_BASE_URL = process.env.META_WA_BASE_URL || "https://graph.facebook.com/v21.0";

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mapeo completo de direcciones por especialidad
 * Basado en el campo SERVICIO de la base de datos
 */
function obtenerDireccionPorEspecialidad(servicio) {
  const servicioUpper = servicio.toUpperCase().trim();

  // ============================================
  // CALLE 16 NO 9-76 (Procedimientos de Cardiología)
  // ============================================
  const serviciosCalle16 = [
    "CARDIOLOGIA PROCEDIMIENTOS",
    "CARDIOLOGIA PEDIATRICA PROCEDIMIENTOS"
  ];

  if (serviciosCalle16.some(esp => servicioUpper.includes(esp))) {
    return {
      direccion1: "Calle 16 No. 9-76",
      direccion2: "Procedimientos de Cardiología",
      extra: ""
    };
  }

  // ============================================
  // EDIFICIO PSI LOCAL 2 CRA 14A NO 29-27 (Endodoncia)
  // ============================================
  const serviciosEdificioPSI = [
    "ENDODONCIA PROCEDIMIENTOS",
    "ENDODONCIA"
  ];

  if (serviciosEdificioPSI.some(esp => servicioUpper.includes(esp))) {
    return {
      direccion1: "Cra 14A # 29A-27 Edificio PSI Local 2",
      direccion2: "Consulta Especializada de Endodoncia",
    extra: "⚠️ IMPORTANTE: Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección."

    };
  }

  // ============================================
  // CALLE 9 NO 9-41 (Periodoncia)
  // ============================================
  if (servicioUpper.includes("PERIODONCIA")) {
    return {
      direccion1: "Calle 9 No. 9-41",
      direccion2: "Consulta Especializada de Periodoncia",
    extra: "⚠️ IMPORTANTE: Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección."

    };
  }

  // ============================================
  // CES - Avenida Santander 24A-48 (Consulta Externa)
  // ============================================
  const serviciosCES = [
    "ADULTEZ",
    "RIESGO CARDIOVASCULAR",
    "AGUDEZA VISUAL",
    "CIRUGIA GENERAL",
    "CIRUGIA PEDIATRICA",
    "CIRUGIA MAXILOFACIAL",
    "CITOLOGIA",
    "CONTROL PRENATAL",
    "DERMATOLOGIA PROCEDIMIENTOS",
    "DERMATOLOGIA",
    "EDUCACION INDIVIDUAL",
    "EXAMEN DE SENO",
    "GINECOLOGIA",
    "MEDICINA FAMILIAR",
    "MEDICINA GENERAL",
    "MEDICINA INTERNA",
    "NEUROLOGIA",
    "NEUROCIRUGIA",
    "NUTRICION",
    "OBSTETRICIA",
    "ODONTOLOGIA",
    "OPTOMETRIA",
    "OFTALMOLOGIA",
    "NEUROLOGIA PROCEDIMIENTOS",
    "PEDIATRIA",
    "PLANIFICACION FAMILIAR",
    "POS PARTO",
    "ORTOPEDIA Y/O TRAUMATOLOGIA",
    "PRIMERA INFANCIA",
    "PSICOLOGIA",
    "PSIQUIATRIA",
    "SALUD ORAL",
    "VEJEZ",
    "UROLOGIA",
    "TERAPIA FISICA Y RESPIRATORIA",
    "JOVEN",
    "HIGIENE ORAL",
    "ORTOPEDIA"
  ];

  if (serviciosCES.some(esp => servicioUpper.includes(esp))) {
    return {
      direccion1: "Avenida Santander 24A-48",
      direccion2: "Consulta Externa CES Hospital Regional de San Gil",
      extra: ""
    };
  }

  // ============================================
  // HOSPITAL - Carrera 5 # 9-102 (Sede Principal)
  // ============================================
  const serviciosHospital = [
    "ANESTESIOLOGIA",
    "CARDIOLOGIA",
    "ECOGRAFIAS",
    "COLONOSCOPIA",
    "CARDIOLOGIA PEDIATRICA",
    "NEUMOLOGIA PROCEDIMIENTOS",
    "FONOAUDIOLOGIA PROCEDIMIENTOS",
    "GASTROENTEROLOGIA",
    "ENDOSCOPIAS",
    "NEUMOLOGIA",
    "TRAUMATOLOGIA",
    "TRABAJO SOCIAL",
        "OTORRINOLARINGOLOGIA",
    "QX OTORRINO",
    "QX GINECOLOGIA",
    "QX ORTOPEDIA",
    "QX UROLOGIA",
    "QX GENERAL",
    "QX PEDIATRICA",
    "QX NEUROCIRUGIA",
    "QX OFTALMOLOGIA",
    "QX DERMATOLOGICA"
  ];

  if (serviciosHospital.some(esp => servicioUpper.includes(esp))) {
    return {
      direccion1: "Carrera 5 # 9-102",
      direccion2: "Hospital Regional de San Gil - Sede Principal",
      extra: ""
    };
  }

  // ============================================
  // DEFAULT - Servicio no mapeado
  // ============================================
  console.log('⚠️  Servicio no mapeado: "' + servicio + '"');
  return {
    direccion1: "Consulta tu lugar de cita",
    direccion2: "llamanos al 6077249701",
    extra: ""
  };
}

/**
 * Función para enviar plantilla de WhatsApp vía Meta API
 */
async function enviarPlantillaMeta(numero, reminder) {
  try {
    const campos = {
      nombre_paciente: reminder.nombre_paciente || "Paciente",
      fecha: reminder.fecha || "Fecha no disponible",
      hora: reminder.hora || "Hora no disponible",
      servicio: reminder.servicio || "Servicio no especificado",
      profesional: reminder.profesional || "Profesional no asignado",
      direccion1: reminder.direccion1 || "Dirección no disponible",
      direccion2: reminder.direccion2 || "",
      extra: reminder.extra || ""
    };

    // 🔥 SIEMPRE ENVIAR TODOS LOS 8 PARÁMETROS
    // Meta requiere que se envíen TODOS los parámetros definidos en la plantilla
    const bodyParameters = [
      { type: "text", text: campos.nombre_paciente },
      { type: "text", text: campos.fecha },
      { type: "text", text: campos.hora },
      { type: "text", text: campos.servicio },
      { type: "text", text: campos.profesional },
      { type: "text", text: campos.direccion1 },
      { type: "text", text: campos.direccion2 },
      { type: "text", text: campos.extra || " " }, // Siempre incluir
    ];

    const payload = {
      messaging_product: "whatsapp",
      to: numero,
      type: "template",
      template: {
        name: "recordatorio_prueba",
        language: { code: "es" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: "https://drive.google.com/uc?export=view&id=1wHMGC9zodGNy6C49k2fIj8zDcHQlu5LT",
                }
              }
            ],
          },
          {
            type: "body",
            parameters: bodyParameters,
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [
              {
                type: "payload",
                payload: "CANCELAR_CITA"
              }
            ]
          }
        ],
      },
    };

    const response = await axios.post(
      META_WA_BASE_URL + '/' + META_PHONE_NUMBER_ID + '/messages',
      payload,
      {
        headers: {
          Authorization: 'Bearer ' + META_TOKEN,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return { success: true, response: response.data };

  } catch (error) {
    console.error('❌ ERROR META API:');
    console.error('   Status:', error.response ? error.response.status : 'N/A');
    console.error('   Error:', JSON.stringify(error.response ? error.response.data : {}, null, 2));
    
    const errorMsg = (error.response && error.response.data && error.response.data.error && error.response.data.error.message) || error.message;
    const errorCode = error.response && error.response.data && error.response.data.error ? error.response.data.error.code : null;
    const errorDetails = error.response && error.response.data && error.response.data.error ? error.response.data.error.error_data : null;
    
    return { 
      success: false, 
      error: errorMsg,
      errorCode: errorCode,
      errorDetails: errorDetails,
      fullError: error.response ? error.response.data : null
    };
  }
}

/**
 * Función principal para enviar recordatorios
 */
const sendWhatsAppReminder = async (req, res) => {
  try {
    console.log("🚀 INICIANDO ENVÍO DE RECORDATORIOS VIA META\n");
    const io = global.io;

    const reminders = await WhatsAppReminder.getRemindersForTomorrow();

    if (reminders.length === 0) {
      return res.status(200).json({ message: "No hay citas para mañana." });
    }

    io.emit("whatsapp:inicio", {
      total: reminders.length,
      timestamp: new Date().toISOString()
    });

    const resultados = { exitosos: 0, fallidos: 0, errores: [] };

    res.status(200).json({
      message: "Proceso de envío iniciado",
      total: reminders.length,
      sessionId: Date.now()
    });

    // Continuar en background
    (async () => {
      for (let i = 0; i < reminders.length; i++) {
        const reminder = reminders[i];

        const dir = obtenerDireccionPorEspecialidad(reminder.servicio);
        reminder.direccion1 = dir.direccion1;
        reminder.direccion2 = dir.direccion2;
        reminder.extra = dir.extra;

        console.log('\n[' + (i + 1) + '/' + reminders.length + '] ' + reminder.nombre_paciente);
        console.log('   Servicio: ' + reminder.servicio);
        console.log('   Dirección: ' + dir.direccion1);
        console.log('   Sede: ' + dir.direccion2);

        let numero = reminder.telefono;
        if (!numero.startsWith("+57")) {
          numero = "+57" + numero.replace(/^0+/, "");
        }

        // Limpiar historial de mensajes antiguos para permitir nueva interacción
        const phone = numero.replace("+57", "");
        await limpiarHistorialMensajes(phone);
        console.log('   🧹 Historial de mensajes limpiado para ' + phone);

        io.emit("whatsapp:procesando", {
          current: i + 1,
          total: reminders.length,
          paciente: reminder.nombre_paciente,
          numero: numero,
          servicio: reminder.servicio,
          fecha: reminder.fecha
        });

        const resultado = await enviarPlantillaMeta(numero, reminder);

        if (resultado.success) {
          resultados.exitosos++;
          await WhatsAppReminder.updateReminderStatus(reminder.id, "recordatorio enviado");
          
          console.log('   ✅ ENVIADO');
          
          io.emit("whatsapp:exito", {
            current: i + 1,
            total: reminders.length,
            paciente: reminder.nombre_paciente,
            numero: numero,
            exitosos: resultados.exitosos,
            fallidos: resultados.fallidos
          });
        } else {
          resultados.fallidos++;
          resultados.errores.push({ 
            numero: numero, 
            paciente: reminder.nombre_paciente, 
            error: resultado.error,
            errorCode: resultado.errorCode,
            fullError: resultado.fullError
          });
          
          console.log('   ❌ ERROR: ' + resultado.error);
          
          io.emit("whatsapp:error", {
            current: i + 1,
            total: reminders.length,
            paciente: reminder.nombre_paciente,
            numero: numero,
            error: resultado.error,
            errorCode: resultado.errorCode,
            exitosos: resultados.exitosos,
            fallidos: resultados.fallidos
          });
        }

        if (i < reminders.length - 1) {
          io.emit("whatsapp:pausa", {
            segundos: 2,
            mensaje: "Esperando 2 segundos..."
          });
          await esperar(2000);
          
          if ((i + 1) % 10 === 0) {
            io.emit("whatsapp:pausa", {
              segundos: 6,
              mensaje: "Pausa extendida de 6 segundos..."
            });
            await esperar(6000);
          }
        }
      }

      const reporte = {
        fecha: new Date().toISOString(),
        total: reminders.length,
        exitosos: resultados.exitosos,
        fallidos: resultados.fallidos,
        tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + "%",
        errores: resultados.errores
      };

      io.emit("whatsapp:completado", reporte);

      const nombreReporte = 'reporte_whatsapp_' + new Date().toISOString().split("T")[0] + '.json';
      fs.writeFileSync(nombreReporte, JSON.stringify(reporte, null, 2));
      
      console.log('\n📊 RESUMEN:');
      console.log('   Total: ' + reporte.total);
      console.log('   Exitosos: ' + reporte.exitosos);
      console.log('   Fallidos: ' + reporte.fallidos);
      console.log('   Tasa de éxito: ' + reporte.tasa_exito);
      console.log('\n💾 Reporte guardado: ' + nombreReporte);
    })();

  } catch (error) {
    console.error("❌ Error general:", error);
    
    if (global.io) {
      global.io.emit("whatsapp:error_fatal", {
        error: error.message
      });
    }
    
    res.status(500).json({ 
      error: "Error al enviar recordatorios.",
      details: error.message 
    });
  }
};

function clasificarRespuesta(mensaje) {
  const m = mensaje.toLowerCase();
  if (m.includes("sí") || m.includes("si") || m.includes("confirmo")) return "confirmada";
  if (m.includes("no") || m.includes("cancelo") || m.includes("cancelar")) return "cancelada";
  if (m.includes("reagendar") || m.includes("cambiar") || m.includes("reprogramar")) return "reagendar";
  return "pendiente_clasificacion";
}

const processWhatsAppReply = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, numero, mensaje, fecha, tipo, DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha_formateada FROM mensajes ORDER BY fecha DESC"
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay mensajes en la base de datos." });
    }

    const responses = rows.map(r => ({
      id: r.id,
      telefono: r.numero,
      mensaje: r.mensaje,
      fecha: r.fecha_formateada,
      estado: clasificarRespuesta(r.mensaje),
    }));

    res.json(responses);
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    res.status(500).json({ error: "Error al obtener respuestas." });
  }
};

/**
 * Obtener todas las respuestas de los pacientes con información de la cita
 */
const getResponses = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        m.id,
        m.numero,
        m.mensaje,
        m.fecha,
        m.tipo,
        m.estado,
        c.NOMBRE as nombre,
        c.FECHA_CITA as fecha_cita,
        c.HORA_CITA as hora_cita,
        c.SERVICIO as servicio
      FROM mensajes m
      LEFT JOIN citas c ON m.numero = c.TELEFONO_FIJO
      WHERE m.tipo = 'entrante'
      ORDER BY m.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    res.status(500).json({ error: "Error al obtener respuestas." });
  }
};

/**
 * Obtener todas las citas canceladas
 */
const getCitasCanceladas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ID,
        NOMBRE,
        TELEFONO_FIJO,
        FECHA_CITA,
        HORA_CITA,
        SERVICIO,
        PROFESIONAL,
        ESTADO,
        CREATED_AT
      FROM citas
      WHERE ESTADO = 'cancelada'
      ORDER BY FECHA_CITA DESC, HORA_CITA DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener citas canceladas:", error);
    res.status(500).json({ error: "Error al obtener citas canceladas." });
  }
};

/**
 * Webhook para verificación de Meta (requerido por Facebook)
 */
const verifyWebhook = (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'mi_token_secreto_12345';

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado correctamente');
        res.status(200).send(challenge);
      } else {
        console.log('❌ Token de verificación incorrecto');
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  } catch (error) {
    console.error('❌ Error en verificación de webhook:', error);
    res.sendStatus(500);
  }
};

/**
 * Webhook para recibir mensajes y respuestas de botones de Meta API
 */
const handleMetaWebhook = async (req, res) => {
  try {
    console.log('📨 Webhook Meta recibido:', JSON.stringify(req.body, null, 2));

    // Responder inmediatamente a Meta (requerido)
    res.status(200).send('EVENT_RECEIVED');

    const { entry } = req.body;

    if (!entry || entry.length === 0) {
      console.log('⚠️ No hay entradas en el webhook');
      return;
    }

    // Procesar cada entrada
    for (const item of entry) {
      const changes = item.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value.messages || [];

        for (const message of messages) {
          await processMetaMessage(message, value);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error procesando webhook de Meta:', error);
  }
};

/**
 * Detectar si un mensaje es casual (saludos, conversación general)
 */
function esMensajeCasual(mensaje) {
  const mensajeLower = mensaje.toLowerCase().trim();
  const palabrasCasuales = [
    'hola', 'hello', 'hi', 'hey', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches',
    'como estas', 'cómo estás', 'como esta', 'cómo está', 'que tal', 'qué tal',
    'gracias', 'muchas gracias', 'ok', 'vale', 'bien', 'perfecto', 'excelente',
    'saludos', 'hola?', 'alo', 'aló', 'bueno', 'si?', 'sí?', '?', 'que?', 'qué?'
  ];

  return palabrasCasuales.some(palabra => mensajeLower === palabra || mensajeLower.startsWith(palabra));
}

/**
 * Procesar mensaje individual de Meta API
 */
async function processMetaMessage(message, value) {
  try {
    const { from, id, timestamp, type } = message;

    // Limpiar número de teléfono (quitar prefijo de país)
    const phone = from.replace('57', '');

    console.log(`\n📱 Procesando mensaje de ${phone}`);
    console.log(`   Tipo: ${type}`);
    console.log(`   ID: ${id}`);

    let messageBody = '';
    let isButtonResponse = false;

    // Detectar tipo de mensaje
    if (type === 'interactive' && message.interactive) {
      // Es una respuesta de botón interactivo
      isButtonResponse = true;
      const interactiveType = message.interactive.type;

      if (interactiveType === 'button_reply') {
        messageBody = message.interactive.button_reply.id; // CONFIRMAR_CITA o CANCELAR_CITA
        console.log(`   🔘 Botón presionado: ${messageBody}`);
      }
    } else if (type === 'button' && message.button) {
      // Respuesta de botón legacy
      isButtonResponse = true;
      messageBody = message.button.payload;
      console.log(`   🔘 Botón legacy presionado: ${messageBody}`);
    } else if (type === 'text' && message.text) {
      // Mensaje de texto normal
      messageBody = message.text.body;
      console.log(`   💬 Texto recibido: ${messageBody}`);

      // Si es un mensaje casual, ignorar completamente
      if (esMensajeCasual(messageBody)) {
        console.log(`   💭 Mensaje casual detectado, se ignora sin responder`);
        return;
      }
    } else {
      console.log(`   ⚠️ Tipo de mensaje no soportado: ${type}`);
      return;
    }

    // Guardar mensaje en BD
    await saveMessageToDb({
      id,
      phone,
      body: messageBody,
      fromMe: false,
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
      status: 'pendiente'
    });

    // Emitir evento Socket.io para actualizar frontend en tiempo real
    if (global.io) {
      global.io.emit("chat:nuevo_mensaje", {
        numero: phone,
        mensaje: {
          id,
          numero: phone,
          mensaje: messageBody,
          fecha: new Date(parseInt(timestamp) * 1000).toISOString(),
          tipo: 'entrante'
        }
      });
    }

    // Buscar cita asociada al número
    const reminder = await getCitaByPhone(phone);

    if (!reminder) {
      console.log(`   ❌ No se encontró cita activa para ${phone}`);
      return;
    }

    // Verificar si la cita ya fue procesada
    const estadoActual = await getEstadoByPhone(phone);
    if (estadoActual && ["confirmada", "cancelada", "reagendamiento solicitado"].includes(estadoActual.estado)) {
      console.log(`   🔒 Cita ya procesada: ${estadoActual.estado}`);

      // Solo responder si es un botón (no responder a mensajes de texto)
      if (isButtonResponse) {
        const replyMessage = `🔒 Tu cita ya está ${estadoActual.estado}. No se permite modificar el estado. Si necesitas ayuda, contáctanos al 6077249701`;
        await sendWhatsAppMessage(from, replyMessage);
      }
      return;
    }

    // Procesar respuesta según el contenido
    await processUserResponse(from, phone, messageBody, reminder, isButtonResponse);

  } catch (error) {
    console.error('❌ Error procesando mensaje de Meta:', error);
  }
}

/**
 * Procesar respuesta del usuario
 */
async function processUserResponse(whatsappId, phone, response, reminder, isButtonResponse) {
  try {
    const responseLower = response.toLowerCase();

    const fechaCita = new Date(reminder.FECHA_CITA);
    const fechaFormateada = fechaCita.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let replyMessage = '';
    let newStatus = '';

    // Determinar acción según la respuesta
    if (responseLower === 'confirmar_cita' || responseLower === 'sí' || responseLower === 'si' || responseLower === 'confirmo') {
      replyMessage = `✅ Gracias por confirmar tu cita médica para el ${fechaFormateada} a las ${reminder.HORA_CITA}. Te esperamos puntualmente.\n\nSi necesitas cambiar el estado, contáctanos al 6077249701`;
      newStatus = "confirmada";
      console.log(`   ✅ Cita confirmada`);

    } else if (responseLower === 'cancelar_cita' || responseLower === 'no' || responseLower === 'cancelar') {
      console.log(`   🔄 Iniciando cancelación para ${phone}`);

      try {
        const salud360CitasService = require("../services/salud360CitasService");

        const datosPaciente = {
          tipoId: reminder.TIPO_IDE_PACIENTE || 'CC',
          numeroId: reminder.NUMERO_IDE,
          fecha: new Date(reminder.FECHA_CITA).toISOString().split('T')[0],
          hora: reminder.HORA_CITA
        };

        console.log(`   📋 Datos para cancelación:`, datosPaciente);

        const resultadoCancelacion = await salud360CitasService.buscarYCancelarCita(
          datosPaciente,
          'Cancelado por paciente vía WhatsApp'
        );

        if (resultadoCancelacion.success) {
          console.log(`   ✅ Cita cancelada en Salud360: CitNum ${resultadoCancelacion.citNum}`);
          replyMessage = `❌ Tu cita médica para el ${fechaFormateada} a las ${reminder.HORA_CITA} ha sido cancelada exitosamente.\n\nSi deseas reagendarla, comunícate al 6077249701.`;
          newStatus = "cancelada";

          await updateCitaStatusInDb(reminder.NUMERO_IDE, reminder.FECHA_CITA, reminder.HORA_CITA, 'cancelada');
        } else {
          console.error(`   ❌ Error cancelando en Salud360:`, resultadoCancelacion.error);
          replyMessage = `⚠️ Hemos registrado tu solicitud de cancelación para el ${fechaFormateada} a las ${reminder.HORA_CITA}.\n\nConfirma la cancelación llamando al 6077249701.`;
          newStatus = "cancelada";
        }
      } catch (error) {
        console.error(`   ❌ Error en cancelación:`, error.message);
        replyMessage = `⚠️ Hemos registrado tu solicitud de cancelación.\n\nPor favor confirma llamando al 6077249701.`;
        newStatus = "cancelada";
      }

    } else if (responseLower.includes('reagendar') || responseLower.includes('reprogramar') || responseLower.includes('cambiar')) {
      replyMessage = `🔄 Hemos recibido tu solicitud para reagendar la cita del ${fechaFormateada} a las ${reminder.HORA_CITA}.\n\nLlámanos al 6077249701 para coordinar una nueva fecha.`;
      newStatus = "reagendamiento solicitado";
      console.log(`   🔄 Reagendamiento solicitado`);

    } else {
      replyMessage = `❓ No pudimos procesar tu respuesta. Por favor responde:\n\n✅ "Sí" o "Confirmo" - Confirmar cita\n❌ "No" o "Cancelar" - Cancelar cita\n🔄 "Reagendar" - Cambiar fecha\n\nO llámanos al 6077249701`;
      console.log(`   ❓ Respuesta no reconocida`);
    }

    // Enviar respuesta al usuario
    if (replyMessage) {
      await sendWhatsAppMessage(whatsappId, replyMessage);
    }

    // Actualizar estado en BD
    if (newStatus) {
      await updateReminderStatusInDb(phone, newStatus);
      console.log(`   💾 Estado actualizado: ${newStatus}`);
    }

  } catch (error) {
    console.error('❌ Error procesando respuesta de usuario:', error);
  }
}

/**
 * Enviar mensaje de WhatsApp vía Meta API
 */
async function sendWhatsAppMessage(to, text) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: text
      }
    };

    const response = await axios.post(
      `${META_WA_BASE_URL}/${META_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${META_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log(`   ✅ Mensaje enviado a ${to}`);
    return { success: true, response: response.data };

  } catch (error) {
    console.error(`   ❌ Error enviando mensaje:`, error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Guardar mensaje en base de datos
 */
async function saveMessageToDb({ id, phone, body, fromMe, timestamp, status }) {
  try {
    const fecha = new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");

    // Verificar duplicados (última semana)
    const [existingMessages] = await db.execute(
      `SELECT id FROM mensajes
       WHERE numero = ?
       AND fecha >= DATE_SUB(?, INTERVAL 1 WEEK)
       LIMIT 1`,
      [phone, fecha]
    );

    if (existingMessages.length > 0) {
      console.log(`   🛑 Mensaje duplicado detectado, no se inserta`);
      return;
    }

    await db.execute(
      `INSERT INTO mensajes (id, numero, mensaje, fecha, tipo, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, phone, body, fecha, fromMe ? 'saliente' : 'entrante', status]
    );

    console.log(`   📝 Mensaje guardado en BD`);

    // Emitir evento Socket.io solo para mensajes salientes (los entrantes ya se emiten en processMetaMessage)
    if (fromMe && global.io) {
      global.io.emit("chat:nuevo_mensaje", {
        numero: phone,
        mensaje: {
          id,
          numero: phone,
          mensaje: body,
          fecha: fecha,
          tipo: 'saliente'
        }
      });
    }
  } catch (error) {
    console.error('   ❌ Error guardando mensaje:', error);
  }
}

/**
 * Obtener cita por teléfono
 */
async function getCitaByPhone(phone) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM citas WHERE TELEFONO_FIJO = ? ORDER BY FECHA_CITA DESC LIMIT 1`,
      [phone]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    return null;
  }
}

/**
 * Obtener estado actual de mensaje por teléfono
 */
async function getEstadoByPhone(phone) {
  try {
    const [rows] = await db.execute(
      `SELECT SQL_NO_CACHE * FROM mensajes WHERE numero = ? ORDER BY fecha DESC LIMIT 1`,
      [phone]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    return null;
  }
}

/**
 * Actualizar estado de reminder en BD
 */
async function updateReminderStatusInDb(phone, newStatus) {
  try {
    const [result] = await db.execute(
      `UPDATE mensajes SET estado = ? WHERE numero = ? ORDER BY fecha DESC LIMIT 1`,
      [newStatus, phone]
    );
    console.log(`   💾 Filas actualizadas: ${result.affectedRows}`);
  } catch (error) {
    console.error('Error actualizando estado:', error);
  }
}

/**
 * Actualizar estado de cita en BD
 */
async function updateCitaStatusInDb(numeroIde, fechaCita, horaCita, newStatus) {
  try {
    const [result] = await db.execute(
      `UPDATE citas
       SET ESTADO = ?
       WHERE NUMERO_IDE = ?
       AND FECHA_CITA = ?
       AND HORA_CITA = ?`,
      [newStatus, numeroIde, fechaCita, horaCita]
    );
    console.log(`   ✅ Estado de cita actualizado: ${result.affectedRows} filas`);
  } catch (error) {
    console.error('Error actualizando estado de cita:', error);
  }
}

/**
 * Limpiar historial de mensajes antiguos para permitir nueva interacción
 * Se ejecuta al enviar un nuevo recordatorio
 */
async function limpiarHistorialMensajes(phone) {
  try {
    const [result] = await db.execute(
      `DELETE FROM mensajes WHERE numero = ?`,
      [phone]
    );
    console.log(`   🧹 ${result.affectedRows} mensajes eliminados para ${phone}`);
  } catch (error) {
    console.error('Error limpiando historial de mensajes:', error);
  }
}

/**
 * Obtener lista de chats agrupados por número de teléfono
 * Incluye información de la última cita y si hay cancelaciones
 */
async function getChats(req, res) {
  try {
    const { filter } = req.query; // 'cancelled', 'active', o 'all'

    let query = `
      SELECT
        m.numero,
        MAX(m.fecha) as ultimo_mensaje,
        COUNT(m.id) as total_mensajes,
        c.NOMBRE,
        c.EMAIL,
        c.FECHA_CITA,
        c.HORA_CITA,
        c.SERVICIO,
        c.PROFESIONAL,
        c.ESTADO as estado_cita,
        (SELECT mensaje FROM mensajes WHERE numero = m.numero ORDER BY fecha DESC LIMIT 1) as ultimo_mensaje_texto,
        (SELECT tipo FROM mensajes WHERE numero = m.numero ORDER BY fecha DESC LIMIT 1) as ultimo_mensaje_tipo
      FROM mensajes m
      LEFT JOIN citas c ON m.numero = c.TELEFONO_FIJO
      WHERE 1=1
    `;

    const params = [];

    // Filtrar por tipo de chat
    if (filter === 'cancelled') {
      query += ` AND c.ESTADO = 'cancelada'`;
    } else if (filter === 'active') {
      query += ` AND (c.ESTADO IS NULL OR c.ESTADO != 'cancelada')`;
    }

    query += `
      GROUP BY m.numero, c.NOMBRE, c.EMAIL, c.FECHA_CITA, c.HORA_CITA, c.SERVICIO, c.PROFESIONAL, c.ESTADO
      ORDER BY ultimo_mensaje DESC
    `;

    const [chats] = await db.execute(query, params);

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error obteniendo lista de chats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener lista de chats'
    });
  }
}

/**
 * Obtener todos los mensajes de un chat específico
 */
async function getChatMessages(req, res) {
  try {
    const { numero } = req.params;

    if (!numero) {
      return res.status(400).json({
        success: false,
        error: 'Número de teléfono requerido'
      });
    }

    // Obtener mensajes del chat
    const [mensajes] = await db.execute(
      `SELECT
        id,
        numero,
        mensaje,
        fecha,
        tipo,
        estado
      FROM mensajes
      WHERE numero = ?
      ORDER BY fecha ASC`,
      [numero]
    );

    // Obtener información del paciente/cita
    const [citas] = await db.execute(
      `SELECT
        NOMBRE,
        EMAIL,
        FECHA_CITA,
        HORA_CITA,
        SERVICIO,
        PROFESIONAL,
        ESTADO,
        TIPO_IDE_PACIENTE,
        NUMERO_IDE
      FROM citas
      WHERE TELEFONO_FIJO = ?
      ORDER BY FECHA_CITA DESC
      LIMIT 1`,
      [numero]
    );

    res.json({
      success: true,
      mensajes,
      paciente: citas.length > 0 ? citas[0] : null
    });
  } catch (error) {
    console.error('Error obteniendo mensajes del chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes del chat'
    });
  }
}

module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
  getResponses,
  getCitasCanceladas,
  verifyWebhook,
  handleMetaWebhook,
  getChats,
  getChatMessages,
};