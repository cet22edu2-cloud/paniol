import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

const HerramientaCard = ({ herramienta, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {herramienta.codigo}
            </span>
            {herramienta.stock <= herramienta.stock_minimo && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Stock Bajo
              </span>
            )}
          </div>
          <h3 className="font-semibold mt-2">{herramienta.descripcion}</h3>
          <p className="text-sm text-gray-600">
            {herramienta.marca} {herramienta.modelo}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-600"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Stock:</span>
          <span className="ml-1 font-medium">{herramienta.stock}</span>
        </div>
        <div>
          <span className="text-gray-500">Mínimo:</span>
          <span className="ml-1 font-medium">{herramienta.stock_minimo}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Taller:</span>
          <span className="ml-1">{herramienta.taller?.nombre || 'N/A'}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Categoría:</span>
          <span className="ml-1">{herramienta.categoria?.nombre || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default HerramientaCard;