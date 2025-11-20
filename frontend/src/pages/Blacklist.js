import { useState, useEffect } from "react";
import { Shield, Trash2, Plus, Search, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Blacklist = () => {
    const navigate = useNavigate();
    const [numeros, setNumeros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [modalAgregar, setModalAgregar] = useState(false);
    const [nuevoNumero, setNuevoNumero] = useState({
        telefono: "",
        razon: ""
    });

    useEffect(() => {
        cargarBlacklist();
    }, []);

    const cargarBlacklist = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
                localStorage.clear();
                setTimeout(() => navigate("/login"), 2000);
                return;
            }

            const response = await axios.get('http://localhost:3001/api/blacklist', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNumeros(response.data.data || []);
        } catch (error) {
            console.error("Error cargando blacklist:", error);

            if (error.response?.status === 401) {
                setError("Tu sesión ha expirado. Redirigiendo al login...");
                localStorage.clear();
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError("Error al cargar la lista negra. Por favor, intenta de nuevo.");
            }

            setNumeros([]);
        } finally {
            setLoading(false);
        }
    };

    const agregarNumero = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setExito(null);

        try {
            const token = localStorage.getItem("token");
            const nombre = localStorage.getItem("nombre");

            const response = await axios.post('http://localhost:3001/api/blacklist', {
                telefono: nuevoNumero.telefono,
                razon: nuevoNumero.razon || "Sin especificar",
                bloqueadoPor: nombre || "Usuario"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setExito("Número agregado a la lista negra exitosamente");
            setModalAgregar(false);
            setNuevoNumero({ telefono: "", razon: "" });
            cargarBlacklist();

            setTimeout(() => setExito(null), 3000);
        } catch (error) {
            console.error("Error agregando número:", error);

            if (error.response?.status === 409) {
                setError("Este número ya está en la lista negra");
            } else {
                setError("Error al agregar el número. Por favor, intenta de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    const eliminarNumero = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este número de la lista negra?")) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");

            await axios.delete(`http://localhost:3001/api/blacklist/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setExito("Número eliminado de la lista negra exitosamente");
            cargarBlacklist();

            setTimeout(() => setExito(null), 3000);
        } catch (error) {
            console.error("Error eliminando número:", error);
            setError("Error al eliminar el número. Por favor, intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const numerosFiltrados = numeros.filter(numero => {
        if (!busqueda) return true;
        return numero.telefono.includes(busqueda) ||
               numero.razon?.toLowerCase().includes(busqueda.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-slate-700 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-red-400" />
                                Lista Negra de Números
                            </h1>
                            <p className="text-slate-400">
                                Gestiona los números bloqueados para recordatorios automáticos
                            </p>
                        </div>
                        <button
                            onClick={() => setModalAgregar(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Agregar Número
                        </button>
                    </div>
                </div>

                {/* Alertas */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {exito && (
                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-green-400">{exito}</p>
                    </div>
                )}

                {/* Búsqueda */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por número o razón..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl shadow-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Número de Teléfono
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Razón
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Bloqueado Por
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                            Cargando...
                                        </td>
                                    </tr>
                                ) : numerosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                            No hay números en la lista negra
                                        </td>
                                    </tr>
                                ) : (
                                    numerosFiltrados.map((numero) => (
                                        <tr key={numero.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-white font-mono">
                                                {numero.telefono}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {numero.razon || "Sin especificar"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {numero.bloqueado_por || "Sistema"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(numero.created_at).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => eliminarNumero(numero.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Total */}
                <div className="mt-4 text-right text-slate-400">
                    Total: {numerosFiltrados.length} número(s) bloqueado(s)
                </div>
            </div>

            {/* Modal Agregar */}
            {modalAgregar && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Agregar Número a Lista Negra
                        </h2>
                        <form onSubmit={agregarNumero}>
                            <div className="mb-4">
                                <label className="block text-slate-300 mb-2">
                                    Número de Teléfono *
                                </label>
                                <input
                                    type="text"
                                    value={nuevoNumero.telefono}
                                    onChange={(e) => setNuevoNumero({...nuevoNumero, telefono: e.target.value})}
                                    placeholder="Ej: 3001234567"
                                    required
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-slate-300 mb-2">
                                    Razón del Bloqueo
                                </label>
                                <textarea
                                    value={nuevoNumero.razon}
                                    onChange={(e) => setNuevoNumero({...nuevoNumero, razon: e.target.value})}
                                    placeholder="Motivo por el cual se bloquea el número..."
                                    rows="3"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalAgregar(false);
                                        setNuevoNumero({ telefono: "", razon: "" });
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Agregando..." : "Agregar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blacklist;
