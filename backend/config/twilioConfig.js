// backend/config/twilioConfig.js
const twilio = require('twilio');
const pool = require('./db'); // Asumiendo que usas mysql2/promise

const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const iniciarLlamada = async (telefono, citaId) => {
  try {
    const llamada = await twilioClient.calls.create({
      url: `${process.env.BASE_URL}/api/voz/handle-call/${citaId}`,
      to: `+57${telefono}`, // Asegurar formato internacional
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: `${process.env.BASE_URL}/api/voz/status-callback/${citaId}`
    });

    await pool.query(
      `UPDATE citas 
       SET llamada_id = ?, intentos_llamada = intentos_llamada + 1 
       WHERE ID = ?`,
      [llamada.sid, citaId]
    );

    return llamada;
  } catch (error) {
    await registrarErrorLlamada(citaId, error.message);
    throw error;
  }
};

const registrarErrorLlamada = async (citaId, error) => {
  await pool.query(
    `UPDATE citas 
     SET estado_llamada = 'fallida', fecha_llamada = NOW() 
     WHERE ID = ?`,
    [citaId]
  );
};

module.exports = { twilioClient, iniciarLlamada };
