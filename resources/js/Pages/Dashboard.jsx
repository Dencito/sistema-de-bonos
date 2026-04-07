import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MobileButton from '@components/MobileButton';
import AuthenticatedLayout from '@layouts/AuthenticatedLayout';
import { roleDisplayNames, allowedRoles } from '@utils/constants';
import { companyService } from '@services/api';
import { shiftService } from '@/Services/shiftService';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';
import { Clock, LogIn, LogOut } from 'lucide-react';

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
    
    // Escuchar eventos de actualización de datos de pasilleras
    const channel = window.Echo.channel('dashboard-updates'); 
    channel.listen('.data.updated', (e) => {
      toast.success(`Nueva transacción registrada por ${e.user.name}`);
      alert(`Nueva transacción registrada por ${e.user.name}`);
    });
    // Cleanup
    return () => {
      window.Echo.leaveChannel('dashboard-updates');
    };
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Panel</h2>}
    >
      <Head title="Panel" />
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="text-4xl font-bold">Inicio</h1>
      </header>
      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          <div className="p-6 text-gray-900">
            <h1 className="text-3xl font-bold">Bienvenido usuario: {auth.user.username}</h1>
            <h2 className="text-2xl font-bold">Rol: {roleDisplayNames[auth.role]}</h2>

            {shiftStatus.hasOpenShift && (
              <h2 className="text-2xl font-bold">
                Numero de Tickets: #{shiftStatus.shift?.branch?.ticketNumber}
              </h2>
            )}
          </div>

          {/* Shift Management Section - Only visible for workers */}
          {allowedRoles.shiftControl.includes(auth.role) && (
            <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-xl font-semibold">
                  <Clock className="mr-2" /> Control de Turnos
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleStartShift}
                    disabled={shiftStatus.loading || shiftStatus.hasOpenShift}
                    className="text-white bg-green-600 hover:bg-green-700"
                  >
                    <LogIn className="mr-2 w-4 h-4" /> Iniciar Turno
                  </Button>
                  <Button
                    onClick={handleEndShift}
                    disabled={shiftStatus.loading || !shiftStatus.hasOpenShift}
                    className="text-white bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="mr-2 w-4 h-4" /> Finalizar Turno
                  </Button>
                </div>
              </div>

              {shiftStatus.loading ? (
                <p>Cargando estado del turno...</p>
              ) : shiftStatus.hasOpenShift ? (
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <p className="font-medium text-green-800">
                    Turno activo en la sucursal: {shiftStatus.shift?.branch?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-green-700">
                    Iniciado por: {shiftStatus.shift?.opened_by?.first_name}{' '}
                    {shiftStatus.shift?.opened_by?.first_last_name}
                  </p>
                  <p className="text-sm text-green-700">
                    Hora de inicio: {formatDateTime(shiftStatus.shift?.opening_time)}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-yellow-800">No hay un turno activo en este momento.</p>
                  <p className="text-sm text-yellow-700">
                    Inicie un nuevo turno para comenzar a registrar actividad.
                  </p>
                </div>
              )}
            </div>
          )}

          {/*  <PdfGenerator user={auth?.user} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
                        <div className="rounded-lg border shadow-sm bg-card text-card-foreground">
                            <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-2">
                                <h3 className="text-sm font-medium tracking-tight whitespace-nowrap">
                                    Sucursales
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="text-2xl font-bold">000</div>
                                <p className="text-xs text-muted-foreground">
                                    Total sucursales
                                </p>
                            </div>
                        </div>
                        <div className="rounded-lg border shadow-sm bg-card text-card-foreground">
                            <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-2">
                                <h3 className="text-sm font-medium tracking-tight whitespace-nowrap">
                                    Usuarios
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="text-2xl font-bold">000</div>
                                <p className="text-xs text-muted-foreground">
                                    Total registros
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="sm:px-6 lg:px-8"></div> */}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
