const express = require("express");
const {
  sendWhatsAppReminder,
  processWhatsAppReply,
  getResponses,
  getCitasCanceladas,
  verifyWebhook,
  handleMetaWebhook,
  getChats,
  getChatMessages,
  markMessagesAsRead,
  togglePinChat,
  getFiltersData
} = require("../controllers/whatsappController");
const { handleWhatsAppResponse } = require("../controllers/chatbotController");

const router = express.Router();

// Envío de recordatorios
router.get("/enviar-recordatorios", sendWhatsAppReminder);

// Webhook de UltraMsg (legacy)
router.post("/webhook-ultramsg", handleWhatsAppResponse);

// Webhook de Meta API (nuevo)
router.get("/webhook-meta", verifyWebhook);  // Para verificación de Meta
router.post("/webhook-meta", handleMetaWebhook);  // Para recibir mensajes

// Respuestas y citas canceladas
router.get("/respuestas", getResponses);
router.get("/citas-canceladas", getCitasCanceladas);

// Chats - Lista y mensajes individuales
router.get("/chats", getChats);  // Lista de chats con filtro opcional ?filter=cancelled|active|all
router.get("/chats/:numero", getChatMessages);  // Mensajes de un chat específico
router.put("/chats/:numero/marcar-leido", markMessagesAsRead);  // Marcar mensajes como leídos
router.put("/chats/:numero/pin", togglePinChat);  // Anclar/desanclar chat

// Filtros - Obtener servicios y profesionales
router.get("/filters", getFiltersData);  // Lista de servicios y profesionales para filtros

module.exports = router;
