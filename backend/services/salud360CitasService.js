const salud360Client = require('./salud360Client');
require('dotenv').config();

/**
 * Servicio para manejar citas en Salud360
 */
class Salud360CitasService {
  constructor() {
    this.empresaCod = process.env.SALUD360_EMPRESA_COD;
    this.sedeCod = process.env.SALUD360_SEDE_COD;
    this.homsedciucli = process.env.SALUD360_HOMSEDCIUCLI;
  }

  /**
   * Obtiene las próximas citas de un paciente desde Salud360
   * @param {string} tipoId - Tipo de identificación (CC, TI, etc.)
   * @param {string} numeroId - Número de identificación
   * @returns {Promise<Array>} Array de citas
   */
  async obtenerProximasCitas(tipoId, numeroId) {
    try {
      console.log(`[Salud360Citas] Consultando próximas citas para ${tipoId} ${numeroId}`);

      const params = {
        Homsedciucli: this.homsedciucli,
        Pactipidecod: tipoId,
        Pacnumide: numeroId
      };

      const response = await salud360Client.executeMethod(
        'awsproximascitas',
        'Execute',
        params
      );

      const result = salud360Client.handleResponse(response);

      if (!result.success) {
        console.error(`[Salud360Citas] Error al consultar citas:`, result.error);
        return {
          success: false,
          error: result.error,
          citas: []
        };
      }

      // Parse del JSON de citas
      let citas = [];
      try {
        if (response.Sdtproxcitasjson) {
          citas = JSON.parse(response.Sdtproxcitasjson);
          if (!Array.isArray(citas)) {
            citas = [citas];
          }
        }
      } catch (parseError) {
        console.error(`[Salud360Citas] Error parseando JSON de citas:`, parseError.message);
      }

      console.log(`[Salud360Citas] Se encontraron ${citas.length} citas próximas`);

      return {
        success: true,
        citas: citas.map(cita => ({
          citEmpCod: cita.CitEmpCod,
          citNum: cita.CitNum, // ← Este es el número que necesitamos para cancelar
          citSedCod: cita.CitSedCod,
          citSedNom: cita.CitSedNom,
          citSedDir: cita.CitSedDir,
          citFec: cita.CitFec,
          citHor: cita.CitHor,
          citTipAgeNro: cita.CitTipAgeNro,
          citTipAgeNom: cita.CitTipAgeNom,
          citMedCod: cita.CitMedCod,
          citMedNomCom: cita.CitMedNomCom
        }))
      };
    } catch (error) {
      console.error(`[Salud360Citas] Error obteniendo próximas citas:`, error.message);
      return {
        success: false,
        error: error.message,
        citas: []
      };
    }
  }

  /**
   * Busca una cita específica por fecha y hora
   * @param {string} tipoId - Tipo de identificación
   * @param {string} numeroId - Número de identificación
   * @param {string} fecha - Fecha de la cita (YYYY-MM-DD)
   * @param {string} hora - Hora de la cita (HH:MM:SS)
   * @returns {Promise<Object>} Cita encontrada o null
   */
  async buscarCitaPorFechaHora(tipoId, numeroId, fecha, hora) {
    try {
      console.log(`[Salud360Citas] Buscando cita para ${fecha} ${hora}`);

      const resultado = await this.obtenerProximasCitas(tipoId, numeroId);

      if (!resultado.success || resultado.citas.length === 0) {
        return {
          success: false,
          error: 'No se encontraron citas para este paciente',
          cita: null
        };
      }

      // Buscar la cita que coincida con fecha y hora
      const citaEncontrada = resultado.citas.find(cita => {
        // Normalizar fechas para comparación
        const citaFecha = cita.citFec.split('T')[0]; // YYYY-MM-DD

        // Normalizar hora (puede venir como 0001-01-01THH:MM:SS)
        let citaHora = '';
        if (cita.citHor.includes('T')) {
          citaHora = cita.citHor.split('T')[1].substring(0, 8); // HH:MM:SS
        } else {
          citaHora = cita.citHor.substring(0, 8);
        }

        // Normalizar hora de búsqueda
        const horaBusqueda = hora.length === 5 ? `${hora}:00` : hora;

        console.log(`[Salud360Citas] Comparando: ${citaFecha} === ${fecha} && ${citaHora} === ${horaBusqueda}`);

        return citaFecha === fecha && citaHora === horaBusqueda;
      });

      if (!citaEncontrada) {
        console.log(`[Salud360Citas] No se encontró cita para ${fecha} ${hora}`);
        return {
          success: false,
          error: `No se encontró cita para la fecha ${fecha} a las ${hora}`,
          cita: null
        };
      }

      console.log(`[Salud360Citas] Cita encontrada: CitNum ${citaEncontrada.citNum}`);

      return {
        success: true,
        cita: citaEncontrada
      };
    } catch (error) {
      console.error(`[Salud360Citas] Error buscando cita:`, error.message);
      return {
        success: false,
        error: error.message,
        cita: null
      };
    }
  }

