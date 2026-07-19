import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { crearHerramienta, actualizarHerramienta } from '../../hooks/useHerramientas';

const HerramientaForm = ({ herramienta, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: herramienta || {}
  });

  useEffect(() => {
    const fetchData = async () => {
      const [categoriasRes, talleresRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('activo', true),
        supabase.from('talleres').select('*').eq('activo', true)
      ]);
      setCategorias(categoriasRes.data || []);
      setTalleres(talleresRes.data || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (herramienta) {
        await actualizarHerramienta(herramienta.id, data);
      } else {
        await crearHerramienta(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {herramienta ? 'Editar Herramienta' : 'Nueva Herramienta'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código</label>
              <input
                {...register('codigo')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input
                {...register('descripcion')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select
                {...register('categoria_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Taller</label>
              <select
                {...register('taller_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {talleres.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                {...register('marca')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input
                {...register('modelo')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
              <input
                type="number"
                {...register('stock_minimo', { valueAsNumber: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HerramientaForm;