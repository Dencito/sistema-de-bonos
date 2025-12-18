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
    } catch (e) {
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
        } catch (e) {
          // Haptics not available
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(response.message);
        try {
          await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
          // Haptics not available
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el gasto');
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (e) {
        // Haptics not available
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const number = parseFloat(value.replace(/[^0-9]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('es-CL').format(number);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gasto Registrado!</h2>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition active:bg-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 ml-3">Registrar Gasto</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Gasto *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={amount ? formatCurrency(amount) : ''}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-4 text-2xl font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="0"
                required
                disabled={loading}
              />
            </div>
            {amount && (
              <p className="text-sm text-gray-500 mt-2">
                ${formatCurrency(amount)} CLP
              </p>
            )}
          </div>

          {/* Machine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máquina *
            </label>
            {loadingMachines ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <select
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition appearance-none bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Ej: Pago de premio, reparación, etc."
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !machine}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Registrar Gasto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
