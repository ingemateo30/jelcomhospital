const db = require("../config/db");

class WhatsAppReminder {
  static async getRemindersForTomorrow() {
    try {
        await db.execute("SET lc_time_names = 'es_ES';");
        const [rows] = await db.execute(`
          SELECT ID AS id, TELEFONO_FIJO AS telefono, NOMBRE AS nombre_paciente, DATE_FORMAT(FECHA_CITA, '%W %d de %M de %Y') AS fecha, DATE_FORMAT(HORA_CITA, '%h:%i %p') AS hora, SERVICIO AS servicio,PROFESIONAL as profesional FROM citas WHERE DATE(FECHA_CITA) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND ESTADO = 'pendiente'; 
          `);
      return rows;
    } catch (error) {
      console.error("❌ Error obteniendo citas:", error);
      throw error;
    }
  }

  static async updateReminderStatus(id, estado) {
    try {
      await db.execute(
        `UPDATE citas SET ESTADO = ? WHERE ID = ?`,
        [estado, id]
      );
      console.log(`🔄 Estado actualizado a "${estado}" para la cita con ID: ${id}`);
    } catch (error) {
      console.error(`❌ Error actualizando estado de la cita ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = WhatsAppReminder;




