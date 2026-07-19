import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const Header = ({ user }) => {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">Bienvenido, {user?.email}</h2>
      <div className="flex items-center space-x-3">
        <UserCircleIcon className="h-8 w-8 text-gray-600" />
      </div>
    </header>
  );
};

export default Header;