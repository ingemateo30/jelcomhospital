const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const db = require("../config/db");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, "citas_" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
const procesarExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se ha subido ningún archivo" });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        for (const row of data) {
            let {
                ATENCION,
                FECHA_CITA,
                HORA_CITA,
                SERVICIO,
                PROFESIONAL,
                TIPO_IDE_PACIENTE,
                NUMERO_IDE,
                NOMBRE,
                TELEFONO_FIJO
            } = row;

            if (!NUMERO_IDE || !NOMBRE || !FECHA_CITA || !HORA_CITA) {
                console.warn(`Fila con datos incompletos:`, row);
                continue;
            }
            NUMERO_IDE = NUMERO_IDE.toString().trim();
            TELEFONO_FIJO = TELEFONO_FIJO ? TELEFONO_FIJO.toString().trim() : null;

            if (!/^\d+$/.test(NUMERO_IDE)) {
                console.warn(`Número de identificación inválido en fila:`, row);
                continue;
            }

            if (TELEFONO_FIJO && !/^\d{7,10}$/.test(TELEFONO_FIJO)) {
                console.warn(`Teléfono inválido en fila:`, row);
                TELEFONO_FIJO = null;
            }

            if (FECHA_CITA) {
                if (typeof FECHA_CITA === "number") {
                    const excelDate = new Date((FECHA_CITA - 25569) * 86400 * 1000);
                    FECHA_CITA = excelDate.toISOString().split("T")[0];
                } else {
                    const [day, month, year] = FECHA_CITA.split("/");
                    FECHA_CITA = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                }
            }

            if (HORA_CITA) {
                if (typeof HORA_CITA === "number") {
                    let totalSeconds = Math.round(HORA_CITA * 86400);
                    let hours = Math.floor(totalSeconds / 3600);
                    let minutes = Math.floor((totalSeconds % 3600) / 60);
                    let seconds = totalSeconds % 60;
                    HORA_CITA = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
                } else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(HORA_CITA)) {
                    HORA_CITA = HORA_CITA.padEnd(8, ":00");
                } else {
                    HORA_CITA = null;
                }
            }

            try {
                await db.query(
                    `INSERT INTO CITAS (
                        ATENCION, 
                        FECHA_CITA, 
                        HORA_CITA, 
                        SERVICIO, 
                        PROFESIONAL, 
                        TIPO_IDE_PACIENTE, 
                        NUMERO_IDE, 
                        NOMBRE, 
                        TELEFONO_FIJO,
                        EMAIL,
                        ESTADO
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pendiente')`,
                    [ATENCION, FECHA_CITA, HORA_CITA, SERVICIO, PROFESIONAL, TIPO_IDE_PACIENTE, NUMERO_IDE, NOMBRE, TELEFONO_FIJO]
                );
            } catch (dbError) {
                console.error("Error al insertar en la base de datos:", dbError);
                continue;
            }
        }

        res.json({ message: "Archivo procesado y datos almacenados correctamente" });
    } catch (error) {
        console.error("Error al procesar el archivo:", error);
        res.status(500).json({ message: "Error al procesar el archivo" });
    }
};

module.exports = { upload, procesarExcel };