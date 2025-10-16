require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const db = require("../config/db");

const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_WA_BASE_URL = process.env.META_WA_BASE_URL || "https://graph.facebook.com/v21.0";
const IMAGE_URL = process.env.WHATSAPP_IMAGE_URL || "https://i.imgur.com/yourimage.jpg";

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mapeo completo de direcciones por especialidad
 * Basado ÚNICAMENTE en el campo SERVICIO de la base de datos
 */
function obtenerDireccionPorEspecialidad(servicio) {
  const servicioLower = servicio.toLowerCase().trim();

  // ============================================
  // CALLE 16 NO. 9-76 (Procedimientos de Cardiología)
  // ============================================
  const serviciosCalle16 = [
    "cardiologia procedimientos",
    "cardiologia pediatrica procedimientos"
  ];

  if (serviciosCalle16.some(esp => servicioLower.includes(esp))) {
    return {
      direccion1: "Calle 16 No. 9-76",
      direccion2: "Procedimientos de Cardiología",
      extra: ""
    };
  }

  // ============================================
  // EDIFICIO PSI (Endodoncia)
  // ============================================
  const serviciosEdificioPSI = [
    "endodoncia procedimientos",
    "endodoncia"
  ];

  if (serviciosEdificioPSI.some(esp => servicioLower.includes(esp))) {
    return {
      direccion1: "Cra 14A # 29A-27 Edificio PSI Local 2 Exterior, Barrio Porvenir",
      direccion2: "Consulta Especializada de Endodoncia",
      extra: "⚠️ IMPORTANTE: Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección."
    };
  }

  // ============================================
  // CALLE 9 NO. 9-41 (Periodoncia)
  // ============================================
  if (servicioLower.includes("periodoncia")) {
    return {
      direccion1: "Calle 9 No. 9-41",
      direccion2: "Consulta Especializada de Periodoncia",
      extra: "⚠️ IMPORTANTE: Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección."
    };
  }

  // ============================================
  // HOSPITAL - SEDE PRINCIPAL (Carrera 5 # 9-102)
  // ============================================
  const serviciosHospital = [
    "anestesiologia",
    "cardiologia pediatrica",
    "cardiologia", // Solo cardiología consulta, NO procedimientos
    "colonoscopia",
    "ecografias",
    "endoscopias",
    "fonoaudiologia procedimientos",
    "gastroenterologia",
    "neumologia",
    "neurologia procedimientos",
    "otorrinolaringologia",
    "trabajo social",
    "qx otorrino",
    "qx ginecologia",
    "qx ortopedia",
    "qx urologia",
    "qx general",
    "qx pediatrica",
    "qx neurocirugia",
    "qx oftalmologia",
    "qx dermatologica"
  ];

  // Verificar si es del hospital (excluyendo los que ya se procesaron arriba)
  if (serviciosHospital.some(esp => {
    if (esp === "cardiologia" && servicioLower.includes("procedimientos")) {
      return false; // Ya se procesó en Calle 16
    }
    return servicioLower.includes(esp);
  })) {
    return {
      direccion1: "Carrera 5 # 9-102",
      direccion2: "Hospital Regional de San Gil - Sede Principal",
      extra: ""
    };
  }

  // ============================================
  // CES (Avenida Santander 24A-48)
  // Todas las demás especialidades van aquí
  // ============================================
  const serviciosCES = [
    "adultez",
    "adulto mayor",
    "agudeza visual",
    "cirugia general",
    "cirugia pediatrica",
    "cirugia maxilofacial",
    "citologia",
    "control prenatal",
    "crecimiento",
    "dermatologia procedimientos",
    "dermatologia",
    "educacion individual",
    "examen de seno",
    "ginecologia",
    "medicina familiar",
    "medicina general",
    "medicina interna",
    "neurocirugia",
    "neurologia",
    "neumologia procedimientos",
    "nutricion",
    "obstetricia",
    "odontologia",
    "oftalmologia",
    "optometria",
    "ortopedia y/o traumatologia",
    "ortopedia",
    "pediatria",
    "planificacion familiar",
    "pos parto",
    "primera infancia",
    "psicologia",
    "psiquiatria",
    "riesgo cardiovascular",
    "salud oral",
    "terapia fisica y respiratoria",
    "urologia",
    "vejez"
  ];

  if (serviciosCES.some(esp => servicioLower.includes(esp))) {
    return {
      direccion1: "Avenida Santander 24A-48",
      direccion2: "Consulta Externa CES Hospital Regional de San Gil",
      extra: ""
    };
  }

  // ============================================
  // DEFAULT: Si no coincide con nada, enviar al Hospital
  // ============================================
  console.warn(`⚠️ Servicio no mapeado: "${servicio}". Enviando al Hospital por defecto.`);
  return {
    direccion1: "valida tu direccion de cita medica",
    direccion2: "no sabes donde es? llamanos al 6077249701",
    extra: ""
  };
}

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
                  link: "https://drive.google.com/uc?export=view&id=1E6_3ZDuBUIy99OvahrhbxpPN21XPY3R2",  
                } 
              }
            ],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: campos.nombre_paciente },
              { type: "text", text: campos.fecha },
              { type: "text", text: campos.hora },
              { type: "text", text: campos.servicio },
              { type: "text", text: campos.profesional },
              { type: "text", text: campos.direccion1 },
              { type: "text", text: campos.direccion2 },
              { type: "text", text: campos.extra },
            ],
          },
        ],
      },
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

    return { success: true, response: response.data };

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorDetails = error.response?.data?.error?.error_data;
    
    return { 
      success: false, 
      error: errorMsg,
      errorCode,
      errorDetails
    };
  }
}

