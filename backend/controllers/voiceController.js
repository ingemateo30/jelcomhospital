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
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    const { FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE } = rows[0];
    const fecha = new Date(FECHA_CITA).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let servicioPronunciacion = SERVICIO;

    const especialidadesMedicas = {
      'anestesiologia': 'a-nes-te-sio-lo-gía',
      'anestesiología': 'a-nes-te-sio-lo-gía',
      'ginecologia': 'gi-ne-co-lo-gía',
      'ginecología': 'gi-ne-co-lo-gía',
      'neurologia': 'neu-ro-lo-gía',
      'neurología': 'neu-ro-lo-gía',
      'urologia': 'u-ro-lo-gía',
      'urología': 'u-ro-lo-gía',
      'oftalmologia': 'of-tal-mo-lo-gía',
      'oftalmología': 'of-tal-mo-lo-gía',
      'cardiologia': 'car-dio-lo-gía',
      'cardiología': 'car-dio-lo-gía',
      'dermatologia': 'der-ma-to-lo-gía',
      'dermatología': 'der-ma-to-lo-gía',
      'endocrinologia': 'en-do-cri-no-lo-gía',
      'endocrinología': 'en-do-cri-no-lo-gía',
      'gastroenterologia': 'gas-tro-en-te-ro-lo-gía',
      'gastroenterología': 'gas-tro-en-te-ro-lo-gía',
      'neumologia': 'neu-mo-lo-gía',
      'neumología': 'neu-mo-lo-gía',
      'oncologia': 'on-co-lo-gía',
      'oncología': 'on-co-lo-gía',
      'pediatria': 'pe-dia-tría',
      'pediatría': 'pe-dia-tría',
      'psiquiatria': 'psi-quia-tría',
      'psiquiatría': 'psi-quia-tría',
      'reumatologia': 'reu-ma-to-lo-gía',
      'reumatología': 'reu-ma-to-lo-gía',
      'traumatologia': 'trau-ma-to-lo-gía',
      'traumatología': 'trau-ma-to-lo-gía'
    };

    const servicioLowerCase = SERVICIO.toLowerCase().trim();
    if (especialidadesMedicas[servicioLowerCase]) {
      servicioPronunciacion = especialidadesMedicas[servicioLowerCase];
    }

        const mensaje = `Hola ${NOMBRE}, le habla el Hospital Regional de San Gil. Le recordamos su cita de ${servicioPronunciacion}, programada para el ${fecha} a las ${HORA_CITA.slice(0, 5)}.
        Por favor, llegue con 40 minutos de anticipación.
        Si desea cancelar o reagendar, llame al 607 724 9701.
        Este mensaje se envía según nuestra política de tratamiento de datos personales.
        Si no desea recibir más recordatorios, indíquelo en esa misma línea.
        Gracias por su atención. Feliz día.`;

    twiml.say(
      {
        voice: 'Google.es-US-Neural2-C',
        language: 'es-US',
        rate: '0.9'
      },
      mensaje
    );

    twiml.pause({ length: 1 });
    twiml.hangup();
    res.status(200).set('Content-Type', 'text/xml').send(twiml.toString());
  } catch (error) {
    console.error('Error al manejar llamada:', error);
    res.status(500).send('Error en el servidor');
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
