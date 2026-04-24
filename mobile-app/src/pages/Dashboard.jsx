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
  Loader2,
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

  const [amount, setAmount] = useState('');
  const [machine, setMachine] = useState('');
  const [description, setDescription] = useState('');
  const [machines, setMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    loadPasillera();
    loadMachines();

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

  const loadMachines = async () => {
    try {
      const response = await pasilleraService.getMachines();
      if (response.success) {
        setMachines(response.data);
      }
    } catch (err) {
      console.error('Error loading machines:', err);
    } finally {
      setLoadingMachines(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
    await loadPasillera();
  };

  const handleLogout = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }
    await logout();
    navigate('/login');
  };

  const handleFinalizeShift = async () => {
    setFinalizing(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }

    try {
      const response = await pasilleraService.finalizeShift();

      if (response.success) {
        try {
          await Haptics.notification({ type: 'success' });
        } catch {
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
    } catch {
      alert(err.response?.data?.message || 'Error al finalizar el turno');
    } finally {
      setFinalizing(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  const handleRegisterExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    setRegistering(true);

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    try {
      const realAmount = parseFloat(amount) * 1000;
      const formattedMachine = machine.toLowerCase().startsWith('maquina')
        ? machine
        : `Maquina ${machine}`;

      const response = await pasilleraService.registerExpense(
        realAmount,
        formattedMachine,
        description
      );

      if (response.success) {
        setFormSuccess(true);
        try {
          await Haptics.notification({ type: 'success' });
        } catch {
          // Haptics not available
        }

        setAmount('');
        setMachine('');
        setDescription('');
        await loadPasillera(); // Reload dashboard data

        setTimeout(() => {
          setFormSuccess(false);
        }, 2000);
      } else {
        setFormError(response.message);
        try {
          await Haptics.notification({ type: 'error' });
        } catch {
          // Haptics not available
        }
      }
    } catch {
      setFormError('Error al registrar el gasto');
      try {
        await Haptics.notification({ type: 'error' });
      } catch {
        // Haptics not available
      }
    } finally {
      setRegistering(false);
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
    <div className="min-h-screen bg-zinc-50 safe-top safe-bottom font-sans">
      {/* Header */}
      <div className="p-6 pb-24 text-zinc-100 bg-zinc-950">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">Hola, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-zinc-400 font-medium">Bienvenido de vuelta</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-700"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 -mt-16 mb-6">
        <div className="p-6 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
          {error ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 w-10 h-10 text-amber-500" />
              <p className="mb-4 text-zinc-600 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="font-medium text-zinc-900 hover:text-zinc-700 transition"
              >
                Reintentar
              </button>
            </div>
          ) : pasillera ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saldo Disponible</p>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                    {formatCurrency(pasillera.current_balance)}
                  </h2>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-zinc-50 rounded-full transition hover:bg-zinc-100 active:bg-zinc-200"
                >
                  <RefreshCw className={`w-4 h-4 text-zinc-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-50 rounded-2xl">
                  <div className="flex items-center mb-1">
                    <Wallet className="mr-1.5 w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Inicial</p>
                  </div>
                  <p className="font-bold text-zinc-900">
                    {formatCurrency(pasillera.initial_balance)}
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl">
                  <div className="flex items-center mb-1">
                    <TrendingDown className="mr-1.5 w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Gastado</p>
                  </div>
                  <p className="font-bold text-zinc-900">
                    {formatCurrency(pasillera.total_payments)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 w-10 h-10 text-zinc-300" />
              <p className="text-zinc-500 text-sm mb-4">No tienes una pasillera activa</p>
              <button
                onClick={() => navigate('/history')}
                className="inline-flex items-center px-4 py-2 font-semibold text-zinc-900 bg-zinc-100 rounded-xl transition hover:bg-zinc-200"
              >
                <History className="mr-2 w-4 h-4" />
                Ver mi Historial
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions & Quick Register */}
      {pasillera && (
        <div className="px-6 space-y-4">
          {/* Quick Register Expense Form */}
          <div className="p-6 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
            <h3 className="mb-5 text-lg font-bold text-zinc-900 flex items-center tracking-tight">
              <Plus className="w-5 h-5 mr-2 text-zinc-800" />
              Registro Rápido
            </h3>

            {formSuccess ? (
              <div className="flex flex-col items-center py-6">
                <div className="flex justify-center items-center w-12 h-12 bg-zinc-100 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-zinc-800" />
                </div>
                <p className="font-semibold text-zinc-900">¡Gasto Registrado!</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterExpense} className="space-y-5">
                {/* Amount and Machine */}
                <div className="flex gap-4">
                  {/* Amount */}
                  <div className="flex-1">
                    <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Monto (x1000) *
                    </label>
                    <div className="relative">
                      <div className="flex absolute inset-y-0 left-0 items-center pl-3.5 pointer-events-none">
                        <DollarSign className="w-4 h-4 text-zinc-400" />
                      </div>
                      <input
                        type="text"
                        value={amount ? new Intl.NumberFormat('es-CL').format(amount) : ''}
                        onChange={handleAmountChange}
                        className="py-3.5 pr-4 pl-10 w-full text-lg font-bold bg-zinc-50 rounded-2xl border border-zinc-200 transition outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder:font-medium placeholder:text-zinc-400"
                        placeholder="Ej: 1"
                        required
                        disabled={registering}
                      />
                    </div>
                  </div>

                  {/* Machine */}
                  <div className="flex-1">
                    <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      N° Máquina *
                    </label>
                    <input
                      type="text"
                      value={machine}
                      onChange={(e) => setMachine(e.target.value.toUpperCase())}
                      className="py-3.5 px-4 w-full text-lg font-bold bg-zinc-50 rounded-2xl border border-zinc-200 transition outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder:font-medium placeholder:text-zinc-400"
                      placeholder="Ej: 12"
                      required
                      disabled={registering}
                    />
                  </div>
                </div>

                {amount && (
                  <p className="text-sm font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    Total a registrar: <span className="text-zinc-900">{formatCurrency(parseFloat(amount) * 1000)}</span>
                  </p>
                )}

                {/* Description (Optional) */}
                <div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-4 py-3.5 w-full text-sm font-medium bg-zinc-50 rounded-2xl border border-zinc-200 transition outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                    placeholder="Descripción (Opcional)"
                    disabled={registering}
                  />
                </div>

                {formError && (
                  <div className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registering || !amount || !machine}
                  className="flex justify-center items-center py-4 w-full font-bold text-white rounded-2xl transition bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500"
                >
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar Gasto'
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/history')}
              className="flex justify-center items-center py-3 w-full font-semibold text-gray-700 bg-white rounded-xl border border-gray-200 shadow-sm transition hover:bg-gray-50"
            >
              <History className="mr-2 w-4 h-4" />
              Historial
            </button>

            <button
              onClick={() => setShowFinalizeConfirm(true)}
              className="flex justify-center items-center py-3 w-full font-semibold text-white bg-green-600 rounded-xl shadow-sm transition hover:bg-green-700"
            >
              <CheckCircle className="mr-2 w-4 h-4" />
              Finalizar
            </button>
          </div>
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
