import { useState } from "react";
import axios from "axios";
import { Calendar, Send, Phone, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const ProgramarRecordatorio = () => {
    const [citaId, setCitaId] = useState("");
    const [resultado, setResultado] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    const handleUnauthorized = (error) => {
        if (error.response?.status === 401) {
            console.warn("Token expirado. Cerrando sesión...");
            localStorage.removeItem("token");
            window.location.href = "/login"; 
            return "Sesión expirada. Redirigiendo al login...";
        }
        return error.response?.data?.error || error.response?.data?.message || "Error al procesar la solicitud.";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResultado(null);
        
        if (!citaId.trim()) {
            setResultado({ error: "Por favor ingresa un ID de cita válido." });
            return;
        }

        const token = localStorage.getItem("token");
        
        if (!token) {
            setResultado({ error: "No tienes un token de autenticación. Inicia sesión nuevamente." });
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(
                "http://localhost:3000/api/voz/programar-llamada", 
                { citaId },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
            setResultado({ mensaje: response.data.mensaje || "Recordatorio enviado exitosamente" });
        } catch (error) {
            setResultado({ error: handleUnauthorized(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const llamarTodos = async () => {
        setResultado(null);
        
        const token = localStorage.getItem("token");
        
        if (!token) {
            setResultado({ error: "No tienes un token de autenticación. Inicia sesión nuevamente." });
            return;
        }

        try {
            setIsLoadingAll(true);
            const response = await axios.post(
                "http://localhost:3000/api/voz/llamar-todos",
                {},
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
            setResultado({ mensaje: response.data.mensaje || "Proceso de llamadas iniciado exitosamente" });
        } catch (error) {
            setResultado({ error: handleUnauthorized(error) });
        } finally {
            setIsLoadingAll(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        Recordatorios de Citas
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Envía recordatorios por voz a tus pacientes
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Formulario para cita individual */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="group">
                            <label htmlFor="citaId" className="block text-sm font-medium text-gray-300 mb-2">
                                ID de la Cita:
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="citaId"
                                    value={citaId}
                                    onChange={(e) => setCitaId(e.target.value)}
                                    className="w-full bg-slate-700/60 border border-slate-600 text-white rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                    placeholder="Ingresa el ID de la cita"
                                    disabled={isLoading}
                                    required
                                />
                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-blue-400" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !citaId}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Enviar Recordatorio Individual
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800/50 text-gray-400">o</span>
                        </div>
                    </div>

                    {/* Botón para llamar a todos */}
                    <button
                        onClick={llamarTodos}
                        disabled={isLoadingAll}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingAll ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando llamadas...
                            </>
                        ) : (
                            <>
                                <Phone className="w-5 h-5" />
                                Llamar a todos los pacientes de mañana
                            </>
                        )}
                    </button>

                    {/* Mensaje de resultado */}
                    {resultado && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
                            resultado.error 
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-green-500/10 border-green-500/20 text-green-400"
                        }`}>
                            {resultado.error ? (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm">
                                {resultado.error || resultado.mensaje}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgramarRecordatorio;