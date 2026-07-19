export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'ABIERTO': return 'text-yellow-600 bg-yellow-100';
    case 'CERRADO': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getEstadoLabel = (estado) => {
  switch (estado) {
    case 'ABIERTO': return 'Abierto';
    case 'CERRADO': return 'Cerrado';
    default: return estado;
  }
};