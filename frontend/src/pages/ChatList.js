import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  MessageSquare, Calendar, User, Phone, Loader2, CheckCircle,
  XCircle, Clock, RefreshCw, Search, Filter, Pin, X, ChevronDown, ChevronRight,
  LayoutList, LayoutGrid
} from "lucide-react";
import { useChatOrganization, useInfiniteScroll } from "../hooks/useChatOrganization";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:3001";

const CHATS_PER_PAGE = 20;

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState("todos");
  const [selectedProfesional, setSelectedProfesional] = useState("todos");
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);

  // Vista
  const [compactView, setCompactView] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Filtrar chats por búsqueda local
  const filteredChats = chats.filter(chat =>
    chat.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.numero?.includes(searchTerm) ||
    chat.SERVICIO?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Usar hook de organización
  const { sections } = useChatOrganization(filteredChats);

  useEffect(() => {
    loadInitialData();
    loadFiltersData();

    // Conectar a Socket.io
    socketRef.current = io(SOCKET_URL);

    // Escuchar nuevos mensajes para actualizar la lista
    socketRef.current.on("chat:nuevo_mensaje", () => {
      // Recargar la lista de chats cuando llegue un nuevo mensaje
      loadInitialData();
    });

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeTab, selectedServicio, selectedProfesional]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setOffset(0);
    await fetchChats(0, true);
  };

  const loadFiltersData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/whatsapp/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setServicios(response.data.servicios || []);
      setProfesionales(response.data.profesionales || []);
    } catch (error) {
      console.error("Error obteniendo filtros:", error);
    }
  };

  const fetchChats = async (currentOffset = 0, reset = false) => {
    try {
      if (!reset) setIsLoadingMore(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("No tienes un token de autenticación. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const params = {
        filter: activeTab,
        limit: CHATS_PER_PAGE,
        offset: currentOffset
      };

      if (selectedServicio !== "todos") {
        params.servicio = selectedServicio;
      }

      if (selectedProfesional !== "todos") {
        params.profesional = selectedProfesional;
      }

      const response = await axios.get(`${API_URL}/whatsapp/chats`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      const newChats = response.data.chats || [];

      if (reset) {
        setChats(newChats);
      } else {
        setChats(prev => [...prev, ...newChats]);
      }

      setTotal(response.data.total || 0);
      setHasMore(response.data.hasMore || false);
      setOffset(currentOffset + newChats.length);
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
      setIsLoadingMore(false);
    }
  };

  const loadMoreChats = () => {
    if (!isLoadingMore && hasMore) {
      fetchChats(offset, false);
    }
  };

  const handleScroll = useInfiniteScroll(loadMoreChats, hasMore);

  const togglePinChat = async (numero, currentPinStatus, e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/whatsapp/chats/${numero}/pin`,
        { pin: !currentPinStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el estado local
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.numero === numero
            ? { ...chat, anclado: !currentPinStatus }
            : chat
        )
      );
    } catch (error) {
      console.error("Error anclando/desanclando chat:", error);
    }
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
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
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleChatClick = (numero) => {
    navigate(`/dashboard/chats/${numero}`);
  };

  const resetFilters = () => {
    setSelectedServicio("todos");
    setSelectedProfesional("todos");
  };

  const ChatCard = ({ chat, compact }) => (
    <div
      onClick={() => handleChatClick(chat.numero)}
      className={`bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`flex items-center gap-3 ${compact ? 'mb-1' : 'mb-2'}`}>
            <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <User className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-white font-semibold ${compact ? 'text-base' : 'text-lg'} truncate`}>
                {chat.NOMBRE || "Sin nombre"}
              </h3>
              {!compact && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" />
                  {formatPhone(chat.numero)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {chat.anclado && (
                <Pin className="w-4 h-4 text-orange-400" />
              )}
              {chat.mensajes_no_leidos > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] text-center">
                  {chat.mensajes_no_leidos}
                </span>
              )}
              {chat.estado_cita && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(chat.estado_cita)}`}>
                  {getStatusIcon(chat.estado_cita)}
                  {!compact && chat.estado_cita}
                </span>
              )}
              <button
                onClick={(e) => togglePinChat(chat.numero, chat.anclado, e)}
                className="p-1.5 hover:bg-slate-600/50 rounded-full transition-colors"
                title={chat.anclado ? "Desanclar chat" : "Anclar chat"}
              >
                <Pin className={`w-4 h-4 ${chat.anclado ? 'text-orange-400' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {!compact && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                {chat.SERVICIO && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="font-medium">Servicio:</span>
                    <span className="text-gray-400 truncate">{chat.SERVICIO}</span>
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
            </>
          )}

          {compact && (
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span className="truncate flex-1">{chat.ultimo_mensaje_texto?.substring(0, 50)}...</span>
              <span className="text-gray-500 ml-2">{formatDate(chat.ultimo_mensaje)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Chats de WhatsApp
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Gestiona las conversaciones con tus pacientes ({total} chats)
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 mb-6">
          {/* Tabs */}
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
                Chats Activos
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
                Chats Cancelados
              </div>
            </button>
          </div>

          {/* Search Bar and Filters */}
          <div className="p-4 border-b border-slate-700/30 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters || selectedServicio !== "todos" || selectedProfesional !== "todos"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                }`}
              >
                <Filter className="w-5 h-5" />
                Filtros
              </button>
              <button
                onClick={() => setCompactView(!compactView)}
                className="px-4 py-2 bg-slate-700/50 text-gray-400 hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                title={compactView ? "Vista expandida" : "Vista compacta"}
              >
                {compactView ? <LayoutGrid className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-700/30">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Servicio</label>
                  <select
                    value={selectedServicio}
                    onChange={(e) => setSelectedServicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="todos">Todos los servicios</option>
                    {servicios.map(servicio => (
                      <option key={servicio} value={servicio}>{servicio}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Profesional</label>
                  <select
                    value={selectedProfesional}
                    onChange={(e) => setSelectedProfesional(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="todos">Todos los profesionales</option>
                    {profesionales.map(profesional => (
                      <option key={profesional} value={profesional}>{profesional}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-slate-700/50 text-gray-400 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? "No se encontraron chats que coincidan con tu búsqueda" : "No hay chats disponibles en esta categoría"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map(section => (
                  <div key={section.key} className="space-y-3">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-700/20 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{section.icon}</span>
                        <h3 className="text-white font-semibold">
                          {section.title} ({section.chats.length})
                        </h3>
                      </div>
                      {collapsedSections[section.key] ? (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {!collapsedSections[section.key] && (
                      <div className="space-y-3 pl-2">
                        {section.chats.map(chat => (
                          <ChatCard key={chat.numero} chat={chat} compact={compactView} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoadingMore && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                    <span className="ml-2 text-gray-400">Cargando más chats...</span>
                  </div>
                )}

                {!hasMore && chats.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay más chats para mostrar
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
