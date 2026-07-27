import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePrestamos = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando préstamos...');

        // 🔧 CONSULTA SIMPLIFICADA - Evitamos joins complejos
        const { data: prestamosData, error: prestamosError } = await supabase
          .from('prestamos')
          .select('*')
          .order('fecha_prestamo', { ascending: false });

        if (prestamosError) {
          console.error('❌ Error al cargar préstamos:', prestamosError);
          throw prestamosError;
        }

        console.log('📋 Préstamos cargados (sin relaciones):', prestamosData?.length || 0);

        // Si no hay préstamos, devolver vacío
        if (!prestamosData || prestamosData.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Obtener IDs de docentes y talleres
        const docenteIds = [...new Set(prestamosData.map(p => p.docente_id).filter(Boolean))];
        const tallerIds = [...new Set(prestamosData.map(p => p.taller_id).filter(Boolean))];

        console.log('🔍 Docentes a cargar:', docenteIds);
        console.log('🔍 Talleres a cargar:', tallerIds);

        // Cargar docentes
        const { data: docentesData, error: docentesError } = await supabase
          .from('docentes')
          .select('id, apellido, nombre, dni')
          .in('id', docenteIds);

        if (docentesError) {
          console.error('❌ Error al cargar docentes:', docentesError);
        }

        // Cargar talleres
        const { data: talleresData, error: talleresError } = await supabase
          .from('talleres')
          .select('id, nombre')
          .in('id', tallerIds);

        if (talleresError) {
          console.error('❌ Error al cargar talleres:', talleresError);
        }

        // Crear mapas para búsqueda rápida
        const docentesMap = {};
        docentesData?.forEach(d => docentesMap[d.id] = d);

        const talleresMap = {};
        talleresData?.forEach(t => talleresMap[t.id] = t);

        // Combinar datos
        const combinedData = prestamosData.map(p => ({
          ...p,
          docente: docentesMap[p.docente_id] || null,
          taller: talleresMap[p.taller_id] || null
        }));

        console.log('📋 Datos combinados:', combinedData.length);
        console.log('📋 Ejemplo de préstamo combinado:', combinedData[0]);

        setData(combinedData);
      } catch (err) {
        console.error('❌ Error general:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros]);

  return { data, loading, error, refetch: () => {} };
};

export const crearPrestamo = async (prestamo, detalles) => {
  try {
    const { data: prestamoData, error: prestamoError } = await supabase
      .from('prestamos')
      .insert(prestamo)
      .select()
      .single();

    if (prestamoError) throw prestamoError;

    const detallesConPrestamo = detalles.map(d => ({
      ...d,
      prestamo_id: prestamoData.id
    }));

    const { error: detalleError } = await supabase
      .from('prestamos_detalle')
      .insert(detallesConPrestamo);

    if (detalleError) throw detalleError;

    return { data: prestamoData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const devolverPrestamo = async (id) => {
  const { data, error } = await supabase
    .from('prestamos')
    .update({ estado: 'CERRADO', fecha_cierre: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};