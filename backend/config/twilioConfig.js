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
      machineDetection: 'Enable',
      timeout: 15
    });

    console.log('Llamada iniciada con Twilio:', call.sid);

    // Devolver el objeto con el ID de la llamada
    return {
      id: call.sid,
      status: call.status
    };

  } catch (error) {
    // Log detallado del error
    console.error('Error en la llamada con Twilio:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    
    // Registrar el error en la base de datos
    await registrarErrorLlamada(citaId, error.message);
    
    // Relanzar el error para manejarlo en el controlador
    throw error;
  }
};

// Función para registrar errores de llamada en la base de datos
const registrarErrorLlamada = async (citaId, error) => {
  try {
    await pool.query(
      `UPDATE citas 
       SET estado_llamada = 'fallida', 
           fecha_llamada = NOW(),
           intentos_llamada = intentos_llamada + 1
       WHERE ID = ?`,
      ['Error: ' + error.substring(0, 255), citaId] 
    );
  } catch (dbError) {
    console.error('Error al registrar fallo en BD:', dbError);
  }
};

module.exports = { iniciarLlamada };

