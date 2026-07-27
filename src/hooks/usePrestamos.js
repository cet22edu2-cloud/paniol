import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePrestamos = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando préstamos con filtros:', filtros);

      // 🔧 CONSULTA CORREGIDA - Incluye docente y filtros
      let query = supabase
        .from('prestamos')
        .select(`
          *,
          docente:docentes(
            id,
            apellido,
            nombre,
            dni
          ),
          taller:talleres(
            id,
            nombre
          ),
          curso:cursos(
            año,
            division
          ),
          prestamos_detalle(
            id,
            cantidad,
            herramienta_id,
            herramienta:herramientas(
              codigo,
              descripcion,
              marca,
              modelo
            )
          )
        `);

      // Filtro por estado
      if (filtros.estado && filtros.estado !== 'TODOS') {
        query = query.eq('estado', filtros.estado);
      }
      
      // 🔧 FILTRO POR BÚSQUEDA (docente) - Versión corregida
      if (filtros.search && filtros.search.trim() !== '') {
        console.log('🔍 Buscando docente:', filtros.search);
        
        // Buscar docentes que coincidan con el término
        const searchTerm = `%${filtros.search.trim()}%`;
        const { data: docentesFiltrados, error: docentesError } = await supabase
          .from('docentes')
          .select('id')
          .or(`apellido.ilike.${searchTerm},nombre.ilike.${searchTerm}`);
        
        if (docentesError) {
          console.error('❌ Error al buscar docentes:', docentesError);
        }
        
        const docentesIds = docentesFiltrados?.map(d => d.id) || [];
        console.log('🔍 Docentes encontrados:', docentesIds);
        
        if (docentesIds.length > 0) {
          // Filtrar préstamos por los IDs de docentes encontrados
          query = query.in('docente_id', docentesIds);
        } else {
          // No hay docentes que coincidan, devolver vacío
          console.log('🔍 No se encontraron docentes con ese término');
          setData([]);
          setLoading(false);
          return;
        }
      }
      
      // Filtro por taller
      if (filtros.taller_id) {
        query = query.eq('taller_id', filtros.taller_id);
      }
      
      // Filtro por docente específico
      if (filtros.docente_id) {
        query = query.eq('docente_id', filtros.docente_id);
      }
      
      // Filtro por fechas
      if (filtros.fecha_desde) {
        query = query.gte('fecha_prestamo', new Date(filtros.fecha_desde).toISOString());
      }
      if (filtros.fecha_hasta) {
        const fechaHasta = new Date(filtros.fecha_hasta);
        fechaHasta.setDate(fechaHasta.getDate() + 1);
        query = query.lt('fecha_prestamo', fechaHasta.toISOString());
      }

      const { data, error } = await query
        .order('fecha_prestamo', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error en consulta:', error);
        throw error;
      }

      console.log('📋 Préstamos cargados:', data?.length || 0);
      console.log('📋 Ejemplo de préstamo:', data?.[0]);
      
      setData(data || []);
    } catch (err) {
      console.error('❌ Error general:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
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