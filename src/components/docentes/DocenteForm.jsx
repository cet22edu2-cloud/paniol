import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { crearDocente, actualizarDocente } from '../../hooks/useDocentes';
import LoadingSpinner from '../common/LoadingSpinner';

const DocenteForm = ({ docente, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [talleres, setTalleres] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: docente || {}
  });

  useEffect(() => {
    const fetchData = async () => {
      const [talleresRes, especialidadesRes] = await Promise.all([
        supabase.from('talleres').select('*').eq('activo', true),
        supabase.from('especialidades').select('*').eq('activo', true)
      ]);
      setTalleres(talleresRes.data || []);
      setEspecialidades(especialidadesRes.data || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (docente) {
        await actualizarDocente(docente.id, data);
      } else {
        await crearDocente(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el docente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {docente ? 'Editar Docente' : 'Nuevo Docente'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input
                {...register('apellido')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                {...register('nombre')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input
                {...register('dni')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Legajo</label>
              <input
                {...register('legajo')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                {...register('telefono')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Especialidad</label>
              <select
                {...register('especialidad_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {especialidades.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Taller</label>
              <select
                {...register('taller_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {talleres.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
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

export default DocenteForm;