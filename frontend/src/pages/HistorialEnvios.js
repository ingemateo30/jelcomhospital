import { useState, useEffect } from "react";
import { Calendar, Search, Filter, Download, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import axios from "axios";

const HistorialEnvios = () => {
    const [envios, setEnvios] = useState([]);
    const [filtros, setFiltros] = useState({
        tipo: 'todos', // whatsapp, voz, todos
        estado: 'todos', // exitoso, fallido, todos
        fechaDesde: '',
        fechaHasta: '',
        busqueda: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        exitosos: 0,
        fallidos: 0,
        tasaExito: 0
    });

    useEffect(() => {
        cargarHistorial();
    }, [filtros]);

    const cargarHistorial = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get('http://localhost:3001/api/envios/historial', {
                params: filtros,
                headers: { Authorization: `Bearer ${token}` }
            });

            setEnvios(response.data.envios || []);
            setStats(response.data.stats || {
                total: 0,
                exitosos: 0,
                fallidos: 0,
                tasaExito: 0
            });
        } catch (error) {
            console.error("Error cargando historial:", error);
            setError("Error al cargar el historial. Por favor, intenta de nuevo.");
            setEnvios([]);
            setStats({
                total: 0,
                exitosos: 0,
                fallidos: 0,
                tasaExito: 0
            });
        } finally {
            setLoading(false);
        }
    };


    const exportarCSV = () => {
        const headers = ['ID', 'Tipo', 'Paciente', 'Número', 'Servicio', 'Fecha', 'Estado', 'Intentos'];
        const csvContent = [
            headers.join(','),
            ...envios.map(e => [
                e.id,
                e.tipo,
                e.paciente,
                e.numero,
                e.servicio,
                new Date(e.fecha).toLocaleString('es-CO'),
                e.estado,
                e.intentos
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial_envios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getEstadoBadge = (estado) => {
        if (estado === 'exitoso') {
            return (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Exitoso
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                <XCircle className="w-3 h-3" />
                Fallido
            </span>
        );
    };

    const getTipoBadge = (tipo) => {
        if (tipo === 'whatsapp') {
            return (
                <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                    WhatsApp
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                Voz
            </span>
        );
    };

    const enviosFiltrados = envios.filter(envio => {
        const matchTipo = filtros.tipo === 'todos' || envio.tipo === filtros.tipo;
        const matchEstado = filtros.estado === 'todos' || envio.estado === filtros.estado;
        const matchBusqueda = !filtros.busqueda || 
            envio.paciente.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            envio.numero.includes(filtros.busqueda);
        
        return matchTipo && matchEstado && matchBusqueda;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                        Historial de Envíos
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Registro completo de WhatsApp y llamadas de voz
                    </p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Envíos</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Exitosos</p>
                                <p className="text-2xl font-bold text-green-400">{stats.exitosos}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Fallidos</p>
                                <p className="text-2xl font-bold text-red-400">{stats.fallidos}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Tasa de Éxito</p>
                                <p className="text-2xl font-bold text-purple-400">{stats.tasaExito}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Mensaje de Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-5 h-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                <Filter className="w-4 h-4 inline mr-1" />
                                Tipo
                            </label>
                            <select
                                value={filtros.tipo}
                                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="todos">Todos</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="voz">Voz</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                <Filter className="w-4 h-4 inline mr-1" />
                                Estado
                            </label>
                            <select
                                value={filtros.estado}
                                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="todos">Todos</option>
                                <option value="exitoso">Exitosos</option>
                                <option value="fallido">Fallidos</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Buscar
                            </label>
                            <input
                                type="text"
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                                placeholder="Paciente o número..."
                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={exportarCSV}
                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Exportar CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Tipo</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Paciente</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Número</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Servicio</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Fecha</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Estado</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Intentos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                                            <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
                                            Cargando historial...
                                        </td>
                                    </tr>
                                ) : enviosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                                            No se encontraron resultados
                                        </td>
                                    </tr>
                                ) : (
                                    enviosFiltrados.map((envio) => (
                                        <tr key={envio.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3">{getTipoBadge(envio.tipo)}</td>
                                            <td className="px-4 py-3 text-white">{envio.paciente}</td>
                                            <td className="px-4 py-3 text-gray-300">{envio.numero}</td>
                                            <td className="px-4 py-3 text-gray-300">{envio.servicio}</td>
                                            <td className="px-4 py-3 text-gray-300 text-sm">
                                                {new Date(envio.fecha).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-3">{getEstadoBadge(envio.estado)}</td>
                                            <td className="px-4 py-3 text-gray-300 text-center">{envio.intentos}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Paginación (opcional) */}
                <div className="mt-4 text-center text-sm text-gray-400">
                    Mostrando {enviosFiltrados.length} de {envios.length} resultados
                </div>
            </div>
        </div>
    );
};

export default HistorialEnvios;