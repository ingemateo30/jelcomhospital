const db = require('../config/db.js');

/**
 * Agregar un número a la lista negra
 * @param {string} telefono - Número de teléfono a bloquear
 * @param {string} razon - Razón del bloqueo
 * @param {string} bloqueadoPor - Usuario que realiza el bloqueo
 */
const agregarABlacklist = async (telefono, razon = null, bloqueadoPor = null) => {
  try {
    const [result] = await db.query(
      'INSERT INTO blacklist (telefono, razon, bloqueado_por) VALUES (?, ?, ?)',
      [telefono, razon, bloqueadoPor]
    );
    return result.insertId;
  } catch (error) {
    // Si el error es por duplicado, lanzar error específico
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('El número ya está en la lista negra');
    }
    console.error('Error al agregar a blacklist:', error);
    throw error;
  }
};

/**
 * Obtener todos los números en la lista negra
 */
const obtenerBlacklist = async () => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM blacklist ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener blacklist:', error);
    throw error;
  }
};

/**
 * Verificar si un número está en la lista negra
 * @param {string} telefono - Número de teléfono a verificar
 */
const estaEnBlacklist = async (telefono) => {
  try {
    // Limpiar el número de caracteres especiales para comparación
    const telefonoLimpio = telefono.replace(/\D/g, '');

    const [rows] = await db.query(
      'SELECT * FROM blacklist WHERE REPLACE(telefono, " ", "") LIKE ? OR REPLACE(telefono, " ", "") LIKE ?',
      [`%${telefonoLimpio}%`, `%${telefonoLimpio.slice(-10)}%`]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error al verificar blacklist:', error);
    throw error;
  }
};

/**
 * Eliminar un número de la lista negra por ID
 * @param {number} id - ID del registro en la blacklist
 */
const eliminarDeBlacklist = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM blacklist WHERE id = ?', [id]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar de blacklist:', error);
    throw error;
  }
};

/**
 * Eliminar un número de la lista negra por teléfono
 * @param {string} telefono - Número de teléfono
 */
const eliminarDeBlacklistPorTelefono = async (telefono) => {
  try {
    const [result] = await db.query('DELETE FROM blacklist WHERE telefono = ?', [telefono]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar de blacklist por teléfono:', error);
    throw error;
  }
};

/**
 * Actualizar un registro de la blacklist
 * @param {number} id - ID del registro
 * @param {string} razon - Nueva razón
 */
const actualizarBlacklist = async (id, razon) => {
  try {
    const [result] = await db.query(
      'UPDATE blacklist SET razon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [razon, id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar blacklist:', error);
    throw error;
  }
};

module.exports = {
  agregarABlacklist,
  obtenerBlacklist,
  estaEnBlacklist,
  eliminarDeBlacklist,
  eliminarDeBlacklistPorTelefono,
  actualizarBlacklist
};
