const db = require("../config/db");
require('dotenv').config();
const axios = require("axios");
const salud360CitasService = require("../services/salud360CitasService");

exports.handleWhatsAppResponse = async (req, res) => {
    try {
        const { data } = req.body;
        const { body, from, to, fromMe, timestamp, id } = data;

        if (!data || !data.from || !data.body) {
            console.error("⚠️ Error: Datos faltantes en la respuesta de UltraMsg", req.body);
            return res.status(400).json({ error: "Datos incompletos en la solicitud" });
        }

        await saveMessage({
            id,
            phone: from.replace("57", "").replace("@c.us", ""),
            body,
            fromMe,
            timestamp: timestamp || new Date().toISOString(),
            status: 'pendiente'
        });

        if (fromMe === true) {
            return res.status(200).json({ message: "Mensaje almacenado (saliente)." });
        }

        const phone = from.replace("57", "").replace("@c.us", "");
        const reminder = await getMessagesByPhone(phone);

        if (!reminder) {
            console.log(`❌ No se encontró recordatorio activo para el número ${phone}`);
            return res.status(200).json({ message: "Mensaje almacenado, sin recordatorio activo." });
        }

        const prueba = await getstatusphone(phone);
        console.log(prueba);
        if (prueba && ["confirmada", "cancelada", "reagendamiento solicitado"].includes(prueba.estado)) {
            const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
            const token = process.env.ULTRAMSG_TOKEN;
            let replyMessage = `🔒 La cita del número ${phone} ya está ${prueba.estado}. No se permite modificar el estado,si se trata de una equivocacion contactanos al #`;
            try {
                await axios.post(
                    `https://api.ultramsg.com/${instanceId}/messages/chat`,
                    { token: token, to: from, body: replyMessage }
                );
                console.log(`🔒 La cita del número ${phone} ya está ${prueba.estado}. No se permite modificar el estado.`);
            } catch (error) {
                console.error(`❌ Error enviando respuesta a ${phone}:`, error);
            }

            return res.status(200).json({ message: `La cita ya ha sido ${prueba.estado} y no se puede cambiar el estado.` });
        }

        const response = body.trim().toLowerCase();
        const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
        const token = process.env.ULTRAMSG_TOKEN;
        let replyMessage = '';
        let newStatus = '';

        const fechaCita = new Date(reminder.FECHA_CITA);
        const fechaFormateada = fechaCita.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        if (response === 'sí' || response === 'si') {
            replyMessage = `Gracias por confirmar tu cita médica para el ${fechaFormateada} a las ${reminder.HORA_CITA}. Te esperamos puntualmente,si quieres cambiar es estado contactanos al #`;
            newStatus = "confirmada";
        } else if (response === 'no' || response === 'cancelar') {
            // Cancelar la cita en Salud360
            console.log(`🔄 Iniciando cancelación en Salud360 para ${phone}`);

            try {
                // Obtener datos del paciente y la cita
                const datosPaciente = {
                    tipoId: reminder.TIPO_IDE_PACIENTE || 'CC',
                    numeroId: reminder.NUMERO_IDE,
                    fecha: new Date(reminder.FECHA_CITA).toISOString().split('T')[0], // YYYY-MM-DD
                    hora: reminder.HORA_CITA // HH:MM:SS
                };

                console.log(`📋 Datos para cancelación:`, datosPaciente);

                // Llamar al servicio de Salud360 para cancelar
                const resultadoCancelacion = await salud360CitasService.buscarYCancelarCita(
                    datosPaciente,
                    'Cancelado por paciente vía WhatsApp'
                );

                if (resultadoCancelacion.success) {
                    console.log(`✅ Cita cancelada en Salud360: CitNum ${resultadoCancelacion.citNum}`);
                    replyMessage = `✅ Tu cita médica para el ${fechaFormateada} a las ${reminder.HORA_CITA} ha sido cancelada exitosamente en el sistema.\n\nSi deseas reagendarla, por favor comunícate con nosotros al #.`;
                    newStatus = "cancelada";

                    // Actualizar también el estado en la tabla citas
                    await updateCitaStatus(reminder.NUMERO_IDE, reminder.FECHA_CITA, reminder.HORA_CITA, 'cancelada');
                } else {
                    console.error(`❌ Error cancelando en Salud360:`, resultadoCancelacion.error);
                    replyMessage = `⚠️ Hemos registrado tu solicitud de cancelación para el ${fechaFormateada} a las ${reminder.HORA_CITA}.\n\nPor favor, confirma la cancelación comunicándote al # para completar el proceso en el sistema.`;
                    newStatus = "cancelada"; // Se marca como cancelada localmente aunque falle en Salud360
                }
            } catch (error) {
                console.error(`❌ Error en proceso de cancelación:`, error.message);
                replyMessage = `⚠️ Hemos registrado tu solicitud de cancelación para el ${fechaFormateada} a las ${reminder.HORA_CITA}.\n\nPor favor, confirma la cancelación comunicándote al # para completar el proceso.`;
                newStatus = "cancelada";
            }
        } else if (response === 'reagendar') {
            replyMessage = `Hemos recibido tu solicitud para reagendar la cita del ${fechaFormateada} a las ${reminder.HORA_CITA}. En breve un asesor se comunicará contigo para coordinar una nueva fecha.`;
            newStatus = "reagendamiento solicitado";
        } else {
            replyMessage = `No hemos podido procesar tu respuesta. Por favor, responde con una de las siguientes opciones:\n✅ "Sí" - Confirmar cita\n❌ "No" - Cancelar cita\n🔄 "Reagendar" - Solicitar cambio de fecha`;
        }

        if (newStatus) {
            try {
                await axios.post(
                    `https://api.ultramsg.com/${instanceId}/messages/chat`,
                    { token: token, to: from, body: replyMessage }
                );

                await updateReminderStatus(phone, newStatus);


                console.log(`✅ Respuesta enviada a ${phone} y estado actualizado a ${newStatus}`);
            } catch (error) {
                console.error(`❌ Error enviando respuesta a ${phone}:`, error);
            }
        }

        res.status(200).json({ message: "Mensaje procesado y almacenado correctamente." });
    } catch (error) {
        console.error("❌ Error procesando respuesta:", error);
        res.status(500).json({ error: "Error al procesar la respuesta." });
    }
};