const sendWhatsAppReminder = async (req, res) => {
  try {
    console.log("🚀 INICIANDO ENVÍO DE RECORDATORIOS VIA META\n");
    const io = global.io;

    const reminders = await WhatsAppReminder.getRemindersForTomorrow();

    if (reminders.length === 0) {
      return res.status(200).json({ message: "No hay citas para mañana." });
    }

    // Emitir inicio del proceso
    io.emit("whatsapp:inicio", {
      total: reminders.length,
      timestamp: new Date().toISOString()
    });

    const resultados = { exitosos: 0, fallidos: 0, errores: [] };

    // Responder inmediatamente al cliente
    res.status(200).json({
      message: "Proceso de envío iniciado",
      total: reminders.length,
      sessionId: Date.now()
    });

    // Continuar el proceso en background
    (async () => {
      for (let i = 0; i < reminders.length; i++) {
        const reminder = reminders[i];
        
        // Obtener dirección según el servicio
        const dir = obtenerDireccionPorEspecialidad(reminder.servicio);
        reminder.direccion1 = dir.direccion1;
        reminder.direccion2 = dir.direccion2;
        reminder.extra = dir.extra;

        // Log para debugging
        console.log(`\n[${i + 1}/${reminders.length}] ${reminder.nombre_paciente}`);
        console.log(`   Servicio: ${reminder.servicio}`);
        console.log(`   Dirección: ${dir.direccion1}`);
        console.log(`   Sede: ${dir.direccion2}`);

        let numero = reminder.telefono;
        if (!numero.startsWith("+57")) {
          numero = "+57" + numero.replace(/^0+/, "");
        }

        // Emitir estado "procesando"
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
          
          console.log(`   ✅ ENVIADO`);
          
          // Emitir éxito
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
            numero, 
            paciente: reminder.nombre_paciente, 
            error: resultado.error,
            errorCode: resultado.errorCode
          });
          
          console.log(`   ❌ ERROR: ${resultado.error}`);
          
          // Emitir error
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

        // Pausas
        if (i < reminders.length - 1) {
          io.emit("whatsapp:pausa", {
            segundos: 2,
            mensaje: "Esperando 20 segundos..."
          });
          await esperar(2000);
          
          if ((i + 1) % 10 === 0) {
            io.emit("whatsapp:pausa", {
              segundos: 6,
              mensaje: "Pausa extendida de 60 segundos..."
            });
            await esperar(6000);
          }
        }
      }

      // Emitir completado
      const reporte = {
        fecha: new Date().toISOString(),
        total: reminders.length,
        exitosos: resultados.exitosos,
        fallidos: resultados.fallidos,
        tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + "%",
        errores: resultados.errores
      };

      io.emit("whatsapp:completado", reporte);

      const nombreReporte = `reporte_whatsapp_${new Date().toISOString().split("T")[0]}.json`;
      fs.writeFileSync(nombreReporte, JSON.stringify(reporte, null, 2));
      
      console.log(`\n📊 RESUMEN:`);
      console.log(`   Total: ${reporte.total}`);
      console.log(`   Exitosos: ${reporte.exitosos}`);
      console.log(`   Fallidos: ${reporte.fallidos}`);
      console.log(`   Tasa de éxito: ${reporte.tasa_exito}`);
      console.log(`\n💾 Reporte guardado: ${nombreReporte}`);
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
    const [rows] = await db.query(`
      SELECT id, numero, mensaje, fecha, tipo,
             DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha_formateada
      FROM mensajes ORDER BY fecha DESC
    `);

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

module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
};