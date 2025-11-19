import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { MessageSquare, Calendar, User, Phone, Loader2, CheckCircle, XCircle, Clock, RefreshCw, Search } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChats(activeTab);

    // Conectar a Socket.io
    socketRef.current = io(SOCKET_URL);

    // Escuchar nuevos mensajes para actualizar la lista
    socketRef.current.on("chat:nuevo_mensaje", (data) => {
      // Recargar la lista de chats cuando llegue un nuevo mensaje
      fetchChats(activeTab);
    });

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    // Filtrar chats por búsqueda
    if (searchTerm.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat =>
        chat.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.numero?.includes(searchTerm) ||
        chat.SERVICIO?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

  const fetchChats = async (filter) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No tienes un token de autenticación. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const response = await axios.get(`${API_URL}/whatsapp/chats`, {
        params: { filter },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setChats(response.data.chats || []);
      setFilteredChats(response.data.chats || []);
    } catch (error) {
      console.error("Error obteniendo chats:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        setError("Sesión expirada. Redirigiendo al login...");
      } else {
        setError("Error al cargar los chats. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "N/A";
    // Formatear número de teléfono
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleChatClick = (numero) => {
    navigate(`/dashboard/chats/${numero}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Chats de WhatsApp
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Gestiona las conversaciones con tus pacientes
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 mb-6">
          <div className="flex border-b border-slate-700/30">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "active"
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chats Activos ({activeTab === "active" ? chats.length : 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "cancelled"
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />
                Chats Cancelados ({activeTab === "cancelled" ? chats.length : 0})
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? "No se encontraron chats que coincidan con tu búsqueda" : "No hay chats disponibles en esta categoría"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.numero}
                    onClick={() => handleChatClick(chat.numero)}
                    className="bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">
                              {chat.NOMBRE || "Sin nombre"}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Phone className="w-4 h-4" />
                              {formatPhone(chat.numero)}
                            </div>
                          </div>
                          {chat.estado_cita && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(chat.estado_cita)}`}>
                              {getStatusIcon(chat.estado_cita)}
                              {chat.estado_cita}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                          {chat.SERVICIO && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                              <span className="font-medium">Servicio:</span>
                              <span className="text-gray-400">{chat.SERVICIO}</span>
                            </div>
                          )}
                          {chat.FECHA_CITA && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-orange-400" />
                              <span className="font-medium">Cita:</span>
                              <span className="text-gray-400">
                                {new Date(chat.FECHA_CITA).toLocaleDateString('es-ES')} {chat.HORA_CITA || ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {chat.ultimo_mensaje_texto && (
                          <div className="mt-3 pt-3 border-t border-slate-600/30">
                            <p className="text-gray-400 text-sm line-clamp-2">
                              <span className={`font-medium ${chat.ultimo_mensaje_tipo === 'saliente' ? 'text-orange-400' : 'text-blue-400'}`}>
                                {chat.ultimo_mensaje_tipo === 'saliente' ? 'Tú: ' : 'Paciente: '}
                              </span>
                              {chat.ultimo_mensaje_texto}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {formatDate(chat.ultimo_mensaje)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
