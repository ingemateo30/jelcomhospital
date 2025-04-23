import axios from "axios";

const API_URL = "http://localhost:3000/api/sms"; 

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
        const response = await axios.get("http://localhost:3000/api/sms/saldo");
        return { success: true, balance: response.data.saldo };
    } catch (error) {
        console.error("Error al obtener el saldo:", error);
        return { success: false, balance: 0, message: "No se pudo obtener el saldo" };
    }
};

