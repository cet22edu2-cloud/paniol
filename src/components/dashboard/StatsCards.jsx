import React from 'react';
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color }) => {
  // Asegurar que el valor sea un número
  const displayValue = typeof value === 'number' ? value : 0;
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{displayValue}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );
};

const StatsCards = ({ stats }) => {
  console.log('📊 StatsCards recibió:', stats);

  const cards = [
    { 
      title: 'Total Herramientas', 
      value: stats.totalHerramientas || 0, 
      icon: WrenchScrewdriverIcon, 
      color: 'border-blue-500' 
    },
    { 
      title: 'Préstamos Activos', 
      value: stats.prestamosActivos || 0, 
      icon: DocumentTextIcon, 
      color: 'border-yellow-500' 
    },
    { 
      title: 'Stock Crítico', 
      value: stats.herramientasCriticas || 0, 
      icon: ExclamationTriangleIcon, 
      color: 'border-red-500' 
    },
    { 
      title: 'Préstamos Semana', 
      value: stats.prestamosSemana || 0, 
      icon: CalendarIcon, 
      color: 'border-green-500' 
    },
    { 
      title: 'Docentes Activos', 
      value: stats.docentesActivos || 0, 
      icon: UserGroupIcon, 
      color: 'border-purple-500' 
    },
    { 
      title: 'Talleres', 
      value: stats.talleres || 0, 
      icon: BuildingOfficeIcon, 
      color: 'border-indigo-500' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;