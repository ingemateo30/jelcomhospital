const db = require('../config/db.js');

class cancelacion {
    static async obtenerCitaPendiente(telefono) {
        const [citas] = await db.execute(
            "SELECT * FROM citas WHERE TELEFONO_FIJO = ? AND (ESTADO = 'pendiente' OR ESTADO = 'recordatorio enviado') ORDER BY FECHA_CITA DESC LIMIT 1",
            [telefono]
        );
        return citas[0];
    }

    static async confirmarCita(telefono) {
        await db.execute(
            "UPDATE citas SET ESTADO = 'confirmada' WHERE TELEFONO_FIJO = ? AND (ESTADO = 'pendiente' OR ESTADO = 'recordatorio enviado')",
            [telefono]
        );
    }

    static async cancelarCita(telefono, motivo = 'Cancelado por el paciente', canceladoPor = 'paciente') {
        await db.execute(
            `UPDATE citas
             SET ESTADO = 'cancelada',
                 MOTIVO_CANCELACION = ?,
                 FECHA_CANCELACION = NOW(),
                 CANCELADO_POR = ?
             WHERE TELEFONO_FIJO = ?
             AND (ESTADO = 'pendiente' OR ESTADO = 'recordatorio enviado')`,
            [motivo, canceladoPor, telefono]
        );
    }

    static async reagendarCita(telefono) {
        await db.execute(
            "UPDATE citas SET ESTADO = 'reagendamiento solicitado' WHERE TELEFONO_FIJO = ? AND (ESTADO = 'pendiente' OR ESTADO = 'recordatorio enviado')",
            [telefono]
        );
    }

    static async obtenerCitasCanceladas() {
        const [citas] = await db.execute(
            "SELECT * FROM citas WHERE ESTADO = 'cancelada' ORDER BY FECHA_CITA DESC"
        );
        return citas;
    }
}

module.exports = cancelacion;
