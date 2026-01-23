import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pasilleraService } from '../services/api';
import {
  Wallet,
  TrendingDown,
  DollarSign,
  LogOut,
  RefreshCw,
  History,
  Plus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pasillera, setPasillera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    loadPasillera();

    const channel = window.Echo.channel('pasillera-updates');
    channel.listen('.cashtransaction.added', (e) => {
      alert('Nueva transacción registrada por la cajera: ' + e.user.name + '\nMonto: $' + e.transaction.amount);
    });
    return () => {
      window.Echo.leave('pasillera-updates');
    };
  }, []);

  const loadPasillera = async () => {
    try {
      setError('');
      const response = await pasilleraService.getMyActive();
      
      if (response.success) {
        setPasillera(response.data.pasillera);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al cargar la información');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available
    }
    await loadPasillera();
  };

  const handleLogout = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available
    }
    await logout();
    navigate('/login');
  };

  const handleFinalizeShift = async () => {
    setFinalizing(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available
    }

    try {
      const response = await pasilleraService.finalizeShift();
      
      if (response.success) {
        try {
          await Haptics.notification({ type: 'success' });
        } catch (e) {
          // Haptics not available
        }
        
        // Show success message
        alert(response.message);
        
        // Reload data
        await loadPasillera();
        setShowFinalizeConfirm(false);
      } else {
        alert(response.message || 'Error al finalizar el turno');
      }
    } catch (err) {
      console.error('Error finalizing shift:', err);
      alert(err.response?.data?.message || 'Error al finalizar el turno');
    } finally {
      setFinalizing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <div className="p-6 pb-24 text-white bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold">Hola, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-primary-100">Bienvenido de vuelta</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg transition hover:bg-primary-500 active:bg-primary-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 -mt-16 mb-6">
        <div className="p-6 bg-white rounded-2xl shadow-lg">
          {error ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 w-12 h-12 text-amber-500" />
              <p className="mb-4 text-gray-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Reintentar
              </button>
            </div>
          ) : pasillera ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="mb-1 text-sm text-gray-500">Saldo Disponible</p>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {formatCurrency(pasillera.current_balance)}
                  </h2>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-lg transition hover:bg-gray-100 active:bg-gray-200"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Wallet className="mr-2 w-4 h-4 text-blue-600" />
                    <p className="text-xs font-medium text-blue-600">Inicial</p>
                  </div>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(pasillera.initial_balance)}
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="mr-2 w-4 h-4 text-red-600" />
                    <p className="text-xs font-medium text-red-600">Gastado</p>
                  </div>
                  <p className="font-semibold text-red-900">
                    {formatCurrency(pasillera.total_payments)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 w-12 h-12 text-gray-400" />
              <p className="text-gray-600">No tienes una pasillera activa</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {pasillera && (
        <div className="px-6 space-y-3">
          <button
            onClick={() => navigate('/register-expense')}
            className="flex justify-center items-center py-4 w-full font-semibold text-white rounded-xl shadow-lg transition bg-primary-600 hover:bg-primary-700 active:bg-primary-800"
          >
            <Plus className="mr-2 w-5 h-5" />
            Registrar Gasto
          </button>

          <button
            onClick={() => navigate('/history')}
            className="flex justify-center items-center py-4 w-full font-semibold text-gray-700 bg-white rounded-xl border border-gray-200 shadow transition hover:bg-gray-50 active:bg-gray-100"
          >
            <History className="mr-2 w-5 h-5" />
            Ver Historial
          </button>

          <button
            onClick={() => setShowFinalizeConfirm(true)}
            className="flex justify-center items-center py-4 w-full font-semibold text-white bg-green-600 rounded-xl shadow-lg transition hover:bg-green-700 active:bg-green-800"
          >
            <CheckCircle className="mr-2 w-5 h-5" />
            Finalizar Turno
          </button>
        </div>
      )}

      {/* Recent Transactions */}
      {pasillera && pasillera.transactions && pasillera.transactions.length > 0 && (
        <div className="px-6 mt-8 mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Últimos Movimientos</h3>
          <div className="overflow-hidden bg-white rounded-xl shadow">
            {pasillera.transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <div className="flex justify-center items-center mr-3 w-10 h-10 bg-red-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.machine}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-red-600">
                  -{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finalize Shift Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="mb-6 text-center">
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Finalizar Turno</h3>
              <p className="mb-4 text-gray-600">
                ¿Estás seguro que deseas finalizar tu turno?
              </p>
              {pasillera && (
                <div className="p-4 mb-4 bg-blue-50 rounded-xl">
                  <p className="mb-1 text-sm text-gray-600">Saldo a devolver:</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(pasillera.current_balance)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Este saldo será devuelto al banco y tu turno será cerrado.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                disabled={finalizing}
                className="flex-1 py-3 font-semibold text-gray-800 bg-gray-200 rounded-xl transition hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizeShift}
                disabled={finalizing}
                className="flex flex-1 justify-center items-center py-3 font-semibold text-white bg-green-600 rounded-xl transition hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
              >
                {finalizing ? (
                  <>
                    <RefreshCw className="mr-2 w-5 h-5 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
