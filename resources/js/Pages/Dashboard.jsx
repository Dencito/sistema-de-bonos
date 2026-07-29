import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MobileButton from '@components/MobileButton';
import AuthenticatedLayout from '@layouts/AuthenticatedLayout';
import { roleDisplayNames, allowedRoles } from '@utils/constants';
import { companyService } from '@services/api';
import { shiftService } from '@/Services/shiftService';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';
import { formatDateTimeCL } from '@/Utils/date';
import {
  Clock,
  LogIn,
  LogOut,
  User,
  Building2,
  Ticket,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard({ auth }) {
  const [shiftStatus, setShiftStatus] = useState({
    hasOpenShift: false,
    shift: null,
    loading: true,
  });

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

  const getShiftStatus = async () => {
    try {
      setShiftStatus((prev) => ({ ...prev, loading: true }));
      const response = await shiftService.getShiftStatus();
      if (response.status === 'success') {
        setShiftStatus({
          hasOpenShift: response.data.hasOpenShift,
          shift: response.data.shift,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error al obtener el estado del turno:', error);
      setShiftStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleStartShift = async () => {
    try {
      const response = await shiftService.startShift();
      if (response.status === 'success') {
        toast.success('Turno iniciado correctamente');
        getShiftStatus();
      }
    } catch (error) {
      console.error('Error al iniciar el turno:', error);
      toast.error(error.response?.data?.message || 'Error al iniciar el turno');
    }
  };

  const handleEndShift = async () => {
    try {
      const response = await shiftService.endShift();
      if (response.status === 'success') {
        toast.success('Turno finalizado correctamente');
        getShiftStatus();
      }
    } catch (error) {
      console.error('Error al finalizar el turno:', error);
      toast.error(error.response?.data?.message || 'Error al finalizar el turno');
    }
  };

  useEffect(() => {
    getSelectedCompany();
    getShiftStatus();
  }, []);

  const formatDateTime = (dateString) => formatDateTimeCL(dateString, { seconds: true });

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
                {shiftStatus.hasOpenShift && (
                  <p className="text-sm mt-1">
                    <Ticket className="w-4 h-4 inline mr-1" />
                    Ticket actual: #{shiftStatus.shift?.branch?.ticketNumber}
                  </p>
                )}
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

          {/* Shift Management Section - Only visible for workers */}
          {allowedRoles.shiftControl.includes(auth.role) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900">
                    <Clock className="mr-2 w-5 h-5 text-blue-600" /> Control de Turnos
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleStartShift}
                      disabled={shiftStatus.loading || shiftStatus.hasOpenShift}
                      className="bg-green-600 hover:bg-green-700 text-white border-0"
                    >
                      <LogIn className="mr-2 w-4 h-4" /> Iniciar Turno
                    </Button>
                    <Button
                      onClick={handleEndShift}
                      disabled={shiftStatus.loading || !shiftStatus.hasOpenShift}
                      className="bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                      <LogOut className="mr-2 w-4 h-4" /> Finalizar Turno
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {shiftStatus.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : shiftStatus.hasOpenShift ? (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 mb-1">
                          Turno activo en: {shiftStatus.shift?.branch?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-green-700">
                          Iniciado por: {shiftStatus.shift?.opened_by?.first_name}{' '}
                          {shiftStatus.shift?.opened_by?.first_last_name}
                        </p>
                        <p className="text-sm text-green-700">
                          Hora de inicio: {formatDateTime(shiftStatus.shift?.opening_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-800 mb-1">No hay turno activo</p>
                        <p className="text-sm text-yellow-700">
                          Inicie un nuevo turno para comenzar a registrar actividad.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
