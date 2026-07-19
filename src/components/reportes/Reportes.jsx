import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';

const Reportes = () => {
  const [reporteTalleres, setReporteTalleres] = useState([]);
  const [reporteStock, setReporteStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        // Reporte de préstamos por taller
        const { data: talleres } = await supabase
          .from('talleres')
          .select(`
            nombre,
            prestamos(
              id,
              estado,
              prestamos_detalle(cantidad)
            )
          `)
          .eq('activo', true);

        // Reporte de stock crítico
        const { data: stock } = await supabase
          .from('herramientas')
          .select('codigo, descripcion, stock, stock_minimo, taller: talleres(nombre)')
          .lte('stock', 'stock_minimo')
          .eq('activo', true);

        setReporteTalleres(talleres || []);
        setReporteStock(stock || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Préstamos por Taller</h2>
          <div className="space-y-3">
            {reporteTalleres.map((taller) => {
              const prestamos = taller.prestamos || [];
              const total = prestamos.length;
              const activos = prestamos.filter(p => p.estado === 'ABIERTO').length;
              const herramientas = prestamos.reduce((sum, p) => 
                sum + (p.prestamos_detalle?.length || 0), 0
              );

              return (
                <div key={taller.nombre} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{taller.nombre}</span>
                    <span className="text-sm text-gray-500">
                      {activos} activos / {total} totales
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Herramientas prestadas: {herramientas}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Stock Crítico</h2>
          {reporteStock.length === 0 ? (
            <p className="text-gray-500">No hay herramientas con stock bajo</p>
          ) : (
            <div className="space-y-3">
              {reporteStock.map((herramienta) => (
                <div key={herramienta.codigo} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-medium">{herramienta.codigo}</span>
                    <span className="ml-2 text-sm">{herramienta.descripcion}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {herramienta.taller?.nombre}
                    </span>
                  </div>
                  <span className="text-red-600 font-bold">
                    Stock: {herramienta.stock} (Mín: {herramienta.stock_minimo})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;