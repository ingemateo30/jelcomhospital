const { twiml } = require('twilio');
const VoiceResponse = twiml.VoiceResponse;
const pool = require('../config/db');
const { iniciarLlamada } = require('../config/twilioConfig');

exports.programarLlamada = async (req, res) => {
  try {
    const { citaId } = req.body;
    if (!citaId) return res.status(400).json({ error: 'ID de cita requerido' });

    const [cita] = await pool.query(
      `SELECT TELEFONO_FIJO, NOMBRE, FECHA_CITA, HORA_CITA, SERVICIO
       FROM citas WHERE ID = ? LIMIT 1`,
      [citaId]
    );
    if (!cita.length) return res.status(404).json({ error: 'Cita no encontrada o ya procesada' });

    const resultado = await iniciarLlamada(cita[0].TELEFONO_FIJO, citaId);
    res.json({
      success: true,
      llamadaId: resultado.sid,
      estado: resultado.status,
      mensaje: `📞 Recordatorio programado para ${cita[0].NOMBRE}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message, codigo: error.code });
  }
};

exports.manejarLlamada = async (req, res) => {
  const twiml = new VoiceResponse();
  try {
    const citaId = req.params.citaId;
    const [rows] = await pool.query(
      `SELECT FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE FROM citas WHERE ID = ?`,
      [citaId]
    );

    if (!rows.length) {
      twiml.say({ voice: 'Mia', language: 'es-MX' }, 'Lo sentimos, no encontramos su cita.');
      return res.type('text/xml').send(twiml.toString());
    }

    const { FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE } = rows[0];
    const fecha = new Date(FECHA_CITA).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const mensaje = `Hola ${NOMBRE}, le recuerda el Hospital Regional de San Gil su cita de ${SERVICIO} programada para el ${fecha} a las ${HORA_CITA.slice(0,5)}. Gracias por elegir nuestros servicios,te esperamos.`;

    twiml.say(
      {
        voice: 'alice',
        language: 'es-MX'
      },
      `<speak>${mensaje}</speak>`
    );
    twiml.hangup();

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('Error al manejar llamada:', error);
    twiml.say({ voice: 'Mia', language: 'es-MX' }, 'Disculpe, ha ocurrido un error en la llamada.');
    twiml.hangup();
    res.type('text/xml').send(twiml.toString());
  }
};

exports.actualizarEstadoLlamada = async (req, res) => {
  try {
    const citaId = req.params.citaId;
    const callStatus = (req.body.CallStatus || 'desconocido').toLowerCase();
    const duracion = parseInt(req.body.CallDuration) || 0;
    const callSid = req.body.CallSid || '';

    await pool.query(
      `UPDATE citas 
         SET estado_llamada = ?, duracion_llamada = ?, fecha_llamada = NOW(),
             intentos_llamada = intentos_llamada + 1, llamada_id = ?
       WHERE ID = ?`,
      [callStatus, duracion, callSid, citaId]
    );
    res.status(204).end();
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};
