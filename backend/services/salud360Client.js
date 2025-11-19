const soap = require('soap');
require('dotenv').config();

/**
 * Cliente SOAP genérico para los WebServices de Salud360
 */
class Salud360Client {
  constructor() {
    this.baseUrl = process.env.SALUD360_BASE_URL;
    this.usuario = process.env.SALUD360_USER;
    this.password = process.env.SALUD360_PASS;
    this.empresaCod = process.env.SALUD360_EMPRESA_COD;
    this.sedeCod = process.env.SALUD360_SEDE_COD;
    this.homsedciucli = process.env.SALUD360_HOMSEDCIUCLI;
  }

  /**
   * Crea un cliente SOAP para el servicio especificado
   * @param {string} serviceName - Nombre del servicio (ej: 'awsproximascitas')
   * @returns {Promise<Object>} Cliente SOAP
   */
  async createClient(serviceName) {
    try {
      const wsdlUrl = `${this.baseUrl}${serviceName}?wsdl`;
      console.log(`[Salud360] Conectando a: ${wsdlUrl}`);

      const client = await soap.createClientAsync(wsdlUrl, {
        disableCache: true,
        endpoint: `${this.baseUrl}${serviceName}`
      });

      console.log(`[Salud360] Cliente SOAP creado para: ${serviceName}`);
      return client;
    } catch (error) {
      console.error(`[Salud360] Error creando cliente SOAP para ${serviceName}:`, error.message);
      throw new Error(`No se pudo conectar al servicio ${serviceName}: ${error.message}`);
    }
  }

  /**
   * Ejecuta un método del WebService de Salud360
   * @param {string} serviceName - Nombre del servicio
   * @param {string} methodName - Nombre del método (ej: 'Execute')
   * @param {Object} params - Parámetros del método
   * @returns {Promise<Object>} Respuesta del servicio
   */
  async executeMethod(serviceName, methodName, params) {
    try {
      const client = await this.createClient(serviceName);

      // Agregar credenciales a los parámetros
      const paramsWithAuth = {
        ...params,
        Usulog: this.usuario,
        Usupas: this.password
      };

      console.log(`[Salud360] Ejecutando ${serviceName}.${methodName} con params:`,
        JSON.stringify(paramsWithAuth, null, 2));

      const [result] = await client[`${methodName}Async`](paramsWithAuth);

      console.log(`[Salud360] Respuesta de ${serviceName}.${methodName}:`,
        JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error(`[Salud360] Error ejecutando ${serviceName}.${methodName}:`, error.message);
      throw error;
    }
  }

  /**
   * Maneja los errores de Salud360
   * @param {Object} response - Respuesta del servicio
   * @returns {Object} Respuesta procesada o error
   */
  handleResponse(response) {
    const codigo = response.Codigo;
    const resultado = response.Resultado;

    // Códigos de éxito
    if (codigo === 'S01') {
      return {
        success: true,
        codigo,
        resultado,
        data: response
      };
    }

    // Códigos de error
    const errorMessages = {
      'S02': 'Usuario o contraseña incorrecta',
      'S03': 'Código de Ciudad no existe o Cita Inexistente o Paciente no encontrado',
      'S04': 'Paciente no encontrado o No se encontraron citas',
      'S05': 'Error WS Salud: Paciente no encontrado',
      'S06': 'Convenio no existe para la ciudad seleccionada',
      'S07': 'Tipo Servicio no existe para el contrato, o no aplica para el paciente',
      'S08': 'Código de Empresa - Sede no existe',
      'S09': 'Jornada debe ser AM, PM o vacío',
      'S10': 'La cita ya se encuentra asignada',
      'S11': 'El paciente ya tiene una cita asignada a la misma hora'
    };

    return {
      success: false,
      codigo,
      resultado,
      error: errorMessages[codigo] || resultado
    };
  }
}

module.exports = new Salud360Client();
