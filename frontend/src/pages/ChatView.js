import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  ArrowLeft, User, Phone, Calendar, Briefcase, Clock, Mail,
  CheckCheck, Image, Video, Headphones, FileText, Download,
  Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw,
  Info,
} from "lucide-react";

import { API_BASE_URL, SOCKET_BASE_URL } from "../config";
const API_URL    = API_BASE_URL;
const SOCKET_URL = SOCKET_BASE_URL;
const BASE_URL   = SOCKET_URL;

/* ─── helpers ─── */
const AVATAR_COLORS = [
  ["#e53935","#b71c1c"],["#8e24aa","#4a148c"],["#1e88e5","#0d47a1"],
  ["#00897b","#004d40"],["#fb8c00","#e65100"],["#6d4c41","#3e2723"],
  ["#039be5","#01579b"],["#43a047","#1b5e20"],
];
function avatarColor(name = "") {
  const n = (name.charCodeAt(0)||0) + (name.charCodeAt(1)||0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name = "") {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0]+p[1][0]).toUpperCase();
  return name.slice(0,2).toUpperCase()||"?";
}
function formatPhone(phone) {
  if (!phone) return "";
  const c = phone.toString().replace(/\D/g,"");
  if (c.length === 10) return `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6)}`;
  return phone;
}
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit",hour12:false});
}
function formatDateSeparator(dateStr) {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  const now  = new Date();
  const msDay = 86400000;
  const dDay  = new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
  const nDay  = new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  const diff  = Math.round((nDay - dDay)/msDay);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return d.toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"});
}

/* ─── Media bubble ─── */
function MediaBubble({ mensaje, isSaliente }) {
  const src     = mensaje.url_media ? `${BASE_URL}${mensaje.url_media}` : null;
  const caption = mensaje.mensaje && !mensaje.mensaje.startsWith("[") ? mensaje.mensaje : null;
  const bubbleText = (txt) => (
    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mt-1">{txt}</p>
  );

  if (mensaje.tipo_media === "image") return (
    <div>
      {src
        ? <img src={src} alt="imagen" className="rounded-xl max-w-full max-h-64 object-cover" />
        : <div className="flex items-center gap-2 text-sm opacity-60 py-1"><Image className="w-4 h-4"/><span>Imagen</span></div>
      }
      {caption && bubbleText(caption)}
    </div>
  );

  if (mensaje.tipo_media === "video") return (
    <div>
      {src
        ? <video src={src} controls className="rounded-xl max-w-full max-h-64" />
        : <div className="flex items-center gap-2 text-sm opacity-60 py-1"><Video className="w-4 h-4"/><span>Video</span></div>
      }
      {caption && bubbleText(caption)}
    </div>
  );

  if (mensaje.tipo_media === "audio") return (
    <div>
      {src
        ? <audio src={src} controls className="w-full max-w-full mt-1" />
        : <div className="flex items-center gap-2 text-sm opacity-60 py-1"><Headphones className="w-4 h-4"/><span>Audio</span></div>
      }
    </div>
  );

  if (mensaje.tipo_media === "document") {
    const fname = mensaje.url_media?.split("/").pop() || "documento";
    return (
      <div>
        {src
          ? (
            <a href={src} target="_blank" rel="noopener noreferrer"
               className={`flex items-center gap-2 text-sm rounded-lg p-2 ${
                 isSaliente ? "bg-orange-700/40 hover:bg-orange-700/60" : "bg-[#1a2e38] hover:bg-[#1f3540]"
               } transition-colors`}>
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{caption || fname}</p>
                <p className="text-[11px] opacity-60 uppercase">{fname.split(".").pop()}</p>
              </div>
              <Download className="w-4 h-4 flex-shrink-0 opacity-70"/>
            </a>
          )
          : <div className="flex items-center gap-2 text-sm opacity-60 py-1"><FileText className="w-4 h-4"/><span>Documento</span></div>
        }
      </div>
    );
  }

  return <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{mensaje.mensaje}</p>;
}

