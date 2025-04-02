// backend/controllers/voiceController.js
const { iniciarLlamada } = require('../config/twilioConfig');
const pool = require('../config/db');
const twilio = require('twilio');

// backend/controllers/voiceController.js
exports.programarLlamada = async (req, res) => {
    try {
      const { citaId } = req.body;
      
      const [rows] = await pool.query(
        `SELECT TELEFONO_FIJO, NOMBRE, FECHA_CITA, HORA_CITA, SERVICIO 
         FROM citas 
         WHERE ID = ?`,
        [citaId]
      );
  
      if (!rows.length) return res.status(404).json({ error: 'Cita no encontrada' });
  
      const resultado = await iniciarLlamada(rows[0].TELEFONO_FIJO, citaId);
      
      res.json({
        success: true,
        sid: resultado.sid,
        mensaje: `Recordatorio enviado a ${rows[0].NOMBRE}`
      });
    } catch (error) {
      // Manejo específico de errores de Twilio
      if (error.code === 20003) { // Código de error de autenticación
        res.status(401).json({ 
          error: 'Error de autenticación con Twilio',
          solucion: 'Verifique las credenciales en .env'
        });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  exports.manejarLlamada = (req, res) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;

const response = new VoiceResponse();
    const citaId = req.params.citaId;

    pool.query(
      `SELECT FECHA_CITA, HORA_CITA, SERVICIO, NOMBRE 
       FROM citas 
       WHERE ID = ?`, 
      [citaId]
    ).then(([citas]) => {
      if (!citas || citas.length === 0) {
        throw new Error('Cita no encontrada');
      }

      const cita = citas[0];
      
      // Formatear fecha en español
      const opcionesFecha = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const fecha = new Date(cita.FECHA_CITA).toLocaleDateString('es-MX', opcionesFecha);
      
      // Formatear hora
      const hora = cita.HORA_CITA.substring(0, 5);

      const mensaje = `Hola ${cita.NOMBRE}, le recordamos su cita de ${cita.SERVICIO} 
                     programada para el ${fecha} 
                     a las ${hora}. 
                     ¡Gracias por elegirnos!`;

      // Configuración de voz en español
      response.say({
        voice: 'Polly.Mathieu',
        language: 'fr-FR'
    }, mensaje);

      twiml.hangup();

      res.type('text/xml');
      res.send(twiml.toString());
    }).catch(error => {
      // Manejo de errores en español
      twiml.say({
        voice: 'Polly.Lupe', // Voz neural en español
        language: 'es-MX'
      }, 'Lo sentimos, hubo un error al procesar su cita.');
      
      twiml.hangup();
      res.type('text/xml').send(twiml.toString());
    });
};

exports.actualizarEstadoLlamada = async (req, res) => {
  const citaId = req.params.citaId;
  const estado = req.body.CallStatus;
  const duracion = req.body.Duration || 0;

  await pool.query(
    `UPDATE citas 
     SET estado_llamada = ?,
         duracion_llamada = ?,
         fecha_llamada = NOW()
     WHERE ID = ?`,
    [estado, duracion, citaId]
  );

  res.status(200).end();
};