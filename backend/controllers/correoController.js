const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const db = require("../config/db");
const cron = require("node-cron");
const moment = require("moment-timezone");

dotenv.config();

const CRON_HORA_EJECUCION = "08:00";

let estadoCron = {
    ultimaEjecucion: null,
    totalEnviados: 0,
    totalErrores: 0,
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


exports.enviarRecordatoriosDiarios = async (req, res) => {
    try {
        console.log("📩 Iniciando envío de recordatorios...");
        const fechaManana = moment().tz("America/Bogota").add(1, "day").format("YYYY-MM-DD");

        console.log("📅 Buscando citas para la fecha:", fechaManana);

        const [citas] = await db.query(
            `SELECT ID, NOMBRE, EMAIL, PROFESIONAL, SERVICIO, FECHA_CITA as fecha, HORA_CITA as hora 
            FROM citas 
            WHERE FECHA_CITA = ?
            AND estado != 'recordatorio enviado' 
            AND email IS NOT NULL 
            AND email NOT LIKE '%@temporal.com'`,
            [fechaManana]
        );

        if (citas.length === 0) {
            console.log("✅ No hay citas con correos válidos.");
            estadoCron = { ultimaEjecucion: new Date(), totalEnviados: 0, totalErrores: 0 };
            if (!req.fake) return res.json({ message: "No hay citas pendientes." });
            return;
        }

        let recordatoriosEnviados = [];
        let errores = [];

        // Función para enviar una tanda de correos
        const enviarTandaCorreos = async (tanda) => {
            const promesas = tanda.map(async (cita) => {
                try {
                    if (!isValidEmail(cita.EMAIL)) {
                        errores.push({ citaId: cita.ID, error: "Formato de correo inválido" });
                        return null;
                    }

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: cita.EMAIL,
                        subject: "Recordatorio Cita Médica Hospital Regional de Sangil",
                        html: generarHtmlRecordatorio(cita.NOMBRE, cita.fecha, cita.hora, cita.SERVICIO),
                    });

                    await db.query("UPDATE citas SET estado = 'recordatorio enviado' WHERE ID = ?", [cita.ID]);
                    return cita.ID;
                } catch (error) {
                    console.error(`❌ Error en cita ${cita.ID}:`, error);
                    errores.push({ citaId: cita.ID, error: error.message });
                    return null;
                }
            });

            const resultados = await Promise.allSettled(promesas);
            return resultados
                .filter(resultado => resultado.status === 'fulfilled' && resultado.value !== null)
                .map(resultado => resultado.value);
        };

        for (let i = 0; i < citas.length; i += 10) {
            const tanda = citas.slice(i, i + 10);
            console.log(`📧 Enviando tanda ${Math.floor(i/10) + 1} de correos...`);
            
            const enviadosEnTanda = await enviarTandaCorreos(tanda);
            recordatoriosEnviados.push(...enviadosEnTanda);

            if (i + 10 < citas.length) {
                console.log("⏳ Esperando 30 segundos antes de la próxima tanda...");
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }

        console.log("📩 Proceso de envío finalizado.");
        estadoCron = {
            ultimaEjecucion: new Date(),
            totalEnviados: recordatoriosEnviados.length,
            totalErrores: errores.length,
        };

        if (!req.fake) return res.json({ 
            message: "Envío de recordatorios completado.", 
            estadoCron,
            errores
        });
    } catch (error) {
        console.error("❌ Error en el proceso de recordatorios:", error);
        if (!req.fake) return res.status(500).json({ 
            message: "Error al enviar recordatorios.", 
            error: error.message 
        });
    }
};


exports.obtenerEstadoCron = (req, res) => {
    const ahora = moment().tz("America/Bogota");
    let proximaEjecucion = ahora.clone().startOf("day").add(8, "hours");

    if (ahora.isAfter(proximaEjecucion)) {
        proximaEjecucion.add(1, "day");
    }

    const tiempoRestante = moment.duration(proximaEjecucion.diff(ahora));
    const tiempoRestanteEnSegundos = tiempoRestante.asSeconds();

    console.log("Tiempo restante en segundos (backend):", tiempoRestanteEnSegundos);

    res.json({
        ultimaEjecucion: estadoCron.ultimaEjecucion ? estadoCron.ultimaEjecucion.toISOString() : "Aún no ejecutado",
        proximaEjecucion: proximaEjecucion.toISOString(),
        tiempoRestante: `${tiempoRestante.hours()}h ${tiempoRestante.minutes()}m ${tiempoRestante.seconds()}s`,
        tiempoRestanteEnSegundos: Math.max(0, tiempoRestanteEnSegundos),
        totalEnviados: estadoCron.totalEnviados,
        totalErrores: estadoCron.totalErrores,
    });
};


