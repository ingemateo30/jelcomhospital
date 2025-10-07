import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api/whatsapp";
export const sendWhatsAppReminders = async () => {
  try {
    const response = await axios.get(`${API_URL}/enviar-recordatorios`);
    return response.data;
  } catch (error) {
    console.error("Error enviando recordatorios de WhatsApp:", error);
    throw error;
  }
};
/*
export const getResponses = async () => {
    try {
      const response = await axios.get(`${API_URL}/mensajes`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo respuestas de WhatsApp:", error);
      return [];
    }
  };
*/