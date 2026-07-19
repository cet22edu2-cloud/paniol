import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePrestamos = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase
          .from('prestamos')
          .select(`
            *,
            docente:docentes(apellido, nombre, dni),
            taller:talleres(nombre),
            curso:cursos(año, division),
            prestamos_detalle(
              id,
              cantidad,
              herramienta:herramientas(codigo, descripcion)
            )
          `);

        if (filtros.estado && filtros.estado !== 'TODOS') {
          query = query.eq('estado', filtros.estado);
        }
        if (filtros.search) {
          query = query.or(`docentes.apellido.ilike.%${filtros.search}%,docentes.nombre.ilike.%${filtros.search}%`);
        }
        if (filtros.taller_id) {
          query = query.eq('taller_id', filtros.taller_id);
        }

        const { data, error } = await query
          .order('fecha_prestamo', { ascending: false })
          .limit(100);

        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros]);

  return { data, loading, error };
};

export const crearPrestamo = async (prestamo, detalles) => {
  try {
    // 1. Crear el préstamo
    const { data: prestamoData, error: prestamoError } = await supabase
      .from('prestamos')
      .insert(prestamo)
      .select()
      .single();

    if (prestamoError) throw prestamoError;

    // 2. Crear los detalles
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