  /**
   * Cancela una cita en Salud360
   * @param {number} citNum - Número de cita
   * @param {string} motivo - Motivo de cancelación
   * @returns {Promise<Object>} Resultado de la cancelación
   */
  async cancelarCita(citNum, motivo = 'Cancelado por WhatsApp') {
    try {
      console.log(`[Salud360Citas] Cancelando cita ${citNum}`);

      const params = {
        Citempcod: parseInt(this.empresaCod),
        Citnum: parseInt(citNum),
        Citobscan: motivo
      };

      const response = await salud360Client.executeMethod(
        'awscancelarcita',
        'Execute',
        params
      );

      const result = salud360Client.handleResponse(response);

      if (!result.success) {
        console.error(`[Salud360Citas] Error al cancelar cita:`, result.error);
        return {
          success: false,
          error: result.error,
          mensaje: result.resultado
        };
      }

      console.log(`[Salud360Citas] Cita ${citNum} cancelada exitosamente`);

      return {
        success: true,
        mensaje: result.resultado,
        citNum
      };
    } catch (error) {
      console.error(`[Salud360Citas] Error cancelando cita:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Flujo completo: Busca y cancela una cita por datos del paciente
   * @param {Object} datosPaciente - Datos del paciente
   * @param {string} datosPaciente.tipoId - Tipo de identificación
   * @param {string} datosPaciente.numeroId - Número de identificación
   * @param {string} datosPaciente.fecha - Fecha de la cita (YYYY-MM-DD)
   * @param {string} datosPaciente.hora - Hora de la cita (HH:MM:SS o HH:MM)
   * @param {string} motivo - Motivo de cancelación
   * @returns {Promise<Object>} Resultado del proceso
   */
  async buscarYCancelarCita(datosPaciente, motivo = 'Cancelado por WhatsApp') {
    try {
      console.log(`[Salud360Citas] Iniciando proceso de búsqueda y cancelación`);

      // 1. Buscar la cita
      const resultadoBusqueda = await this.buscarCitaPorFechaHora(
        datosPaciente.tipoId,
        datosPaciente.numeroId,
        datosPaciente.fecha,
        datosPaciente.hora
      );

      if (!resultadoBusqueda.success) {
        return {
          success: false,
          error: resultadoBusqueda.error,
          paso: 'busqueda'
        };
      }

      // 2. Cancelar la cita
      const resultadoCancelacion = await this.cancelarCita(
        resultadoBusqueda.cita.citNum,
        motivo
      );

      if (!resultadoCancelacion.success) {
        return {
          success: false,
          error: resultadoCancelacion.error,
          paso: 'cancelacion',
          citaEncontrada: resultadoBusqueda.cita
        };
      }

      return {
        success: true,
        mensaje: 'Cita cancelada exitosamente',
        cita: resultadoBusqueda.cita,
        citNum: resultadoCancelacion.citNum
      };
    } catch (error) {
      console.error(`[Salud360Citas] Error en proceso de cancelación:`, error.message);
      return {
        success: false,
        error: error.message,
        paso: 'general'
      };
    }
  }
}

module.exports = new Salud360CitasService();
