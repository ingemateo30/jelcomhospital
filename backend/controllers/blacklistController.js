const Blacklist = require('../models/Blacklist');

/**
 * Obtener todos los números en la lista negra
 */
exports.obtenerBlacklist = async (req, res) => {
  try {
    const numeros = await Blacklist.obtenerBlacklist();
    res.json({
      success: true,
      data: numeros,
      total: numeros.length
    });
  } catch (error) {
    console.error('Error al obtener blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista negra'
    });
  }
};

/**
 * Agregar un número a la lista negra
 */
exports.agregarABlacklist = async (req, res) => {
  try {
    const { telefono, razon, bloqueadoPor } = req.body;

    // Validar que el teléfono esté presente
    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono es requerido'
      });
    }

    // Limpiar el número de teléfono (eliminar espacios, guiones, etc.)
    const telefonoLimpio = telefono.replace(/[\s\-()]/g, '');

    // Verificar si ya está en la lista negra
    const yaExiste = await Blacklist.estaEnBlacklist(telefonoLimpio);
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        message: 'Este número ya está en la lista negra'
      });
    }

    // Agregar a la blacklist
    const id = await Blacklist.agregarABlacklist(
      telefonoLimpio,
      razon || 'Sin especificar',
      bloqueadoPor || 'Sistema'
    );

    res.status(201).json({
      success: true,
      message: 'Número agregado a la lista negra exitosamente',
      data: {
        id,
        telefono: telefonoLimpio,
        razon: razon || 'Sin especificar',
        bloqueadoPor: bloqueadoPor || 'Sistema'
      }
    });
  } catch (error) {
    console.error('Error al agregar a blacklist:', error);

    if (error.message === 'El número ya está en la lista negra') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al agregar el número a la lista negra'
    });
  }
};

/**
 * Verificar si un número está en la lista negra
 */
exports.verificarBlacklist = async (req, res) => {
  try {
    const { telefono } = req.params;

    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono es requerido'
      });
    }

    const estaBloqueado = await Blacklist.estaEnBlacklist(telefono);

    res.json({
      success: true,
      bloqueado: estaBloqueado,
      telefono
    });
  } catch (error) {
    console.error('Error al verificar blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el número en la lista negra'
    });
  }
};

/**
 * Eliminar un número de la lista negra por ID
 */
exports.eliminarDeBlacklist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID es requerido'
      });
    }

    const filasAfectadas = await Blacklist.eliminarDeBlacklist(id);

    if (filasAfectadas === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el número en la lista negra'
      });
    }

    res.json({
      success: true,
      message: 'Número eliminado de la lista negra exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar de blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el número de la lista negra'
    });
  }
};

/**
 * Eliminar un número de la lista negra por teléfono
 */
exports.eliminarDeBlacklistPorTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;

    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono es requerido'
      });
    }

    const filasAfectadas = await Blacklist.eliminarDeBlacklistPorTelefono(telefono);

    if (filasAfectadas === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el número en la lista negra'
      });
    }

    res.json({
      success: true,
      message: 'Número eliminado de la lista negra exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar de blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el número de la lista negra'
    });
  }
};

/**
 * Actualizar la razón de bloqueo
 */
exports.actualizarBlacklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID es requerido'
      });
    }

    if (!razon) {
      return res.status(400).json({
        success: false,
        message: 'La razón es requerida'
      });
    }

    const filasAfectadas = await Blacklist.actualizarBlacklist(id, razon);

    if (filasAfectadas === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el número en la lista negra'
      });
    }

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el registro'
    });
  }
};
