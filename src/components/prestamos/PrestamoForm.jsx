import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PrestamoForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [tiposSolicitud, setTiposSolicitud] = useState([]);
  const [filteredHerramientas, setFilteredHerramientas] = useState([]);

  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      items: [{ herramienta_id: '', cantidad: 1 }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const tallerId = watch('taller_id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docentesRes, herramientasRes, talleresRes, cursosRes, tiposRes] = await Promise.all([
          supabase.from('docentes').select('*').eq('activo', true),
          supabase.from('herramientas').select('*, taller_id').eq('activo', true).gt('stock', 0),
          supabase.from('talleres').select('*').eq('activo', true),
          supabase.from('cursos').select('*, especialidad:especialidades(nombre)').eq('activo', true),
          supabase.from('tipos_solicitud').select('*')
        ]);

        setDocentes(docentesRes.data || []);
        setHerramientas(herramientasRes.data || []);
        setTalleres(talleresRes.data || []);
        setCursos(cursosRes.data || []);
        setTiposSolicitud(tiposRes.data || []);
        setFilteredHerramientas(herramientasRes.data || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (tallerId) {
      const filtered = herramientas.filter(h => h.taller_id === tallerId);
      setFilteredHerramientas(filtered);
    } else {
      setFilteredHerramientas(herramientas);
    }
  }, [tallerId, herramientas]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (!data.items || data.items.length === 0) {
        alert('Debe agregar al menos una herramienta');
        setLoading(false);
        return;
      }

      const prestamoData = {
        usuario_id: user.id,
        docente_id: data.docente_id,
        taller_id: data.taller_id,
        curso_id: data.curso_id || null,
        tipo_solicitud_id: data.tipo_solicitud_id,
        observaciones: data.observaciones || '',
        estado: 'ABIERTO'
      };

      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .insert(prestamoData)
        .select()
        .single();

      if (prestamoError) throw prestamoError;

      const detalles = data.items.map(item => ({
        prestamo_id: prestamo.id,
        herramienta_id: item.herramienta_id,
        cantidad: parseInt(item.cantidad),
        estado_salida: 'BUENO'
      }));

      const { error: detalleError } = await supabase
        .from('prestamos_detalle')
        .insert(detalles);

      if (detalleError) throw detalleError;

      for (const item of data.items) {
        const { data: herramienta, error: stockError } = await supabase
          .from('herramientas')
          .select('stock')
          .eq('id', item.herramienta_id)
          .single();

        if (stockError) throw stockError;

        const nuevoStock = herramienta.stock - parseInt(item.cantidad);
        
        const { error: updateError } = await supabase
          .from('herramientas')
          .update({ stock: nuevoStock })
          .eq('id', item.herramienta_id);

        if (updateError) throw updateError;

        const { error: movimientoError } = await supabase
          .from('movimientos_stock')
          .insert({
            herramienta_id: item.herramienta_id,
            usuario_id: user.id,
            tipo: 'SALIDA',
            cantidad: parseInt(item.cantidad),
            referencia: prestamo.id,
            observacion: `Préstamo #${prestamo.id}`
          });

        if (movimientoError) throw movimientoError;
      }

      alert('✅ Préstamo creado exitosamente');
      
      setLoading(false);
      
      // Primero actualizar la lista (onSuccess)
      if (onSuccess && typeof onSuccess === 'function') {
        await onSuccess();
      }
      
      // Luego cerrar el modal (onClose)
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
      
    } catch (error) {
      console.error('Error creando préstamo:', error);
      alert('❌ Error al crear el préstamo: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Nuevo Préstamo</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Docente *</label>
              <select
                {...register('docente_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {docentes.map(docente => (
                  <option key={docente.id} value={docente.id}>
                    {docente.apellido}, {docente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Taller *</label>
              <select
                {...register('taller_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {talleres.map(taller => (
                  <option key={taller.id} value={taller.id}>
                    {taller.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Curso</label>
              <select
                {...register('curso_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {cursos.map(curso => (
                  <option key={curso.id} value={curso.id}>
                    {curso.año}° {curso.division} - {curso.especialidad?.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Solicitud *</label>
              <select
                {...register('tipo_solicitud_id')}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {tiposSolicitud.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              {...register('observaciones')}
              rows="2"
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Herramientas *</label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <select
                    {...register(`items.${index}.herramienta_id`)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar herramienta...</option>
                    {filteredHerramientas.map(herramienta => (
                      <option key={herramienta.id} value={herramienta.id}>
                        {herramienta.codigo} - {herramienta.descripcion} (Stock: {herramienta.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    {...register(`items.${index}.cantidad`, { min: 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cant."
                    min="1"
                    required
                  />
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 px-3 py-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ herramienta_id: '', cantidad: 1 })}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Agregar herramienta
            </button>
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
              {loading ? 'Creando...' : 'Crear Préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrestamoForm;