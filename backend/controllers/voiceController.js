const { iniciarLlamada } = require('../config/twilioConfig');
const pool = require('../config/db');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

exports.programarLlamada = async (req, res) => {
  try {
    const { citaId } = req.body;
    console.log('ID de cita recibido:', citaId);
    
    if (!citaId) {
      return res.status(400).json({ error: 'ID de cita requerido' });
    }

    const [cita] = await pool.query(
      `SELECT TELEFONO_FIJO, NOMBRE, FECHA_CITA, HORA_CITA, SERVICIO 
       FROM citas 
       WHERE ID = ?
       LIMIT 1`,
      [citaId]
    );

    if (!cita.length) {
      return res.status(404).json({ error: 'Cita no encontrada o ya procesada' });
    }

    const resultado = await iniciarLlamada(cita[0].TELEFONO_FIJO, citaId);

    res.json({
      success: true,
      llamadaId: resultado.id,
      estado: resultado.status,
      mensaje: `📞 Recordatorio programado para ${cita[0].NOMBRE}`
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      codigo: error.code
    });
  }
};

exports.manejarLlamada = async (req, res) => {
  try {
    const citaId = req.params.citaId;
    
    const [cita] = await pool.query(
      `SELECT FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE 
       FROM citas 
       WHERE ID = ?`,
      [citaId]
    );

    if (!cita.length) {
      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'Polly.Mia-Neural',
        language: 'es-MX'
      }, 'Lo sentimos, no encontramos su cita.');
      twiml.hangup();
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    const { FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE } = cita[0];
    const fecha = new Date(FECHA_CITA).toLocaleDateString('es-CO', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    const mensaje = `
      Hola ${NOMBRE} te saluda hospital regional de san gil, le recordamos su cita de ${SERVICIO}, 
      programada para el ${fecha} a las ${HORA_CITA.substring(0, 5)}. 
      Gracias por elegir nuestros servicios,te esperamos.
    `.replace(/\s+/g, ' ').trim();

    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Mia-Neural',
      language: 'es-MX'
    }, mensaje);
    twiml.pause({ length: 1 });
    twiml.hangup();

    res.type('text/xml');
    return res.send(twiml.toString());

  } catch (error) {
    console.error('Error al manejar llamada:', error);
    
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Mia-Neural',
      language: 'es-MX'
    }, 'Disculpe, ha ocurrido un error con su cita.');
    twiml.hangup();
    
    res.type('text/xml');
    return res.send(twiml.toString());
  }
};

exports.actualizarEstadoLlamada = async (req, res) => {
  try {
    const citaId = req.params.citaId;
    
    // Capturar datos del callback de estado de Twilio
    const callStatus = req.body.CallStatus || 'desconocido';
    const duracion = parseInt(req.body.CallDuration) || 0;
    const callSid = req.body.CallSid || '';
    
    // Mapear estados de Twilio a nuestros estados
    let estadoNormalizado = callStatus.toLowerCase();
    
    // Registrar información en la base de datos
    await pool.query(
      `UPDATE citas 
       SET estado_llamada = ?,
           duracion_llamada = ?,
           fecha_llamada = NOW(),
           intentos_llamada = intentos_llamada + 1,
           id_externo_llamada = ?
       WHERE ID = ?`,
      [estadoNormalizado, duracion, callSid, citaId]
    );

    console.log('Estado actualizado:', { citaId, estado: estadoNormalizado, duracion });
    res.status(204).end(); 
    
  } catch (error) {
    console.error('Error al actualizar estado de llamada:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};