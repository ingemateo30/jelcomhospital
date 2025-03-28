import { useState, useEffect } from "react";
import { sendWhatsAppReminders } from "../services/whatsappService";
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const SendWhatsApp = () => {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);

    const handleSendWhatsApp = async () => {
        setLoading(true);
        try {
            const result = await sendWhatsAppReminders();
            setResponse({
                success: true,
                message: result.message || "Mensajes de WhatsApp enviados con éxito."
            });
        } catch (error) {
            console.error("Error en la solicitud:", error);
            setResponse({
                success: false,
                message: error.response?.data?.message || "Error al enviar mensajes de WhatsApp."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (response) {
            const timer = setTimeout(() => setResponse(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [response]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                        Enviar Recordatorios de WhatsApp
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">Envía recordatorios automáticos por WhatsApp a los clientes.</p>
                </div>

                {/* Botón de Enviar WhatsApp con colores naranjas */}
                <button
                    onClick={handleSendWhatsApp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.05] shadow-lg shadow-orange-700/30"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <MessageCircle className="w-5 h-5" />
                            Enviar WhatsApp
                        </>
                    )}
                </button>

                {/* Mensajes de Éxito/Error con colores naranjas */}
                {response && (
                    <div className={`p-4 mt-4 rounded-lg flex items-center gap-3 border transform transition-all duration-300 ${response.success
                            ? "bg-orange-600/10 border-orange-500/20 text-orange-400 shadow-md shadow-orange-500/30"
                            : "bg-red-500/10 border-red-500/20 text-red-400 shadow-md shadow-red-500/30"
                        }`}>
                        {response.success ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="text-sm">{response.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendWhatsApp;


