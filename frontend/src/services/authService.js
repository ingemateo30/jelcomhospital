import axios from "axios";

const API_URL = "http://localhost:3001/api/auth";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    console.log("Respuesta del servidor:", response.data);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("rol", response.data.rol);
      localStorage.setItem("estado", response.data.estado);
    }

    return response.data;
  } catch (error) {
    return { error: error.response?.data?.message || "Error en la autenticación" };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUserRole = () => {
  return localStorage.getItem("rol") || null;
};
export const solicitarRecuperacion = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    return { error: error.response?.data?.message || "Error al solicitar recuperación" };
  }
};
export const resetearPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
    return response.data;
  } catch (error) {
    return { error: error.response?.data?.message || "Error al restablecer contraseña" };
  }
};
