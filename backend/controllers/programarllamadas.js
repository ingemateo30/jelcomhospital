const { iniciarLlamada } = require('../config/twilioConfig');
const pool = require('../config/db');

const programarLlamadasDelDiaSiguiente = async () => {
  try {
    const fechaManana = new Date();
    fechaManana.setDate(fechaManana.getDate() + 1);
    const fechaFormateada = fechaManana.toISOString().split('T')[0];

    const [citas] = await pool.query(
      `SELECT ID, TELEFONO_FIJO 
       FROM citas 
       WHERE DATE(FECHA_CITA) = ? 
         AND estado_llamada IS NULL 
         AND intentos_llamada < 3`,
      [fechaFormateada]
    );

    console.log(`📅 ${citas.length} llamadas programadas para ${fechaFormateada}`);

    let index = 0;

    const ejecutarLlamadas = async () => {
      if (index >= citas.length) {
        console.log('✅ Todas las llamadas han sido programadas.');
        return;
      }

      const cita = citas[index];
      console.log(`⏱️ Llamando a: ${cita.TELEFONO_FIJO} (ID cita: ${cita.ID})`);

      try {
        await iniciarLlamada(cita.TELEFONO_FIJO, cita.ID);
      } catch (error) {
        console.error(`❌ Error en llamada ID ${cita.ID}:`, error.message);
      }

      index++;
      setTimeout(ejecutarLlamadas, 3000);
    };

    ejecutarLlamadas();

  } catch (error) {
    console.error('💥 Error al programar llamadas:', error);
  }
};

if (require.main === module) {
  programarLlamadasDelDiaSiguiente();
}

module.exports = { programarLlamadasDelDiaSiguiente };
