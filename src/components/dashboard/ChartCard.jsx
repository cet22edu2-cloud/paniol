import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';

const ChartCard = () => {
  const [chartData, setChartData] = useState({
    prestamosPorTaller: [],
    prestamosPorDia: [],
    herramientasPorCategoria: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // 1. Préstamos por taller
        const { data: prestamosTaller } = await supabase
          .from('prestamos')
          .select(`
            taller:talleres(nombre),
            estado
          `);

        const talleresMap = {};
        prestamosTaller?.forEach(p => {
          const nombre = p.taller?.nombre || 'Sin taller';
          talleresMap[nombre] = (talleresMap[nombre] || 0) + 1;
        });

        const prestamosPorTaller = Object.entries(talleresMap).map(([name, value]) => ({
          name,
          value
        }));

        // 2. Herramientas por categoría
        const { data: herramientas } = await supabase
          .from('herramientas')
          .select(`
            categoria:categorias(nombre)
          `)
          .eq('activo', true);

        const categoriasMap = {};
        herramientas?.forEach(h => {
          const nombre = h.categoria?.nombre || 'Sin categoría';
          categoriasMap[nombre] = (categoriasMap[nombre] || 0) + 1;
        });

        const herramientasPorCategoria = Object.entries(categoriasMap).map(([name, value]) => ({
          name,
          value
        }));

        // 3. Préstamos por día (últimos 7 días)
        const { data: prestamosSemana } = await supabase
          .from('prestamos')
          .select('fecha_prestamo')
          .gte('fecha_prestamo', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const diasMap = {};
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        diasSemana.forEach(d => diasMap[d] = 0);

        prestamosSemana?.forEach(p => {
          const fecha = new Date(p.fecha_prestamo);
          const dia = diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
          diasMap[dia] = (diasMap[dia] || 0) + 1;
        });

        const prestamosPorDia = Object.entries(diasMap).map(([name, value]) => ({
          name,
          value
        }));

        setChartData({
          prestamosPorTaller,
          prestamosPorDia,
          herramientasPorCategoria,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error cargando gráficos:', error);
        setChartData(prev => ({ ...prev, loading: false, error: error.message }));
      }
    };

    fetchChartData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (chartData.loading) return <LoadingSpinner />;
  if (chartData.error) return <div className="text-red-600">Error: {chartData.error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Gráfico: Préstamos por Taller */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Préstamos por Taller</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.prestamosPorTaller}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0088FE" name="Préstamos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: Herramientas por Categoría */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Herramientas por Categoría</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.herramientasPorCategoria}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.herramientasPorCategoria.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: Préstamos por Día */}
      <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Préstamos de la Semana</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.prestamosPorDia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#00C49F" name="Préstamos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;