// ======================================================
// CONTROLADOR DE RECORDATORIOS WHATSAPP - API META OFICIAL
// ======================================================

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const Cita = require("../models/Cancelacion");
const db = require("../config/db");

const usuariosEnEsperaDeMotivo = new Map();

// ======================================================
// CONFIGURACIÓN META API
// ======================================================
const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_WA_BASE_URL = process.env.META_WA_BASE_URL || "https://graph.facebook.com/v21.0";

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function obtenerMimeType(rutaArchivo) {
  const extension = path.extname(rutaArchivo).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function buscarImagen(nombreBase = "recordatorio_cita") {
  const extensiones = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const carpetas = [__dirname, path.join(__dirname, ".."), path.join(__dirname, "../public/images")];

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

// ======================================================
// FUNCIÓN PARA ENVIAR PLANTILLA META
// ======================================================
async function enviarPlantillaMeta(numero, reminder, imageUrl = null) {
  try {
    console.log(`📤 Enviando plantilla Meta a ${numero}...`);

    const payload = {
      messaging_product: "whatsapp",
      to: numero,
      type: "template",
      template: {
        name: "recordatorio",
        language: { code: "es" },
        components: [
          ...(imageUrl
            ? [
                {
                  type: "header",
                  parameters: [{ type: "image", image: { link: imageUrl } }],
                },
              ]
            : []),
          {
            type: "body",
            parameters: [
              { type: "text", text: reminder.nombre_paciente }, // {{1}}
              { type: "text", text: reminder.fecha }, // {{2}}
              { type: "text", text: reminder.hora }, // {{3}}
              { type: "text", text: reminder.servicio }, // {{4}}
              { type: "text", text: reminder.profesional }, // {{5}}
              { type: "text", text: reminder.direccion1 || "" }, // {{6}}
              { type: "text", text: reminder.direccion2 || "" }, // {{7}}
              { type: "text", text: reminder.extra || "" }, // {{8}}
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
      }
    );

    console.log(`✅ Mensaje enviado a ${numero}`);
    return { success: true, response: response.data };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Error enviando a ${numero}: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// ======================================================
// OBTENER DIRECCIÓN POR ESPECIALIDAD
// ======================================================
function obtenerDireccionPorEspecialidad(servicio) {
  const servicioLower = servicio.toLowerCase().trim();

  if (servicioLower.includes("cardiologia") && servicioLower.includes("procedimiento")) {
    return {
      direccion1: "Calle 16 No. 9-76",
      direccion2: "Procedimientos de Cardiología",
      extra: "",
    };
  }

  const especialidadesSedePrincipal = [
    "otorrino", "otorrinolaringologia", "anestesia", "anestesiologia",
    "cardiologia consulta", "endoscopia", "colonoscopia", "gastroenterologia",
    "fonoaudiologia", "qx dermatológica", "qx general"
  ];

  if (especialidadesSedePrincipal.some(esp => servicioLower.includes(esp))) {
    return {
      direccion1: "Carrera 5 # 9-102",
      direccion2: "Hospital Regional de San Gil - Sede Principal",
      extra: "",
    };
  }

  const especialidadesCES = [
    "adulto mayor", "citología", "control prenatal", "planificación familiar", "pos parto",
    "medicina general", "odontologia", "ecografias", "examen de seno", "cirugia general",
    "ginecologia", "nutricion", "oftalmologia", "optometria", "ortopedia", "pediatria",
    "psiquiatria", "psicologia", "crecimiento", "riesgo cardiovascular"
  ];

  if (especialidadesCES.some(esp => servicioLower.includes(esp))) {
    return {
      direccion1: "Avenida Santander 24A-48",
      direccion2: "Consulta externa CES Hospital Regional de San Gil",
      extra: "",
    };
  }

  if (servicioLower.includes("endodoncia")) {
    return {
      direccion1: "Cra 14A # 29A-27 Edificio PSI Local 2 Exterior, Barrio Porvenir",
      direccion2: "Consulta Especializada de Endodoncia",
      extra: "⚠️ *IMPORTANTE:* Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección.",
    };
  }

  return {
    direccion1: "Carrera 5 # 9-102",
    direccion2: "Hospital Regional de San Gil - Sede Principal",
    extra: "",
  };
}

// ======================================================
// ENVÍO MASIVO DE RECORDATORIOS
// ======================================================
const sendWhatsAppReminder = async (req, res) => {
  try {
    console.log("🚀 INICIANDO ENVÍO DE RECORDATORIOS VIA META\n");

    const reminders = await WhatsAppReminder.getRemindersForTomorrow();

    if (reminders.length === 0) {
      return res.status(200).json({ message: "No hay citas para mañana." });
    }

    const imageUrl = "https://drive.google.com/uc?export=view&id=EXAMPLE_IMAGE_ID"; // reemplaza luego

    const resultados = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];
      const dir = obtenerDireccionPorEspecialidad(reminder.servicio);
      reminder.direccion1 = dir.direccion1;
      reminder.direccion2 = dir.direccion2;
      reminder.extra = dir.extra;

      let numero = reminder.telefono;
      if (!numero.startsWith("+57")) numero = "+57" + numero.replace(/^0+/, "");

      console.log(`[${i + 1}/${reminders.length}] Enviando a ${numero} (${reminder.nombre_paciente})`);

      const resultado = await enviarPlantillaMeta(numero, reminder, imageUrl);

      if (resultado.success) {
        resultados.exitosos++;
        await WhatsAppReminder.updateReminderStatus(reminder.id, "recordatorio enviado");
      } else {
        resultados.fallidos++;
        resultados.errores.push({ numero, paciente: reminder.nombre_paciente, error: resultado.error });
      }

      // Pausas inteligentes
      if (i < reminders.length - 1) {
        console.log("⏳ Pausa de 20 segundos...");
        await esperar(20000);
        if ((i + 1) % 10 === 0) {
          console.log("⏸️ Pausa extendida de 60 segundos...");
          await esperar(60000);
        }
      }
    }

    // Guardar reporte
    const nombreReporte = `reporte_recordatorios_${new Date().toISOString().split("T")[0]}.json`;
    fs.writeFileSync(nombreReporte, JSON.stringify(resultados, null, 2));
    console.log(`💾 Reporte guardado: ${nombreReporte}`);

    res.status(200).json({
      message: "Recordatorios enviados",
      ...resultados,
      total: reminders.length,
      tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + "%",
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({ error: "Error al enviar recordatorios." });
  }
};

// ======================================================
// CLASIFICAR RESPUESTAS AUTOMÁTICAMENTE
// ======================================================
function clasificarRespuesta(mensaje) {
  const m = mensaje.toLowerCase();
  if (m.includes("sí") || m.includes("si") || m.includes("confirmo")) return "confirmada";
  if (m.includes("no") || m.includes("cancelo") || m.includes("cancelar")) return "cancelada";
  if (m.includes("reagendar") || m.includes("cambiar") || m.includes("reprogramar")) return "reagendar";
  return "pendiente_clasificacion";
}

// ======================================================
// OBTENER RESPUESTAS
// ======================================================
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

// ======================================================
// ENVÍO INDIVIDUAL / MASIVO PERSONALIZADO
// ======================================================
const sendMessage = async (to, reminder, imageUrl = null) => {
  return enviarPlantillaMeta(to, reminder, imageUrl);
};

const sendMassiveMessage = async (numeros, reminderBase, imageUrl = null) => {
  const resultados = { exitosos: 0, fallidos: 0, errores: [] };
  for (let i = 0; i < numeros.length; i++) {
    const num = numeros[i];
    console.log(`[${i + 1}/${numeros.length}] Enviando a ${num}`);
    const resultado = await enviarPlantillaMeta(num, reminderBase, imageUrl);
    if (resultado.success) resultados.exitosos++;
    else resultados.errores.push({ num, error: resultado.error });
    if (i < numeros.length - 1) await esperar(3000);
  }
  return resultados;
};

// ======================================================
// EXPORTAR
// ======================================================
module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
  sendMessage,
  sendMassiveMessage,
};