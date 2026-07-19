import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ role }) => {
  const { logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/herramientas', label: 'Herramientas', icon: WrenchScrewdriverIcon },
    { path: '/docentes', label: 'Docentes', icon: UserGroupIcon },
    { path: '/prestamos', label: 'Préstamos', icon: DocumentTextIcon },
    { path: '/reportes', label: 'Reportes', icon: ChartBarIcon },
  ];

  if (role === 'ADMIN') {
    menuItems.push({ path: '/configuracion', label: 'Configuración', icon: Cog6ToothIcon });
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Registro Préstamos</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-2">
        <p className="text-sm text-gray-400">Rol: {role || 'Sin rol'}</p>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 w-full"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;