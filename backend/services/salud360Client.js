const soap = require('soap');
const path = require('path');
const fs = require('fs');
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
    this.wsdlDir = path.join(__dirname, '..', 'wsdl');
  }

  /**
   * Crea un cliente SOAP para el servicio especificado.
   * Usa WSDL local si existe, si no intenta descargarlo de la red.
   */
  async createClient(serviceName) {
    const localWsdlPath = path.join(this.wsdlDir, `${serviceName}.wsdl`);
    const remoteWsdlUrl = `${this.baseUrl}${serviceName}?wsdl`;
    const endpoint = `${this.baseUrl}${serviceName}`;

    const useLocal = fs.existsSync(localWsdlPath);
    const wsdlSource = useLocal ? localWsdlPath : remoteWsdlUrl;

    console.log(`[Salud360] Cargando WSDL ${useLocal ? 'LOCAL' : 'REMOTO'}: ${wsdlSource}`);

    try {
      const client = await soap.createClientAsync(wsdlSource, {
        disableCache: true,
        endpoint,
      });
      console.log(`[Salud360] Cliente SOAP creado para: ${serviceName}`);
      return client;
    } catch (error) {
      const aggregateErrors = error?.cause?.errors || error?.errors || [];
      const detail = error?.cause?.message || error?.response?.body || error?.stack || error?.message || String(error);

      console.error(`[Salud360] Error creando cliente SOAP para ${serviceName}:`);
      console.error(`   Tipo: ${error?.constructor?.name}`);
      console.error(`   Mensaje: ${error?.message}`);
      console.error(`   Código: ${error?.code}`);
      console.error(`   Detalle: ${detail}`);
      aggregateErrors.forEach((e, i) => {
        console.error(`   Error[${i}]: ${e?.constructor?.name} - código=${e?.code} - ${e?.message}`);
      });

      // Si falló con WSDL local, no hay fallback útil
      if (useLocal) {
        throw new Error(`Fallo al crear cliente SOAP desde WSDL local (${serviceName}): ${error?.message}`);
      }
      throw new Error(`No se pudo conectar al servicio ${serviceName}: ${error?.message || String(error)}`);
    }
  }

  /**
   * Ejecuta un método del WebService de Salud360
   */
  async executeMethod(serviceName, methodName, params) {
    try {
      const client = await this.createClient(serviceName);

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
   */
  handleResponse(response) {
    const codigo = response.Codigo;
    const resultado = response.Resultado;

    if (codigo === 'S01') {
      return { success: true, codigo, resultado, data: response };
    }

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