async function saveMessage({ id, phone, body, fromMe, timestamp, status }) {
    try {
        // Convertimos timestamp en un formato compatible con MySQL
        const fecha = new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");

        // Verificar si ya existe un mensaje similar en la última hora
        const [existingMessages] = await db.execute(
            `SELECT id FROM mensajes 
             WHERE numero = ? 
             AND fecha >= DATE_SUB(?, INTERVAL 1 WEEK) 
             LIMIT 1`,
            [phone,fecha]
        );

        if (existingMessages.length > 0) {
            console.log(`🛑 Mensaje duplicado detectado. No se vuelve a insertar: ${body}`);
            return;
        }

        await db.execute(
            `INSERT INTO mensajes (id,numero, mensaje, fecha, tipo, estado) 
             VALUES (?, ?, ?, ?, ?,?)`,
            [id, phone, body, fecha, fromMe ? 'saliente' : 'entrante', status]
        );

        console.log(`📝 Mensaje almacenado correctamente en BD: ${phone}`);
    } catch (error) {
        console.error("❌ Error al guardar mensaje:", error);
        throw error;
    }
}

async function getMessagesByPhone(phone) {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM citas WHERE TELEFONO_FIJO = ? ORDER BY FECHA_CITA DESC LIMIT 1`,
            [phone]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error al obtener los mensajes por teléfono:", error);
        throw error;
    }
}

async function getstatusphone(phone) {
    try {
        const [rows] = await db.execute(
            `SELECT SQL_NO_CACHE * FROM mensajes WHERE numero = ? ORDER BY fecha DESC LIMIT 1`,
            [phone]
        );
        console.log("Resultado de la consulta:", rows);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error al obtener los mensajes por teléfono:", error);
        throw error;
    }
}

async function updateReminderStatus(phone, newStatus) {
    try {
        const [result] = await db.execute(
            `UPDATE mensajes SET estado = ? WHERE numero = ? ORDER BY fecha DESC LIMIT 1`,
            [newStatus, phone]
        );
        console.log("Filas afectadas por UPDATE:", result.affectedRows);
        console.log(`✅ Estado actualizado para el número ${phone}: ${newStatus}`);
    } catch (error) {
        console.error("Error actualizando estado del mensaje:", error);
        throw error;
    }
}

async function updateCitaStatus(numeroIde, fechaCita, horaCita, newStatus) {
    try {
        const [result] = await db.execute(
            `UPDATE citas
             SET ESTADO = ?
             WHERE NUMERO_IDE = ?
             AND FECHA_CITA = ?
             AND HORA_CITA = ?`,
            [newStatus, numeroIde, fechaCita, horaCita]
        );
        console.log(`✅ Estado de cita actualizado en BD: ${numeroIde} - ${fechaCita} ${horaCita} -> ${newStatus}`);
        console.log("Filas afectadas:", result.affectedRows);
    } catch (error) {
        console.error("Error actualizando estado de la cita:", error);
        throw error;
    }
}
