import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Input,
  Button,
  Table,
  InputNumber,
  Modal,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Select,
  Tag,
  Divider,
  Upload,
  Alert,
  Spin,
  Skeleton,
} from 'antd';
import {
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  SwapOutlined,
  EditOutlined,
  UploadOutlined,
  ShopOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Switch } from 'antd';
import axios from 'axios';
import { formatDateTimeCL } from '@/Utils/date';

const { Title, Text } = Typography;
const { Option } = Select;

const BRANCH_STORAGE_KEY = 'systembank:branch_id';

// Espejo de TransactionType::LABELS del backend. Estaba repetido en tres mapas
// dentro del componente, cada uno con su propio subconjunto.
const TYPE_LABELS = {
  transfer: 'Transferencia',
  giro: 'Giro',
  payment: 'Pago por Caja',
  tragados: 'Tragados',
  other: 'Otro Gasto',
  pasillera_payment: 'Pago Pasillera',
  pasillera_return: 'Reintegro Pasillera',
  sorteo: 'Sorteo',
  bonus_especial: 'Bono Especial',
  prestamo: 'Préstamo',
  deposit: 'Agregar Dinero',
  withdrawal: 'Quitar Dinero',
};

// Tipos que se registran contra una máquina: abren el modal que la pide.
const MACHINE_TYPES = ['payment', 'tragados'];

export default function SystemBank({
  auth,
  activeShift,
  previousBalance,
  availableUsers = [],
  branch,
  branches = [],
  canSelectBranch = false,
  error: serverError = null,
  tickets: initialTickets = [],
}) {
  // Los roles superiores no tienen sucursal asignada: eligen sobre cual operar y
  // ese id viaja en todas las peticiones.
  const [branchId, setBranchId] = useState(branch?.id ?? null);

  // Cada request lleva la sucursal como query param, asi sirve igual para
  // GET, POST multipart, PUT y DELETE.
  const withBranch = (config = {}) => ({
    ...config,
    params: { ...(config.params || {}), ...(branchId ? { branch_id: branchId } : {}) },
  });

  const api = {
    get: (url, config) => axios.get(url, withBranch(config)),
    post: (url, data, config) => axios.post(url, data, withBranch(config)),
    put: (url, data, config) => axios.put(url, data, withBranch(config)),
    delete: (url, config) => axios.delete(url, withBranch(config)),
  };

  // Cambiar o recuperar la sucursal implica una navegación de Inertia: sin esto
  // la pantalla queda vacía hasta que responde el servidor.
  const [switchingBranch, setSwitchingBranch] = useState(false);

  const handleBranchChange = (value) => {
    setBranchId(value);
    setSwitchingBranch(Boolean(value));
    if (value) {
      localStorage.setItem(BRANCH_STORAGE_KEY, String(value));
    } else {
      localStorage.removeItem(BRANCH_STORAGE_KEY);
    }
    router.get('/cash-management', value ? { branch_id: value } : {}, {
      preserveState: false,
    });
  };

  // Al entrar sin sucursal en la URL, recupera la ultima elegida
  useEffect(() => {
    if (!canSelectBranch || branchId) return;

    const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
    if (stored && branches.some((b) => String(b.id) === stored)) {
      setSwitchingBranch(true);
      router.get('/cash-management', { branch_id: stored }, { preserveState: false });
    }
  }, []);

  const [shift, setShift] = useState(activeShift);
  const [prevBalance, setPrevBalance] = useState(previousBalance || 0);
  const [initialBalance, setInitialBalance] = useState('');
  const [initialBalanceMode, setInitialBalanceMode] = useState('total');
  const [amount, setAmount] = useState('');
  const [client, setClient] = useState('');
  const [machine, setMachine] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  // Pago por Caja y Tragados comparten el modal que pide la máquina
  const [machineTransactionType, setMachineTransactionType] = useState('payment');
  const [otherModalVisible, setOtherModalVisible] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clientTransactionType, setClientTransactionType] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authTransactionType, setAuthTransactionType] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [inactivityModalVisible, setInactivityModalVisible] = useState(() => {
    return localStorage.getItem('sessionLocked') === 'true';
  });
  const [unlockPassword, setUnlockPassword] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editClient, setEditClient] = useState('');
  const [editMachine, setEditMachine] = useState('');
  const [editExpenseType, setEditExpenseType] = useState('');
  const [pasilleras, setPasilleras] = useState(activeShift?.pasilleras || []);
  const [otherExpenseType, setOtherExpenseType] = useState('');
  const [otherExpenseCustom, setOtherExpenseCustom] = useState('');
  const [expenseImage, setExpenseImage] = useState(null);
  const [pasilleraUserId, setPasilleraUserId] = useState(null);
  const [pasilleraInitialBalance, setPasilleraInitialBalance] = useState('');
  const [transactions, setTransactions] = useState(activeShift?.transactions || []);
  const [tickets, setTickets] = useState(initialTickets);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Con turno activo la página se pinta con los props de Inertia y recién
  // después llegan transacciones y tickets por axios, así que arranca cargando.
  const [initialLoading, setInitialLoading] = useState(Boolean(activeShift));

  // Estados para conteo de apertura
  const [opening20000, setOpening20000] = useState(0);
  const [opening10000, setOpening10000] = useState(0);
  const [opening5000, setOpening5000] = useState(0);

  // Gastos comunes (pueden ser editados según lo que indique Ces)
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
  const [opening2000, setOpening2000] = useState(0);
  const [opening1000, setOpening1000] = useState(0);
  const [openingCoins, setOpeningCoins] = useState(0);

  // Estados para conteo de cierre
  const [closing20000, setClosing20000] = useState(0);
  const [closing10000, setClosing10000] = useState(0);
  const [closing5000, setClosing5000] = useState(0);
  const [closing2000, setClosing2000] = useState(0);
  const [closing1000, setClosing1000] = useState(0);
  const [closingCoins, setClosingCoins] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');

  // Modal states
  const [openingModalVisible, setOpeningModalVisible] = useState(false);
  const [closingModalVisible, setClosingModalVisible] = useState(false);
  const [openingSimpleMode, setOpeningSimpleMode] = useState(true);
  const [openingSimpleTotal, setOpeningSimpleTotal] = useState('');
  const [closingSimpleMode, setClosingSimpleMode] = useState(true);
  const [closingSimpleTotal, setClosingSimpleTotal] = useState('');

  // Modal para agregar saldo a pasillera
  const [addBalanceModalVisible, setAddBalanceModalVisible] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [addBalancePasilleraId, setAddBalancePasilleraId] = useState(null);
  const [addBalancePasilleraName, setAddBalancePasilleraName] = useState('');

  useEffect(() => {
    if (!activeShift) return;
    fetchShiftStatus().finally(() => setInitialLoading(false));
  }, []);

  const fetchShiftStatus = async () => {
    try {
      const response = await api.get('/cash-management/shift-status');
      if (response.data.success) {
        setShift(response.data.data.activeShift);
        setPrevBalance(response.data.data.previousBalance);
        setTotalTickets(response.data.data.totalTickets || 0);
        setPasilleras(response.data.data.activeShift?.pasilleras || []);
        setTransactions(response.data.data.activeShift?.transactions || []);
      }
      // Cargar transacciones y tickets del turno activo
      const txResponse = await api.get('/cash-management/transactions');
      if (txResponse.data.success) {
        setTransactions(txResponse.data.data.transactions || []);
        setTickets(txResponse.data.data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching shift status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShiftStatus();
    setRefreshing(false);
  };

  const RefreshBtn = ({ tooltip = 'Actualizar' }) => (
    <Button
      type="text"
      size="small"
      icon={<ReloadOutlined spin={refreshing} />}
      onClick={handleRefresh}
      loading={refreshing}
      title={tooltip}
    />
  );

  const calculateOpeningTotal = () => {
    return (
      opening20000 * 20000 +
      opening10000 * 10000 +
      opening5000 * 5000 +
      opening2000 * 2000 +
      opening1000 * 1000 +
      parseFloat(openingCoins || 0)
    );
  };

  const calculateClosingTotal = () => {
    return (
      closing20000 * 20000 +
      closing10000 * 10000 +
      closing5000 * 5000 +
      closing2000 * 2000 +
      closing1000 * 1000 +
      parseFloat(closingCoins || 0)
    );
  };

  // Combinar transacciones y tickets en un solo array ordenado por fecha
  const combinedHistory = [
    ...transactions.map((t) => ({ ...t, source: 'transaction' })),
    ...tickets.map((t) => ({ ...t, source: 'ticket' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleStartShift = async () => {
    // Calculate the actual initial_balance to send based on mode
    let initialBalanceToSend = Number(initialBalance) || 0;
    if (initialBalanceMode === 'total') {
      // If total mode, subtract previous balance
      initialBalanceToSend = initialBalanceToSend - prevBalance;
    }

    if (initialBalanceToSend < 0) {
      message.error('El monto total no puede ser menor al saldo anterior');
      return;
    }

    if (initialBalanceToSend <= 0) {
      message.error('Ingrese un saldo válido (mayor a 0)');
      return;
    }

    // In simple mode use the direct total; in denomination mode use the calculated sum
    const effectiveTotal = openingSimpleMode
      ? initialBalanceMode === 'total'
        ? Number(initialBalance)
        : prevBalance + Number(initialBalance)
      : calculateOpeningTotal();

    if (!openingSimpleMode && effectiveTotal <= 0) {
      message.error('El conteo de billetes no puede ser 0');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cash-management/shift/start', {
        initial_balance: initialBalanceToSend,
        opening_total: openingSimpleMode
          ? initialBalanceMode === 'total'
            ? Number(initialBalance)
            : prevBalance + Number(initialBalance)
          : calculateOpeningTotal(),
        opening_20000: openingSimpleMode ? 0 : opening20000,
        opening_10000: openingSimpleMode ? 0 : opening10000,
        opening_5000: openingSimpleMode ? 0 : opening5000,
        opening_2000: openingSimpleMode ? 0 : opening2000,
        opening_1000: openingSimpleMode ? 0 : opening1000,
        opening_coins: openingSimpleMode ? 0 : openingCoins,
        simple_mode: openingSimpleMode,
      });

      if (response.data.success) {
        const { has_difference, opening_difference } = response.data;

        if (has_difference) {
          const diffAmount = new Intl.NumberFormat('es-CL').format(Math.abs(opening_difference));
          const diffType = opening_difference > 0 ? 'SOBRANTE' : 'FALTANTE';
          message.warning(`Turno iniciado con ${diffType} de $${diffAmount} en apertura`, 5);
        } else {
          message.success('Turno iniciado correctamente - Conteo exacto');
        }

        setShift(response.data.data);
        setInitialBalance('');
        setOpeningSimpleTotal('');
        setOpening20000(0);
        setOpening10000(0);
        setOpening5000(0);
        setOpening2000(0);
        setOpening1000(0);
        setOpeningCoins(0);
        setOpeningModalVisible(false);
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al iniciar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (closingSimpleMode && (!closingSimpleTotal || Number(closingSimpleTotal) <= 0)) {
      message.error('Ingrese el monto total de la caja al cierre (mayor a 0)');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/cash-management/shift/end', {
        simple_mode: closingSimpleMode,
        closing_total: closingSimpleMode ? closingSimpleTotal : undefined,
        closing_20000: closingSimpleMode ? 0 : closing20000,
        closing_10000: closingSimpleMode ? 0 : closing10000,
        closing_5000: closingSimpleMode ? 0 : closing5000,
        closing_2000: closingSimpleMode ? 0 : closing2000,
        closing_1000: closingSimpleMode ? 0 : closing1000,
        closing_coins: closingSimpleMode ? 0 : closingCoins,
        closing_notes: closingNotes,
      });

      if (response.data.success) {
        const { difference } = response.data.data;

        let msg = 'Turno cerrado correctamente.';
        if (!closingSimpleMode && difference !== 0) {
          msg += ` Diferencia: $${new Intl.NumberFormat('es-CL').format(Math.abs(difference))} ${difference > 0 ? '(Sobrante)' : '(Faltante)'}`;
        }

        message.success(msg);
        setShift(null);
        setPasilleras([]);
        setTransactions([]);
        setClosingSimpleTotal('');
        setClosing20000(0);
        setClosing10000(0);
        setClosing5000(0);
        setClosing2000(0);
        setClosing1000(0);
        setClosingCoins(0);
        setClosingNotes('');
        setClosingModalVisible(false);
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al cerrar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (type, adminUserId = null, overrideExpenseType = null) => {
    if (!amount || amount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }

    // Validaciones específicas por tipo
    if (MACHINE_TYPES.includes(type) && !machine) {
      message.error(`Debe indicar el número de máquina para ${TYPE_LABELS[type]}`);
      return;
    }
    const effectiveExpenseType = overrideExpenseType || expenseType;
    if (type === 'other' && !effectiveExpenseType) {
      message.error('Debe indicar el tipo de gasto');
      return;
    }
    if (['sorteo', 'bonus_especial', 'prestamo'].includes(type) && !client) {
      message.error('Debe indicar el nombre del cliente');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('amount', amount);
      if (client) formData.append('client', client);
      if (machine) formData.append('machine', machine);
      if (effectiveExpenseType) formData.append('expense_type', effectiveExpenseType);
      if (expenseImage) formData.append('image', expenseImage);
      if (adminUserId) formData.append('admin_user_id', adminUserId);

      const response = await api.post('/cash-management/transaction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success('Transacción registrada correctamente');
        setAmount('');
        setClient('');
        setMachine('');
        setExpenseType('');
        setOtherExpenseType('');
        setOtherExpenseCustom('');
        setExpenseImage(null);
        setPaymentModalVisible(false);
        setOtherModalVisible(false);
        setClientModalVisible(false);
        setClientTransactionType('');
        setAuthModalVisible(false);
        setAuthUsername('');
        setAuthPassword('');
        setAuthUser(null);
        setAuthTransactionType('');
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al registrar transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthTransaction = async () => {
    if (!authUsername || !authPassword) {
      message.error('Debe ingresar usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cash-management/admin/validate-credentials', {
        username: authUsername,
        password: authPassword,
      });

      if (response.data.success) {
        setAuthUser(response.data.user);
        await handleTransaction(authTransactionType, response.data.user.id);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPasillera = async () => {
    if (!pasilleraUserId || !pasilleraInitialBalance || pasilleraInitialBalance <= 0) {
      message.error('Complete todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cash-management/pasillera', {
        user_id: pasilleraUserId,
        initial_balance: pasilleraInitialBalance,
      });

      if (response.data.success) {
        message.success('Pasillera agregada correctamente');
        setPasilleraUserId(null);
        setPasilleraInitialBalance('');
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al agregar pasillera');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasillera = async (pasilleraId) => {
    Modal.confirm({
      title: 'Reiniciar Pasillera',
      content: (
        <Input
          type="number"
          placeholder="Ingrese el nuevo saldo inicial"
          id={`reset-input-${pasilleraId}`}
        />
      ),
      onOk: async () => {
        const input = document.getElementById(`reset-input-${pasilleraId}`);
        const newBalance = input?.value;

        if (!newBalance || newBalance <= 0) {
          message.error('Ingrese un saldo válido');
          return;
        }

        try {
          const response = await api.put(`/cash-management/pasillera/${pasilleraId}/reset`, {
            new_balance: newBalance,
          });

          if (response.data.success) {
            message.success('Pasillera reiniciada correctamente');
            fetchShiftStatus();
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Error al reiniciar pasillera');
        }
      },
    });
  };

  const handleDeletePasillera = async (pasilleraId) => {
    setLoading(true);
    try {
      const response = await api.delete(`/cash-management/pasillera/${pasilleraId}`);

      if (response.data.success) {
        message.success('Pasillera eliminada correctamente');
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al eliminar pasillera');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async () => {
    if (!addBalanceAmount || Number(addBalanceAmount) <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        `/cash-management/pasillera/${addBalancePasilleraId}/add-balance`,
        { amount: Number(addBalanceAmount) },
      );

      if (response.data.success) {
        message.success('Saldo agregado correctamente');
        setAddBalanceModalVisible(false);
        setAddBalanceAmount('');
        setAddBalancePasilleraId(null);
        setAddBalancePasilleraName('');
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al agregar saldo');
    } finally {
      setLoading(false);
    }
  };

  const openAddBalanceModal = (pasillera) => {
    setAddBalancePasilleraId(pasillera.id);
    setAddBalancePasilleraName(`${pasillera.user?.first_name} ${pasillera.user?.first_last_name}`);
    setAddBalanceAmount('');
    setAddBalanceModalVisible(true);
  };

  const getUserLabel = (u) =>
    u ? [u.first_name, u.first_last_name].filter(Boolean).join(' ') || u.username : '';

  // Mismo formato que el historial de cajas y la app de pasillera
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  // Inactivity timer - COMENTADO POR AHORA
  /*
  const INACTIVITY_TIMEOUT = 30 * 1000; // 30 segundos
  let inactivityTimer;

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      setInactivityModalVisible(true);
      localStorage.setItem('sessionLocked', 'true');
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Si la sesión ya está bloqueada, no iniciar el timer
    if (inactivityModalVisible) {
      return;
    }

    const handleActivity = () => {
      if (!inactivityModalVisible) {
        resetInactivityTimer();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [inactivityModalVisible]);
  */

  const handleUnlockSession = async () => {
    if (!unlockPassword) {
      message.error('Ingrese su contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cash-management/admin/validate-current-password', {
        password: unlockPassword,
      });

      if (response.data.success) {
        message.success('Sesión desbloqueada');
        setInactivityModalVisible(false);
        setUnlockPassword('');
        localStorage.removeItem('sessionLocked');
        resetInactivityTimer();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const transactionColumns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDateTimeCL(date, { seconds: true }),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => {
        if (record.source === 'ticket') {
          return <Tag color="blue">Ticket</Tag>;
        }
        const label = TYPE_LABELS[type] || type;
        const sourceLabel = record.source === 'pasillera' ? ' (Pasillera)' : '';
        return label + sourceLabel;
      },
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => {
        const value = record.source === 'ticket' ? record.total_amount : amount;
        return formatCurrency(value);
      },
    },
    {
      title: 'Máquina',
      dataIndex: 'machine',
      key: 'machine',
      render: (m, record) => {
        if (record.source === 'ticket') return record.ticket_number || '-';
        return m || '-';
      },
    },
    {
      title: 'Tipo Gasto',
      dataIndex: 'expense_type',
      key: 'expense_type',
      render: (e, record) => {
        if (record.source === 'ticket') return record.type || '-';
        return e || '-';
      },
    },
    {
      title: 'Detalle',
      dataIndex: 'description',
      key: 'description',
      render: (desc, record) => {
        if (record.source === 'ticket') {
          return `Ticket #${record.ticket_number} - ${record.user?.first_name} ${record.user?.first_last_name || ''}`;
        }
        const parts = [];
        if (record.type === 'deposit') parts.push('Agregar Dinero');
        else if (record.type === 'withdrawal') parts.push('Quitar Dinero');
        if (record.client) parts.push(record.client);
        if (record.machine) parts.push(`Máquina: ${record.machine}`);
        if (record.expense_type) parts.push(record.expense_type);
        if (['deposit', 'withdrawal'].includes(record.type) && record.admin_user) {
          const u = record.admin_user;
          parts.push(
            `Autorizado por: ${[u.first_name, u.first_last_name].filter(Boolean).join(' ')}`,
          );
        }
        return parts.length ? parts.join(' | ') : desc || '-';
      },
    },
    {
      title: 'Operado por',
      key: 'operator',
      width: 160,
      render: (_, record) => {
        if (record.source === 'ticket') return <span>-</span>;
        // Transacciones de pasillera
        if (record.pasillera_id && record.pasillera?.user) {
          const pu = record.pasillera.user;
          return (
            <span>
              {[pu.first_name, pu.first_last_name].filter(Boolean).join(' ') || '-'}{' '}
              <Tag size="small" color="blue">
                Pasillera
              </Tag>
            </span>
          );
        }
        // Transacciones normales (admin)
        const u = record?.admin_user || (record?.first_name ? record : null);
        if (u) {
          return <span>{[u.first_name, u.first_last_name].filter(Boolean).join(' ') || '-'}</span>;
        }
        return <span>-</span>;
      },
    },
    {
      title: 'Billetes',
      key: 'bills',
      render: (_, record) => {
        const shiftData = shift;
        if (!shiftData) return '-';
        return (
          <Button
            type="link"
            size="small"
            onClick={() => {
              Modal.info({
                title: 'Desglose de Billetes',
                width: 500,
                content: (
                  <div>
                    <h4>Apertura</h4>
                    <div style={{ marginBottom: 16 }}>
                      <div>
                        $20.000: {shiftData.opening_20000 || 0} x 20.000 ={' '}
                        {formatCurrency((shiftData.opening_20000 || 0) * 20000)}
                      </div>
                      <div>
                        $10.000: {shiftData.opening_10000 || 0} x 10.000 ={' '}
                        {formatCurrency((shiftData.opening_10000 || 0) * 10000)}
                      </div>
                      <div>
                        $5.000: {shiftData.opening_5000 || 0} x 5.000 ={' '}
                        {formatCurrency((shiftData.opening_5000 || 0) * 5000)}
                      </div>
                      <div>
                        $2.000: {shiftData.opening_2000 || 0} x 2.000 ={' '}
                        {formatCurrency((shiftData.opening_2000 || 0) * 2000)}
                      </div>
                      <div>
                        $1.000: {shiftData.opening_1000 || 0} x 1.000 ={' '}
                        {formatCurrency((shiftData.opening_1000 || 0) * 1000)}
                      </div>
                      <div>Monedas: {formatCurrency(shiftData.opening_coins || 0)}</div>
                      <Divider />
                      <div style={{ fontWeight: 'bold' }}>
                        Total Apertura: {formatCurrency(shiftData.opening_total_counted || 0)}
                      </div>
                    </div>
                    {!shiftData.is_active && (
                      <>
                        <h4>Cierre</h4>
                        <div>
                          <div>
                            $20.000: {shiftData.closing_20000 || 0} x 20.000 ={' '}
                            {formatCurrency((shiftData.closing_20000 || 0) * 20000)}
                          </div>
                          <div>
                            $10.000: {shiftData.closing_10000 || 0} x 10.000 ={' '}
                            {formatCurrency((shiftData.closing_10000 || 0) * 10000)}
                          </div>
                          <div>
                            $5.000: {shiftData.closing_5000 || 0} x 5.000 ={' '}
                            {formatCurrency((shiftData.closing_5000 || 0) * 5000)}
                          </div>
                          <div>
                            $2.000: {shiftData.closing_2000 || 0} x 2.000 ={' '}
                            {formatCurrency((shiftData.closing_2000 || 0) * 2000)}
                          </div>
                          <div>
                            $1.000: {shiftData.closing_1000 || 0} x 1.000 ={' '}
                            {formatCurrency((shiftData.closing_1000 || 0) * 1000)}
                          </div>
                          <div>Monedas: {formatCurrency(shiftData.closing_coins || 0)}</div>
                          <Divider />
                          <div style={{ fontWeight: 'bold' }}>
                            Total Cierre: {formatCurrency(shiftData.closing_total_counted || 0)}
                          </div>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color:
                                shiftData.difference !== 0
                                  ? shiftData.difference > 0
                                    ? '#52c41a'
                                    : '#ff4d4f'
                                  : undefined,
                            }}
                          >
                            Diferencia:{' '}
                            {shiftData.difference !== 0
                              ? shiftData.difference > 0
                                ? '+'
                                : ''
                              : ''}
                            {formatCurrency(shiftData.difference || 0)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ),
              });
            }}
          >
            Ver desglose
          </Button>
        );
      },
    },
    {
      title: 'Imagen',
      dataIndex: 'image',
      key: 'image',
      render: (image) => {
        if (!image) return '-';
        return (
          <a
            href={`/storage/${image}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1890ff' }}
          >
            Ver imagen
          </a>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        if (record.source === 'ticket') return '-';
        // Las transacciones de pasillera se editan/eliminan desde su propia app,
        // donde se ajusta su saldo sin tocar el de la caja.
        if (record.source === 'pasillera') return '-';
        const isAdmin = ['duenio', 'super-admin'].includes(auth.role);
        const editable =
          isAdmin &&
          shift?.is_active &&
          [
            'transfer',
            'giro',
            'payment',
            'other',
            'sorteo',
            'bonus_especial',
            'prestamo',
            'deposit',
            'withdrawal',
          ].includes(record.type);
        const deletable =
          isAdmin &&
          shift?.is_active &&
          [
            'transfer',
            'giro',
            'payment',
            'other',
            'sorteo',
            'bonus_especial',
            'prestamo',
            'deposit',
            'withdrawal',
          ].includes(record.type);
        if (!editable && !deletable) return '-';
        return (
          <Space>
            {editable && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditTransaction(record)}
              />
            )}
            {deletable && (
              <Popconfirm
                title="¿Eliminar esta transacción?"
                description="Se revertirá el efecto sobre el saldo de la caja."
                okText="Eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeleteTransaction(record.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const openEditTransaction = (tx) => {
    setEditingTx(tx);
    setEditAmount(Number(tx.amount) || 0);
    setEditClient(tx.client || '');
    setEditMachine(tx.machine || '');
    setEditExpenseType(tx.expense_type || '');
    setEditModalVisible(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTx) return;
    if (!editAmount || editAmount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }
    if (editingTx.type === 'payment' && !editMachine) {
      message.error('Debe indicar el número de máquina');
      return;
    }
    if (editingTx.type === 'other' && !editExpenseType) {
      message.error('Debe indicar el tipo de gasto');
      return;
    }
    try {
      setLoading(true);
      const res = await api.put(`/cash-management/transaction/${editingTx.id}`, {
        amount: editAmount,
        client: editClient,
        machine: editMachine,
        expense_type: editExpenseType,
      });
      if (res.data.success) {
        message.success('Transacción actualizada');
        setEditModalVisible(false);
        setEditingTx(null);
        fetchShiftStatus();
      } else {
        message.error(res.data.message || 'Error al actualizar');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      setLoading(true);
      const res = await api.delete(`/cash-management/transaction/${id}`);
      if (res.data.success) {
        message.success('Transacción eliminada');
        fetchShiftStatus();
      } else {
        message.error(res.data.message || 'Error al eliminar');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const branchSelector = (
    <Select
      style={{ minWidth: 240 }}
      placeholder="Seleccionar sucursal"
      value={branchId}
      onChange={handleBranchChange}
      showSearch
      optionFilterProp="children"
      size="large"
    >
      {branches.map((b) => (
        <Option key={b.id} value={b.id}>
          {b.name}
        </Option>
      ))}
    </Select>
  );

  // Mientras se resuelve la sucursal o llega la primera tanda de datos se
  // muestra el esqueleto de la pantalla, no una versión vacía de la real.
  if (switchingBranch || initialLoading) {
    return (
      <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
        <Head title="Sistema de Caja" />

        <div className="p-4 mx-auto space-y-4 max-w-[1600px] sm:p-6">
          <PageHeader
            title="Sistema de Gestión de Caja"
            icon={BankOutlined}
            subtitle={switchingBranch ? 'Cambiando de sucursal…' : 'Cargando la caja…'}
          />

          <Row gutter={[16, 16]}>
            {[0, 1, 2].map((i) => (
              <Col xs={24} lg={8} key={i}>
                <Card>
                  <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                </Card>
              </Col>
            ))}
          </Row>

          <Card>
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Spin size="large" />
              <Text type="secondary">
                {switchingBranch
                  ? 'Buscando el turno de la sucursal seleccionada…'
                  : 'Cargando movimientos y pasilleras…'}
              </Text>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Un rol superior todavía no eligió sucursal: no hay nada que mostrar
  if (canSelectBranch && !branchId) {
    return (
      <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
        <Head title="Sistema de Caja" />

        <div className="p-4 mx-auto max-w-[1600px] sm:p-6">
          <PageHeader title="Sistema de Gestión de Caja" icon={BankOutlined} />
          <Card>
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <ShopOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Elegí una sucursal
                </Title>
                <Text type="secondary">
                  Tu rol no tiene sucursal asignada. Seleccioná sobre cuál querés operar.
                </Text>
              </div>
              {branchSelector}
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (serverError) {
    return (
      <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
        <Head title="Sistema de Caja" />
        <div className="p-4 mx-auto max-w-[1600px] sm:p-6">
          <PageHeader title="Sistema de Gestión de Caja" icon={BankOutlined} />
          <Alert type="warning" showIcon message={serverError} />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Un superior mirando el turno que abrió otra persona
  const shiftOwner = shift?.user;
  const isForeignShift = shiftOwner && shiftOwner.id !== auth.user?.id;
  const currentBalance = Number(shift?.current_balance) || 0;
  const exceedsBalance = Number(amount || 0) > 0 && Number(amount) > currentBalance;

  // Las acciones que abren un modal comparten la misma validación de monto
  const withAmount = (fn) => {
    if (!amount || amount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }
    fn();
  };

  const openMachineModal = (type) => {
    setMachineTransactionType(type);
    setPaymentModalVisible(true);
  };

  const openClientModal = (type) => {
    setClientTransactionType(type);
    setClientModalVisible(true);
  };

  const openAuthModal = (type) => {
    setAuthTransactionType(type);
    setAuthModalVisible(true);
  };

  return (
    <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
      <Head title="Sistema de Caja" />

      <div className="p-4 mx-auto space-y-4 max-w-[1600px] sm:p-6">
        <PageHeader
          title="Sistema de Gestión de Caja"
          icon={BankOutlined}
          subtitle={
            shift?.is_active
              ? `Turno abierto${shift.started_at ? ` · desde ${formatDateTimeCL(shift.started_at)} hrs` : ''}`
              : 'Sin turno abierto'
          }
          actions={
            <>
              {canSelectBranch
                ? branchSelector
                : branch?.name && (
                    <Tag color="blue" style={{ padding: '6px 12px', fontSize: 13, margin: 0 }}>
                      {branch.name}
                    </Tag>
                  )}
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefresh}
                loading={refreshing}
                size="large"
                title="Actualizar toda la página"
              >
                Actualizar
              </Button>
            </>
          }
        />

        {isForeignShift && (
          <Alert
            type="info"
            showIcon
            message={`Estás operando sobre el turno de ${[shiftOwner.first_name, shiftOwner.first_last_name].filter(Boolean).join(' ')}`}
            description="Cada movimiento que registres queda a tu nombre."
          />
        )}

        {/* Resumen de saldos: siempre visible, el saldo actual manda */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <div
              className={`h-full p-5 rounded-xl border-2 ${
                currentBalance < 0
                  ? 'bg-red-50 border-red-300'
                  : currentBalance === 0
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Saldo Actual en Caja
                </p>
                <RefreshBtn tooltip="Actualizar saldo actual" />
              </div>
              <p
                className={`mt-1 text-3xl font-bold sm:text-4xl tabular-nums ${
                  currentBalance < 0
                    ? 'text-red-700'
                    : currentBalance === 0
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                }`}
              >
                {formatCurrency(currentBalance)}
              </p>
              {currentBalance < 0 && (
                <p className="mt-2 text-sm font-semibold text-red-700">
                  ⚠ Saldo negativo. Revisá las transacciones registradas.
                </p>
              )}
              {shift?.is_active && (
                <Button
                  danger
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  className="mt-4"
                  onClick={() => setClosingModalVisible(true)}
                >
                  Cerrar Caja
                </Button>
              )}
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <div className="h-full p-4 bg-white border rounded-xl border-slate-200">
              <p className="text-xs font-medium text-slate-500">Saldo Anterior</p>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(prevBalance)}
              </p>
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <div className="h-full p-4 bg-white border rounded-xl border-slate-200">
              <p className="text-xs font-medium text-slate-500">Saldo Inicial del Turno</p>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(shift?.total_initial_balance ?? 0)}
              </p>
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="h-full p-4 bg-white border rounded-xl border-slate-200">
              <p className="text-xs font-medium text-slate-500">Turno</p>
              {shift?.is_active ? (
                <>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    Abierto por {getUserLabel(shift.user) || 'usuario'}
                  </p>
                  <p className="text-sm text-slate-500 tabular-nums">
                    Desde {formatDateTimeCL(shift.started_at)} hrs
                  </p>
                </>
              ) : (
                <p className="mt-1 text-base font-semibold text-slate-500">Sin turno abierto</p>
              )}
              {shift?.difference != null && Number(shift.difference) !== 0 && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    Number(shift.difference) > 0 ? 'text-cyan-700' : 'text-red-700'
                  }`}
                >
                  {Number(shift.difference) > 0 ? '⬆ Sobrante' : '⬇ Faltante'} de apertura:{' '}
                  {formatCurrency(Math.abs(Number(shift.difference)))}
                </p>
              )}
            </div>
          </Col>
        </Row>

        {/* Apertura: solo tiene sentido mostrarla cuando no hay turno abierto */}
        {!shift?.is_active && (
          <Card title="Abrir Caja">
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={9}>
                <Text strong>Modo de Ingreso</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={initialBalanceMode}
                  onChange={setInitialBalanceMode}
                  size="large"
                >
                  <Option value="total">Monto Total (incluye saldo anterior)</Option>
                  <Option value="additional">Monto Adicional (a sumar al saldo anterior)</Option>
                </Select>
              </Col>
              <Col xs={24} md={7}>
                <Text strong>
                  {initialBalanceMode === 'total' ? 'Monto Total en Caja' : 'Monto a Agregar'}
                </Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={initialBalance}
                  onChange={setInitialBalance}
                  size="large"
                  placeholder={
                    initialBalanceMode === 'total'
                      ? 'Ingrese el monto total'
                      : 'Ingrese monto a agregar'
                  }
                  min={0}
                  precision={2}
                />
              </Col>
              <Col xs={24} md={4}>
                <p className="text-xs font-medium text-slate-500">Saldo Inicial Total</p>
                <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(
                    initialBalanceMode === 'total'
                      ? Number(initialBalance) || 0
                      : prevBalance + (Number(initialBalance) || 0),
                  )}
                </p>
              </Col>
              <Col xs={24} md={4}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => setOpeningModalVisible(true)}
                  disabled={!initialBalance}
                  loading={loading}
                >
                  Abrir Caja
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {shift?.is_active && (
          <Card
            title="Movimientos del Turno"
            extra={<RefreshBtn tooltip="Actualizar movimientos" />}
          >
            <Row gutter={[16, 16]}>
              {[
                {
                  title: 'Transferencias',
                  total: shift?.total_transfers,
                  caja: shift?.total_transfers_caja,
                  pasillera: shift?.total_transfers_pasillera,
                },
                {
                  title: 'Giros',
                  total: shift?.total_giros,
                  caja: shift?.total_giros_caja,
                  pasillera: shift?.total_giros_pasillera,
                },
                {
                  title: 'Pagos por Caja',
                  total: shift?.total_payments,
                  caja: shift?.total_payments_caja,
                  pasillera: shift?.total_payments_pasillera,
                },
                {
                  title: 'Tragados',
                  total: shift?.total_tragados,
                  caja: shift?.total_tragados_caja,
                  pasillera: shift?.total_tragados_pasillera,
                },
                {
                  title: 'Otros Gastos',
                  total: shift?.total_other,
                  caja: shift?.total_other_caja,
                  pasillera: shift?.total_other_pasillera,
                },
                {
                  title: 'Sorteos',
                  total: shift?.total_sorteo,
                  caja: shift?.total_sorteo_caja,
                  pasillera: shift?.total_sorteo_pasillera,
                },
                {
                  title: 'Bonus Especial',
                  total: shift?.total_bonus_especial,
                  caja: shift?.total_bonus_especial_caja,
                  pasillera: shift?.total_bonus_especial_pasillera,
                },
                {
                  title: 'Préstamos',
                  total: shift?.total_prestamo,
                  caja: shift?.total_prestamo_caja,
                  pasillera: shift?.total_prestamo_pasillera,
                },
                {
                  title: 'Depósitos',
                  total: shift?.total_deposit,
                  caja: shift?.total_deposit_caja,
                  pasillera: shift?.total_deposit_pasillera,
                },
                {
                  title: 'Retiros',
                  total: shift?.total_withdrawal,
                  caja: shift?.total_withdrawal_caja,
                  pasillera: shift?.total_withdrawal_pasillera,
                },
              ].map((item, idx) => {
                const total = Number(item.total) || 0;
                const caja = Number(item.caja) || 0;
                const pasillera = Number(item.pasillera) || 0;
                const empty = total === 0;

                return (
                  <Col xs={12} sm={8} xl={6} key={idx}>
                    <div
                      className={`h-full px-3 py-2.5 rounded-lg border ${
                        empty ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-medium truncate text-slate-500">{item.title}</p>
                      <p
                        className={`mt-0.5 text-lg font-bold tabular-nums ${
                          empty ? 'text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(total)}
                      </p>
                      <div className="grid grid-cols-2 gap-1 pt-2 mt-2 border-t border-slate-200">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Caja</p>
                          <p className="text-xs font-semibold truncate text-slate-700 tabular-nums">
                            {formatCurrency(caja)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Pasillera
                          </p>
                          <p className="text-xs font-semibold truncate text-slate-700 tabular-nums">
                            {formatCurrency(pasillera)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
              <Col xs={12} sm={8} xl={6}>
                <div className="h-full px-3 py-2.5 rounded-lg border bg-emerald-50 border-emerald-200">
                  <p className="text-xs font-medium text-emerald-700">Tickets</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(Number(totalTickets) || 0)}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Nueva Transacción */}
        <Card title="Nueva Transacción" extra={<RefreshBtn tooltip="Actualizar transacciones" />}>
          {!shift?.is_active ? (
            <Alert type="info" showIcon message="Abrí la caja para poder registrar transacciones" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={10}>
                  <Text strong>Monto *</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    value={amount}
                    onChange={setAmount}
                    size="large"
                    placeholder="Ingrese monto"
                    min={0}
                    precision={2}
                    status={exceedsBalance ? 'warning' : ''}
                  />
                </Col>
                <Col xs={24} md={14}>
                  <Text strong>Cliente</Text>
                  <Input
                    style={{ marginTop: 8 }}
                    size="large"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Nombre del cliente (obligatorio en Sorteo, Bono Especial y Préstamo)"
                  />
                </Col>
              </Row>

              {exceedsBalance && (
                <Alert
                  type="warning"
                  showIcon
                  message={`El monto excede el saldo actual (${formatCurrency(currentBalance)}). No se podrá registrar como Giro, Pago u Otro Gasto.`}
                />
              )}

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Gastos y pagos
                </p>
                <Space wrap>
                  <Button
                    size="large"
                    onClick={() => handleTransaction('transfer')}
                    loading={loading}
                  >
                    Transferencia
                  </Button>
                  <Button size="large" onClick={() => handleTransaction('giro')} loading={loading}>
                    Giro
                  </Button>
                  <Button
                    size="large"
                    onClick={() => withAmount(() => openMachineModal('payment'))}
                  >
                    Pago por Caja
                  </Button>
                  <Button
                    size="large"
                    onClick={() => withAmount(() => openMachineModal('tragados'))}
                  >
                    Tragados
                  </Button>
                  <Button size="large" onClick={() => withAmount(() => setOtherModalVisible(true))}>
                    Otro Gasto
                  </Button>
                  <Button size="large" onClick={() => withAmount(() => openClientModal('sorteo'))}>
                    Sorteo
                  </Button>
                  <Button
                    size="large"
                    onClick={() => withAmount(() => openClientModal('bonus_especial'))}
                  >
                    Bono Especial
                  </Button>
                  <Button
                    size="large"
                    onClick={() => withAmount(() => openClientModal('prestamo'))}
                  >
                    Préstamo
                  </Button>
                </Space>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Movimientos de caja · requieren autorización
                </p>
                <Space wrap>
                  <Button
                    size="large"
                    type="primary"
                    onClick={() => withAmount(() => openAuthModal('deposit'))}
                  >
                    Agregar Dinero
                  </Button>
                  <Button
                    size="large"
                    danger
                    onClick={() => withAmount(() => openAuthModal('withdrawal'))}
                  >
                    Quitar Dinero
                  </Button>
                </Space>
              </div>
            </Space>
          )}
        </Card>

        {/* Modal de Pago por Caja y Tragados - pedir máquina */}
        <Modal
          title={TYPE_LABELS[machineTransactionType] || 'Pago por Caja'}
          open={paymentModalVisible}
          onCancel={() => {
            setPaymentModalVisible(false);
            setMachine('');
          }}
          onOk={() => handleTransaction(machineTransactionType)}
          confirmLoading={loading}
          okText="Registrar"
          cancelText="Cancelar"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Monto</Text>
              <div>{formatCurrency(amount || 0)}</div>
            </div>
            <div>
              <Text strong>Cliente</Text>
              <div>{client || '-'}</div>
            </div>
            <div>
              <Text strong>N° Máquina *</Text>
              <Input
                autoFocus
                value={machine}
                onChange={(e) => setMachine(e.target.value.toUpperCase())}
                placeholder="Ej: 12, A-05"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Modal>

        {/* Modal Otro Gasto - pedir tipo de gasto */}
        <Modal
          title="Otro Gasto"
          open={otherModalVisible}
          onCancel={() => {
            setOtherModalVisible(false);
            setOtherExpenseType('');
            setOtherExpenseCustom('');
            setExpenseImage(null);
          }}
          onOk={() => {
            const finalExpenseType =
              otherExpenseType === 'Otros' ? otherExpenseCustom : otherExpenseType;
            setExpenseType(finalExpenseType);
            handleTransaction('other', null, finalExpenseType);
          }}
          confirmLoading={loading}
          okText="Registrar"
          cancelText="Cancelar"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Monto</Text>
              <div>{formatCurrency(amount || 0)}</div>
            </div>
            <div>
              <Text strong>Tipo de Gasto *</Text>
              <Select
                autoFocus
                value={otherExpenseType}
                onChange={(value) => {
                  setOtherExpenseType(value);
                  if (value !== 'Otros') {
                    setOtherExpenseCustom('');
                  }
                }}
                placeholder="Seleccione el tipo de gasto"
                style={{ width: '100%', marginTop: 8 }}
              >
                {commonExpenses.map((expense) => (
                  <Select.Option key={expense} value={expense}>
                    {expense}
                  </Select.Option>
                ))}
              </Select>
            </div>
            {otherExpenseType === 'Otros' && (
              <div>
                <Text strong>Especifique el gasto *</Text>
                <Input
                  value={otherExpenseCustom}
                  onChange={(e) => setOtherExpenseCustom(e.target.value)}
                  placeholder="Ej: Compras, Viáticos, etc."
                  style={{ marginTop: 8 }}
                />
              </div>
            )}
            <div>
              <Text strong>Detalle (opcional)</Text>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Descripción adicional"
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>Adjuntar imagen (opcional)</Text>
              <Upload
                accept="image/*"
                listType="picture-card"
                maxCount={1}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('Solo se permiten archivos de imagen');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('La imagen no puede superar 5MB');
                    return Upload.LIST_IGNORE;
                  }
                  setExpenseImage(file);
                  return false;
                }}
                onRemove={() => setExpenseImage(null)}
                style={{ marginTop: 8 }}
              >
                {expenseImage ? null : (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Subir imagen</div>
                  </div>
                )}
              </Upload>
            </div>
          </Space>
        </Modal>

        {/* Modal Cliente - para Sorteo, Bono Especial, Préstamo */}
        <Modal
          title={
            clientTransactionType === 'sorteo'
              ? 'Sorteo'
              : clientTransactionType === 'bonus_especial'
                ? 'Bono Especial'
                : 'Préstamo'
          }
          open={clientModalVisible}
          onCancel={() => {
            setClientModalVisible(false);
            setClient('');
            setClientTransactionType('');
          }}
          onOk={() => handleTransaction(clientTransactionType)}
          confirmLoading={loading}
          okText="Registrar"
          cancelText="Cancelar"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Monto</Text>
              <div>{formatCurrency(amount || 0)}</div>
            </div>
            <div>
              <Text strong>Cliente *</Text>
              <Input
                autoFocus
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nombre del cliente"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Modal>

        {/* Modal Autenticación - para Agregar/Quitar Dinero */}
        <Modal
          title={
            authTransactionType === 'deposit' ? 'Agregar Dinero a Caja' : 'Quitar Dinero de Caja'
          }
          open={authModalVisible}
          onCancel={() => {
            setAuthModalVisible(false);
            setAuthUsername('');
            setAuthPassword('');
            setAuthUser(null);
            setAuthTransactionType('');
          }}
          onOk={handleAuthTransaction}
          confirmLoading={loading}
          okText="Confirmar"
          cancelText="Cancelar"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Monto</Text>
              <div>{formatCurrency(amount || 0)}</div>
            </div>
            <Divider />
            <div>
              <Text strong>Usuario *</Text>
              <Input
                autoFocus
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Nombre de usuario"
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>Contraseña *</Text>
              <Input.Password
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Contraseña"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Modal>

        {/* Modal Inactividad - Bloqueo por seguridad - COMENTADO POR AHORA
        <Modal
          title="Sesión Bloqueada por Inactividad"
          open={inactivityModalVisible}
          closable={false}
          maskClosable={false}
          footer={[
            <Button key="unlock" type="primary" onClick={handleUnlockSession} loading={loading}>
              Desbloquear
            </Button>,
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Por seguridad, su sesión ha sido bloqueada por inactividad."
              description="Ingrese su contraseña para continuar."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div>
              <Text strong>Contraseña *</Text>
              <Input.Password
                autoFocus
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                onPressEnter={handleUnlockSession}
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Modal>
        */}

        {/* Modal Editar Transacción */}
        <Modal
          title={`Editar Transacción${
            editingTx ? ' · ' + (TYPE_LABELS[editingTx.type] || editingTx.type) : ''
          }`}
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingTx(null);
          }}
          onOk={handleUpdateTransaction}
          confirmLoading={loading}
          okText="Guardar"
          cancelText="Cancelar"
          destroyOnClose
        >
          {editingTx && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Monto</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={editAmount}
                  onChange={setEditAmount}
                  min={0.01}
                  precision={2}
                />
              </div>
              {(editingTx.type === 'payment' || editingTx.type === 'pasillera_payment') && (
                <div>
                  <Text strong>N° Máquina *</Text>
                  <Input
                    value={editMachine}
                    onChange={(e) => setEditMachine(e.target.value.toUpperCase())}
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}
              {editingTx.type === 'other' && (
                <div>
                  <Text strong>Tipo de Gasto *</Text>
                  <Input
                    value={editExpenseType}
                    onChange={(e) => setEditExpenseType(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}
              <div>
                <Text strong>Cliente / Detalle</Text>
                <Input
                  value={editClient}
                  onChange={(e) => setEditClient(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Space>
          )}
        </Modal>

        {/* Control de Pasilleras */}
        <Card title="Control de Pasilleras" extra={<RefreshBtn tooltip="Actualizar pasilleras" />}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {!shift?.is_active ? (
              <Alert
                type="info"
                showIcon
                message="Abrí la caja para poder asignar saldo a una pasillera"
              />
            ) : (
              <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} sm={10}>
                  <Text strong>Seleccionar Pasillera</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    size="large"
                    value={pasilleraUserId}
                    onChange={setPasilleraUserId}
                    placeholder="Seleccione un usuario"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                    notFoundContent="No hay usuarios con cargo PASILLER@ en esta sucursal"
                  >
                    {availableUsers.map((user) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={10}>
                  <Text strong>Saldo Inicial</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    size="large"
                    value={pasilleraInitialBalance}
                    onChange={setPasilleraInitialBalance}
                    placeholder="Saldo inicial"
                    min={0}
                    precision={2}
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleAddPasillera}
                    disabled={!pasilleraInitialBalance || !pasilleraUserId}
                    loading={loading}
                    block
                  >
                    Agregar
                  </Button>
                </Col>
              </Row>
            )}

            {(() => {
              const fmtTs = (ts) => formatDateTimeCL(ts);

              const grouped = {};
              pasilleras.forEach((p) => {
                const uid = p.user?.id ?? 'unknown';
                if (!grouped[uid]) grouped[uid] = { user: p.user, items: [] };
                grouped[uid].items.push(p);
              });

              const groupList = Object.values(grouped);

              if (!groupList.length) {
                return (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm">Todavía no hay pasilleras en este turno.</p>
                  </div>
                );
              }

              return groupList.map(({ user, items }, groupIdx) => (
                <div key={user?.id ?? 'unknown'} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      👤 {user?.first_name} {user?.first_last_name}
                    </Text>
                    <Tag color="blue">
                      {items.length} turno{items.length !== 1 ? 's' : ''}
                    </Tag>
                  </div>

                  <Row gutter={[16, 16]}>
                    {items.map((pasillera) => {
                      const hasReintegro = pasillera.transactions?.some(
                        (t) => t.type === 'pasillera_return',
                      );
                      const reintegroTx = pasillera.transactions?.find(
                        (t) => t.type === 'pasillera_return',
                      );
                      const isBalanceZero =
                        Number(pasillera.current_balance) === 0 && !hasReintegro;
                      const isForceClosed = pasillera.force_closed;

                      return (
                        <Col xs={24} md={12} key={pasillera.id}>
                          <Card
                            size="small"
                            title={
                              <span
                                style={{
                                  color: isForceClosed
                                    ? '#cf1322'
                                    : hasReintegro
                                      ? '#389e0d'
                                      : undefined,
                                }}
                              >
                                {`Turno #${pasillera.id} - ${user?.first_name} ${user?.first_last_name}`}
                                {isForceClosed && (
                                  <Tag color="error" style={{ marginLeft: 8, fontSize: 11 }}>
                                    ⚠ Cierre Forzado
                                  </Tag>
                                )}
                                {hasReintegro && !isForceClosed && (
                                  <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>
                                    ✓ Reintegrado
                                  </Tag>
                                )}
                                {isBalanceZero && !isForceClosed && (
                                  <Tag color="warning" style={{ marginLeft: 8, fontSize: 11 }}>
                                    Saldo en $0
                                  </Tag>
                                )}
                              </span>
                            }
                            style={{
                              borderColor: isForceClosed
                                ? '#ffccc7'
                                : hasReintegro
                                  ? '#b7eb8f'
                                  : undefined,
                              background: isForceClosed
                                ? '#fff1f0'
                                : hasReintegro
                                  ? '#f6ffed'
                                  : undefined,
                            }}
                            headStyle={{
                              background: isForceClosed
                                ? '#ffccc7'
                                : hasReintegro
                                  ? '#d9f7be'
                                  : undefined,
                            }}
                            extra={
                              !hasReintegro &&
                              !isForceClosed && (
                                <Space size="small">
                                  <RefreshBtn tooltip={`Actualizar datos de ${user?.first_name}`} />
                                  <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={() => openAddBalanceModal(pasillera)}
                                    title="Agregar saldo"
                                  />
                                  <Popconfirm
                                    title="¿Eliminar esta pasillera?"
                                    onConfirm={() => handleDeletePasillera(pasillera.id)}
                                    okText="Sí"
                                    cancelText="No"
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      size="small"
                                    />
                                  </Popconfirm>
                                </Space>
                              )
                            }
                          >
                            <Row gutter={[8, 8]}>
                              <Col span={12}>
                                <Text type="secondary">Saldo Inicial:</Text>
                                <br />
                                <Text strong>{formatCurrency(pasillera.initial_balance)}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Pagos:</Text>
                                <br />
                                <Text strong>{formatCurrency(pasillera.total_payments)}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Saldo Actual:</Text>
                                <br />
                                <Text
                                  strong
                                  style={{
                                    color: hasReintegro
                                      ? '#52c41a'
                                      : isBalanceZero
                                        ? '#fa8c16'
                                        : undefined,
                                  }}
                                >
                                  {formatCurrency(pasillera.current_balance)}
                                </Text>
                              </Col>
                            </Row>

                            <Divider style={{ margin: '10px 0' }} />

                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              <div>
                                🕐{' '}
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Asignado:
                                </Text>{' '}
                                <Text style={{ fontSize: 12 }}>{fmtTs(pasillera.created_at)}</Text>
                              </div>
                              {hasReintegro && reintegroTx && (
                                <div style={{ marginTop: 4 }}>
                                  ✅{' '}
                                  <Text style={{ fontSize: 12, color: '#52c41a' }}>
                                    Reintegrado:
                                  </Text>{' '}
                                  <Text style={{ fontSize: 12 }}>
                                    {fmtTs(reintegroTx.created_at)}
                                  </Text>
                                </div>
                              )}
                              {isBalanceZero && (
                                <div style={{ marginTop: 4, color: '#fa8c16' }}>
                                  ⚠ Saldo llegó a $0
                                </div>
                              )}
                            </div>

                            {pasillera.transactions && pasillera.transactions.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <Text strong style={{ fontSize: 12 }}>
                                  Registros:
                                </Text>
                                <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6 }}>
                                  {pasillera.transactions.map((registro, index) => {
                                    // Dentro de la pasillera estos dos tipos se
                                    // nombran distinto que en la tabla general
                                    const typeLabels = {
                                      ...TYPE_LABELS,
                                      pasillera_payment: 'Pago Máquina',
                                      pasillera_return: 'Reintegro',
                                    };
                                    const label = typeLabels[registro.type] || registro.type;
                                    const isPositive = ['deposit', 'pasillera_return'].includes(
                                      registro.type,
                                    );
                                    const isNegative = [
                                      'pasillera_payment',
                                      'transfer',
                                      'giro',
                                      'payment',
                                      'other',
                                      'sorteo',
                                      'bonus_especial',
                                      'prestamo',
                                      'withdrawal',
                                    ].includes(registro.type);
                                    const color =
                                      registro.type === 'pasillera_return'
                                        ? '#52c41a'
                                        : isNegative
                                          ? '#cf1322'
                                          : isPositive
                                            ? '#13c2c2'
                                            : undefined;

                                    const details = [];
                                    if (registro.client)
                                      details.push(`Cliente: ${registro.client}`);
                                    if (registro.machine)
                                      details.push(`Máquina: ${registro.machine}`);
                                    if (registro.expense_type) details.push(registro.expense_type);
                                    if (registro.description) details.push(registro.description);

                                    return (
                                      <div
                                        key={index}
                                        style={{
                                          fontSize: 12,
                                          marginBottom: 6,
                                          padding: '4px 6px',
                                          borderRadius: 4,
                                          background:
                                            registro.type === 'pasillera_return'
                                              ? '#f6ffed'
                                              : '#f5f5f5',
                                          borderLeft: `3px solid ${color || '#d9d9d9'}`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                          }}
                                        >
                                          <span>
                                            <span style={{ fontWeight: 600, color }}>{label}</span>
                                            {' · '}
                                            <span style={{ fontWeight: 700 }}>
                                              {formatCurrency(registro.amount)}
                                            </span>
                                          </span>
                                          <span style={{ color: '#8c8c8c', fontSize: 11 }}>
                                            {formatDateTimeCL(registro.created_at, {
                                              seconds: true,
                                            })}
                                          </span>
                                        </div>
                                        {details.length > 0 && (
                                          <div
                                            style={{ color: '#595959', fontSize: 11, marginTop: 2 }}
                                          >
                                            {details.join(' · ')}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                  {groupIdx < groupList.length - 1 && <Divider style={{ margin: '16px 0' }} />}
                </div>
              ));
            })()}
          </Space>
        </Card>

        {/* Historial de Transacciones */}
        <Card
          title={
            <span>
              Historial de Transacciones{' '}
              <Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
                ({combinedHistory.length})
              </Text>
            </span>
          }
          extra={<RefreshBtn tooltip="Actualizar historial" />}
        >
          <Table
            columns={transactionColumns}
            dataSource={combinedHistory}
            rowKey={(record) => `${record.source}-${record.id}`}
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '25', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
            }}
            scroll={{ x: 800 }}
            locale={{
              emptyText: shift?.is_active
                ? 'Todavía no hay movimientos en este turno'
                : 'Abrí la caja para registrar movimientos',
            }}
          />
        </Card>

        {/* Modal de Apertura de Caja */}
        <Modal
          title="Apertura de Caja"
          open={openingModalVisible}
          onOk={handleStartShift}
          onCancel={() => setOpeningModalVisible(false)}
          okText="Abrir Caja"
          cancelText="Cancelar"
          width={600}
          confirmLoading={loading}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Branch info */}
            {branch?.name && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Sucursal:
                </Text>
                <Text strong style={{ fontSize: 14, color: '#1d4ed8' }}>
                  {branch.name}
                </Text>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Switch
                checked={openingSimpleMode}
                onChange={setOpeningSimpleMode}
                checkedChildren="Monto directo"
                unCheckedChildren="Desglose billetes"
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {openingSimpleMode
                  ? 'Ingresa el total de dinero en caja directamente.'
                  : 'Detalla la cantidad de cada billete para mayor control.'}
              </Text>
            </div>

            {openingSimpleMode ? (
              /* SIMPLE MODE */
              <div>
                <div>
                  <Text strong>Modo de Ingreso</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={initialBalanceMode}
                    onChange={setInitialBalanceMode}
                  >
                    <Option value="total">Monto Total (incluye saldo anterior)</Option>
                    <Option value="additional">Monto Adicional (a sumar al saldo anterior)</Option>
                  </Select>
                </div>
                <Text strong>
                  {initialBalanceMode === 'total'
                    ? 'Total en caja al abrir *'
                    : 'Monto a Agregar *'}
                </Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={initialBalance}
                  onChange={setInitialBalance}
                  placeholder={initialBalanceMode === 'total' ? 'Ej: 150000' : 'Ej: 100000'}
                  min={1}
                  precision={0}
                  size="large"
                />
                {initialBalance > 0 && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {initialBalanceMode === 'total'
                      ? `Total en caja: $${new Intl.NumberFormat('es-CL').format(initialBalance)}`
                      : `Total en caja: $${new Intl.NumberFormat('es-CL').format(prevBalance + Number(initialBalance))} (Saldo anterior: $${new Intl.NumberFormat('es-CL').format(prevBalance)})`}
                  </Text>
                )}
              </div>
            ) : (
              /* DENOMINATION MODE */
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Modo de Ingreso</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={initialBalanceMode}
                    onChange={setInitialBalanceMode}
                  >
                    <Option value="total">Monto Total (incluye saldo anterior)</Option>
                    <Option value="additional">Monto Adicional (a sumar al saldo anterior)</Option>
                  </Select>
                </div>
                <div>
                  <Text strong>
                    {initialBalanceMode === 'total' ? 'Monto Total en Caja' : 'Monto a Agregar'}
                  </Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    value={initialBalance}
                    onChange={setInitialBalance}
                    placeholder={
                      initialBalanceMode === 'total'
                        ? 'Ingrese el monto total'
                        : 'Ingrese monto a agregar'
                    }
                    min={0}
                    precision={2}
                  />
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Saldo Esperado"
                      value={
                        initialBalanceMode === 'total'
                          ? Number(initialBalance) || 0
                          : prevBalance + (Number(initialBalance) || 0)
                      }
                      precision={0}
                      prefix="$"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Contado"
                      value={calculateOpeningTotal()}
                      precision={0}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>

                <div>
                  <Statistic
                    title="Diferencia"
                    value={
                      calculateOpeningTotal() -
                      (initialBalanceMode === 'total'
                        ? Number(initialBalance) || 0
                        : prevBalance + (Number(initialBalance) || 0))
                    }
                    precision={0}
                    prefix="$"
                    valueStyle={{
                      color:
                        calculateOpeningTotal() -
                          (initialBalanceMode === 'total'
                            ? Number(initialBalance) || 0
                            : prevBalance + (Number(initialBalance) || 0)) ===
                        0
                          ? '#3f8600'
                          : calculateOpeningTotal() -
                                (initialBalanceMode === 'total'
                                  ? Number(initialBalance) || 0
                                  : prevBalance + (Number(initialBalance) || 0)) >
                              0
                            ? '#1890ff'
                            : '#cf1322',
                    }}
                    suffix={
                      calculateOpeningTotal() -
                        (initialBalanceMode === 'total'
                          ? Number(initialBalance) || 0
                          : prevBalance + (Number(initialBalance) || 0)) ===
                      0
                        ? '(Exacto)'
                        : calculateOpeningTotal() -
                              (initialBalanceMode === 'total'
                                ? Number(initialBalance) || 0
                                : prevBalance + (Number(initialBalance) || 0)) >
                            0
                          ? '(Sobrante)'
                          : '(Faltante)'
                    }
                  />
                </div>

                {[
                  { label: '$20.000', state: opening20000, setter: setOpening20000, val: 20000 },
                  { label: '$10.000', state: opening10000, setter: setOpening10000, val: 10000 },
                  { label: '$5.000', state: opening5000, setter: setOpening5000, val: 5000 },
                  { label: '$2.000', state: opening2000, setter: setOpening2000, val: 2000 },
                  { label: '$1.000', state: opening1000, setter: setOpening1000, val: 1000 },
                ].map(({ label, state, setter, val }) => (
                  <Row key={label} gutter={[16, 8]} align="middle">
                    <Col span={12}>
                      <Text strong>Billetes de {label}</Text>
                      <InputNumber
                        style={{ width: '100%', marginTop: 8 }}
                        value={state}
                        onChange={setter}
                        min={0}
                        placeholder="Cantidad"
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">
                        Total: ${new Intl.NumberFormat('es-CL').format(state * val)}
                      </Text>
                    </Col>
                  </Row>
                ))}

                <Row gutter={[16, 8]} align="middle">
                  <Col span={12}>
                    <Text strong>Monedas</Text>
                    <InputNumber
                      style={{ width: '100%', marginTop: 8 }}
                      value={openingCoins}
                      onChange={setOpeningCoins}
                      min={0}
                      placeholder="Monto en monedas"
                      precision={0}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">
                      Total: ${new Intl.NumberFormat('es-CL').format(openingCoins)}
                    </Text>
                  </Col>
                </Row>
              </Space>
            )}
          </Space>
        </Modal>

        {/* Modal de Cierre de Caja */}
        <Modal
          title="Cierre de Caja"
          open={closingModalVisible}
          onOk={handleEndShift}
          onCancel={() => setClosingModalVisible(false)}
          okText="Cerrar Caja"
          cancelText="Cancelar"
          width={700}
          confirmLoading={loading}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Mode toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Switch
                checked={closingSimpleMode}
                onChange={setClosingSimpleMode}
                checkedChildren="Monto directo"
                unCheckedChildren="Desglose billetes"
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {closingSimpleMode
                  ? 'Ingresa el total de dinero en caja al cerrar directamente.'
                  : 'Detalla la cantidad de cada billete para mayor control.'}
              </Text>
            </div>

            {closingSimpleMode ? (
              /* SIMPLE MODE */
              <div>
                <Text strong>Total en caja al cerrar *</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={closingSimpleTotal}
                  onChange={setClosingSimpleTotal}
                  placeholder="Ej: 150000"
                  min={1}
                  precision={0}
                  size="large"
                />
                {closingSimpleTotal > 0 && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Monto ingresado:{' '}
                    <strong>${new Intl.NumberFormat('es-CL').format(closingSimpleTotal)}</strong>
                  </Text>
                )}
              </div>
            ) : (
              /* DENOMINATION MODE */
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Saldo Esperado en Caja"
                      value={shift?.current_balance || 0}
                      precision={0}
                      prefix="$"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Contado"
                      value={calculateClosingTotal()}
                      precision={0}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>

                <div>
                  <Statistic
                    title="Diferencia"
                    value={calculateClosingTotal() - (shift?.current_balance || 0)}
                    precision={0}
                    prefix="$"
                    valueStyle={{
                      color:
                        calculateClosingTotal() - (shift?.current_balance || 0) === 0
                          ? '#3f8600'
                          : calculateClosingTotal() - (shift?.current_balance || 0) > 0
                            ? '#1890ff'
                            : '#cf1322',
                    }}
                    suffix={
                      calculateClosingTotal() - (shift?.current_balance || 0) === 0
                        ? '(Exacto)'
                        : calculateClosingTotal() - (shift?.current_balance || 0) > 0
                          ? '(Sobrante)'
                          : '(Faltante)'
                    }
                  />
                </div>

                {[
                  { label: '$20.000', state: closing20000, setter: setClosing20000, val: 20000 },
                  { label: '$10.000', state: closing10000, setter: setClosing10000, val: 10000 },
                  { label: '$5.000', state: closing5000, setter: setClosing5000, val: 5000 },
                  { label: '$2.000', state: closing2000, setter: setClosing2000, val: 2000 },
                  { label: '$1.000', state: closing1000, setter: setClosing1000, val: 1000 },
                ].map(({ label, state, setter, val }) => (
                  <Row key={label} gutter={[16, 8]} align="middle">
                    <Col span={12}>
                      <Text strong>Billetes de {label}</Text>
                      <InputNumber
                        style={{ width: '100%', marginTop: 8 }}
                        value={state}
                        onChange={setter}
                        min={0}
                        placeholder="Cantidad"
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">
                        Total: ${new Intl.NumberFormat('es-CL').format(state * val)}
                      </Text>
                    </Col>
                  </Row>
                ))}

                <Row gutter={[16, 8]} align="middle">
                  <Col span={12}>
                    <Text strong>Monedas</Text>
                    <InputNumber
                      style={{ width: '100%', marginTop: 8 }}
                      value={closingCoins}
                      onChange={setClosingCoins}
                      min={0}
                      placeholder="Monto en monedas"
                      precision={0}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">
                      Total: ${new Intl.NumberFormat('es-CL').format(closingCoins)}
                    </Text>
                  </Col>
                </Row>
              </Space>
            )}

            <div>
              <Text strong>Notas de Cierre</Text>
              <Input.TextArea
                style={{ marginTop: 8 }}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Observaciones sobre el cierre (opcional)"
                rows={3}
              />
            </div>
          </Space>
        </Modal>

        {/* Modal Agregar Saldo a Pasillera */}
        <Modal
          title="Agregar Saldo a Pasillera"
          open={addBalanceModalVisible}
          onOk={handleAddBalance}
          onCancel={() => {
            setAddBalanceModalVisible(false);
            setAddBalanceAmount('');
            setAddBalancePasilleraId(null);
            setAddBalancePasilleraName('');
          }}
          okText="Agregar"
          cancelText="Cancelar"
          confirmLoading={loading}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Pasillera:</Text>
              <br />
              <Text>{addBalancePasilleraName}</Text>
            </div>
            <div>
              <Text strong>Monto a agregar *</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={addBalanceAmount}
                onChange={setAddBalanceAmount}
                min={0.01}
                precision={2}
                placeholder="Ingrese el monto"
                prefix="$"
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Este monto se descontará de la caja y se sumará al saldo de la pasillera.
            </Text>
          </Space>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
