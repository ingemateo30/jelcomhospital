import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!newPassword || newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || "http://192.168.70.23:3000/api"}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al restablecer la contraseña.");

            setMessage(data.message);
            setNewPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-black opacity-90"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-black/40 backdrop-blur-md rounded-2xl shadow-lg border border-orange-500/50">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-orange-400 mb-2">
                        Nueva Contraseña
                    </h2>
                    <p className="text-gray-300">Crea una nueva contraseña segura</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-orange-500/10 backdrop-blur-md border border-orange-400/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 text-white font-bold bg-orange-500 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <>
                                <span>Restablecer</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${
                            message.toLowerCase().includes("éxito") 
                            ? "bg-green-500/10 border border-green-500/20" 
                            : "bg-red-500/10 border border-red-500/20"
                        }`}>
                            {message.toLowerCase().includes("éxito") ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <p className={`text-sm ${
                                message.toLowerCase().includes("éxito") 
                                ? "text-green-400" 
                                : "text-red-400"
                            }`}>{message}</p>
                        </div>
                    )}

                    <div className="text-center">
                        <Link 
                            to="/login"
                            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                        >
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
