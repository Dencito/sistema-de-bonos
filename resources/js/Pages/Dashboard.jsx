import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import MobileButton from '@components/MobileButton';
import AuthenticatedLayout from '@layouts/AuthenticatedLayout';
import { roleDisplayNames } from '@utils/constants';
import { companyService } from '@services/api';
import { User, Building2, Ticket, DollarSign } from 'lucide-react';

export default function Dashboard({ auth }) {
  const getSelectedCompany = async () => {
    try {
      const response = await companyService.getSelected();
      window.localStorage.setItem('companySelect', await response.data.company);
      return response.data.company;
    } catch (error) {
      console.error('Error al obtener la empresa seleccionada:', error);
      return null;
    }
  };

  useEffect(() => {
    getSelectedCompany();
  }, []);

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Panel</h2>}
    >
      <Head title="Panel" />
      <header className="flex justify-between items-center p-6 bg-white shadow-sm border-b">
        <MobileButton role={auth.role} roles={auth.roles} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
          <p className="text-gray-500 text-sm">Bienvenido al sistema de gestión</p>
        </div>
      </header>
      <div className="overflow-auto z-10 flex-1 p-6">
        <div className="w-full space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Hola, {auth.user.username}</h1>
                <p className="text-blue-100">{roleDisplayNames[auth.role]}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sucursales</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tickets Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ventas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
