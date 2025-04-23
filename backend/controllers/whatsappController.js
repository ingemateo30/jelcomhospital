require("dotenv").config();
const axios = require("axios");
const WhatsAppReminder = require("../models/WhatsAppReminder");
const Cita = require("../models/Cancelacion");
const getRawBody = require("raw-body");
const db = require("../config/db");

const usuariosEnEsperaDeMotivo = new Map();

const sendWhatsAppReminder = async (req, res) => {
  try {
    const reminders = await WhatsAppReminder.getRemindersForTomorrow();

    if (reminders.length === 0) {
      return res.status(200).json({ message: "No hay citas para mañana." });
    }

    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];

      const message = `*📢 Recordatorio de Cita Médica* \n\n👤 *Paciente:* ${reminder.nombre_paciente}\n📅 *Fecha:* ${reminder.fecha}\n🕘 *Hora:* ${reminder.hora}\n🏥 *Servicio:* ${reminder.servicio}\n\nTe esperamos puntualmente.\n\nPor favor responde:\n✅ *Sí* - Confirmar cita\n❌ *No* - Cancelar cita\n🔄 *Reagendar* - Solicitar cambio de fecha`;

      try {
        await axios.post(
          `https://api.ultramsg.com/${instanceId}/messages/chat`,
          {
            token: token,
            to: `+57${reminder.telefono}`,
            body: message,
          }
        );
        console.log(`✅ Mensaje enviado a ${reminder.telefono}`);
        await WhatsAppReminder.updateReminderStatus(reminder.id, "recordatorio enviado");
      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${reminder.telefono}:`, error);
      }

      if (i < reminders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    res.status(200).json({ message: "Mensajes enviados con éxito." });
  } catch (error) {
    console.error("❌ Error en el envío de recordatorios:", error);
    res.status(500).json({ error: "Error al enviar recordatorios." });
  }
};

const processWhatsAppReply = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, numero, mensaje, fecha, tipo FROM mensajes");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay mensajes en la base de datos." });
    }

    const responses = rows.map(row => ({
      id: row.id,
      telefono: row.numero,
      nombre_paciente: row.numero,
      fecha_cita: row.fecha,        
      respuesta: row.mensaje,       
      motivo: row.tipo              
    }));

    console.log("Respuestas enviadas al frontend:", responses);
    return res.json(responses);
  } catch (error) {
    console.error("Error al obtener los mensajes:", error);
    return res.status(500).json({ error: "Error al obtener los mensajes." });
  }
};

const sendMessage = async (to, message) => {
  try {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    const response = await axios.post(
      `https://api.ultramsg.com/${instanceId}/messages/chat`,
      {
        token: token,
        to: `+${to}`,
        body: message,
      });
    console.log("Mensaje enviado:", response.data);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
};



module.exports = { sendWhatsAppReminder, processWhatsAppReply};




