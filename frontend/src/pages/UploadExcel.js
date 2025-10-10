import { useState } from "react";
import axios from "axios";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const UploadExcel = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage("");
    };

    const handleUnauthorized = (error) => {
        if (error.response?.status === 401) {
            console.warn("Token expirado. Cerrando sesión...");
            localStorage.removeItem("token");
            window.location.href = "/login"; 
            return "Sesión expirada. Redirigiendo al login...";
        }
        return error.response?.data?.message || "Error al subir el archivo.";
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Por favor selecciona un archivo.");
            return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        const token = localStorage.getItem("token");
    
        if (!token) {
            setMessage("No tienes un token de autenticación. Inicia sesión nuevamente.");
            return;
        }
    
        try {
            setIsLoading(true);
            const response = await axios.post(
                "http://localhost:3001/api/citas/subir-excel",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
    
            setMessage(response.data.message);
        } catch (error) {
            setMessage(handleUnauthorized(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700/30 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                        Cargar Excel
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Sube tu archivo .xlsx para procesar las citas
                    </p>
                </div>

                <div className="space-y-6">
                    {/* File Input */}
                    <div className="group relative">
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileChange}
                            className="hidden"
                            id="fileInput"
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="fileInput"
                            className={`flex flex-col items-center justify-center border-2 border-dashed border-orange-500/30 rounded-xl p-6 cursor-pointer transition-all
                            ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-orange-500/50 hover:bg-slate-700/20"}`}
                        >
                            <Upload className="w-12 h-12 text-orange-400 mb-3" />
                            <span className="text-orange-300 font-medium">
                                {file ? file.name : "Seleccionar archivo"}
                            </span>
                            <span className="text-gray-400 text-sm mt-1">
                                {file ? "Haz clic para cambiar" : "Formatos soportados: .xlsx"}
                            </span>
                        </label>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || isLoading}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Subir Archivo
                            </>
                        )}
                    </button>

                    {/* Messages */}
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
                            message.toLowerCase().includes("éxito") || message.toLowerCase().includes("exitosamente") 
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                            {message.toLowerCase().includes("éxito") || message.toLowerCase().includes("exitosamente") ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm">{message}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadExcel;
