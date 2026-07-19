import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import StatsCards from './StatsCards';
import ChartCard from './ChartCard';
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

        const [
          herramientasRes,
          prestamosRes,
          stockRes,
          semanaRes,
          docentesRes,
          talleresRes
        ] = await Promise.all([
          supabase.from('herramientas').select('*', { count: 'exact', head: true }),
          supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'ABIERTO'),
          supabase.from('herramientas').select('*', { count: 'exact', head: true }).lte('stock', 'stock_minimo'),
          supabase.from('prestamos').select('*', { count: 'exact', head: true })
            .gte('fecha_prestamo', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('docentes').select('*', { count: 'exact', head: true }).eq('activo', true),
          supabase.from('talleres').select('*', { count: 'exact', head: true })
        ]);

        console.log('✅ Herramientas:', herramientasRes.count);
        console.log('✅ Préstamos activos:', prestamosRes.count);
        console.log('✅ Stock crítico:', stockRes.count);
        console.log('✅ Préstamos semana:', semanaRes.count);
        console.log('✅ Docentes activos:', docentesRes.count);
        console.log('✅ Talleres:', talleresRes.count);

        setStats({
          totalHerramientas: herramientasRes.count || 0,
          prestamosActivos: prestamosRes.count || 0,
          herramientasCriticas: stockRes.count || 0,
          prestamosSemana: semanaRes.count || 0,
          docentesActivos: docentesRes.count || 0,
          talleres: talleresRes.count || 0
        });

      } catch (err) {
        console.error('❌ Error:', err);
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
        <p className="text-red-600">Error: {error}</p>
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
      <ChartCard />
    </div>
  );
};

export default Dashboard;