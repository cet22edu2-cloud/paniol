import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePrestamos = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para eliminar acentos
  const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando préstamos con filtros:', filtros);

        // 1. Cargar TODOS los préstamos
        const { data: prestamosData, error: prestamosError } = await supabase
          .from('prestamos')
          .select('*')
          .order('fecha_prestamo', { ascending: false });

        if (prestamosError) {
          console.error('❌ Error al cargar préstamos:', prestamosError);
          throw prestamosError;
        }

        console.log('📋 Préstamos cargados (sin filtrar):', prestamosData?.length || 0);

        if (!prestamosData || prestamosData.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // 2. Obtener IDs de docentes y talleres
        const docenteIds = [...new Set(prestamosData.map(p => p.docente_id).filter(Boolean))];
        const tallerIds = [...new Set(prestamosData.map(p => p.taller_id).filter(Boolean))];

        // 3. Cargar docentes
        const { data: docentesData, error: docentesError } = await supabase
          .from('docentes')
          .select('id, apellido, nombre, dni')
          .in('id', docenteIds);

        if (docentesError) {
          console.error('❌ Error al cargar docentes:', docentesError);
        }

        // 4. Cargar talleres
        const { data: talleresData, error: talleresError } = await supabase
          .from('talleres')
          .select('id, nombre')
          .in('id', tallerIds);

        if (talleresError) {
          console.error('❌ Error al cargar talleres:', talleresError);
        }

        // 5. Crear mapas para búsqueda rápida
        const docentesMap = {};
        docentesData?.forEach(d => docentesMap[d.id] = d);

        const talleresMap = {};
        talleresData?.forEach(t => talleresMap[t.id] = t);

        // 6. Combinar datos
        let combinedData = prestamosData.map(p => ({
          ...p,
          docente: docentesMap[p.docente_id] || null,
          taller: talleresMap[p.taller_id] || null
        }));

        console.log('📋 Datos combinados (antes de filtrar):', combinedData.length);

        // ============================================================
        // 🔧 APLICAR FILTROS (CON SOPORTE PARA ACENTOS)
        // ============================================================

        // 6.1 Filtro por estado
        if (filtros.estado && filtros.estado !== 'TODOS') {
          combinedData = combinedData.filter(p => p.estado === filtros.estado);
          console.log(`📌 Filtrado por estado: ${filtros.estado} → ${combinedData.length} préstamos`);
        }

        // 6.2 Filtro por búsqueda (docente) - SIN ACENTOS Y SIN MAYÚSCULAS
        if (filtros.search && filtros.search.trim() !== '') {
          const searchTerm = removeAccents(filtros.search.trim().toLowerCase());
          combinedData = combinedData.filter(p => {
            const nombreCompleto = `${p.docente?.apellido || ''} ${p.docente?.nombre || ''}`;
            const nombreSinAcentos = removeAccents(nombreCompleto.toLowerCase());
            return nombreSinAcentos.includes(searchTerm);
          });
          console.log(`📌 Filtrado por búsqueda: "${searchTerm}" → ${combinedData.length} préstamos`);
        }

        // 6.3 Filtro por taller
        if (filtros.taller_id) {
          combinedData = combinedData.filter(p => p.taller_id === filtros.taller_id);
        }

        // 6.4 Filtro por docente específico
        if (filtros.docente_id) {
          combinedData = combinedData.filter(p => p.docente_id === filtros.docente_id);
        }

        // 6.5 Filtro por fechas
        if (filtros.fecha_desde) {
          const fechaDesde = new Date(filtros.fecha_desde);
          combinedData = combinedData.filter(p => new Date(p.fecha_prestamo) >= fechaDesde);
        }
        if (filtros.fecha_hasta) {
          const fechaHasta = new Date(filtros.fecha_hasta);
          fechaHasta.setDate(fechaHasta.getDate() + 1);
          combinedData = combinedData.filter(p => new Date(p.fecha_prestamo) < fechaHasta);
        }

        console.log('📋 Préstamos finales:', combinedData.length);
        
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