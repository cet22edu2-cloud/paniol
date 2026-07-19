import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useHerramientas = (filtros = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase
          .from('herramientas')
          .select(`
            *,
            categoria:categorias(nombre),
            taller:talleres(nombre)
          `)
          .eq('activo', true);

        if (filtros.search) {
          query = query.ilike('descripcion', `%${filtros.search}%`);
        }
        if (filtros.categoria_id) {
          query = query.eq('categoria_id', filtros.categoria_id);
        }
        if (filtros.taller_id) {
          query = query.eq('taller_id', filtros.taller_id);
        }

        const { data, error } = await query.order('codigo');

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

export const crearHerramienta = async (herramienta) => {
  const { data, error } = await supabase
    .from('herramientas')
    .insert(herramienta)
    .select()
    .single();
  return { data, error };
};

export const actualizarHerramienta = async (id, herramienta) => {
  const { data, error } = await supabase
    .from('herramientas')
    .update(herramienta)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const eliminarHerramienta = async (id) => {
  const { error } = await supabase
    .from('herramientas')
    .update({ activo: false })
    .eq('id', id);
  return { error };
};