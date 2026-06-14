import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pasilleraService, getBaseUrl } from '../services/api';
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
  Pencil,
  Trash2,
  X,
  Clock,
  Image,
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
  const [transactionType, setTransactionType] = useState('pasillera_payment');
  const [client, setClient] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [otherExpenseCustom, setOtherExpenseCustom] = useState('');
  const [expenseImage, setExpenseImage] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMachine, setEditMachine] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const transactionTypes = [
    { value: 'pasillera_payment', label: 'Pago Pasillera', requiresMachine: true },
    { value: 'transfer', label: 'Transferencia', requiresMachine: false },
    { value: 'giro', label: 'Giro', requiresMachine: false },
    { value: 'other', label: 'Otro Gasto', requiresMachine: false, requiresExpenseType: true },
    { value: 'sorteo', label: 'Sorteo', requiresClient: true },
    { value: 'bonus_especial', label: 'Bono Especial', requiresClient: true },
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
    loadPasillera();
    loadMachines();
    updateTime();

    // Actualizar hora cada segundo
    const timeInterval = setInterval(updateTime, 1000);

    const channel = window.Echo.channel('pasillera-updates');
    channel.listen('.cashtransaction.added', (e) => {
      alert('Nueva transacción registrada por la cajera: ' + e.user.name + '\nMonto: $' + e.transaction.amount);
    });
    return () => {
      clearInterval(timeInterval);
      window.Echo.leave('pasillera-updates');
    };
  }, []);

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('es-CL'));
  };

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

      // Validaciones según tipo
      const currentType = transactionTypes.find(t => t.value === transactionType);
      if (currentType.requiresMachine && !machine) {
        setFormError('Debe indicar el número de máquina');
        setRegistering(false);
        return;
      }
      if (currentType.requiresClient && !client) {
        setFormError('Debe indicar el nombre del cliente');
        setRegistering(false);
        return;
      }
      if (currentType.requiresExpenseType && !expenseType) {
        setFormError('Debe indicar el tipo de gasto');
        setRegistering(false);
        return;
      }
      if (expenseType === 'Otros' && !otherExpenseCustom) {
        setFormError('Debe especificar el tipo de gasto');
        setRegistering(false);
        return;
      }

      let response;

      if (transactionType === 'pasillera_payment') {
        // Pago Pasillera usa el endpoint dedicado de pasillera
        response = await pasilleraService.registerExpense(realAmount, machine, description);
      } else {
        const formData = new FormData();
        formData.append('type', transactionType);
        formData.append('amount', realAmount);
        if (machine) formData.append('machine', machine);
        if (client) formData.append('client', client);
        const finalExpenseType = expenseType === 'Otros' ? otherExpenseCustom : expenseType;
        if (finalExpenseType) {
          formData.append('expense_type', finalExpenseType);
        } else if (transactionType === 'other') {
          formData.append('expense_type', 'Otros');
        }
        if (description) formData.append('description', description);
        if (expenseImage) formData.append('image', expenseImage);
        formData.append('admin_user_id', user.id);
        response = await pasilleraService.registerTransaction(formData);
      }

      if (response.success) {
        setFormSuccess(true);
        try {
          await Haptics.notification({ type: 'success' });
        } catch {
          // Haptics not available
        }

        setAmount('');
        setMachine('');
        setClient('');
        setExpenseType('');
        setOtherExpenseCustom('');
        setDescription('');
        setExpenseImage(null);
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

  const openEditTx = async (tx) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    setEditingTx(tx);
    setEditAmount(String(tx.amount));
    setEditMachine(tx.machine || '');
    // Use description directly; for pasillera_payment keep existing parsing for compatibility
    if (tx.type === 'pasillera_payment') {
      const desc = tx.description || '';
      const parts = desc.split(' - ');
      setEditDescription(parts.length > 2 ? parts.slice(2).join(' - ') : '');
    } else {
      setEditDescription(tx.description || '');
    }
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    setEditError('');
    setEditSaving(true);
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    try {
      const newAmount = parseFloat(editAmount);
      if (!newAmount || newAmount <= 0) {
        setEditError('Ingrese un monto válido');
        setEditSaving(false);
        return;
      }
      let response;
      if (editingTx.type === 'pasillera_payment') {
        if (!editMachine) {
          setEditError('Ingrese el número de máquina');
          setEditSaving(false);
          return;
        }
        const formattedMachine = editMachine.toLowerCase().startsWith('maquina')
          ? editMachine
          : `Maquina ${editMachine}`;
        response = await pasilleraService.updateExpense(
          editingTx.id,
          newAmount,
          formattedMachine,
          editDescription
        );
      } else {
        response = await pasilleraService.updateTransaction(editingTx.id, {
          amount: newAmount,
          machine: editMachine || null,
          description: editDescription || null,
        });
      }
      if (response.success) {
        try { await Haptics.notification({ type: 'success' }); } catch {}
        setEditingTx(null);
        await loadPasillera();
      } else {
        setEditError(response.message || 'Error al actualizar');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al actualizar');
      try { await Haptics.notification({ type: 'error' }); } catch {}
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteTx = async (tx) => {
    setDeletingId(tx.id);
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    try {
      let response;
      if (tx.type === 'pasillera_payment') {
        response = await pasilleraService.deleteExpense(tx.id);
      } else {
        response = await pasilleraService.deleteTransaction(tx.id);
      }
      if (response.success) {
        try { await Haptics.notification({ type: 'success' }); } catch {}
        setConfirmDelete(null);
        await loadPasillera();
      } else {
        alert(response.message || 'Error al eliminar');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
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
          <div className="flex items-center gap-3">
            {currentTime && (
              <div className="flex items-center text-xs text-zinc-400">
                <Clock className="w-3 h-3 mr-1" />
                {currentTime}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-700"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
                <p className="font-semibold text-zinc-900">¡Transacción Registrada!</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterExpense} className="space-y-4">
                {/* Transaction Type */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                      setExpenseImage(null);
                    }}
                    className="px-3 py-3 w-full bg-white rounded-lg border border-zinc-200 transition appearance-none outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                    required
                    disabled={registering}
                  >
                    {transactionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Machine - side by side when machine is required */}
                {transactionTypes.find(t => t.value === transactionType)?.requiresMachine ? (
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
                ) : (
                  /* Amount only when machine is not required */
                  <div>
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
                )}

                {/* Client - conditional */}
                {transactionTypes.find(t => t.value === transactionType)?.requiresClient && (
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Cliente *
                    </label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="px-3 py-3 w-full bg-white rounded-lg border border-zinc-200 transition outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                      placeholder="Nombre del cliente"
                      required={transactionTypes.find(t => t.value === transactionType)?.requiresClient}
                      disabled={registering}
                    />
                  </div>
                )}

                {/* Expense Type - conditional */}
                {transactionTypes.find(t => t.value === transactionType)?.requiresExpenseType && (
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                      className="px-3 py-3 w-full bg-white rounded-lg border border-zinc-200 transition appearance-none outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                      required
                      disabled={registering}
                    >
                      <option value="">Seleccionar tipo</option>
                      {commonExpenses.map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>

                    {expenseType === 'Otros' && (
                      <div className="mt-3">
                        <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Especifique el gasto *
                        </label>
                        <input
                          type="text"
                          value={otherExpenseCustom}
                          onChange={(e) => setOtherExpenseCustom(e.target.value)}
                          className="px-3 py-3 w-full bg-white rounded-lg border border-zinc-200 transition outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                          placeholder="Ej: Compras, Viáticos, etc."
                          required
                          disabled={registering}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-3 py-3 w-full rounded-lg border border-zinc-200 transition outline-none resize-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                    placeholder="Descripción adicional"
                    rows="2"
                    disabled={registering}
                  />
                </div>

                {/* Image Upload - only for Otro Gasto */}
                {transactionType === 'other' && (
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Imagen (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setExpenseImage(e.target.files[0] || null)}
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                        disabled={registering}
                      />
                      {expenseImage && (
                        <p className="mt-1 text-xs text-zinc-500">{expenseImage.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {amount && (
                  <p className="text-sm font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    Total a registrar: <span className="text-zinc-900">{formatCurrency(parseFloat(amount) * 1000)}</span>
                  </p>
                )}

                {formError && (
                  <div className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registering || !amount}
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos Movimientos</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              Ver todos
            </button>
          </div>
          {pasillera.force_closed && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">⚠ Turno cerrado forzosamente</p>
              <p className="text-xs text-red-600 mt-1">El saldo fue reintegrado automáticamente a la caja</p>
            </div>
          )}
          <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100">
            {pasillera.transactions.slice(0, 5).map((transaction) => {
              const typeLabels = {
                transfer: 'Transferencia',
                giro: 'Giro',
                payment: 'Pago por Caja',
                other: 'Otro Gasto',
                sorteo: 'Sorteo',
                bonus_especial: 'Bono Especial',
                prestamo: 'Préstamo',
                deposit: 'Agregar Dinero',
                withdrawal: 'Quitar Dinero',
                pasillera_payment: 'Pago Máquina',
                pasillera_return: 'Reintegro',
              };
              const typeLabel = typeLabels[transaction.type] || transaction.type;
              const isPositive = ['deposit', 'pasillera_return'].includes(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-4"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`flex justify-center items-center mr-3 w-10 h-10 rounded-full flex-shrink-0 ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DollarSign className={`w-5 h-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{typeLabel}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {transaction.description || transaction.client || transaction.machine || transaction.expense_type || '-'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleString('es-CL')}
                        </p>
                        {transaction.image && (
                          <button
                            onClick={async () => {
                              const base = await getBaseUrl();
                              setViewImageUrl(`${base}/storage/${transaction.image}`);
                            }}
                            className="inline-flex items-center text-xs font-medium text-blue-600"
                          >
                            <Image className="w-3 h-3 mr-0.5" />
                            Ver imagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <p className={`font-semibold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="flex fixed inset-0 z-50 justify-center items-end sm:items-center p-0 sm:p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Editar Gasto</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="p-2 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Monto *</label>
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3.5 pointer-events-none">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="py-3.5 pr-4 pl-10 w-full text-lg font-bold bg-zinc-50 rounded-2xl border border-zinc-200 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    disabled={editSaving}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  N° Máquina {editingTx?.type === 'pasillera_payment' ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={editMachine}
                  onChange={(e) => setEditMachine(e.target.value.toUpperCase())}
                  className="py-3.5 px-4 w-full text-lg font-bold bg-zinc-50 rounded-2xl border border-zinc-200 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  disabled={editSaving}
                  required={editingTx?.type === 'pasillera_payment'}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descripción</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="px-4 py-3.5 w-full text-sm font-medium bg-zinc-50 rounded-2xl border border-zinc-200 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  disabled={editSaving}
                />
              </div>
              {editError && (
                <div className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-100">
                  {editError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  disabled={editSaving}
                  className="flex-1 py-3 font-semibold text-zinc-800 bg-zinc-100 rounded-xl hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex flex-1 justify-center items-center py-3 font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                >
                  {editSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="mb-5 text-center">
              <div className="flex justify-center items-center mx-auto mb-3 w-14 h-14 bg-red-100 rounded-full">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900">Eliminar movimiento</h3>
              <p className="text-sm text-zinc-600">
                {confirmDelete.machine || confirmDelete.client || confirmDelete.expense_type || confirmDelete.type} · {formatCurrency(confirmDelete.amount)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Se devolverá el monto a tu saldo disponible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-3 font-semibold text-zinc-800 bg-zinc-100 rounded-xl hover:bg-zinc-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteTx(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex flex-1 justify-center items-center py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Eliminar'}
              </button>
            </div>
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

      {/* View Image Modal */}
      {viewImageUrl && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-80">
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setViewImageUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white rounded-full hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewImageUrl}
              alt="Comprobante"
              className="w-full rounded-xl shadow-2xl"
              onError={() => {
                setViewImageUrl(null);
                alert('No se pudo cargar la imagen');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