/* ─── appointment status ─── */
function statusBadge(estado) {
  const map = {
    confirmada:              { icon: <CheckCircle className="w-3.5 h-3.5"/>, bg:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    cancelada:               { icon: <XCircle    className="w-3.5 h-3.5"/>, bg:"bg-red-500/15 text-red-400 border-red-500/25" },
    "reagendamiento solicitado": { icon: <RefreshCw  className="w-3.5 h-3.5"/>, bg:"bg-blue-500/15 text-blue-400 border-blue-500/25" },
  };
  const s = map[estado] || { icon:<Clock className="w-3.5 h-3.5"/>, bg:"bg-orange-500/15 text-orange-400 border-orange-500/25" };
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg}`}>
      {s.icon}{estado}
    </span>
  );
}

/* ─── message grouping ─── */
function groupMessages(msgs) {
  const groups = [];
  let curDate = null, curGroup = [];
  msgs.forEach(m => {
    const d = new Date(m.fecha);
    const key = new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    if (key !== curDate) {
      if (curGroup.length) groups.push({ date: curDate, messages: curGroup });
      curDate = key; curGroup = [m];
    } else {
      curGroup.push(m);
    }
  });
  if (curGroup.length) groups.push({ date: curDate, messages: curGroup });
  return groups;
}

/* ─── ChatView ─── */
const ChatView = () => {
  const { numero }  = useParams();
  const navigate    = useNavigate();
  const [mensajes,  setMensajes]  = useState([]);
  const [paciente,  setPaciente]  = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [showInfo,  setShowInfo]  = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef      = useRef(null);
  const chatAreaRef    = useRef(null);

  /* ─── fetch ─── */
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }
      const { data } = await axios.get(`${API_URL}/whatsapp/chats/${numero}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensajes(data.mensajes || []);
      setPaciente(data.paciente || null);
      markAsRead();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token"); window.location.href = "/login";
      } else {
        setError("Error al cargar los mensajes.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.put(`${API_URL}/whatsapp/chats/${numero}/marcar-leido`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  /* ─── socket ─── */
  useEffect(() => {
    fetchMessages();
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on("chat:nuevo_mensaje", (data) => {
      if (data.numero === numero) {
        setMensajes(prev => {
          const exists = prev.some(m => m.id === data.mensaje.id);
          if (exists) return prev;
          return [...prev, data.mensaje];
        });
        markAsRead();
      }
    });
    return () => socketRef.current?.disconnect();
  }, [numero]);

  /* ─── scroll to bottom on new messages ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const grouped = useMemo(() => groupMessages(mensajes), [mensajes]);
  const [c1, c2] = avatarColor(paciente?.NOMBRE || numero);

  /* ─── render ─── */
  return (
    <div
      className="flex flex-col bg-[#0b141a] w-full overflow-x-hidden"
      style={{ height: "calc(100vh - 72px)" }}
    >
      {/* ══ Header ══ */}
      <div className="flex-shrink-0 bg-[#202c33] px-4 py-2.5 flex items-center gap-3 border-b border-white/5 shadow-sm min-w-0">
        <button
          onClick={() => navigate("/dashboard/chats")}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#aebac1]" />
        </button>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm select-none"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {initials(paciente?.NOMBRE || numero)}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="text-[#e9edef] font-semibold text-[15px] leading-tight truncate">
            {paciente?.NOMBRE || formatPhone(numero)}
          </p>
          <p className="text-[#8696a0] text-xs leading-none mt-0.5">
            {paciente?.NOMBRE ? formatPhone(numero) : ""}
          </p>
        </div>

        {/* Status badge */}
        {paciente?.ESTADO && statusBadge(paciente.ESTADO)}

        {/* Info toggle */}
        <button
          onClick={() => setShowInfo(v => !v)}
          title={showInfo ? "Ocultar info" : "Ver info de cita"}
          className={`p-2 rounded-full transition-colors ${
            showInfo ? "bg-orange-500/20 text-orange-400" : "text-[#aebac1] hover:bg-white/10"
          }`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* ══ Patient info panel (collapsible) ══ */}
      {showInfo && paciente && (
        <div className="flex-shrink-0 bg-[#182229] border-b border-white/5 px-4 py-3 overflow-x-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {paciente.SERVICIO && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-[#8696a0] uppercase tracking-wide">Servicio</p>
                  <p className="text-[#e9edef] text-sm font-medium">{paciente.SERVICIO}</p>
                </div>
              </div>
            )}
            {paciente.FECHA_CITA && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-[#8696a0] uppercase tracking-wide">Fecha cita</p>
                  <p className="text-[#e9edef] text-sm font-medium">
                    {new Date(paciente.FECHA_CITA).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}
                  </p>
                </div>
              </div>
            )}
            {paciente.HORA_CITA && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-[#8696a0] uppercase tracking-wide">Hora</p>
                  <p className="text-[#e9edef] text-sm font-medium">{paciente.HORA_CITA}</p>
                </div>
              </div>
            )}
            {paciente.PROFESIONAL && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-[#8696a0] uppercase tracking-wide">Profesional</p>
                  <p className="text-[#e9edef] text-sm font-medium">{paciente.PROFESIONAL}</p>
                </div>
              </div>
            )}
            {paciente.EMAIL && (
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0"/>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#8696a0] uppercase tracking-wide">Correo</p>
                  <p className="text-[#e9edef] text-sm font-medium truncate">{paciente.EMAIL}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Messages area ══ */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)
          `,
          backgroundSize: "32px 32px",
          backgroundColor: "#0b141a",
        }}
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin"/>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center">
              <User className="w-8 h-8 text-[#8696a0]"/>
            </div>
            <p className="text-[#8696a0] text-sm">No hay mensajes en esta conversación</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {grouped.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex justify-center my-4 sticky top-2 z-10">
                  <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-full shadow">
                    {formatDateSeparator(group.messages[0]?.fecha)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg, mi) => {
                  const prev = mi > 0 ? group.messages[mi - 1] : null;
                  const next = mi < group.messages.length - 1 ? group.messages[mi + 1] : null;
                  const isSent = msg.tipo === "saliente";

                  /* grouping: same side + within 2 minutes */
                  const mTime = new Date(msg.fecha).getTime();
                  const pTime = prev ? new Date(prev.fecha).getTime() : 0;
                  const nTime = next ? new Date(next.fecha).getTime() : 0;

                  const isFirst = !prev || prev.tipo !== msg.tipo || mTime - pTime > 120000;
                  const isLast  = !next || next.tipo !== msg.tipo || nTime - mTime > 120000;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isSent={isSent}
                      isFirst={isFirst}
                      isLast={isLast}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef}/>
          </div>
        )}
      </div>

      {/* ══ Footer (read-only notice) ══ */}
      <div className="flex-shrink-0 bg-[#202c33] border-t border-white/5 px-4 py-3 flex items-center justify-center gap-2">
        <Phone className="w-3.5 h-3.5 text-[#8696a0]"/>
        <p className="text-[#8696a0] text-xs">
          Vista de solo lectura · Responde desde WhatsApp Business
        </p>
      </div>
    </div>
  );
};

/* ─── MessageBubble ─── */
function MessageBubble({ msg, isSent, isFirst, isLast }) {
  const hasMedia = !!msg.tipo_media;

  /* Border radius: mimic WhatsApp shape */
  const radius = isSent
    ? `${isFirst ? "18px" : "18px"} ${isFirst ? "4px" : "18px"} ${isLast ? "4px" : "18px"} 18px`
    : `${isFirst ? "4px" : "18px"} ${isFirst ? "18px" : "18px"} 18px ${isLast ? "4px" : "18px"}`;

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0.5"} w-full`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 px-3 py-2 shadow-sm overflow-hidden ${
          isSent
            ? "bg-[#005c4b] text-[#e9edef]"
            : "bg-[#202c33] text-[#e9edef]"
        }`}
        style={{ borderRadius: radius }}
      >
        {/* Tail */}
        {isFirst && (
          <div
            className="absolute top-0"
            style={{
              [isSent ? "right" : "left"]: "-7px",
              width: 0, height: 0,
              borderStyle: "solid",
              borderWidth: isSent ? "0 0 8px 8px" : "0 8px 8px 0",
              borderColor: isSent
                ? "transparent transparent transparent #005c4b"
                : "transparent #202c33 transparent transparent",
            }}
          />
        )}

        {/* Content */}
        <MediaBubble mensaje={msg} isSaliente={isSent}/>

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${hasMedia ? "justify-end" : "justify-end"}`}>
          <span className="text-[11px] text-[#8696a0] leading-none">
            {formatTime(msg.fecha)}
          </span>
          {isSent && (
            msg.leido
              ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" title={`Leído`}/>
              : <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" title="Enviado"/>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatView;
