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
        name: "recordatorio_citas",
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
                payload: "CONFIRMAR_CITA"
              }
            ]
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [
              {
                type: "payload",
                payload: "CANCELAR_CITA"
              }
            ]
          },
          {
            type: "button",
            sub_type: "phone_number",
            index: "2",
            parameters: [
              {
                type: "text",
                text: "6077249701"
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

module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
  getResponses,
  getCitasCanceladas,
};