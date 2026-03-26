import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import logo from '../assets/logos-jelcom.png';
import { API_BASE_URL } from "../config";

const API_URL = API_BASE_URL;

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [animateFields, setAnimateFields] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setAnimateFields(true);
        }, 100);
    }, []);

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!validateEmail(email)) {
            setMessage("Por favor, ingresa un correo válido.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() })
            });

            if (!response.ok) throw new Error("No se pudo procesar la solicitud.");

            const data = await response.json();
            setMessage(data.message || "Si el correo es válido, recibirás un enlace.");
        } catch (error) {
            setMessage("Hubo un error, intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-gray-900 to-black"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-orange-500/30">
                <div className="flex flex-col items-center mb-8">
                    <img src={logo} alt="Jelcom Logo" className="h-16 mb-4" />
                    <h2 className="text-center text-3xl font-bold mb-1">
                        <span className="text-white">Recuperar </span>
                        <span className="text-orange-500">Contraseña</span>
                    </h2>
                    <p className="text-center text-gray-400">Ingresa tu correo para restablecer tu contraseña</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className={`relative transition-all duration-500 ${animateFields ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <label className="text-sm text-orange-400 font-medium ml-2 mb-1 block">Correo electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 text-white font-bold bg-orange-500 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                                <span>Enviando...</span>
                            </div>
                        ) : (
                            <>
                                <span>Enviar enlace</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${
                            message.toLowerCase().includes("recibirás") 
                            ? "bg-green-500/10 border border-green-500/20" 
                            : "bg-red-500/10 border border-red-500/20"
                        }`}>
                            {message.toLowerCase().includes("recibirás") ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <p className={`text-sm ${
                                message.toLowerCase().includes("recibirás") 
                                ? "text-green-400" 
                                : "text-red-400"
                            }`}>{message}</p>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/login" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
