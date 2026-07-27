import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const DevolucionForm = ({ prestamo, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [estados, setEstados] = useState(
    prestamo?.prestamos_detalle?.reduce((acc, item) => {
      acc[item.id] = 'BUENO';
      return acc;
    }, {}) || {}
  );

  const handleEstadoChange = (detalleId, estado) => {
    setEstados(prev => ({ ...prev, [detalleId]: estado }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Procesando devolución...');

      if (!prestamo?.prestamos_detalle || prestamo.prestamos_detalle.length === 0) {
        throw new Error('No hay herramientas asociadas a este préstamo');
      }

      for (const detalle of prestamo.prestamos_detalle) {
        let herramientaId = detalle.herramienta_id;
        
        if (!herramientaId && detalle.herramienta && detalle.herramienta.id) {
          herramientaId = detalle.herramienta.id;
        }

        if (!herramientaId) {
          throw new Error('Detalle sin herramienta_id');
        }

        const { error: detalleError } = await supabase
          .from('prestamos_detalle')
          .update({
            estado_devolucion: estados[detalle.id] || 'BUENO',
            fecha_devolucion: new Date().toISOString()
          })
          .eq('id', detalle.id);

        if (detalleError) throw detalleError;

        const { data: herramienta, error: stockError } = await supabase
          .from('herramientas')
          .select('stock')
          .eq('id', herramientaId)
          .single();

        if (stockError) throw stockError;

        const nuevoStock = herramienta.stock + detalle.cantidad;

        const { error: updateError } = await supabase
          .from('herramientas')
          .update({ stock: nuevoStock })
          .eq('id', herramientaId);

        if (updateError) throw updateError;

        const { error: movimientoError } = await supabase
          .from('movimientos_stock')
          .insert({
            herramienta_id: herramientaId,
            usuario_id: user.id,
            tipo: 'DEVOLUCION',
            cantidad: detalle.cantidad,
            referencia: prestamo.id,
            observacion: `Devolución del préstamo #${prestamo.id}`
          });

        if (movimientoError) throw movimientoError;
      }

      const { error: prestamoError } = await supabase
        .from('prestamos')
        .update({
          estado: 'CERRADO',
          fecha_cierre: new Date().toISOString()
        })
        .eq('id', prestamo.id);

      if (prestamoError) throw prestamoError;

      alert('✅ Devolución completada exitosamente');
      
      setLoading(false);
      
      try {
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (err) {
        console.warn('Error en onSuccess:', err);
      }
      
      try {
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      } catch (err) {
        console.warn('Error en onClose:', err);
      }

    } catch (error) {
      console.error('❌ Error al devolver:', error);
      alert('❌ Error al procesar la devolución: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Devolución de Préstamo</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p><strong>Docente:</strong> {prestamo?.docente?.apellido}, {prestamo?.docente?.nombre}</p>
          <p><strong>Taller:</strong> {prestamo?.taller?.nombre}</p>
          <p><strong>Fecha:</strong> {new Date(prestamo?.fecha_prestamo).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de las herramientas devueltas
            </label>
            {prestamo?.prestamos_detalle?.map((detalle) => (
              <div key={detalle.id} className="flex items-center justify-between border-b py-2">
                <span>
                  {detalle.herramienta?.codigo} - {detalle.herramienta?.descripcion}
                  <span className="ml-2 text-sm text-gray-500">(x{detalle.cantidad})</span>
                </span>
                <select
                  value={estados[detalle.id] || 'BUENO'}
                  onChange={(e) => handleEstadoChange(detalle.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="BUENO">Bueno</option>
                  <option value="REGULAR">Regular</option>
                  <option value="MALO">Malo</option>
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="2"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales sobre la devolución..."
            />
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucionForm;