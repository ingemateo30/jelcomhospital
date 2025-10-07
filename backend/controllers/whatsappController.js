require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const db = require("../config/db");

// ======================================================
// CONFIGURACIÓN META API
// ======================================================
const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_WA_BASE_URL = process.env.META_WA_BASE_URL || "https://graph.facebook.com/v21.0";

// ✅ URL DE IMAGEN VÁLIDA (sube tu imagen a un servidor público)
const IMAGE_URL = process.env.WHATSAPP_IMAGE_URL || "https://i.imgur.com/yourimage.jpg";

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      extra: "Por favor, llegar con 40 minutos de anticipación.",
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
      extra: "Por favor, llegar con 40 minutos de anticipación.",
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
      extra: "Por favor, llegar con 40 minutos de anticipación.",
    };
  }

  if (servicioLower.includes("endodoncia")) {
    return {
      direccion1: "Cra 14A # 29A-27 Edificio PSI Local 2 Exterior, Barrio Porvenir",
      direccion2: "Consulta Especializada de Endodoncia",
      extra: "⚠️ IMPORTANTE: Diríjase primero al CES (Avenida Santander 24A-48) antes de ir a esta dirección.",
    };
  }

  return {
    direccion1: "Carrera 5 # 9-102",
    direccion2: "Hospital Regional de San Gil - Sede Principal",
    extra: "Por favor, llegar con 40 minutos de anticipación.",
  };
}

// ======================================================
// ✅ FUNCIÓN MEJORADA PARA ENVIAR PLANTILLA META
// ======================================================
async function enviarPlantillaMeta(numero, reminder) {
  try {
    console.log(`📤 Enviando plantilla Meta a ${numero}...`);

    // ✅ Validar que todos los campos requeridos existan
    const campos = {
      nombre_paciente: reminder.nombre_paciente || "Paciente",
      fecha: reminder.fecha || "Fecha no disponible",
      hora: reminder.hora || "Hora no disponible",
      servicio: reminder.servicio || "Servicio no especificado",
      profesional: reminder.profesional || "Profesional no asignado",
      direccion1: reminder.direccion1 || "Dirección no disponible",
      direccion2: reminder.direccion2 || "",
      extra: reminder.extra || "Por favor, llegar con 40 minutos de anticipación."
    };

    // ✅ Validar URL de imagen
    if (!IMAGE_URL || IMAGE_URL.includes("EXAMPLE")) {
      console.error("⚠️ ADVERTENCIA: URL de imagen no configurada correctamente");
      // Usar una imagen por defecto de Meta (logo de WhatsApp Business)
      // O lanzar un error si la imagen es obligatoria
    }

    const payload = {
      messaging_product: "whatsapp",
      to: numero,
      type: "template",
      template: {
        name: "recordatorio",
        language: { code: "es" },
        components: [
          // ✅ HEADER SIEMPRE INCLUIDO (es obligatorio en tu plantilla)
          {
            type: "header",
            parameters: [
              { 
                type: "image", 
                image: { 
                link: "https://drive.google.com/uc?export=view&id=1okoJZf6Kc8RLaGJy8OvqCV5PZ-8iwAN5",   
             } 
              }
            ],
          },
          // ✅ BODY con todos los parámetros
          {
            type: "body",
            parameters: [
              { type: "text", text: campos.nombre_paciente },    // {{1}}
              { type: "text", text: campos.fecha },              // {{2}}
              { type: "text", text: campos.hora },               // {{3}}
              { type: "text", text: campos.servicio },           // {{4}}
              { type: "text", text: campos.profesional },        // {{5}}
              { type: "text", text: campos.direccion1 },         // {{6}}
              { type: "text", text: campos.direccion2 },         // {{7}}
              { type: "text", text: campos.extra },              // {{8}}
            ],
          },
          // ✅ BUTTONS (si tu plantilla los tiene, descomenta esto)
          // {
          //   type: "button",
          //   sub_type: "phone_number",
          //   index: 0,
          //   parameters: [
          //     {
          //       type: "text",
          //       text: "6077249701"
          //     }
          //   ]
          // }
        ],
      },
    };

    console.log("📋 Payload enviado:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${META_WA_BASE_URL}/${META_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${META_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 segundos de timeout
      }
    );

    console.log(`✅ Mensaje enviado a ${numero}`);
    return { success: true, response: response.data };

  } catch (error) {
    // ✅ Mejor manejo de errores
    const errorMsg = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorDetails = error.response?.data?.error?.error_data;
    
    console.error(`❌ Error enviando a ${numero}:`);
    console.error(`   Código: ${errorCode}`);
    console.error(`   Mensaje: ${errorMsg}`);
    if (errorDetails) {
      console.error(`   Detalles:`, errorDetails);
    }
    
    return { 
      success: false, 
      error: errorMsg,
      errorCode,
      errorDetails
    };
  }
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

    const resultados = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];
      
      // ✅ Obtener dirección según especialidad
      const dir = obtenerDireccionPorEspecialidad(reminder.servicio);
      reminder.direccion1 = dir.direccion1;
      reminder.direccion2 = dir.direccion2;
      reminder.extra = dir.extra;

      // ✅ Formatear número
      let numero = reminder.telefono;
      if (!numero.startsWith("+57")) {
        numero = "+57" + numero.replace(/^0+/, "");
      }

      console.log(`\n[${i + 1}/${reminders.length}] Procesando: ${reminder.nombre_paciente}`);
      console.log(`   📞 Número: ${numero}`);
      console.log(`   📅 Fecha: ${reminder.fecha}`);
      console.log(`   🏥 Servicio: ${reminder.servicio}`);

      const resultado = await enviarPlantillaMeta(numero, reminder);

      if (resultado.success) {
        resultados.exitosos++;
        await WhatsAppReminder.updateReminderStatus(reminder.id, "recordatorio enviado");
        console.log(`   ✅ ÉXITO`);
      } else {
        resultados.fallidos++;
        resultados.errores.push({ 
          numero, 
          paciente: reminder.nombre_paciente, 
          error: resultado.error,
          errorCode: resultado.errorCode
        });
        console.log(`   ❌ FALLÓ: ${resultado.error}`);
      }

      // ✅ Pausas inteligentes para evitar límites de rate
      if (i < reminders.length - 1) {
        console.log("   ⏳ Esperando 20 segundos...");
        await esperar(20000);
        
        if ((i + 1) % 10 === 0) {
          console.log("   ⏸️ Pausa extendida de 60 segundos...");
          await esperar(60000);
        }
      }
    }

    // ✅ Guardar reporte detallado
    const nombreReporte = `reporte_recordatorios_${new Date().toISOString().split("T")[0]}.json`;
    const reporte = {
      fecha: new Date().toISOString(),
      total: reminders.length,
      exitosos: resultados.exitosos,
      fallidos: resultados.fallidos,
      tasa_exito: ((resultados.exitosos / reminders.length) * 100).toFixed(1) + "%",
      errores: resultados.errores
    };
    
    fs.writeFileSync(nombreReporte, JSON.stringify(reporte, null, 2));
    console.log(`\n💾 Reporte guardado: ${nombreReporte}`);

    res.status(200).json({
      message: "Proceso de envío completado",
      ...reporte
    });

  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({ 
      error: "Error al enviar recordatorios.",
      details: error.message 
    });
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
// EXPORTAR
// ======================================================
module.exports = {
  sendWhatsAppReminder,
  processWhatsAppReply,
};