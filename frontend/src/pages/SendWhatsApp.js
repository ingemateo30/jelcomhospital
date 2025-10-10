import { useState, useEffect } from "react";
import { sendWhatsAppReminders } from "../services/whatsappService";
import { MessageCircle, Loader2, CheckCircle, AlertCircle, XCircle, Clock, Users, Send, TrendingUp, Pause } from "lucide-react";
import io from "socket.io-client";

const SendWhatsApp = () => {
    const [loading, setLoading] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        current: 0,
        exitosos: 0,
        fallidos: 0,
        porcentaje: 0
    });
    const [envios, setEnvios] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [pausando, setPausando] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Conectar a Socket.io
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        // Eventos de WhatsApp
        newSocket.on("whatsapp:inicio", (data) => {
            console.log("📢 Inicio del proceso:", data);
            setProcesando(true);
            setStats({
                total: data.total,
                current: 0,
                exitosos: 0,
                fallidos: 0,
                porcentaje: 0
            });
            setEnvios([]);
            setMensaje({ tipo: 'info', texto: `Iniciando envío de ${data.total} recordatorios...` });
        });

        newSocket.on("whatsapp:procesando", (data) => {
            console.log("⏳ Procesando:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            // Agregar a la lista como "procesando"
            setEnvios(prev => [{
                id: Date.now(),
                paciente: data.paciente,
                numero: data.numero,
                servicio: data.servicio,
                fecha: data.fecha,
                estado: 'procesando',
                timestamp: new Date().toISOString()
            }, ...prev].slice(0, 50)); // Mantener solo los últimos 50
        });

        newSocket.on("whatsapp:exito", (data) => {
            console.log("✅ Éxito:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                exitosos: data.exitosos,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            // Actualizar el primer elemento de la lista
            setEnvios(prev => {
                const nuevos = [...prev];
                if (nuevos[0] && nuevos[0].estado === 'procesando') {
                    nuevos[0].estado = 'exitoso';
                }
                return nuevos;
            });
        });

        newSocket.on("whatsapp:error", (data) => {
            console.log("❌ Error:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                fallidos: data.fallidos,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            // Actualizar el primer elemento de la lista
            setEnvios(prev => {
                const nuevos = [...prev];
                if (nuevos[0] && nuevos[0].estado === 'procesando') {
                    nuevos[0].estado = 'error';
                    nuevos[0].error = data.error;
                }
                return nuevos;
            });
        });

        newSocket.on("whatsapp:pausa", (data) => {
            console.log("⏸️ Pausa:", data);
            setPausando(true);
            setTimeout(() => setPausando(false), data.segundos * 1000);
        });

        newSocket.on("whatsapp:completado", (data) => {
            console.log("🎉 Completado:", data);
            setProcesando(false);
            setLoading(false);
            setMensaje({
                tipo: 'success',
                texto: `Proceso completado: ${data.exitosos} exitosos, ${data.fallidos} fallidos (${data.tasa_exito})`
            });
        });

        newSocket.on("whatsapp:error_fatal", (data) => {
            console.error("💥 Error fatal:", data);
            setProcesando(false);
            setLoading(false);
            setMensaje({
                tipo: 'error',
                texto: `Error fatal: ${data.error}`
            });
        });

        // Cleanup
        return () => {
            newSocket.close();
        };
    }, []);

    const handleSendWhatsApp = async () => {
        setLoading(true);
        setMensaje(null);
        
        try {
            await sendWhatsAppReminders();
            // La respuesta del servidor activará los eventos de Socket.io
        } catch (error) {
            console.error("Error en la solicitud:", error);
            setLoading(false);
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || "Error al iniciar envío de WhatsApp"
            });
        }
    };

    const getEstadoIcono = (estado) => {
        switch (estado) {
            case 'procesando':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
            case 'exitoso':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'procesando':
                return 'bg-blue-500/10 border-blue-500/20';
            case 'exitoso':
                return 'bg-green-500/10 border-green-500/20';
            case 'error':
                return 'bg-red-500/10 border-red-500/20';
            default:
                return 'bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                        Enviar Recordatorios WhatsApp
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Monitoreo en tiempo real de envíos masivos
                    </p>
                </div>

                {/* Botón de envío */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-6 mb-6">
                    <button
                        onClick={handleSendWhatsApp}
                        disabled={loading || procesando}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading || procesando ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {procesando ? `Enviando... ${stats.current}/${stats.total}` : 'Iniciando...'}
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Iniciar Envío de WhatsApp
                            </>
                        )}
                    </button>
                </div>

                {/* Mensaje de estado */}
                {mensaje && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border mb-6 ${
                        mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                        {mensaje.tipo === 'success' && <CheckCircle className="w-5 h-5" />}
                        {mensaje.tipo === 'error' && <AlertCircle className="w-5 h-5" />}
                        {mensaje.tipo === 'info' && <MessageCircle className="w-5 h-5" />}
                        <span className="text-sm">{mensaje.texto}</span>
                    </div>
                )}

                {/* Estadísticas */}
                {procesando && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Total</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Procesados</p>
                                    <p className="text-2xl font-bold text-white">{stats.current}</p>
                                </div>
                                <Clock className="w-8 h-8 text-orange-400" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Exitosos</p>
                                    <p className="text-2xl font-bold text-green-400">{stats.exitosos}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Fallidos</p>
                                    <p className="text-2xl font-bold text-red-400">{stats.fallidos}</p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra de progreso */}
                {procesando && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 font-medium">Progreso</span>
                            <span className="text-orange-400 font-bold">{stats.porcentaje}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 flex items-center justify-end pr-2"
                                style={{ width: `${stats.porcentaje}%` }}
                            >
                                {pausando && (
                                    <Pause className="w-3 h-3 text-white animate-pulse" />
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-center text-sm text-gray-400">
                            {stats.current} de {stats.total} mensajes procesados
                        </div>
                    </div>
                )}

                {/* Lista de envíos */}
                {envios.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
                        <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Últimos envíos
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {envios.map((envio) => (
                                <div 
                                    key={envio.id}
                                    className={`p-4 rounded-lg border ${getEstadoColor(envio.estado)} transition-all duration-300`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getEstadoIcono(envio.estado)}
                                                <span className="font-medium text-white">{envio.paciente}</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                <p>📞 {envio.numero}</p>
                                                <p>🏥 {envio.servicio}</p>
                                                <p>📅 {envio.fecha}</p>
                                            </div>
                                            {envio.error && (
                                                <p className="text-xs text-red-400 mt-2">❌ {envio.error}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(envio.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendWhatsApp;