import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaCog,
  FaUsers,
  FaChevronLeft,
  FaUpload,
  FaPaperPlane,
  FaEnvelope,
  FaSms,
  FaMobileAlt,
  FaWhatsapp,
  FaChevronUp,
  FaChevronDown,
  FaSearch,
  FaHistory, // ✅ NUEVO ICONO PARA HISTORIAL
  FaComments, // ✅ NUEVO ICONO PARA RESPUESTAS
  FaCommentDots, // ✅ NUEVO ICONO PARA CHATS
  FaBan, // ✅ NUEVO ICONO PARA LISTA NEGRA
} from "react-icons/fa";
import logo from "../assets/logos-jelcom.png";

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("rol");
    if (!userRole) {
      navigate("/");
    } else {
      setRole(userRole);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const [openSections, setOpenSections] = useState({
    correos: false,
    sms: false,
    whatsapp: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-gray-800/50 backdrop-blur-lg border-r border-gray-700 transition-all duration-300 ease-in-out`}
      >
        {/* Logo y botón de colapsar */}
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <img
            src={logo}
            alt="Jelcom Logo"
            className={`h-10 transition-opacity ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            }`}
          />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <FaBars />
            ) : (
              <FaChevronLeft className="hover:-translate-x-1 transition-transform" />
            )}
          </button>
        </div>

        {/* Menú */}
        <nav className="p-4 space-y-2">
          {/* Menús de Admin */}
          {role === "admin" && (
            <>
              <SidebarButton 
                icon={<FaHome />} 
                text="Inicio" 
                collapsed={isCollapsed} 
                onClick={() => navigate("/dashboard")} 
              />
              <SidebarButton 
                icon={<FaUsers />} 
                text="Usuarios" 
                collapsed={isCollapsed} 
                onClick={() => navigate("/dashboard/usuarios")} 
              />
              <SidebarButton 
                icon={<FaCog />} 
                text="Configuración" 
                collapsed={isCollapsed} 
                onClick={() => navigate("/dashboard/configuracion")} 
              />
            </>
          )}
          
          {/* Subir Excel */}
          <SidebarButton 
            icon={<FaUpload />} 
            text="Subir Excel" 
            collapsed={isCollapsed} 
            onClick={() => navigate("/dashboard/subir-excel")} 
          />
          
          {/* ✅ NUEVO: Historial de Envíos */}
          <SidebarButton
            icon={<FaHistory />}
            text="Historial de Envíos"
            collapsed={isCollapsed}
            onClick={() => navigate("/dashboard/historial")}
          />

          {/* ✅ NUEVO: Lista Negra */}
          <SidebarButton
            icon={<FaBan />}
            text="Lista Negra"
            collapsed={isCollapsed}
            onClick={() => navigate("/dashboard/blacklist")}
          />

          {/* Sección de Correos */}
          <div className="relative group">
            <div
              className="flex items-center justify-between text-gray-300 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={() => toggleSection("correos")}
            >
              <div className="flex items-center space-x-2">
                <FaEnvelope />
                {!isCollapsed && <span>Correos</span>}
              </div>
              {!isCollapsed && (openSections.correos ? <FaChevronUp /> : <FaChevronDown />)}
            </div>

            {!isCollapsed ? (
              <div className={`pl-6 space-y-1 transition-all duration-300 ${openSections.correos ? "block" : "hidden"}`}>
                <SidebarButton 
                  icon={<FaPaperPlane />} 
                  text="Correos automáticos" 
                  collapsed={isCollapsed} 
                  onClick={() => navigate("/dashboard/enviar-correos")} 
                />
                <SidebarButton 
                  icon={<FaEnvelope />} 
                  text="Enviar Correo manual" 
                  collapsed={isCollapsed} 
                  onClick={() => navigate("/dashboard/enviar-correo")} 
                />
              </div>
            ) : (
              <div className="absolute left-full top-0 bg-gray-800 text-white p-2 rounded-lg shadow-lg w-48 hidden group-hover:block">
                <SidebarButton 
                  icon={<FaPaperPlane />} 
                  text="Correo automático" 
                  collapsed={false} 
                  onClick={() => navigate("/dashboard/enviar-correos")} 
                />
                <SidebarButton 
                  icon={<FaEnvelope />} 
                  text="Correo manual" 
                  collapsed={false} 
                  onClick={() => navigate("/dashboard/enviar-correo")} 
                />
              </div>
            )}
          </div>

          {/* Sección de SMS */}
          <div className="relative group">
            <div
              className="flex items-center justify-between text-gray-300 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={() => toggleSection("sms")}
            >
              <div className="flex items-center space-x-2">
                <FaSms />
                {!isCollapsed && <span>SMS</span>}
              </div>
              {!isCollapsed && (openSections.sms ? <FaChevronUp /> : <FaChevronDown />)}
            </div>

            {!isCollapsed ? (
              <div className={`pl-6 space-y-1 transition-all duration-300 ${openSections.sms ? "block" : "hidden"}`}>
                <SidebarButton 
                  icon={<FaSms />} 
                  text="SMS automáticos" 
                  collapsed={isCollapsed} 
                  onClick={() => navigate("/dashboard/enviar-sms")} 
                />
                <SidebarButton 
                  icon={<FaMobileAlt />} 
                  text="SMS manual" 
                  collapsed={isCollapsed} 
                  onClick={() => navigate("/dashboard/enviar-sms-manual")} 
                />
              </div>
            ) : (
              <div className="absolute left-full top-0 bg-gray-800 text-white p-2 rounded-lg shadow-lg w-48 hidden group-hover:block">
                <SidebarButton 
                  icon={<FaSms />} 
                  text="SMS automáticos" 
                  collapsed={false} 
                  onClick={() => navigate("/dashboard/enviar-sms")} 
                />
                <SidebarButton 
                  icon={<FaMobileAlt />} 
                  text="SMS manual" 
                  collapsed={false} 
                  onClick={() => navigate("/dashboard/enviar-sms-manual")} 
                />
              </div>
            )}
          </div>

          {/* Sección de WhatsApp y Voz */}
          <div className="relative group">
            <div
              className="flex items-center justify-between text-gray-300 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={() => toggleSection("whatsapp")}
            >
              <div className="flex items-center space-x-2">
                <FaWhatsapp />
                {!isCollapsed && <span>WhatsApp & Voz</span>}
              </div>
              {!isCollapsed && (openSections.whatsapp ? <FaChevronUp /> : <FaChevronDown />)}
            </div>

            {!isCollapsed ? (
              <div className={`pl-6 space-y-1 transition-all duration-300 ${openSections.whatsapp ? "block" : "hidden"}`}>
                <SidebarButton
                  icon={<FaWhatsapp />}
                  text="Enviar WhatsApp"
                  collapsed={isCollapsed}
                  onClick={() => navigate("/dashboard/enviar-whatsapp")}
                />
                <SidebarButton
                  icon={<FaCommentDots />}
                  text="Chats"
                  collapsed={isCollapsed}
                  onClick={() => navigate("/dashboard/chats")}
                />
                <SidebarButton
                  icon={<FaComments />}
                  text="Respuestas y Citas"
                  collapsed={isCollapsed}
                  onClick={() => navigate("/dashboard/respuestas")}
                />
                <SidebarButton
                  icon={<FaWhatsapp />}
                  text="Enviar voz"
                  collapsed={isCollapsed}
                  onClick={() => navigate("/dashboard/enviar-voz")}
                />
              </div>
            ) : (
              <div className="absolute left-full top-0 bg-gray-800 text-white p-2 rounded-lg shadow-lg w-48 hidden group-hover:block">
                <SidebarButton
                  icon={<FaWhatsapp />}
                  text="Enviar WhatsApp"
                  collapsed={false}
                  onClick={() => navigate("/dashboard/enviar-whatsapp")}
                />
                <SidebarButton
                  icon={<FaCommentDots />}
                  text="Chats"
                  collapsed={false}
                  onClick={() => navigate("/dashboard/chats")}
                />
                <SidebarButton
                  icon={<FaComments />}
                  text="Respuestas y Citas"
                  collapsed={false}
                  onClick={() => navigate("/dashboard/respuestas")}
                />
                <SidebarButton
                  icon={<FaWhatsapp />}
                  text="Enviar voz"
                  collapsed={false}
                  onClick={() => navigate("/dashboard/enviar-voz")}
                />
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
            <div>
              <p className="text-white font-medium">Bienvenido</p>
              <p className="text-xs text-gray-400">{role}</p>
            </div>
          </div>

          {/* Barra de búsqueda integrada */}
          <div className="hidden md:flex items-center relative w-64 lg:w-96">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors">
              <FaUser />
              <span>Perfil</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              <FaSignOutAlt />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

const SidebarButton = ({ icon, text, collapsed, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all"
  >
    {icon}
    {!collapsed && <span className="text-sm">{text}</span>}
  </button>
);

export default Dashboard;