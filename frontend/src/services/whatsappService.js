import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/whatsapp`;

export const sendWhatsAppReminders = async () => {
  try {
    const response = await axios.get(`${API_URL}/enviar-recordatorios`);
    return response.data;
  } catch (error) {
    console.error("Error enviando recordatorios de WhatsApp:", error);
    throw error;
  }
};

export const getResponses = async () => {
  try {
    const response = await axios.get(`${API_URL}/respuestas`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo respuestas de WhatsApp:", error);
    return [];
  }
};

export const getCitasCanceladas = async () => {
  try {
    const response = await axios.get(`${API_URL}/citas-canceladas`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo citas canceladas:", error);
    return [];
  }
};
