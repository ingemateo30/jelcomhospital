import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { ArrowLeft, User, Phone, Calendar, Briefcase, Loader2, CheckCircle, XCircle, Clock, RefreshCw, Mail, Check, CheckCheck, Reply } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:3001";

const ChatView = () => {
  const { numero } = useParams();
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChatMessages();

    // Conectar a Socket.io
    socketRef.current = io(SOCKET_URL);

    // Escuchar nuevos mensajes
    socketRef.current.on("chat:nuevo_mensaje", (data) => {
      // Solo agregar si es para este chat
      if (data.numero === numero) {
        setMensajes(prev => [...prev, data.mensaje]);
      }
    });

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [numero]);

  useEffect(() => {
    // Scroll to bottom when messages load
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatMessages = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No tienes un token de autenticación. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const response = await axios.get(`${API_URL}/whatsapp/chats/${numero}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMensajes(response.data.mensajes || []);
      setPaciente(response.data.paciente);

      // Marcar mensajes como leídos automáticamente al abrir el chat
      markAsRead();
    } catch (error) {
      console.error("Error obteniendo mensajes:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        setError("Sesión expirada. Redirigiendo al login...");
      } else {
        setError("Error al cargar los mensajes. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_URL}/whatsapp/chats/${numero}/marcar-leido`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Mensajes marcados como leídos");
    } catch (error) {
      console.error("Error marcando mensajes como leídos:", error);
      // No mostrar error al usuario, es una operación en segundo plano
    }
  };

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'confirmada':
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case 'cancelada':
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case 'reagendamiento solicitado':
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    }
  };

  const getStatusIcon = (estado) => {
    switch(estado) {
      case 'confirmada':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4" />;
      case 'reagendamiento solicitado':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "N/A";
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Formatear hora estilo WhatsApp (solo hora:minuto)
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Formatear fecha completa para separadores
  const formatDateSeparator = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalizar fechas a medianoche para comparación
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDate.getTime() === todayDate.getTime()) {
      return "Hoy";
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  // Agrupar mensajes por fecha para mostrar separadores
  const groupedMessages = useMemo(() => {
    if (!mensajes || mensajes.length === 0) return [];

    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    mensajes.forEach((mensaje) => {
      const messageDate = new Date(mensaje.fecha);
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      ).getTime();

      if (currentDate !== messageDateOnly) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDateOnly;
        currentGroup = [mensaje];
      } else {
        currentGroup.push(mensaje);
      }
    });

    // Agregar el último grupo
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
  }, [mensajes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/chats')}
            className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Chats
          </button>

          {paciente && (
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {paciente.NOMBRE || "Sin nombre"}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {formatPhone(numero)}
                      </div>
                      {paciente.EMAIL && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {paciente.EMAIL}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {paciente.ESTADO && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(paciente.ESTADO)}`}>
                    {getStatusIcon(paciente.ESTADO)}
                    {paciente.ESTADO}
                  </span>
                )}
              </div>

              {/* Información de la cita */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/30">
                {paciente.SERVICIO && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Briefcase className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">Servicio</p>
                      <p className="font-medium">{paciente.SERVICIO}</p>
                    </div>
                  </div>
                )}
                {paciente.FECHA_CITA && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Cita</p>
                      <p className="font-medium">
                        {new Date(paciente.FECHA_CITA).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
                {paciente.HORA_CITA && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">Hora</p>
                      <p className="font-medium">{paciente.HORA_CITA}</p>
                    </div>
                  </div>
                )}
              </div>
              {paciente.PROFESIONAL && (
                <div className="mt-4 pt-4 border-t border-slate-700/30">
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">Profesional</p>
                      <p className="font-medium">{paciente.PROFESIONAL}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30">
          <div className="p-6 border-b border-slate-700/30">
            <h3 className="text-xl font-semibold text-white">Conversación</h3>
          </div>

          <div className="p-6 h-[600px] overflow-y-auto bg-slate-900/30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0z\' fill=\'%23334155\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")' }}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400">No hay mensajes en esta conversación</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedMessages.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    {/* Separador de fecha */}
                    <div className="flex justify-center my-4">
                      <div className="bg-slate-700/60 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg">
                        <p className="text-xs font-medium text-gray-300">
                          {formatDateSeparator(group.messages[0]?.fecha)}
                        </p>
                      </div>
                    </div>

                    {/* Mensajes del día */}
                    {group.messages.map((mensaje, index) => {
                      const isSaliente = mensaje.tipo === 'saliente';
                      const prevMessage = index > 0 ? group.messages[index - 1] : null;
                      const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;

                      // Determinar si es parte de un grupo de mensajes consecutivos
                      const isFirstInGroup = !prevMessage || prevMessage.tipo !== mensaje.tipo;
                      const isLastInGroup = !nextMessage || nextMessage.tipo !== mensaje.tipo;

                      return (
                        <div
                          key={mensaje.id}
                          className={`flex ${isSaliente ? 'justify-end' : 'justify-start'} px-2`}
                        >
                          <div
                            className={`max-w-[75%] relative ${
                              isSaliente
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg'
                                : 'bg-slate-700/80 text-gray-100 border border-slate-600/40 shadow-md'
                            } ${
                              isSaliente
                                ? isFirstInGroup
                                  ? 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-2xl'
                                  : isLastInGroup
                                  ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg'
                                  : 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                                : isFirstInGroup
                                ? 'rounded-tl-lg rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                                : isLastInGroup
                                ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-lg rounded-br-2xl'
                                : 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                            } px-3 py-2`}
                          >
                            {/* Cola de la burbuja estilo WhatsApp */}
                            {isLastInGroup && (
                              <div
                                className={`absolute bottom-0 ${
                                  isSaliente ? '-right-1' : '-left-1'
                                } w-3 h-3 ${
                                  isSaliente
                                    ? 'bg-orange-600'
                                    : 'bg-slate-700/80 border-l border-b border-slate-600/40'
                                }`}
                                style={{
                                  clipPath: isSaliente
                                    ? 'polygon(0 0, 100% 0, 0 100%)'
                                    : 'polygon(100% 0, 100% 100%, 0 0)',
                                }}
                              />
                            )}

                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-1">
                              {mensaje.mensaje}
                            </p>

                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p className={`text-[11px] ${isSaliente ? 'text-orange-100/90' : 'text-gray-400'}`}>
                                {formatTime(mensaje.fecha)}
                              </p>
                              {isSaliente && (
                                <div className="flex items-center">
                                  {mensaje.leido ? (
                                    <CheckCheck className="w-4 h-4 text-blue-300" title={`Leído${mensaje.fecha_leido ? ': ' + formatDate(mensaje.fecha_leido) : ''}`} />
                                  ) : (
                                    <CheckCheck className="w-4 h-4 text-orange-200/70" title="Enviado" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
