import React, { useState } from 'react';
import { usePrestamos } from '../../hooks/usePrestamos';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../common/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import DevolucionForm from './DevolucionForm';
import PrestamoForm from './PrestamoForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PrestamosList = () => {
  const { role } = useAuth();
  const [filtros, setFiltros] = useState({ estado: 'ABIERTO' });
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [showPrestamoForm, setShowPrestamoForm] = useState(false);
  const { data: prestamos, loading, error, refetch } = usePrestamos(filtros);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ABIERTO': return 'bg-yellow-100 text-yellow-800';
      case 'CERRADO': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDevolucion = (prestamo) => {
    setSelectedPrestamo(prestamo);
    setShowDevolucion(true);
  };

  const handleDevolucionSuccess = () => {
    console.log('🔄 Actualizando lista de préstamos...');
    refetch();
  };

  const handlePrestamoSuccess = () => {
    setShowPrestamoForm(false);
    refetch();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Préstamos</h1>
        {(role === 'ADMIN' || role === 'PANOL') && (
          <button
            onClick={() => setShowPrestamoForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nuevo Préstamo
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <SearchBar
          placeholder="Buscar por docente..."
          onSearch={(term) => setFiltros({ ...filtros, search: term })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="ABIERTO">Abiertos</option>
          <option value="CERRADO">Cerrados</option>
          <option value="TODOS">Todos</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Herramientas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prestamos && prestamos.length > 0 ? (
              prestamos.map((prestamo) => (
                <tr key={prestamo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {prestamo.docente?.apellido}, {prestamo.docente?.nombre}
                  </td>
                  <td className="px-6 py-4">{prestamo.taller?.nombre}</td>
                  <td className="px-6 py-4">
                    {format(new Date(prestamo.fecha_prestamo), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    {prestamo.prestamos_detalle?.length || 0} herramientas
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(prestamo.estado)}`}>
                      {prestamo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">Ver</button>
                    {prestamo.estado === 'ABIERTO' && (role === 'ADMIN' || role === 'PANOL') && (
                      <button
                        onClick={() => handleDevolucion(prestamo)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Devolver
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No hay préstamos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Devolución */}
      {showDevolucion && selectedPrestamo && (
        <DevolucionForm
          prestamo={selectedPrestamo}
          onClose={() => {
            console.log('🔒 Cerrando modal de devolución...');
            setShowDevolucion(false);
            setSelectedPrestamo(null);
          }}
          onSuccess={handleDevolucionSuccess}
        />
      )}

      {/* Modal de Nuevo Préstamo */}
      {showPrestamoForm && (
        <PrestamoForm
          onClose={() => setShowPrestamoForm(false)}
          onSuccess={handlePrestamoSuccess}
        />
      )}
    </div>
  );
};

export default PrestamosList;