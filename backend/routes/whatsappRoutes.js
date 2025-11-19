const express = require("express");
const { sendWhatsAppReminder, processWhatsAppReply, getResponses, getCitasCanceladas }  = require("../controllers/whatsappController");
const {handleWhatsAppResponse }  = require("../controllers/chatbotController");

const router = express.Router();

router.get("/enviar-recordatorios", sendWhatsAppReminder);

router.post("/webhook-ultramsg", handleWhatsAppResponse);

router.get("/respuestas", getResponses);

router.get("/citas-canceladas", getCitasCanceladas);

module.exports = router;
