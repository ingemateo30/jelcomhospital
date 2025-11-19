import { useEffect, useState } from "react";
import { getResponses, getCitasCanceladas } from "../services/whatsappService";
import { MessageSquare, Calendar, User, Phone, Info, Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

const ResponsesList = () => {
  const [responses, setResponses] = useState([]);
  const [citasCanceladas, setCitasCanceladas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("respuestas");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No tienes un token de autenticación. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        const [responsesData, canceladasData] = await Promise.all([
          getResponses(),
          getCitasCanceladas()
        ]);

        setResponses(responsesData);
        setCitasCanceladas(canceladasData);
      } catch (error) {
        console.error("Error obteniendo datos:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          setError("Sesión expirada. Redirigiendo al login...");
        } else {
          setError("Error al cargar los datos. Intenta nuevamente.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Gestión de Respuestas y Citas
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Monitoreo de confirmaciones, cancelaciones y reagendamientos
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 mb-6">
          <div className="flex border-b border-slate-700/30">
            <button
              onClick={() => setActiveTab("respuestas")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "respuestas"
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Todas las Respuestas ({responses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("canceladas")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "canceladas"
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />
                Citas Canceladas ({citasCanceladas.length})
              </div>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-16">
            <div className="flex justify-center items-center">
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
              <span className="ml-3 text-orange-300">Cargando datos...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg flex items-center gap-3 border bg-red-500/10 border-red-500/20 text-red-400">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-6">
            {activeTab === "respuestas" ? (
              responses.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <MessageSquare className="w-16 h-16 mx-auto text-orange-400 mb-4" />
                  <p className="text-lg">No hay respuestas registradas aún</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50 text-left">
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            Teléfono
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Paciente
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Fecha Cita
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Estado
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Mensaje
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {responses.map((response, index) => (
                        <tr key={index} className="hover:bg-slate-700/10 transition-colors">
                          <td className="px-4 py-4 text-gray-300 font-mono">{response.numero}</td>
                          <td className="px-4 py-4 text-gray-300">{response.nombre || "N/A"}</td>
                          <td className="px-4 py-4 text-gray-300">
                            {response.fecha_cita ? new Date(response.fecha_cita).toLocaleDateString('es-CO') : "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`py-1 px-3 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${getStatusColor(response.estado)}`}>
                              {getStatusIcon(response.estado)}
                              {response.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-300 text-sm max-w-xs truncate">
                            {response.mensaje || "Sin mensaje"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              citasCanceladas.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <XCircle className="w-16 h-16 mx-auto text-orange-400 mb-4" />
                  <p className="text-lg">No hay citas canceladas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50 text-left">
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Paciente
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            Teléfono
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Fecha Cita
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Hora
                          </div>
                        </th>
                        <th className="px-4 py-3 text-gray-400 font-medium">
                          <div className="flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Servicio
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {citasCanceladas.map((cita, index) => (
                        <tr key={index} className="hover:bg-slate-700/10 transition-colors">
                          <td className="px-4 py-4 text-gray-300">{cita.NOMBRE}</td>
                          <td className="px-4 py-4 text-gray-300 font-mono">{cita.TELEFONO_FIJO}</td>
                          <td className="px-4 py-4 text-gray-300">
                            {new Date(cita.FECHA_CITA).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-4 py-4 text-gray-300">{cita.HORA_CITA}</td>
                          <td className="px-4 py-4 text-gray-300 text-sm">{cita.SERVICIO}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsesList;