import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/config`;

export const getAllConfigs = async () => {
    try {
        const response = await axios.get(`${API_URL}/`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener configuraciones:", error);
        throw error;
    }
};

export const getConfigByKey = async (key) => {
    try {
        const response = await axios.get(`${API_URL}/${key}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener configuración ${key}:`, error);
        throw error;
    }
};

export const updateConfig = async (key, value) => {
    try {
        const response = await axios.post(`${API_URL}/update`, { key, value });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar configuración:", error);
        throw error;
    }
};
