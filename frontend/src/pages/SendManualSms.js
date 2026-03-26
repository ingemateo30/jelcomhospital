import { useState } from "react";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import { API_BASE_URL } from "../config";

const Enviarsms = () => {
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponse(null);
    
        if (!nombre || !correo || !mensaje) {
            setResponse({ success: false, message: "Todos los campos son requeridos: nombre, sms y mensaje." });
            setLoading(false);
            return;
        }
    
        console.log("Datos que se enviarán:", { nombre, correo, mensaje }); 
        const token = localStorage.getItem("token");
        if (!token) {
            setResponse({ success: false, message: "No estás autenticado. Por favor inicia sesión." });
            setLoading(false);
            return;
        }
    
        try {
            const res = await axios.post(`${API_BASE_URL}/sms/enviar-sms`, {
                nombre,
                correo,
                mensaje,
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
    
            setResponse({ success: true, message: res.data.message });
            setTimeout(() => {
                setNombre("");
                setCorreo("");
                setMensaje("");
                setResponse(null);
            }, 9000);

        } catch (error) {
            console.error("Error response:", error.response);
            setResponse({
                success: false,
                message: error.response?.data?.message || "Error al enviar el sms",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-8">
                <h2 className="text-3xl font-bold text-center text-orange-400 mb-6">Enviar Sms</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                   
                    <div>
                        <label className="text-gray-300 block mb-1">Nombre</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ingresa el nombre"
                            required
                        />
                    </div>

                  
                    <div>
                        <label className="text-gray-300 block mb-1">Numero Telefono</label>
                        <input
                            type="tel"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="(573001234567)"
                            required
                        />
                    </div>

                    
                    <div>
                        <label className="text-gray-300 block mb-1">Escribe tu mensaje</label>
                        <textarea
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            className="w-full p-3 h-32 rounded-lg bg-slate-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            placeholder="Escribe el contenido del sms aquí..."
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : <><FaPaperPlane /> Enviar sms</>}
                    </button>
                </form>
                {response && (
                    <div className={`p-4 mt-4 rounded-lg text-sm ${response.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"} border ${response.success ? "border-green-500/20" : "border-red-500/20"}`}>
                        {response.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Enviarsms;


