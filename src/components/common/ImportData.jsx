import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

const ImportData = ({ tipo, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setPreview(jsonData);
      } catch (err) {
        setError('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError('No hay datos para importar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of preview) {
        try {
          if (tipo === 'herramientas') {
            await importHerramienta(row);
          } else if (tipo === 'docentes') {
            await importDocente(row);
          }
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Error en fila:', row, err);
        }
      }

      alert(`✅ Importación completada:\n${successCount} registros exitosos\n${errorCount} errores`);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error al importar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const importHerramienta = async (row) => {
    // Buscar categoria_id por nombre
    const { data: categoria } = await supabase
      .from('categorias')
      .select('id')
      .eq('nombre', row.categoria)
      .single();

    // Buscar taller_id por nombre
    const { data: taller } = await supabase
      .from('talleres')
      .select('id')
      .eq('nombre', row.taller)
      .single();

    const herramienta = {
      codigo: row.codigo,
      descripcion: row.descripcion,
      categoria_id: categoria?.id || null,
      taller_id: taller?.id || null,
      marca: row.marca || '',
      modelo: row.modelo || '',
      stock: parseInt(row.stock) || 0,
      stock_minimo: parseInt(row.stock_minimo) || 1,
      ubicacion: row.ubicacion || '',
      estado: 'Disponible',
      activo: true
    };

    const { error } = await supabase
      .from('herramientas')
      .insert(herramienta);

    if (error) throw error;
  };

  const importDocente = async (row) => {
    // Buscar taller_id por nombre
    const { data: taller } = await supabase
      .from('talleres')
      .select('id')
      .eq('nombre', row.taller)
      .single();

    const docente = {
      apellido: row.apellido,
      nombre: row.nombre,
      dni: row.dni || '',
      legajo: row.legajo || '',
      email: row.email || '',
      telefono: row.telefono || '',
      taller_id: taller?.id || null,
      activo: true
    };

    const { error } = await supabase
      .from('docentes')
      .insert(docente);

    if (error) throw error;
  };

  const descargarPlantilla = () => {
    let headers = [];
    let example = {};

    if (tipo === 'herramientas') {
      headers = ['codigo', 'descripcion', 'categoria', 'taller', 'marca', 'modelo', 'stock', 'stock_minimo', 'ubicacion'];
      example = {
        codigo: 'H-100',
        descripcion: 'Nueva Herramienta',
        categoria: 'Manuales',
        taller: 'Taller de Electrónica',
        marca: 'Marca Ejemplo',
        modelo: 'Modelo X',
        stock: 10,
        stock_minimo: 2,
        ubicacion: 'Estante A1'
      };
    } else if (tipo === 'docentes') {
      headers = ['apellido', 'nombre', 'dni', 'legajo', 'email', 'telefono', 'taller'];
      example = {
        apellido: 'García',
        nombre: 'María',
        dni: '12345678',
        legajo: '001',
        email: 'maria@ejemplo.com',
        telefono: '1155551234',
        taller: 'Taller de Electrónica'
      };
    }

    const ws = XLSX.utils.json_to_sheet([example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `plantilla_${tipo}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Importar {tipo === 'herramientas' ? 'Herramientas' : 'Docentes'} desde Excel
        </h2>

        <div className="mb-4">
          <button
            onClick={descargarPlantilla}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            📥 Descargar plantilla de ejemplo
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600">
              Haz clic para seleccionar un archivo Excel o CSV
            </p>
            <p className="text-gray-400 text-sm mt-1">
              o arrastra y suelta aquí
            </p>
          </label>
        </div>

        {file && (
          <div className="mt-2 text-sm text-gray-600">
            Archivo: {file.name} ({preview.length} registros)
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Vista previa ({preview.length} registros):</h3>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-3 py-2 text-gray-700">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <p className="text-gray-400 text-sm p-2">
                  ... y {preview.length - 5} registros más
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={loading || preview.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportData;