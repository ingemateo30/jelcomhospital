import { useState, useEffect } from "react";
import axios from "axios";
import { Phone, Send, Loader2, AlertCircle, CheckCircle, XCircle, Clock, Users, TrendingUp, Pause } from "lucide-react";
import io from "socket.io-client";

const ProgramarRecordatorio = () => {
    const [citaId, setCitaId] = useState("");
    const [resultado, setResultado] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [procesando, setProcesando] = useState(false);
    
    const [stats, setStats] = useState({
        total: 0,
        current: 0,
        exitosas: 0,
        fallidas: 0,
        porcentaje: 0
    });
    const [llamadas, setLlamadas] = useState([]);
    const [pausando, setPausando] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Conectar a Socket.io
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        // Eventos de voz
        newSocket.on("voz:inicio", (data) => {
            console.log("📢 Inicio del proceso de llamadas:", data);
            setProcesando(true);
            setStats({
                total: data.total,
                current: 0,
                exitosas: 0,
                fallidas: 0,
                porcentaje: 0
            });
            setLlamadas([]);
            setResultado({ 
                mensaje: `Iniciando ${data.total} llamadas para ${data.fecha}...` 
            });
        });

        newSocket.on("voz:procesando", (data) => {
            console.log("⏳ Procesando llamada:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            setLlamadas(prev => [{
                id: Date.now(),
                paciente: data.paciente,
                numero: data.numero,
                servicio: data.servicio,
                fecha: data.fecha,
                hora: data.hora,
                estado: 'procesando',
                timestamp: new Date().toISOString()
            }, ...prev].slice(0, 50));
        });

        newSocket.on("voz:exito", (data) => {
            console.log("✅ Llamada exitosa:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                exitosas: data.exitosas,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            setLlamadas(prev => {
                const nuevas = [...prev];
                if (nuevas[0] && nuevas[0].estado === 'procesando') {
                    nuevas[0].estado = 'exitoso';
                    nuevas[0].llamadaId = data.llamadaId;
                }
                return nuevas;
            });
        });

        newSocket.on("voz:error", (data) => {
            console.log("❌ Error en llamada:", data);
            setStats(prev => ({
                ...prev,
                current: data.current,
                fallidas: data.fallidas,
                porcentaje: ((data.current / data.total) * 100).toFixed(1)
            }));
            
            setLlamadas(prev => {
                const nuevas = [...prev];
                if (nuevas[0] && nuevas[0].estado === 'procesando') {
                    nuevas[0].estado = 'error';
                    nuevas[0].error = data.error;
                }
                return nuevas;
            });
        });

        newSocket.on("voz:pausa", (data) => {
            console.log("⏸️ Pausa:", data);
            setPausando(true);
            setTimeout(() => setPausando(false), data.segundos * 1000);
        });

        newSocket.on("voz:completado", (data) => {
            console.log("🎉 Proceso completado:", data);
            setProcesando(false);
            setIsLoadingAll(false);
            setResultado({
                mensaje: `Proceso completado: ${data.exitosas} exitosas, ${data.fallidas} fallidas (${data.tasa_exito})`
            });
        });

        newSocket.on("voz:error_fatal", (data) => {
            console.error("💥 Error fatal:", data);
            setProcesando(false);
            setIsLoadingAll(false);
            setResultado({
                error: `Error fatal: ${data.error}`
            });
        });

        return () => {
            newSocket.close();
        };
    }, []);

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
                "http://localhost:3001/api/voz/programar-llamada", 
                { citaId },
                { headers: { "Authorization": `Bearer ${token}` } }
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
                "http://localhost:3001/api/voz/llamar-todos",
                {},
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            // Los eventos de Socket.io manejarán la actualización
        } catch (error) {
            setResultado({ error: handleUnauthorized(error) });
            setIsLoadingAll(false);
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
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        Recordatorios por Voz
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Envía recordatorios por llamada telefónica automatizada
                    </p>
                </div>

                {/* Formulario individual */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-6 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                ID de la Cita:
                            </label>
                            <input
                                type="number"
                                value={citaId}
                                onChange={(e) => setCitaId(e.target.value)}
                                className="w-full bg-slate-700/60 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Ingresa el ID de la cita"
                                disabled={isLoading || procesando}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !citaId || procesando}
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
                </div>

                {/* Botón masivo */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-6 mb-6">
                    <button
                        onClick={llamarTodos}
                        disabled={isLoadingAll || procesando}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingAll || procesando ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {procesando ? `Llamando... ${stats.current}/${stats.total}` : 'Iniciando...'}
                            </>
                        ) : (
                            <>
                                <Phone className="w-5 h-5" />
                                Llamar a todos los pacientes de mañana
                            </>
                        )}
                    </button>
                </div>

                {/* Mensaje */}
                {resultado && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border mb-6 ${
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
                                    <p className="text-gray-400 text-sm">Procesadas</p>
                                    <p className="text-2xl font-bold text-white">{stats.current}</p>
                                </div>
                                <Clock className="w-8 h-8 text-orange-400" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Exitosas</p>
                                    <p className="text-2xl font-bold text-green-400">{stats.exitosas}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Fallidas</p>
                                    <p className="text-2xl font-bold text-red-400">{stats.fallidas}</p>
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
                            <span className="text-blue-400 font-bold">{stats.porcentaje}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 flex items-center justify-end pr-2"
                                style={{ width: `${stats.porcentaje}%` }}
                            >
                                {pausando && (
                                    <Pause className="w-3 h-3 text-white animate-pulse" />
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-center text-sm text-gray-400">
                            {stats.current} de {stats.total} llamadas procesadas
                        </div>
                    </div>
                )}

                {/* Lista de llamadas */}
                {llamadas.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
                        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Últimas llamadas
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {llamadas.map((llamada) => (
                                <div 
                                    key={llamada.id}
                                    className={`p-4 rounded-lg border ${getEstadoColor(llamada.estado)} transition-all duration-300`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getEstadoIcono(llamada.estado)}
                                                <span className="font-medium text-white">{llamada.paciente}</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                <p>📞 {llamada.numero}</p>
                                                <p>🏥 {llamada.servicio}</p>
                                                <p>📅 {llamada.fecha} - {llamada.hora}</p>
                                            </div>
                                            {llamada.error && (
                                                <p className="text-xs text-red-400 mt-2">❌ {llamada.error}</p>
                                            )}
                                            {llamada.llamadaId && (
                                                <p className="text-xs text-green-400 mt-2">✅ ID: {llamada.llamadaId}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(llamada.timestamp).toLocaleTimeString()}
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

export default ProgramarRecordatorio;