import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pasilleraService } from '../services/api';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, Clock } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export default function RegisterExpense() {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState('payment');
  const [amount, setAmount] = useState('');
  const [machine, setMachine] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [otherExpenseCustom, setOtherExpenseCustom] = useState('');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const transactionTypes = [
    { value: 'transfer', label: 'Transferencia', requiresMachine: false },
    { value: 'giro', label: 'Giro', requiresMachine: false },
    { value: 'payment', label: 'Pago por Caja', requiresMachine: true },
    { value: 'other', label: 'Otro Gasto', requiresMachine: false, requiresExpenseType: true },
    { value: 'sorteo', label: 'Sorteo', requiresClient: true },
    { value: 'bonus_especial', label: 'Bono Especial', requiresClient: true },
    { value: 'prestamo', label: 'Préstamo', requiresClient: true },
  ];

  const commonExpenses = [
    'Limpieza',
    'Insumos',
    'Reparación',
    'Mantenimiento',
    'Servicios',
    'Alimentos',
    'Transporte',
    'Publicidad',
    'Otros',
  ];

  useEffect(() => {
    loadMachines();
    updateTime();

    // Actualizar hora cada segundo
    const timeInterval = setInterval(updateTime, 1000);

    // Escuchar eventos de actualización de datos
    const channel = window.Echo.channel('dashboard-updates');
    channel.listen('.data.updated', () => {
      // Aquí puedes mostrar notificaciones o actualizar estado
      // Por ejemplo, mostrar una notificación de que la transacción fue registrada
    });

    // Cleanup
    return () => {
      clearInterval(timeInterval);
      window.Echo.leave('dashboard-updates');
    };
  }, []);

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('es-CL'));
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
      const realAmount = parseFloat(amount) * 1000;

      // Validaciones según tipo
      const currentType = transactionTypes.find(t => t.value === transactionType);
      if (currentType.requiresMachine && !machine) {
        setError('Debe indicar el número de máquina');
        setLoading(false);
        return;
      }
      if (currentType.requiresClient && !client) {
        setError('Debe indicar el nombre del cliente');
        setLoading(false);
        return;
      }
      if (currentType.requiresExpenseType && !expenseType) {
        setError('Debe indicar el tipo de gasto');
        setLoading(false);
        return;
      }
      if (expenseType === 'Otros' && !otherExpenseCustom) {
        setError('Debe especificar el tipo de gasto');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('type', transactionType);
      formData.append('amount', realAmount);
      if (machine) formData.append('machine', machine);
      if (client) formData.append('client', client);
      const finalExpenseType = expenseType === 'Otros' ? otherExpenseCustom : expenseType;
      if (finalExpenseType) formData.append('expense_type', finalExpenseType);
      if (description) formData.append('description', description);

      const response = await pasilleraService.registerTransaction(formData);

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
      setError('Error al registrar la transacción');
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
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 rounded-lg transition hover:bg-gray-100 active:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900">Registrar Transacción</h1>
          </div>
          {currentTime && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {currentTime}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Tipo de Transacción *
            </label>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                // Limpiar campos que no aplican al cambiar de tipo
                setClient('');
                setMachine('');
                setExpenseType('');
                setOtherExpenseCustom('');
                setDescription('');
              }}
              className="px-3 py-3 w-full bg-white rounded-lg border border-gray-300 transition appearance-none outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              required
              disabled={loading}
            >
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Monto *
            </label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={amount ? new Intl.NumberFormat('es-CL').format(amount) : ''}
                onChange={handleAmountChange}
                className="py-3 pr-3 pl-10 w-full text-lg font-semibold rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: 1 = $1.000"
                required
                disabled={loading}
              />
            </div>
            {amount && (
              <p className="mt-1 text-xs font-medium text-primary-600">
                Total: ${formatCurrency((parseFloat(amount) * 1000).toString())} CLP
              </p>
            )}
          </div>

          {/* Machine - conditional */}
          {transactionTypes.find(t => t.value === transactionType)?.requiresMachine && (
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Máquina *
              </label>
              {loadingMachines ? (
                <div className="flex justify-center items-center py-3">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : (
                <select
                  value={machine}
                  onChange={(e) => setMachine(e.target.value)}
                  className="px-3 py-3 w-full bg-white rounded-lg border border-gray-300 transition appearance-none outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
          )}

          {/* Client - conditional */}
          {transactionTypes.find(t => t.value === transactionType)?.requiresClient && (
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Cliente *
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="px-3 py-3 w-full bg-white rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Nombre del cliente"
                required={transactionTypes.find(t => t.value === transactionType)?.requiresClient}
                disabled={loading}
              />
            </div>
          )}

          {/* Expense Type - conditional */}
          {transactionTypes.find(t => t.value === transactionType)?.requiresExpenseType && (
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipo de Gasto *
              </label>
              <select
                value={expenseType}
                onChange={(e) => {
                  setExpenseType(e.target.value);
                  if (e.target.value !== 'Otros') {
                    setOtherExpenseCustom('');
                  }
                }}
                className="px-3 py-3 w-full bg-white rounded-lg border border-gray-300 transition appearance-none outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                required
                disabled={loading}
              >
                <option value="">Seleccionar tipo</option>
                {commonExpenses.map((exp) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>

              {expenseType === 'Otros' && (
                <div className="mt-3">
                  <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Especifique el gasto *
                  </label>
                  <input
                    type="text"
                    value={otherExpenseCustom}
                    onChange={(e) => setOtherExpenseCustom(e.target.value)}
                    className="px-3 py-3 w-full bg-white rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    placeholder="Ej: Compras, Viáticos, etc."
                    required
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Descripción (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-3 w-full rounded-lg border border-gray-300 transition outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              placeholder="Descripción adicional"
              rows="2"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount}
            className="flex justify-center items-center py-3 w-full font-semibold text-white rounded-lg shadow-lg transition bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 w-4 h-4" />
                Registrar Transacción
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