cron.schedule(
    "0 8 * * *",
    async () => {
        console.log("⏳ Ejecutando el envío automático de correos...");
        await exports.enviarRecordatoriosDiarios({ body: {} }, { json: () => { } });
    },
    {
        timezone: "America/Bogota",
    }
);


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function generarHtmlRecordatorio(nombre, fecha, hora, profesional) {
    const horaFormateada = formatearHoraAMPM(hora);
    return `
       <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-Mailer" content="Microsoft Outlook 16.0">
        <title>Recordatorio de Cita</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #444444;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">
            <div style="background: #007bff; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 15px 0 0 0; font-size: 24px;">Recordatorio de Cita</h1>
            </div>
            <div style="padding: 30px 25px;">
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola ${nombre},</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">📅 Detalles de tu cita:</h3>
                    <ul style="padding-left: 20px; margin: 10px 0;">
                        <li style="margin-bottom: 8px;">
                            <strong style="color: #007bff;">Fecha:</strong> 
                            ${moment(fecha).format("dddd, D [de] MMMM [de] YYYY")}
                        </li>
                        <li style="margin-bottom: 8px;">
                            <strong style="color: #007bff;">Hora:</strong> 
                            ${horaFormateada} (Hora local)
                        </li>
                        <li style="margin-bottom: 8px;">
                            <strong style="color: #007bff;">Especialidad:</strong> 
                            ${profesional}
                        </li>
                    </ul>
                </div> 
                <div style="border-top: 2px solid #eee; padding-top: 20px;">
                    <p style="font-size: 14px; color: #6c757d;">
                        ⚠️ Por favor:
                        <ul style="font-size: 14px; color: #6c757d; padding-left: 20px;">
                            <li>Llegar 15 minutos antes</li>
                            <li>Traer documentos requeridos</li>
                            <li>Usar mascarilla si es necesario</li>
                            <li>Contactanos para reprogramar la cita medica</li>
                        </ul>
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
                    Si tienes dudas o deseas reprogramar tu cita, contáctanos:<br>
                    📞 <a href="tel:+57123456789" style="color: #007bff; text-decoration: none;">numero</a> | 
                    ✉️ <a href="mailto:msalazar5@udi.edu.co" style="color: #007bff; text-decoration: none;">msalazar5@udi.edu.co</a>
                </p>
                <p style="margin: 5px 0; font-size: 10px; color: #999;">CARRERA 5 9 102, SAN GIL, Santander <br>
                    <a href="https://hospital-regional-de-san-gil.micolombiadigital.gov.co/sites/hospital-regional-de-san-gil/content/files/000006/269_politicaprotecciondedatospersonales.pdf" style="color: #6c757d; text-decoration: none;">Política de Proteccion de datos</a> | 
                    <a href="[URL_CANCELAR_SUSCRIPCION]" style="color: #6c757d; text-decoration: none;">Cancelar suscripción</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function formatearHoraAMPM(horaString) {
    if (!/^\d{1,2}:\d{2}$/.test(horaString)) {
        console.error('Formato de hora inválido. Usar "HH:mm"');
        return horaString;
    }

    const [horas, minutos] = horaString.split(':').map(Number);
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = (horas % 12) || 12;

    return `${horas12}:${String(minutos).padStart(2, '0')} ${periodo}`;
}

exports.sendManualEmail = async (req, res) => {
    console.log('Datos recibidos:', req.body);
    const { nombre, correo, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
        return res.status(400).json({ success: false, message: "Nombre, correo y contenido son requeridos" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: "Recordatorio cita medica",
            html: `
            <!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-Mailer" content="Microsoft Outlook 16.0">
    <title>Recordatorio de Cita</title>
</head>

<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #444444;">
    <!-- Contenedor principal -->
    <div
        style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background: #007bff; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 15px 0 0 0; font-size: 24px;">Recordatorio de Cita</h1>
        </div>

        <!-- Contenido -->
        <div style="padding: 30px 25px;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola ${nombre},</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">📅 Detalles de tu cita:</h3>
                <p style="font-size: 16px; line-height: 1.6; margin: 10px 0; color: #2c3e50; font-weight: 400;">${mensaje}</p>
            </div> <!-- Información importante -->
            <div style="border-top: 2px solid #eee; padding-top: 20px;">
                <p style="font-size: 14px; color: #6c757d;">
                    ⚠️ Por favor:
                <ul style="font-size: 14px; color: #6c757d; padding-left: 20px;">
                    <li>Llegar 15 minutos antes</li>
                    <li>Traer documentos requeridos</li>
                    <li>Usar mascarilla si es necesario</li>
                    <li>Contactanos para reprogramar la cita medica</li>
                </ul>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
                Si tienes dudas o deseas reprogramar tu cita, contáctanos:<br>
                📞 <a href="tel:+573007015239" style="color: #007bff; text-decoration: none;">3007015239</a> |
                ✉️ <a href="mailto:msalazar5@udi.edu.co"
                    style="color: #007bff; text-decoration: none;">msalazar5@udi.edu.co</a>
            </p>
            <p style="margin: 5px 0; font-size: 10px; color: #999;">CARRERA 5 9 102, SAN GIL, Santander <br>
                <a href="[URL_PRIVACIDAD]" style="color: #6c757d; text-decoration: none;">Política de Privacidad</a> |
                <a href="[URL_CANCELAR_SUSCRIPCION]" style="color: #6c757d; text-decoration: none;">Cancelar
                    suscripción</a>
            </p>
        </div>
    </div>
</body>

</html>
            `
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: `Correo enviado a ${correo}` });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ message: "Error interno al procesar la solicitud." });
    }
};

