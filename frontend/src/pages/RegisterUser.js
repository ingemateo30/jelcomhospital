import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

const RegisterUser = () => {
  const [formData, setFormData] = useState({ nombre: "", email: "", password: "" });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No tienes un token de autenticación. Inicia sesión.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al obtener usuarios");

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.nombre || !formData.email || !formData.password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error en el registro");

      setSuccess("Usuario registrado con éxito");
      setFormData({ nombre: "", email: "", password: "" });
      fetchUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const toggleUserStatus = async (id, estado) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No tienes un token de autenticación. Inicia sesión.");
      return;
    }

    try {
      const nuevoEstado = estado === "activo" ? "inactivo" : "activo";
      const response = await fetch(`${API_BASE_URL}/auth/usuarios/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) throw new Error("Error al actualizar el estado del usuario");

      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === id ? { ...user, estado: nuevoEstado } : user))
      );
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto">
      <h2 className="text-orange-400 text-3xl font-bold text-center mb-6">Registrar Usuario</h2>

      {error && <p className="text-red-500 bg-red-900 p-2 rounded-md text-center">{error}</p>}
      {success && <p className="text-green-400 bg-green-900 p-2 rounded-md text-center">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-orange-500"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-orange-500"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-orange-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 transition-all duration-300 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
        >
          {loading ? "Registrando..." : "Registrar Usuario"}
        </button>
      </form>

      <h3 className="text-orange-400 text-xl font-bold mt-8">Lista de Usuarios</h3>
      <div className="overflow-x-auto mt-4">
        <table className="w-full bg-gray-700 text-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-gray-900">
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Rol</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-600">
                  <td className="py-3 px-4">{user.nombre}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.rol}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={user.estado === "activo" ? "text-green-400" : "text-red-400"}>
                      {user.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.estado)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 shadow-lg ${
                        user.estado === "activo"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {user.estado === "activo" ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 px-4 text-center" colSpan="5">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegisterUser;


