// frontend/src/components/ProgramarRecordatorio.js
import React, { useState } from 'react';
import axios from 'axios';

const ProgramarRecordatorio = () => {
  const [citaId, setCitaId] = useState('');
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/voz/programar-llamada', { citaId });
      setResultado(response.data);
    } catch (error) {
      setResultado({ error: error.response.data.error });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Enviar Recordatorio de Cita</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID de la Cita:</label>
          <input
            type="number"
            value={citaId}
            onChange={(e) => setCitaId(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Enviar Recordatorio
        </button>
      </form>

      {resultado && (
        <div className={`mt-4 p-4 rounded-md ${
          resultado.error ? 'bg-red-100' : 'bg-green-100'
        }`}>
          {resultado.error ? (
            <p className="text-red-600">Error: {resultado.error}</p>
          ) : (
            <div>
              <p className="text-green-600 font-medium">✓ Recordatorio enviado</p>
              <p className="mt-2 text-sm text-gray-600">
                ID de llamada: {resultado.sid}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramarRecordatorio;