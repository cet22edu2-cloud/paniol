import React, { useState } from 'react';
import { useDocentes } from '../../hooks/useDocentes';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../common/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import DocenteForm from './DocenteForm';

const DocentesList = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const { data: docentes, loading, error, refetch } = useDocentes({ search });

  const handleEdit = (docente) => {
    setSelectedDocente(docente);
    setShowForm(true);
  };

  const handleSuccess = () => {
    refetch();
    setShowForm(false);
    setSelectedDocente(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Docentes</h1>
        {(role === 'ADMIN') && (
          <button
            onClick={() => {
              setSelectedDocente(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nuevo Docente
          </button>
        )}
      </div>

      <SearchBar placeholder="Buscar docente..." onSearch={setSearch} />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docentes && docentes.length > 0 ? (
              docentes.map((docente) => (
                <tr key={docente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{docente.apellido}</td>
                  <td className="px-6 py-4">{docente.nombre}</td>
                  <td className="px-6 py-4">{docente.dni}</td>
                  <td className="px-6 py-4">{docente.taller?.nombre || 'N/A'}</td>
                  <td className="px-6 py-4">{docente.email}</td>
                  <td className="px-6 py-4">
                    {role === 'ADMIN' && (
                      <button
                        onClick={() => handleEdit(docente)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No hay docentes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <DocenteForm
          docente={selectedDocente}
          onClose={() => {
            setShowForm(false);
            setSelectedDocente(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default DocentesList;