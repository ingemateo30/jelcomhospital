import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import Unauthorized from "./pages/unauthorized";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UploadExcel from "./pages/UploadExcel";
import DashboardHome from "./pages/DashboardHome";
import RegisterUser from "./pages/RegisterUser";
import LandingPage from "./pages/LandingPage";
import SendEmails from "./pages/SendEmails";
import SendManualEmail from "./pages/SendManualEmail";
import SendSMS from "./pages/SendSms";
import SendManualSms from "./pages/SendManualSms";
import SendWhatsApp from "./pages/SendWhatsApp";
import ConfigAdmin from "./pages/ConfigAdmin";
import ResponsesList from "./pages/ResponsesList";
import Recordatoriovoz from "./pages/ProgramarRecordatorio";
import HistorialEnvios from "./pages/HistorialEnvios"; // ✅ NUEVO

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="subir-excel" element={<UploadExcel />} />
            
            {/* ✅ NUEVA RUTA DE HISTORIAL */}
            <Route path="historial" element={<HistorialEnvios />} />
            
            {/* Rutas de correos */}
            <Route path="enviar-correos" element={<SendEmails />} />
            <Route path="enviar-correo" element={<SendManualEmail />} />
            
            {/* Rutas de SMS */}
            <Route path="enviar-sms" element={<SendSMS />} />
            <Route path="enviar-sms-manual" element={<SendManualSms />} />
            
            {/* Rutas de WhatsApp y Voz */}
            <Route path="enviar-whatsapp" element={<SendWhatsApp />} />
            <Route path="enviar-voz" element={<Recordatoriovoz />} />
            
            {/* Ruta de respuestas (si la usas) */}
            <Route path="respuestas" element={<ResponsesList />} />
            
            {/* Rutas solo para admin */}
            <Route element={<PrivateRoute requiredRole="admin" />}>
              <Route path="usuarios" element={<RegisterUser />} />
              <Route path="configuracion" element={<ConfigAdmin />} />
            </Route>
          </Route>
        </Route>

        {/* Ruta adicional de admin (si la necesitas) */}
        <Route element={<PrivateRoute requiredRole="admin" />}>
          <Route path="/admin" element={<h1>Panel de Administrador</h1>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;