const API_URL = "http://localhost:3000/api/correo";

const handleUnauthorized = (response) => {
    if (response.status === 401) {
        console.warn("Token expirado. Cerrando sesión...");
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Sesión expirada. Redirigiendo al login...");
    }
};

export const sendReminderEmails = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token disponible.");

        const response = await fetch(`${API_URL}/enviar-recordatorios`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        handleUnauthorized(response); // Verifica si el token ha expirado

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const contentType = response.headers.get("content-type");

        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        console.log("📩 Respuesta del servidor:", data);
        return { success: true, ...data };
    } catch (error) {
        console.error("❌ Error enviando recordatorios:", error);
        return { success: false, message: "Error en el servidor", error: error.message };
    }
};

export const getCronStatus = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token disponible.");

        const response = await fetch(`${API_URL}/estado-cron`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        handleUnauthorized(response); // Verifica si el token ha expirado y vence y lo saca de la sesión

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("Error obteniendo estado del cron:", error);
        return null;
    }
};



