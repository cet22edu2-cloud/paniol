import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import StatsCards from './StatsCards';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHerramientas: 0,
    prestamosActivos: 0,
    herramientasCriticas: 0,
    prestamosSemana: 0,
    docentesActivos: 0,
    talleres: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 Obteniendo estadísticas...');

        // 1. Total de herramientas
        const { count: totalHerramientas, error: err1 } = await supabase
          .from('herramientas')
          .select('*', { count: 'exact', head: true });

        if (err1) console.error('Error en herramientas:', err1);

        // 2. Préstamos activos
        const { count: prestamosActivos, error: err2 } = await supabase
          .from('prestamos')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'ABIERTO');

        if (err2) console.error('Error en préstamos activos:', err2);

        // 3. Stock crítico - obtener datos y calcular manualmente
        const { data: stockData, error: err3 } = await supabase
          .from('herramientas')
          .select('stock, stock_minimo');

        if (err3) console.error('Error en stock crítico:', err3);

        const herramientasCriticas = stockData 
          ? stockData.filter(h => h.stock <= h.stock_minimo).length 
          : 0;

        // 4. Préstamos de la última semana
        const fechaSemana = new Date();
        fechaSemana.setDate(fechaSemana.getDate() - 7);
        
        const { count: prestamosSemana, error: err4 } = await supabase
          .from('prestamos')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_prestamo', fechaSemana.toISOString());

        if (err4) console.error('Error en préstamos semana:', err4);

        // 5. Docentes activos
        const { count: docentesActivos, error: err5 } = await supabase
          .from('docentes')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true);

        if (err5) console.error('Error en docentes:', err5);

        // 6. Total de talleres
        const { count: talleres, error: err6 } = await supabase
          .from('talleres')
          .select('*', { count: 'exact', head: true });

        if (err6) console.error('Error en talleres:', err6);

        console.log('📊 Resultados:');
        console.log('Total Herramientas:', totalHerramientas);
        console.log('Préstamos activos:', prestamosActivos);
        console.log('Stock crítico:', herramientasCriticas);
        console.log('Préstamos semana:', prestamosSemana);
        console.log('Docentes activos:', docentesActivos);
        console.log('Talleres:', talleres);

        setStats({
          totalHerramientas: totalHerramientas || 0,
          prestamosActivos: prestamosActivos || 0,
          herramientasCriticas: herramientasCriticas || 0,
          prestamosSemana: prestamosSemana || 0,
          docentesActivos: docentesActivos || 0,
          talleres: talleres || 0
        });

      } catch (err) {
        console.error('❌ Error general:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error al cargar los datos: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <StatsCards stats={stats} />
    </div>
  );
};

export default Dashboard;