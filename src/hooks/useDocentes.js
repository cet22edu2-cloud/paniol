import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useDocentes = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase
          .from('docentes')
          .select('*, taller:talleres(nombre), especialidad:especialidades(nombre)')
          .eq('activo', true);

        if (filtros.search) {
          query = query.or(`apellido.ilike.%${filtros.search}%,nombre.ilike.%${filtros.search}%`);
        }

        const { data, error } = await query.order('apellido');

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

export const crearDocente = async (docente) => {
  const { data, error } = await supabase
    .from('docentes')
    .insert(docente)
    .select()
    .single();
  return { data, error };
};

export const actualizarDocente = async (id, docente) => {
  const { data, error } = await supabase
    .from('docentes')
    .update(docente)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};