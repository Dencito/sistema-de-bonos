import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pasilleraService } from '../services/api';
import { ArrowLeft, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export default function RegisterExpense() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [machine, setMachine] = useState('');
  const [description, setDescription] = useState('');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMachines();

    // Escuchar eventos de actualización de datos
    const channel = window.Echo.channel('dashboard-updates');
    channel.listen('.data.updated', () => {
      // Aquí puedes mostrar notificaciones o actualizar estado
      // Por ejemplo, mostrar una notificación de que la transacción fue registrada
    });

    // Cleanup
    return () => {
      window.Echo.leave('dashboard-updates');
    };
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    try {
      const response = await pasilleraService.registerExpense(
        parseFloat(amount),
        machine,
        description
      );

      if (response.success) {
        setSuccess(true);
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          // Haptics not available
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(response.message);
        try {
          await Haptics.notification({ type: NotificationType.Error });
        } catch {
          // Haptics not available
        }
      }
    } catch {
      setError('Error al registrar el gasto');
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch {
        // Haptics not available
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const number = parseFloat(value.replace(/[^0-9]/g, ''));
    if (isNaN(number)) return '';
    // eslint-disable-next-line no-undef
    return new Intl.NumberFormat('es-CL').format(number);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  if (success) {
    return (
      <div className="flex justify-center items-center p-6 min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center items-center mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Gasto Registrado!</h2>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-lg transition hover:bg-gray-100 active:bg-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="ml-3 text-xl font-semibold text-gray-900">Registrar Gasto</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Monto del Gasto *
            </label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={amount ? formatCurrency(amount) : ''}
                onChange={handleAmountChange}
                className="py-4 pr-4 pl-12 w-full text-2xl font-semibold rounded-xl border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
                required
                disabled={loading}
              />
            </div>
            {amount && (
              <p className="mt-2 text-sm text-gray-500">
                ${formatCurrency(amount)} CLP
              </p>
            )}
          </div>

          {/* Machine */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Máquina *
            </label>
            {loadingMachines ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <select
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="px-4 py-4 w-full bg-white rounded-xl border border-gray-300 transition appearance-none outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Seleccionar máquina</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Descripción (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-3 w-full rounded-xl border border-gray-300 transition outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ej: Pago de premio, reparación, etc."
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !machine}
            className="flex justify-center items-center py-4 w-full font-semibold text-white rounded-xl shadow-lg transition bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 w-5 h-5" />
                Registrar Gasto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
