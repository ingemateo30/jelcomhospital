const twilio = require('twilio');
const pool = require('./db');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const iniciarLlamada = async (telefono, citaId) => {
  try {
    const numeroLimpio = telefono.replace(/\D/g, '');
    if (numeroLimpio.length !== 10) throw new Error('Número debe tener 10 dígitos');
    const numeroFormateado = `+57${numeroLimpio}`;
    const call = await client.calls.create({
      to: numeroFormateado,
      from: twilioNumber,
      url: `${process.env.BASE_URL}/api/voz/mensaje/${citaId}`,
      statusCallback: `${process.env.BASE_URL}/api/voz/status-callback/${citaId}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 15,
      answerOnBridge: true,
      record: false
    });

    console.log('Llamada iniciada con Twilio:', call.sid);
    return {
      id: call.sid,
      status: call.status
    };
  } catch (error) {
    console.error('Error en la llamada con Twilio:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    await registrarErrorLlamada(citaId, error.message);
    throw error;
  }
};
const registrarErrorLlamada = async (citaId, error) => {
  try {
    await pool.query(
      `UPDATE citas 
       SET estado_llamada = 'fallida', 
           fecha_llamada = NOW(),
           intentos_llamada = intentos_llamada + 1
       WHERE ID = ?`,
      [citaId]
    );
  } catch (dbError) {
    console.error('Error al registrar fallo en BD:', dbError);
  }
};

module.exports = { iniciarLlamada };

