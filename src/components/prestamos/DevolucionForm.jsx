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
      console.log('📋 Datos del préstamo:', prestamo);
      console.log('📋 Detalles del préstamo:', prestamo?.prestamos_detalle);

      // Verificar que hay detalles
      if (!prestamo?.prestamos_detalle || prestamo.prestamos_detalle.length === 0) {
        throw new Error('No hay herramientas asociadas a este préstamo');
      }

      // 1. Actualizar cada detalle con su estado de devolución
      for (const detalle of prestamo.prestamos_detalle) {
        console.log(`📝 Procesando detalle:`, detalle);

        // Validar que detalle tenga id
        if (!detalle.id) {
          console.error('❌ Detalle sin ID:', detalle);
          throw new Error('Detalle sin ID');
        }

        // Validar que detalle tenga herramienta_id
        if (!detalle.herramienta_id) {
          console.error('❌ Detalle sin herramienta_id:', detalle);
          throw new Error('Detalle sin herramienta_id');
        }

        console.log(`📝 Actualizando detalle ${detalle.id}...`);

        // 1. Actualizar detalle
        const { data: updatedDetalle, error: detalleError } = await supabase
          .from('prestamos_detalle')
          .update({
            estado_devolucion: estados[detalle.id] || 'BUENO',
            fecha_devolucion: new Date().toISOString()
          })
          .eq('id', detalle.id)
          .select();

        if (detalleError) {
          console.error('❌ Error en detalle:', detalleError);
          throw detalleError;
        }

        console.log('✅ Detalle actualizado:', updatedDetalle);

        // 2. Obtener stock actual
        const { data: herramienta, error: stockError } = await supabase
          .from('herramientas')
          .select('stock')
          .eq('id', detalle.herramienta_id)
          .single();

        if (stockError) {
          console.error('❌ Error al obtener stock:', stockError);
          throw stockError;
        }

        const nuevoStock = herramienta.stock + detalle.cantidad;
        console.log(`📊 Actualizando stock: ${herramienta.stock} → ${nuevoStock}`);

        // 3. Actualizar stock
        const { error: updateError } = await supabase
          .from('herramientas')
          .update({ stock: nuevoStock })
          .eq('id', detalle.herramienta_id);

        if (updateError) {
          console.error('❌ Error al actualizar stock:', updateError);
          throw updateError;
        }

        // 4. Registrar movimiento
        console.log('📝 Registrando movimiento...');
        const movimiento = {
          herramienta_id: detalle.herramienta_id,
          usuario_id: user.id,
          tipo: 'DEVOLUCION',
          cantidad: detalle.cantidad,
          referencia: prestamo.id,
          observacion: `Devolución del préstamo #${prestamo.id}`
        };

        console.log('📝 Movimiento a insertar:', movimiento);

        const { data: movimientoData, error: movimientoError } = await supabase
          .from('movimientos_stock')
          .insert(movimiento)
          .select();

        if (movimientoError) {
          console.error('❌ Error al registrar movimiento:', movimientoError);
          throw movimientoError;
        }

        console.log('✅ Movimiento registrado:', movimientoData);
      }

      // 5. Cerrar préstamo
      console.log('📝 Cerrando préstamo...');
      const { data: closedPrestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .update({
          estado: 'CERRADO',
          fecha_cierre: new Date().toISOString()
        })
        .eq('id', prestamo.id)
        .select();

      if (prestamoError) {
        console.error('❌ Error al cerrar préstamo:', prestamoError);
        throw prestamoError;
      }

      console.log('✅ Préstamo cerrado:', closedPrestamo);
      console.log('✅ Devolución completada exitosamente');
      alert('✅ Devolución completada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error al devolver:', error);
      alert('❌ Error al procesar la devolución: ' + error.message);
    } finally {
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