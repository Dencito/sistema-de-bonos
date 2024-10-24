import React, { useState } from 'react';
import { CircleX, Menu } from 'lucide-react';
import { Links } from './Links';

export const MobileButton = ({role, roles}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón para abrir el menú */}
      <button
        onClick={toggleMenu}
        className="lg:hidden p-2 border border-gray-300 rounded-md"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </button>

      {/* Menu deslizante */}
      <div
        className={`fixed z-20 top-0 left-0 h-full w-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="space-y-2 p-4 mt-10 z-30">
          <button onClick={toggleMenu} className='absolute top-5 right-5 text-red-600'><CircleX size={40} /></button>
          <Links role={role} roles={roles}/>        </nav>
      </div>
    </>
  );
};
