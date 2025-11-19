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
  // Especialidades básicas
  'anestesiologia': 'a-nes-te-sio-lo-gía',
  'anestesiología': 'a-nes-te-sio-lo-gía',
  'cardiologia': 'car-dio-lo-gía',
  'cardiología': 'car-dio-lo-gía',
  'cardiologia pediatrica': 'car-dio-lo-gía pe-diá-tri-ca',
  'cardiología pediátrica': 'car-dio-lo-gía pe-diá-tri-ca',
  'cirugia general': 'ci-ru-gía ge-ne-ral',
  'cirugía general': 'ci-ru-gía ge-ne-ral',
  'cirugia pediatrica': 'ci-ru-gía pe-diá-tri-ca',
  'cirugía pediátrica': 'ci-ru-gía pe-diá-tri-ca',
  'cirugia maxilofacial': 'ci-ru-gía ma-xi-lo-fa-cial',
  'cirugía maxilofacial': 'ci-ru-gía ma-xi-lo-fa-cial',
  'dermatologia': 'der-ma-to-lo-gía',
  'dermatología': 'der-ma-to-lo-gía',
  'endocrinologia': 'en-do-cri-no-lo-gía',
  'endocrinología': 'en-do-cri-no-lo-gía',
  'endodoncia': 'en-do-don-cia',
  'gastroenterologia': 'gas-tro-en-te-ro-lo-gía',
  'gastroenterología': 'gas-tro-en-te-ro-lo-gía',
  'ginecologia': 'gi-ne-co-lo-gía',
  'ginecología': 'gi-ne-co-lo-gía',
  'medicina general': 'me-di-ci-na ge-ne-ral',
  'medicina familiar': 'me-di-ci-na fa-mi-liar',
  'medicina interna': 'me-di-ci-na in-ter-na',
  'neumologia': 'neu-mo-lo-gía',
  'neumología': 'neu-mo-lo-gía',
  'neurocirugia': 'neu-ro-ci-ru-gía',
  'neurocirugía': 'neu-ro-ci-ru-gía',
  'neurologia': 'neu-ro-lo-gía',
  'neurología': 'neu-ro-lo-gía',
  'nutricion': 'nu-tri-ción',
  'nutrición': 'nu-tri-ción',
  'obstetricia': 'obs-te-tri-cia',
  'odontologia': 'o-don-to-lo-gía',
  'odontología': 'o-don-to-lo-gía',
  'oftalmologia': 'of-tal-mo-lo-gía',
  'oftalmología': 'of-tal-mo-lo-gía',
  'oncologia': 'on-co-lo-gía',
  'oncología': 'on-co-lo-gía',
  'optometria': 'op-to-me-tría',
  'optometría': 'op-to-me-tría',
  'ortopedia': 'or-to-pe-dia',
  'ortopedia y/o traumatologia': 'or-to-pe-dia i trau-ma-to-lo-gía',
  'ortopedia y/o traumatología': 'or-to-pe-dia i trau-ma-to-lo-gía',
  'otorrinolaringologia': 'o-to-rri-no-la-rin-go-lo-gía',
  'otorrinolaringología': 'o-to-rri-no-la-rin-go-lo-gía',
  'pediatria': 'pe-dia-tría',
  'pediatría': 'pe-dia-tría',
  'periodoncia': 'pe-rio-don-cia',
  'psicologia': 'psi-co-lo-gía',
  'psicología': 'psi-co-lo-gía',
  'psiquiatria': 'psi-quia-tría',
  'psiquiatría': 'psi-quia-tría',
  'reumatologia': 'reu-ma-to-lo-gía',
  'reumatología': 'reu-ma-to-lo-gía',
  'traumatologia': 'trau-ma-to-lo-gía',
  'traumatología': 'trau-ma-to-lo-gía',
  'urologia': 'u-ro-lo-gía',
  'urología': 'u-ro-lo-gía',
  
  // Especialidades con PROCEDIMIENTOS
  'cardiologia procedimientos': 'pro-ce-di-mien-tos de car-dio-lo-gía',
  'cardiología procedimientos': 'pro-ce-di-mien-tos de car-dio-lo-gía',
  'cardiologia pediatrica procedimientos': 'pro-ce-di-mien-tos de car-dio-lo-gía pe-diá-tri-ca',
  'cardiología pediátrica procedimientos': 'pro-ce-di-mien-tos de car-dio-lo-gía pe-diá-tri-ca',
  'dermatologia procedimientos': 'pro-ce-di-mien-tos de der-ma-to-lo-gía',
  'dermatología procedimientos': 'pro-ce-di-mien-tos de der-ma-to-lo-gía',
  'endodoncia procedimientos': 'pro-ce-di-mien-tos de en-do-don-cia',
  'fonoaudiologia procedimientos': 'pro-ce-di-mien-tos de fo-no-au-dio-lo-gía',
  'fonoaudiología procedimientos': 'pro-ce-di-mien-tos de fo-no-au-dio-lo-gía',
  'neumologia procedimientos': 'pro-ce-di-mien-tos de neu-mo-lo-gía',
  'neumología procedimientos': 'pro-ce-di-mien-tos de neu-mo-lo-gía',
  'neurologia procedimientos': 'pro-ce-di-mien-tos de neu-ro-lo-gía',
  'neurología procedimientos': 'pro-ce-di-mien-tos de neu-ro-lo-gía',
  
  // Procedimientos y servicios
  'citologia': 'ci-to-lo-gía',
  'citología': 'ci-to-lo-gía',
  'colonoscopia': 'co-lo-nos-co-pia',
  'colonoscopía': 'co-lo-nos-co-pia',
  'control prenatal': 'con-trol pre-na-tal',
  'ecografias': 'e-co-gra-fías',
  'ecografías': 'e-co-gra-fías',
  'endoscopias': 'en-dos-co-pias',
  'endoscopías': 'en-dos-co-pias',
  'examen de seno': 'e-xa-men de se-no',
  'fonoaudiologia': 'fo-no-au-dio-lo-gía',
  'fonoaudiología': 'fo-no-au-dio-lo-gía',
  'higiene oral': 'hi-gie-ne o-ral',
  'planificacion familiar': 'pla-ni-fi-ca-ción fa-mi-liar',
  'planificación familiar': 'pla-ni-fi-ca-ción fa-mi-liar',
  'pos parto': 'pos par-to',
  'salud oral': 'sa-lud o-ral',
  'terapia fisica': 'te-ra-pia fí-si-ca',
  'terapia física': 'te-ra-pia fí-si-ca',
  'terapia respiratoria': 'te-ra-pia res-pi-ra-to-ria',
  'terapia fisica y respiratoria': 'te-ra-pia fí-si-ca i res-pi-ra-to-ria',
  'terapia física y respiratoria': 'te-ra-pia fí-si-ca i res-pi-ra-to-ria',
  'trabajo social': 'tra-ba-jo so-cial',
  
  // Programas y controles
  'adultez': 'a-dul-tez',
  'agudeza visual': 'a-gu-de-za vi-sual',
  'educacion individual': 'e-du-ca-ción in-di-vi-dual',
  'educación individual': 'e-du-ca-ción in-di-vi-dual',
  'joven': 'jo-ven',
  'primera infancia': 'pri-me-ra in-fan-cia',
  'riesgo cardiovascular': 'ries-go car-dio-vas-cu-lar',
  'vejez': 've-jez',
  
  // Procedimientos quirúrgicos
  'qx general': 'ci-ru-gía ge-ne-ral',
  'qx pediatrica': 'ci-ru-gía pe-diá-tri-ca',
  'qx pediátrica': 'ci-ru-gía pe-diá-tri-ca',
  'qx ginecologia': 'ci-ru-gía gi-ne-co-ló-gi-ca',
  'qx ginecología': 'ci-ru-gía gi-ne-co-ló-gi-ca',
  'qx ortopedia': 'ci-ru-gía or-to-pé-di-ca',
  'qx urologia': 'ci-ru-gía u-ro-ló-gi-ca',
  'qx urología': 'ci-ru-gía u-ro-ló-gi-ca',
  'qx neurocirugia': 'neu-ro-ci-ru-gía',
  'qx neurocirugía': 'neu-ro-ci-ru-gía',
  'qx oftalmologia': 'ci-ru-gía of-tal-mo-ló-gi-ca',
  'qx oftalmología': 'ci-ru-gía of-tal-mo-ló-gi-ca',
  'qx dermatologica': 'ci-ru-gía der-ma-to-ló-gi-ca',
  'qx dermatológica': 'ci-ru-gía der-ma-to-ló-gi-ca',
  'qx otorrino': 'ci-ru-gía o-to-rri-no-la-rin-go-ló-gi-ca'
};

    // Normaliza tildes y elimina espacios dobles
const normalizar = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')                 // separa caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')  // elimina tildes
    .replace(/\s+/g, ' ')             // colapsa múltiples espacios a uno solo
    .trim();
};

const servicioLowerCase = normalizar(SERVICIO);
    console.log('🔍 Servicio original:', SERVICIO);
console.log('🔍 Servicio normalizado:', servicioLowerCase);
    if (especialidadesMedicas[servicioLowerCase]) {
      console.log('✅ Pronunciación encontrada:', servicioPronunciacion);
      servicioPronunciacion = especialidadesMedicas[servicioLowerCase];
    }
  else {
  console.log('⚠️ No se encontró pronunciación para:', servicioLowerCase);
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
