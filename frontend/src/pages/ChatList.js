import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  MessageSquare, Search, Pin, CheckCheck, Check,
  Image, Video, Headphones, FileText, Loader2,
  SlidersHorizontal, X, Circle
} from "lucide-react";
import { useInfiniteScroll } from "../hooks/useChatOrganization";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.70.23:3000/api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://192.168.70.23:3000";
const CHATS_PER_PAGE = 30;

/* ─── helpers ─── */
const AVATAR_COLORS = [
  ["#e53935", "#b71c1c"], ["#8e24aa", "#4a148c"], ["#1e88e5", "#0d47a1"],
  ["#00897b", "#004d40"], ["#fb8c00", "#e65100"], ["#6d4c41", "#3e2723"],
  ["#039be5", "#01579b"], ["#43a047", "#1b5e20"],
];

function avatarColor(name = "") {
  const n = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function formatChatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const MEDIA_ICONS = {
  image:    <><Image    className="w-3.5 h-3.5 flex-shrink-0" /><span>Imagen</span></>,
  video:    <><Video    className="w-3.5 h-3.5 flex-shrink-0" /><span>Video</span></>,
  audio:    <><Headphones className="w-3.5 h-3.5 flex-shrink-0" /><span>Audio</span></>,
  document: <><FileText className="w-3.5 h-3.5 flex-shrink-0" /><span>Documento</span></>,
};

function LastMessagePreview({ chat }) {
  const isSent = chat.ultimo_mensaje_tipo === "saliente";
  const mediaType = chat.ultimo_tipo_media || (
    chat.ultimo_mensaje_texto === "[Imagen]"    ? "image"    :
    chat.ultimo_mensaje_texto === "[Video]"     ? "video"    :
    chat.ultimo_mensaje_texto === "[Audio]"     ? "audio"    :
    chat.ultimo_mensaje_texto === "[Documento]" ? "document" : null
  );

  return (
    <p className={`text-[13px] truncate flex items-center gap-1 ${
      chat.mensajes_no_leidos > 0 ? "text-[#e9edef]" : "text-[#8696a0]"
    }`}>
      {isSent && (
        chat.leido_ultimo
          ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
          : <CheckCheck className="w-3.5 h-3.5 text-[#8696a0] flex-shrink-0" />
      )}
      {mediaType && MEDIA_ICONS[mediaType]
        ? <span className="flex items-center gap-1 text-[#8696a0]">{MEDIA_ICONS[mediaType]}</span>
        : <span className="truncate">{chat.ultimo_mensaje_texto || "Sin mensajes"}</span>
      }
    </p>
  );
}

/* ─── component ─── */
const ChatList = () => {
  const [chats, setChats]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [offset, setOffset]         = useState(0);
  const [total, setTotal]           = useState(0);

  const navigate    = useNavigate();
  const socketRef   = useRef(null);
  const scrollRef   = useRef(null);

  /* filtered list (client-side search + unread toggle) */
  const visible = chats.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (c.NOMBRE || "").toLowerCase().includes(q) ||
      (c.numero || "").includes(q) ||
      (c.SERVICIO || "").toLowerCase().includes(q);
    const matchesUnread = !unreadOnly || c.mensajes_no_leidos > 0;
    return matchesSearch && matchesUnread;
  });

  /* ─── data fetching ─── */
  const fetchChats = useCallback(async (currentOffset = 0, reset = false) => {
    try {
      if (!reset) setIsLoadingMore(true);
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }

      const { data } = await axios.get(`${API_URL}/whatsapp/chats`, {
        params: { filter: "active", limit: CHATS_PER_PAGE, offset: currentOffset },
        headers: { Authorization: `Bearer ${token}` },
      });

      const incoming = data.chats || [];
      reset ? setChats(incoming) : setChats(prev => [...prev, ...incoming]);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setOffset(currentOffset + incoming.length);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError("Error al cargar los chats.");
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  /* initial load */
  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    fetchChats(0, true);
  }, [fetchChats]);

  /* socket */
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("chat:nuevo_mensaje", (data) => {
      setChats(prev => {
        const idx = prev.findIndex(c => c.numero === data.numero);
        if (idx === -1) {
          // unknown chat: reload
          fetchChats(0, true);
          return prev;
        }
        const updated = {
          ...prev[idx],
          ultimo_mensaje: data.mensaje.fecha,
          ultimo_mensaje_texto: data.mensaje.tipo_media
            ? `[${data.mensaje.tipo_media.charAt(0).toUpperCase() + data.mensaje.tipo_media.slice(1)}]`
            : data.mensaje.mensaje,
          ultimo_mensaje_tipo: data.mensaje.tipo,
          ultimo_tipo_media: data.mensaje.tipo_media || null,
          mensajes_no_leidos:
            data.mensaje.tipo === "entrante"
              ? (prev[idx].mensajes_no_leidos || 0) + 1
              : prev[idx].mensajes_no_leidos,
        };
        // move to top (after pinned)
        const rest = prev.filter((_, i) => i !== idx);
        const pinnedEnd = rest.findLastIndex?.(c => c.anclado) ?? -1;
        const insertAt = updated.anclado ? 0 : pinnedEnd + 1;
        const next = [...rest];
        next.splice(insertAt, 0, updated);
        return next;
      });
    });

    return () => socketRef.current?.disconnect();
  }, [fetchChats]);

  /* infinite scroll */
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchChats(offset, false);
  }, [isLoadingMore, hasMore, offset, fetchChats]);
  const handleScroll = useInfiniteScroll(loadMore, hasMore);

  const totalUnread = chats.reduce((s, c) => s + (c.mensajes_no_leidos || 0), 0);

  /* ─── render ─── */
  return (
    <div className="flex flex-col bg-[#111b21] w-full overflow-x-hidden" style={{ height: "calc(100vh - 72px)" }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 bg-[#202c33] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[#e9edef] font-semibold text-[15px] leading-none">WhatsApp</h1>
            <p className="text-[#8696a0] text-xs mt-0.5">{total} conversaciones</p>
          </div>
        </div>
        {totalUnread > 0 && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
            {totalUnread}
          </span>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="flex-shrink-0 bg-[#111b21] px-3 py-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[#8696a0] hover:text-[#e9edef]" />
            </button>
          )}
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar o empezar un chat"
            className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-[15px] pl-9 pr-9 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          title={unreadOnly ? "Mostrar todos" : "Solo no leídos"}
          className={`p-2 rounded-lg transition-colors ${
            unreadOnly ? "bg-orange-500 text-white" : "text-[#8696a0] hover:bg-[#202c33]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── List ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <MessageSquare className="w-12 h-12 text-[#8696a0]" />
            <p className="text-[#8696a0] text-sm">
              {searchTerm || unreadOnly ? "Sin resultados" : "No hay conversaciones"}
            </p>
          </div>
        ) : (
          <>
            {visible.map((chat, i) => (
              <ChatItem
                key={chat.numero}
                chat={chat}
                isLast={i === visible.length - 1}
                onClick={() => navigate(`/dashboard/chats/${chat.numero}`)}
              />
            ))}

            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              </div>
            )}

            {!hasMore && chats.length > CHATS_PER_PAGE && (
              <p className="text-center text-[#8696a0] text-xs py-4">
                Fin de las conversaciones
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ─── ChatItem ─── */
function ChatItem({ chat, isLast, onClick }) {
  const [c1, c2] = avatarColor(chat.NOMBRE || chat.numero);
  const unread = chat.mensajes_no_leidos || 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer transition-colors border-b border-[#202c33]/60 relative"
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-[15px] select-none"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        {initials(chat.NOMBRE || chat.numero)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {chat.anclado === 1 && (
              <Pin className="w-3 h-3 text-[#8696a0] flex-shrink-0" fill="currentColor" />
            )}
            <span className={`text-[15px] truncate ${
              unread > 0 ? "text-[#e9edef] font-semibold" : "text-[#e9edef]"
            }`}>
              {chat.NOMBRE || chat.numero}
            </span>
          </div>
          <span className={`text-xs flex-shrink-0 ml-2 ${
            unread > 0 ? "text-orange-400 font-medium" : "text-[#8696a0]"
          }`}>
            {formatChatTime(chat.ultimo_mensaje)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1"><LastMessagePreview chat={chat} /></div>
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {unread > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-orange-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>

        {/* Appointment info */}
        {(chat.SERVICIO || chat.FECHA_CITA) && (
          <p className="text-[11px] text-[#8696a0] mt-0.5 truncate">
            {[chat.SERVICIO, chat.FECHA_CITA && new Date(chat.FECHA_CITA).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatList;
