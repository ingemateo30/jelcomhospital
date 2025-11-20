import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  MessageSquare, Calendar, User, Phone, Loader2, CheckCircle,
  XCircle, Clock, RefreshCw, Search, Filter, Pin, X, ChevronDown, ChevronRight,
  LayoutList, LayoutGrid, Briefcase, CheckCheck
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
  const [readFilter, setReadFilter] = useState("todos"); // "todos", "leidos", "no_leidos"
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);

  // Vista
  const [compactView, setCompactView] = useState(() => {
    const saved = localStorage.getItem('chatListCompactView');
    return saved ? JSON.parse(saved) : false;
  });
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const saved = localStorage.getItem('chatListCollapsedSections');
    return saved ? JSON.parse(saved) : {};
  });

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Filtrar chats por búsqueda local y filtro de leídos
  const filteredChats = chats.filter(chat => {
    // Filtro de búsqueda
    const matchesSearch = chat.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.numero?.includes(searchTerm) ||
      chat.SERVICIO?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de leídos/no leídos
    let matchesReadFilter = true;
    if (readFilter === "leidos") {
      matchesReadFilter = !chat.mensajes_no_leidos || chat.mensajes_no_leidos === 0;
    } else if (readFilter === "no_leidos") {
      matchesReadFilter = chat.mensajes_no_leidos > 0;
    }

    return matchesSearch && matchesReadFilter;
  });

  // Usar hook de organización
  const { sections } = useChatOrganization(filteredChats);

  // Persistir preferencias de vista
  useEffect(() => {
    localStorage.setItem('chatListCompactView', JSON.stringify(compactView));
  }, [compactView]);

  useEffect(() => {
    localStorage.setItem('chatListCollapsedSections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

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
    setReadFilter("todos");
  };

  const ChatCard = ({ chat, compact }) => {
    if (compact) {
      // Vista ultra-compacta: una sola línea optimizada para muchos chats
      return (
        <div
          onClick={() => handleChatClick(chat.numero)}
          className={`group flex items-center gap-2 px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-600/20 rounded-lg cursor-pointer transition-all hover:shadow-md ${
            chat.mensajes_no_leidos > 0 ? 'ring-1 ring-orange-500/30' : ''
          } ${getStatusColor(chat.estado_cita)} bg-opacity-5`}
        >
          {/* Avatar pequeño */}
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>

          {/* Nombre y servicio */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm truncate">
                {chat.NOMBRE || "Sin nombre"}
              </span>
              {chat.SERVICIO && (
                <span className="text-gray-500 text-xs truncate max-w-[120px]">
                  • {chat.SERVICIO}
                </span>
              )}
            </div>
          </div>

          {/* Estado, hora y badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Estado de cita */}
            {chat.estado_cita && (
              <div className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusColor(chat.estado_cita)}`}>
                {getStatusIcon(chat.estado_cita)}
              </div>
            )}

            {/* Hora */}
            <span className="text-xs text-gray-500 min-w-[45px] text-right">
              {(() => {
                const date = new Date(chat.ultimo_mensaje);
                return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              })()}
            </span>

            {/* Badge de no leídos */}
            {chat.mensajes_no_leidos > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] text-center">
                {chat.mensajes_no_leidos}
              </span>
            )}

            {/* Pin indicator */}
            {chat.anclado && (
              <Pin className="w-3 h-3 text-orange-400" fill="currentColor" />
            )}
          </div>
        </div>
      );
    }

    // Vista normal (expandida)
    return (
      <div
        onClick={() => handleChatClick(chat.numero)}
        className={`group bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/30 rounded-xl cursor-pointer transition-all hover:shadow-xl p-4 ${
          chat.mensajes_no_leidos > 0 ? 'ring-2 ring-orange-500/20' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Nombre y Fecha */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-white font-bold text-lg truncate flex-1">
                {chat.NOMBRE || "Sin nombre"}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {formatDate(chat.ultimo_mensaje).split(',')[1]?.trim() || formatDate(chat.ultimo_mensaje)}
                </span>
                {chat.anclado && (
                  <Pin className="w-4 h-4 text-orange-400" fill="currentColor" />
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Phone className="w-3.5 h-3.5" />
              {formatPhone(chat.numero)}
            </div>

            {/* Último mensaje */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm line-clamp-2">
                  {chat.ultimo_mensaje_tipo === 'saliente' && (
                    <CheckCheck className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  )}
                  <span className={`${chat.mensajes_no_leidos > 0 ? 'font-semibold text-white' : 'text-gray-400'}`}>
                    {chat.ultimo_mensaje_texto || "Sin mensajes"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {chat.mensajes_no_leidos > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center shadow-lg">
                    {chat.mensajes_no_leidos}
                  </span>
                )}
              </div>
            </div>

            {/* Info de cita */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {chat.SERVICIO && (
                <div className="flex items-center gap-1.5 text-gray-400 bg-slate-800/50 px-2 py-1 rounded-md">
                  <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                  <span className="truncate max-w-[150px]">{chat.SERVICIO}</span>
                </div>
              )}
              {chat.FECHA_CITA && (
                <div className="flex items-center gap-1.5 text-gray-400 bg-slate-800/50 px-2 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    {new Date(chat.FECHA_CITA).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    {chat.HORA_CITA && ` ${chat.HORA_CITA}`}
                  </span>
                </div>
              )}
              {chat.estado_cita && (
                <span className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${getStatusColor(chat.estado_cita)}`}>
                  {getStatusIcon(chat.estado_cita)}
                  <span className="capitalize">{chat.estado_cita}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={(e) => togglePinChat(chat.numero, chat.anclado, e)}
            className="p-2 hover:bg-slate-600/50 rounded-full transition-colors self-start opacity-0 group-hover:opacity-100"
            title={chat.anclado ? "Desanclar chat" : "Anclar chat"}
          >
            <Pin className={`w-4 h-4 ${chat.anclado ? 'text-orange-400' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
    );
  };

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
                  showFilters || selectedServicio !== "todos" || selectedProfesional !== "todos" || readFilter !== "todos"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                }`}
              >
                <Filter className="w-5 h-5" />
                Filtros
                {(selectedServicio !== "todos" || selectedProfesional !== "todos" || readFilter !== "todos") && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {[selectedServicio !== "todos" ? 1 : 0, selectedProfesional !== "todos" ? 1 : 0, readFilter !== "todos" ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCompactView(!compactView)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  compactView
                    ? 'bg-orange-500 text-white'
                    : total > 100
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 animate-pulse'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                }`}
                title={compactView ? "Vista expandida" : "Vista compacta (recomendada para muchos chats)"}
              >
                {compactView ? <LayoutGrid className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
                {!compactView && total > 100 && (
                  <span className="text-xs">Compacta</span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-700/30">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Estado de Lectura</label>
                  <select
                    value={readFilter}
                    onChange={(e) => setReadFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="todos">Todos los mensajes</option>
                    <option value="no_leidos">No leídos</option>
                    <option value="leidos">Leídos</option>
                  </select>
                </div>
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
                      className="w-full flex items-center justify-between text-left px-4 py-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all border border-slate-600/20 hover:border-slate-600/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{section.icon}</span>
                        <div>
                          <h3 className="text-white font-bold text-lg">
                            {section.title}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            {section.chats.length} {section.chats.length === 1 ? 'chat' : 'chats'}
                            {section.chats.filter(c => c.mensajes_no_leidos > 0).length > 0 &&
                              ` • ${section.chats.filter(c => c.mensajes_no_leidos > 0).length} sin leer`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {collapsedSections[section.key] && section.chats.filter(c => c.mensajes_no_leidos > 0).length > 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                            {section.chats.reduce((sum, c) => sum + (c.mensajes_no_leidos || 0), 0)}
                          </span>
                        )}
                        {collapsedSections[section.key] ? (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {!collapsedSections[section.key] && (
                      <div className={`${compactView ? 'space-y-1' : 'space-y-3'} pl-2 animate-fadeIn`}>
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
