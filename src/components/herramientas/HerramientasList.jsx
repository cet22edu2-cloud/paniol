import React, { useState } from 'react';
import { useHerramientas } from '../../hooks/useHerramientas';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../common/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import HerramientaCard from './HerramientaCard';
import HerramientaForm from './HerramientaForm';
import ImportData from '../common/ImportData';

const HerramientasList = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);
  const { data: herramientas, loading, error, refetch } = useHerramientas({ search });

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Herramientas</h1>
        <div className="flex gap-2">
          {(role === 'ADMIN') && (
            <>
              <button
                onClick={() => setShowImport(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                📥 Importar Excel
              </button>
              <button
                onClick={() => {
                  setSelectedHerramienta(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Nueva Herramienta
              </button>
            </>
          )}
        </div>
      </div>

      <SearchBar
        placeholder="Buscar herramienta..."
        onSearch={setSearch}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {herramientas.map((herramienta) => (
          <HerramientaCard
            key={herramienta.id}
            herramienta={herramienta}
            onEdit={() => {
              setSelectedHerramienta(herramienta);
              setShowForm(true);
            }}
          />
        ))}
      </div>

      {herramientas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay herramientas registradas
        </div>
      )}

      {showForm && (
        <HerramientaForm
          herramienta={selectedHerramienta}
          onClose={() => {
            setShowForm(false);
            setSelectedHerramienta(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedHerramienta(null);
            refetch();
          }}
        />
      )}

      {showImport && (
        <ImportData
          tipo="herramientas"
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default HerramientasList;