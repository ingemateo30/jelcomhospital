const { iniciarLlamada } = require('../config/twilioConfig');
const pool = require('../config/db');

const programarLlamadasDelDiaSiguiente = async (req, res) => {
  try {
    const fechaManana = new Date();
    fechaManana.setDate(fechaManana.getDate() + 1);
    const fechaFormateada = fechaManana.toISOString().split('T')[0];

    const [citas] = await pool.query(
      `SELECT ID, TELEFONO_FIJO, NOMBRE, FECHA_CITA, HORA_CITA, SERVICIO 
       FROM citas 
       WHERE DATE(FECHA_CITA) = ? 
         AND intentos_llamada < 3`,
      [fechaFormateada]
    );

    const io = global.io;

    if (citas.length === 0) {
      if (res) {
        return res.status(200).json({ message: "No hay llamadas para programar." });
      }
      return;
    }

    console.log(`📅 ${citas.length} llamadas programadas para ${fechaFormateada}`);

    // Emitir inicio
    io.emit("voz:inicio", {
      total: citas.length,
      fecha: fechaFormateada,
      timestamp: new Date().toISOString()
    });

    // Responder inmediatamente si es petición HTTP
    if (res) {
      res.status(200).json({
        message: "Proceso de llamadas iniciado",
        total: citas.length,
        fecha: fechaFormateada,
        sessionId: Date.now()
      });
    }

    // Ejecutar llamadas en background
    let exitosas = 0;
    let fallidas = 0;
    const errores = [];

    for (let i = 0; i < citas.length; i++) {
      const cita = citas[i];

      // Emitir estado "procesando"
      io.emit("voz:procesando", {
        current: i + 1,
        total: citas.length,
        paciente: cita.NOMBRE,
        numero: cita.TELEFONO_FIJO,
        servicio: cita.SERVICIO,
        fecha: new Date(cita.FECHA_CITA).toLocaleDateString('es-CO'),
        hora: cita.HORA_CITA
      });

      try {
        const resultado = await iniciarLlamada(cita.TELEFONO_FIJO, cita.ID);
        exitosas++;

        // Emitir éxito
        io.emit("voz:exito", {
          current: i + 1,
          total: citas.length,
          paciente: cita.NOMBRE,
          numero: cita.TELEFONO_FIJO,
          llamadaId: resultado.id,
          exitosas,
          fallidas
        });

        console.log(`✅ [${i + 1}/${citas.length}] Llamada exitosa a ${cita.NOMBRE}`);

      } catch (error) {
        fallidas++;
        errores.push({
          paciente: cita.NOMBRE,
          numero: cita.TELEFONO_FIJO,
          error: error.message,
          codigo: error.code
        });

        // Emitir error
        io.emit("voz:error", {
          current: i + 1,
          total: citas.length,
          paciente: cita.NOMBRE,
          numero: cita.TELEFONO_FIJO,
          error: error.message,
          codigo: error.code,
          exitosas,
          fallidas
        });

        console.error(`❌ [${i + 1}/${citas.length}] Error llamando a ${cita.NOMBRE}: ${error.message}`);
      }

      // Pausa entre llamadas
      if (i < citas.length - 1) {
        io.emit("voz:pausa", {
          segundos: 20,
          mensaje: "Esperando 20 segundos antes de la siguiente llamada..."
        });
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    // Emitir completado
    const reporte = {
      fecha: new Date().toISOString(),
      total: citas.length,
      exitosas,
      fallidas,
      tasa_exito: ((exitosas / citas.length) * 100).toFixed(1) + "%",
      errores
    };

    io.emit("voz:completado", reporte);
    console.log('✅ Todas las llamadas han sido procesadas.');

  } catch (error) {
    console.error('💥 Error al programar llamadas:', error);
    
    if (global.io) {
      global.io.emit("voz:error_fatal", {
        error: error.message
      });
    }

    if (res) {
      res.status(500).json({ 
        error: "Error al programar llamadas",
        details: error.message 
      });
    }
  }
};

module.exports = { programarLlamadasDelDiaSiguiente };