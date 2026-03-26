import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/sms`;

export const sendReminderSMS = async () => {
    try {
        const response = await axios.post(`${API_URL}/enviar`);
        return response.data;
    } catch (error) {
        console.error("Error al enviar SMS:", error);
        throw error.response ? error.response.data : { message: "Error desconocido" };
    }
};

export const getSMSBalance = async () => {
    try {
        const response = await axios.get(`${API_URL}/saldo`);
        return { success: true, balance: response.data.saldo };
    } catch (error) {
        console.error("Error al obtener el saldo:", error);
        return { success: false, balance: 0, message: "No se pudo obtener el saldo" };
    }
};
