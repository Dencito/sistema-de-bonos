import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
} from 'antd';
import { DeleteOutlined, ReloadOutlined, PlusOutlined, SwapOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

export default function SystemBank({ auth, activeShift, previousBalance, availableUsers = [], branch, tickets: initialTickets = [] }) {
  const [shift, setShift] = useState(activeShift);
  const [prevBalance, setPrevBalance] = useState(previousBalance || 0);
  const [initialBalance, setInitialBalance] = useState('');
  const [initialBalanceMode, setInitialBalanceMode] = useState('total');
  const [amount, setAmount] = useState('');
  const [client, setClient] = useState('');
  const [machine, setMachine] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    if (activeShift) {
      fetchShiftStatus();
    }
  }, []);

  const fetchShiftStatus = async () => {
    try {
      const response = await axios.get('/cash-management/shift-status');
      if (response.data.success) {
        setShift(response.data.data.activeShift);
        setPrevBalance(response.data.data.previousBalance);
        setPasilleras(response.data.data.activeShift?.pasilleras || []);
        setTransactions(response.data.data.activeShift?.transactions || []);
      }
      // Cargar transacciones y tickets del turno activo
      const txResponse = await axios.get('/cash-management/transactions');
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
    ...transactions.map(t => ({ ...t, source: 'transaction' })),
    ...tickets.map(t => ({ ...t, source: 'ticket' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Calcular saldo ajustado restando tickets
  const totalTicketsAmount = tickets.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const adjustedBalance = (shift?.current_balance || 0) - totalTicketsAmount;

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
      ? (initialBalanceMode === 'total' ? Number(initialBalance) : prevBalance + Number(initialBalance))
      : calculateOpeningTotal();

    if (!openingSimpleMode && effectiveTotal <= 0) {
      message.error('El conteo de billetes no puede ser 0');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/cash-management/shift/start', {
        initial_balance: initialBalanceToSend,
        opening_total: openingSimpleMode
          ? (initialBalanceMode === 'total' ? Number(initialBalance) : prevBalance + Number(initialBalance))
          : calculateOpeningTotal(),
        opening_20000: openingSimpleMode ? 0 : opening20000,
        opening_10000: openingSimpleMode ? 0 : opening10000,
        opening_5000: openingSimpleMode ? 0 : opening5000,
        opening_2000: openingSimpleMode ? 0 : opening2000,
        opening_1000: openingSimpleMode ? 0 : opening10000,
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
      const response = await axios.post('/cash-management/shift/end', {
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
    if (type === 'payment' && !machine) {
      message.error('Debe indicar el número de máquina para Pago por Caja');
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

      const response = await axios.post('/cash-management/transaction', formData, {
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
      const response = await axios.post('/cash-management/admin/validate-credentials', {
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
      const response = await axios.post('/cash-management/pasillera', {
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
          const response = await axios.put(`/cash-management/pasillera/${pasilleraId}/reset`, {
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
      const response = await axios.delete(`/cash-management/pasillera/${pasilleraId}`);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount || 0);
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
      const response = await axios.post('/cash-management/admin/validate-current-password', {
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
      render: (date) => new Date(date).toLocaleString('es-AR'),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => {
        if (record.source === 'ticket') {
          return <Tag color="blue">Ticket</Tag>;
        }
        const types = {
          transfer: 'Transferencia',
          giro: 'Giro',
          payment: 'Pago por Caja',
          other: 'Otro Gasto',
          pasillera_payment: 'Pago Pasillera',
          pasillera_return: 'Reintegro Pasillera',
          sorteo: 'Sorteo',
          bonus_especial: 'Bono Especial',
          prestamo: 'Préstamo',
          deposit: 'Agregar Dinero',
          withdrawal: 'Quitar Dinero',
        };
        return types[type] || type;
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
          parts.push(`Autorizado por: ${[u.first_name, u.first_last_name].filter(Boolean).join(' ')}`);
        }
        if (record.pasillera?.user) {
          const p = record.pasillera.user;
          parts.push(`Pasillero: ${[p.first_name, p.first_last_name].filter(Boolean).join(' ')}`);
        }
        return parts.length ? parts.join(' | ') : (desc || '-');
      },
    },
    {
      title: 'Autorizado por',
      key: 'operator',
      render: (_, record) => {
        if (record.source === 'ticket') return '-';
        // Pasillera transaction: show pasillero name
        if (record.pasillera?.user) {
          const u = record.pasillera.user;
          const name = [u.first_name, u.first_last_name].filter(Boolean).join(' ') || '-';
          return `Pasillera: ${name}`;
        }
        // Admin transaction (deposit/withdrawal/etc): show admin name
        if (record.admin_user) {
          const u = record.admin_user;
          const name = [u.first_name, u.first_last_name].filter(Boolean).join(' ') || '-';
          return `Admin: ${name}`;
        }
        return '-';
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
                      <div>$20.000: {shiftData.opening_20000 || 0} x 20.000 = {formatCurrency((shiftData.opening_20000 || 0) * 20000)}</div>
                      <div>$10.000: {shiftData.opening_10000 || 0} x 10.000 = {formatCurrency((shiftData.opening_10000 || 0) * 10000)}</div>
                      <div>$5.000: {shiftData.opening_5000 || 0} x 5.000 = {formatCurrency((shiftData.opening_5000 || 0) * 5000)}</div>
                      <div>$2.000: {shiftData.opening_2000 || 0} x 2.000 = {formatCurrency((shiftData.opening_2000 || 0) * 2000)}</div>
                      <div>$1.000: {shiftData.opening_1000 || 0} x 1.000 = {formatCurrency((shiftData.opening_1000 || 0) * 1000)}</div>
                      <div>Monedas: {formatCurrency(shiftData.opening_coins || 0)}</div>
                      <Divider />
                      <div style={{ fontWeight: 'bold' }}>Total Apertura: {formatCurrency(shiftData.opening_total_counted || 0)}</div>
                    </div>
                    {!shiftData.is_active && (
                      <>
                        <h4>Cierre</h4>
                        <div>
                          <div>$20.000: {shiftData.closing_20000 || 0} x 20.000 = {formatCurrency((shiftData.closing_20000 || 0) * 20000)}</div>
                          <div>$10.000: {shiftData.closing_10000 || 0} x 10.000 = {formatCurrency((shiftData.closing_10000 || 0) * 10000)}</div>
                          <div>$5.000: {shiftData.closing_5000 || 0} x 5.000 = {formatCurrency((shiftData.closing_5000 || 0) * 5000)}</div>
                          <div>$2.000: {shiftData.closing_2000 || 0} x 2.000 = {formatCurrency((shiftData.closing_2000 || 0) * 2000)}</div>
                          <div>$1.000: {shiftData.closing_1000 || 0} x 1.000 = {formatCurrency((shiftData.closing_1000 || 0) * 1000)}</div>
                          <div>Monedas: {formatCurrency(shiftData.closing_coins || 0)}</div>
                          <Divider />
                          <div style={{ fontWeight: 'bold' }}>Total Cierre: {formatCurrency(shiftData.closing_total_counted || 0)}</div>
                          <div style={{ fontWeight: 'bold', color: shiftData.difference !== 0 ? (shiftData.difference > 0 ? '#52c41a' : '#ff4d4f') : undefined }}>
                            Diferencia: {shiftData.difference !== 0 ? (shiftData.difference > 0 ? '+' : '') : ''}{formatCurrency(shiftData.difference || 0)}
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
        const isAdmin = ['duenio', 'super-admin'].includes(auth.role);
        const editable = isAdmin && shift?.is_active && ['transfer', 'giro', 'payment', 'other', 'sorteo', 'bonus_especial', 'prestamo', 'deposit', 'withdrawal'].includes(record.type);
        const deletable = isAdmin && shift?.is_active && ['transfer', 'giro', 'payment', 'other', 'sorteo', 'bonus_especial', 'prestamo', 'deposit', 'withdrawal'].includes(record.type);
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
      const res = await axios.put(`/cash-management/transaction/${editingTx.id}`, {
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
      const res = await axios.delete(`/cash-management/transaction/${id}`);
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


  return (
    <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
      <Head title="Sistema de Caja" />

      <div className="container p-4 mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Title level={2} style={{ margin: 0 }}>Sistema de Gestión de Caja</Title>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
              title="Actualizar toda la página"
            >
              Actualizar
            </Button>
          </div>
          {branch?.name && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Text type="secondary" style={{ fontSize: 13 }}>Sucursal:</Text>
              <Text strong style={{ fontSize: 14, color: '#1d4ed8' }}>{branch.name}</Text>
            </div>
          )}
        </div>

        {/* Control de Caja */}
        <Card
          title="Control de Caja"
          extra={<RefreshBtn tooltip="Actualizar saldos de caja" />}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div className="flex items-center gap-2">
                  <Statistic title="Saldo Anterior" value={prevBalance} precision={2} prefix="$" />
                  <RefreshBtn tooltip="Actualizar saldo anterior" />
                </div>
                <div>
                  <Text strong>Modo de Ingreso</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={initialBalanceMode}
                    onChange={setInitialBalanceMode}
                    disabled={shift?.is_active}
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
                    placeholder={initialBalanceMode === 'total' ? 'Ingrese el monto total' : 'Ingrese monto a agregar'}
                    disabled={shift?.is_active}
                    min={0}
                    precision={2}
                  />
                </div>
                <Statistic
                  title="Saldo Inicial Total"
                  value={initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)}
                  precision={2}
                  prefix="$"
                />
                {!shift?.is_active ? (
                  <Button
                    type="primary"
                    onClick={() => setOpeningModalVisible(true)}
                    disabled={!initialBalance}
                    loading={loading}
                    block
                  >
                    Abrir Caja
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    danger
                    loading={loading}
                    block
                    onClick={() => setClosingModalVisible(true)}
                  >
                    Cerrar Caja
                  </Button>
                )}
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div className="flex items-center gap-2">
                  <Statistic
                    title="Saldo Actual"
                    value={adjustedBalance}
                    precision={2}
                    prefix="$"
                    valueStyle={{
                      color: adjustedBalance < 0
                        ? '#cf1322'
                        : adjustedBalance === 0
                          ? '#faad14'
                          : '#3f8600',
                    }}
                  />
                  <RefreshBtn tooltip="Actualizar saldo actual" />
                </div>
                {totalTicketsAmount > 0 && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      color: '#096dd9',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Tickets del turno: ${new Intl.NumberFormat('en-US').format(Math.trunc(totalTicketsAmount))}
                  </div>
                )}
                {Number(shift?.current_balance || 0) < 0 && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: '#fff1f0',
                      border: '1px solid #ffa39e',
                      color: '#cf1322',
                      fontWeight: 600,
                    }}
                  >
                    ⚠ Saldo negativo. Revise las transacciones registradas.
                  </div>
                )}

                <Card size="small" title="Movimientos del Turno">
                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={8}>
                      <Statistic title="Transferencias" value={shift?.total_transfers || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Giros" value={shift?.total_giros || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Pagos por Caja" value={shift?.total_payments || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Otros Gastos" value={shift?.total_other || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Sorteos" value={shift?.total_sorteo || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Bonus Especial" value={shift?.total_bonus_especial || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Préstamos" value={shift?.total_prestamo || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Depósitos" value={shift?.total_deposit || 0} precision={2} prefix="$" />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Retiros" value={shift?.total_withdrawal || 0} precision={2} prefix="$" />
                    </Col>
                  </Row>
                </Card>

                {shift?.difference != null && Number(shift.difference) !== 0 && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: Number(shift.difference) > 0 ? '#e6fffb' : '#fff1f0',
                      border: `1px solid ${Number(shift.difference) > 0 ? '#87e8de' : '#ffa39e'}`,
                    }}
                  >
                    <Text strong style={{ color: Number(shift.difference) > 0 ? '#13c2c2' : '#cf1322' }}>
                      {Number(shift.difference) > 0 ? '⬆ SOBRANTE' : '⬇ FALTANTE'} de apertura:{' '}
                      {formatCurrency(Math.abs(Number(shift.difference)))}
                    </Text>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Nueva Transacción */}
        <Card title="Nueva Transacción" extra={<RefreshBtn tooltip="Actualizar transacciones" />}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>Monto</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                value={amount}
                onChange={setAmount}
                placeholder="Ingrese monto"
                disabled={!shift?.is_active}
                min={0}
                precision={2}
                status={Number(amount || 0) > Number(shift?.current_balance || 0) ? 'warning' : ''}
              />
              {Number(amount || 0) > 0 && Number(amount || 0) > Number(shift?.current_balance || 0) && (
                <div style={{ color: '#faad14', marginTop: 4, fontSize: 12 }}>
                  ⚠ El monto excede el saldo actual ({formatCurrency(shift?.current_balance || 0)}). No se podrá registrar como Giro / Pago / Otro Gasto.
                </div>
              )}
            </div>
            <div>
              <Text strong>Cliente</Text>
              <Input
                style={{ marginTop: 8 }}
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nombre del cliente"
                disabled={!shift?.is_active}
              />
            </div>
            <Space style={{ width: '100%' }} wrap>
              <Button
                onClick={() => handleTransaction('transfer')}
                disabled={!shift?.is_active}
                loading={loading}
              >
                Transferencia
              </Button>
              <Button
                onClick={() => handleTransaction('giro')}
                disabled={!shift?.is_active}
                loading={loading}
              >
                Giro
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setPaymentModalVisible(true);
                }}
                disabled={!shift?.is_active}
              >
                Pago por Caja
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setOtherModalVisible(true);
                }}
                disabled={!shift?.is_active}
              >
                Otro Gasto
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setClientTransactionType('sorteo');
                  setClientModalVisible(true);
                }}
                disabled={!shift?.is_active}
              >
                Sorteo
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setClientTransactionType('bonus_especial');
                  setClientModalVisible(true);
                }}
                disabled={!shift?.is_active}
              >
                Bono Especial
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setAuthTransactionType('deposit');
                  setAuthModalVisible(true);
                }}
                disabled={!shift?.is_active}
                type="primary"
              >
                Agregar Dinero
              </Button>
              <Button
                onClick={() => {
                  if (!amount || amount <= 0) {
                    message.error('Ingrese un monto válido');
                    return;
                  }
                  setAuthTransactionType('withdrawal');
                  setAuthModalVisible(true);
                }}
                disabled={!shift?.is_active}
                danger
              >
                Quitar Dinero
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Modal Pago por Caja - pedir máquina */}
        <Modal
          title="Pago por Caja"
          open={paymentModalVisible}
          onCancel={() => {
            setPaymentModalVisible(false);
            setMachine('');
          }}
          onOk={() => handleTransaction('payment')}
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
            const finalExpenseType = otherExpenseType === 'Otros' ? otherExpenseCustom : otherExpenseType;
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
          title={clientTransactionType === 'sorteo' ? 'Sorteo' : clientTransactionType === 'bonus_especial' ? 'Bono Especial' : 'Préstamo'}
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
          title={authTransactionType === 'deposit' ? 'Agregar Dinero a Caja' : 'Quitar Dinero de Caja'}
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
          title={`Editar Transacción${editingTx ? ' · ' + ({
            transfer: 'Transferencia',
            giro: 'Giro',
            payment: 'Pago por Caja',
            other: 'Otro Gasto',
          }[editingTx.type] || editingTx.type) : ''}`}
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
            <Row gutter={16}>
              <Col xs={24} sm={10}>
                <Text strong>Seleccionar Pasillera</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={pasilleraUserId}
                  onChange={setPasilleraUserId}
                  placeholder="Seleccione un usuario"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
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
                  value={pasilleraInitialBalance}
                  onChange={setPasilleraInitialBalance}
                  placeholder="Saldo inicial"
                  min={0}
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  type="primary"
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

{(() => {
                const fmtTs = (ts) => ts ? new Date(ts).toLocaleString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                }) : '-';

                const grouped = {};
                pasilleras.forEach(p => {
                  const uid = p.user?.id ?? 'unknown';
                  if (!grouped[uid]) grouped[uid] = { user: p.user, items: [] };
                  grouped[uid].items.push(p);
                });

                const groupList = Object.values(grouped);
                return groupList.map(({ user, items }, groupIdx) => (
                  <div key={user?.id ?? 'unknown'} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 14 }}>
                        👤 {user?.first_name} {user?.first_last_name}
                      </Text>
                      <Tag color="blue">{items.length} turno{items.length !== 1 ? 's' : ''}</Tag>
                    </div>

                    <Row gutter={[16, 16]}>
                      {items.map((pasillera) => {
                        const hasReintegro = pasillera.transactions?.some(t => t.type === 'pasillera_return');
                        const reintegroTx = pasillera.transactions?.find(t => t.type === 'pasillera_return');
                        const isBalanceZero = Number(pasillera.current_balance) === 0 && !hasReintegro;
                        const isForceClosed = pasillera.force_closed;

                        return (
                          <Col xs={24} md={12} key={pasillera.id}>
                            <Card
                              size="small"
                              title={
                                <span style={{ color: isForceClosed ? '#cf1322' : hasReintegro ? '#389e0d' : undefined }}>
                                  {`Turno #${pasillera.id} - ${user?.first_name} ${user?.first_last_name}`}
                                  {isForceClosed && (
                                    <Tag color="error" style={{ marginLeft: 8, fontSize: 11 }}>⚠ Cierre Forzado</Tag>
                                  )}
                                  {hasReintegro && !isForceClosed && (
                                    <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>✓ Reintegrado</Tag>
                                  )}
                                  {isBalanceZero && !isForceClosed && (
                                    <Tag color="warning" style={{ marginLeft: 8, fontSize: 11 }}>Saldo en $0</Tag>
                                  )}
                                </span>
                              }
                              style={{
                                borderColor: isForceClosed ? '#ffccc7' : hasReintegro ? '#b7eb8f' : undefined,
                                background: isForceClosed ? '#fff1f0' : hasReintegro ? '#f6ffed' : undefined,
                              }}
                              headStyle={{ background: isForceClosed ? '#ffccc7' : hasReintegro ? '#d9f7be' : undefined }}
                              extra={
                                !hasReintegro && !isForceClosed && (
                                  <Space size="small">
                                    <RefreshBtn tooltip={`Actualizar datos de ${user?.first_name}`} />
                                    <Popconfirm
                                      title="¿Eliminar esta pasillera?"
                                      onConfirm={() => handleDeletePasillera(pasillera.id)}
                                      okText="Sí"
                                      cancelText="No"
                                    >
                                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
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
                                  <Text strong style={{ color: hasReintegro ? '#52c41a' : isBalanceZero ? '#fa8c16' : undefined }}>
                                    {formatCurrency(pasillera.current_balance)}
                                  </Text>
                                </Col>
                              </Row>

                              <Divider style={{ margin: '10px 0' }} />

                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                <div>🕐 <Text type="secondary" style={{ fontSize: 12 }}>Asignado:</Text>{' '}
                                  <Text style={{ fontSize: 12 }}>{fmtTs(pasillera.created_at)}</Text>
                                </div>
                                {hasReintegro && reintegroTx && (
                                  <div style={{ marginTop: 4 }}>
                                    ✅ <Text style={{ fontSize: 12, color: '#52c41a' }}>Reintegrado:</Text>{' '}
                                    <Text style={{ fontSize: 12 }}>{fmtTs(reintegroTx.created_at)}</Text>
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
                                  <Text strong style={{ fontSize: 12 }}>Registros:</Text>
                                  <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6 }}>
                                    {pasillera.transactions.map((registro, index) => {
                                      const typeLabels = {
                                        pasillera_payment: 'Pago Máquina',
                                        pasillera_return: 'Reintegro',
                                        transfer: 'Transferencia',
                                        giro: 'Giro',
                                        payment: 'Pago por Caja',
                                        other: 'Otro Gasto',
                                        sorteo: 'Sorteo',
                                        bonus_especial: 'Bono Especial',
                                        prestamo: 'Préstamo',
                                        deposit: 'Agregar Dinero',
                                        withdrawal: 'Quitar Dinero',
                                      };
                                      const label = typeLabels[registro.type] || registro.type;
                                      const isPositive = ['deposit', 'pasillera_return'].includes(registro.type);
                                      const isNegative = ['pasillera_payment', 'transfer', 'giro', 'payment', 'other', 'sorteo', 'bonus_especial', 'prestamo', 'withdrawal'].includes(registro.type);
                                      const color = registro.type === 'pasillera_return' ? '#52c41a'
                                        : isNegative ? '#cf1322'
                                        : isPositive ? '#13c2c2'
                                        : undefined;

                                      const details = [];
                                      if (registro.client) details.push(`Cliente: ${registro.client}`);
                                      if (registro.machine) details.push(`Máquina: ${registro.machine}`);
                                      if (registro.expense_type) details.push(registro.expense_type);
                                      if (registro.description) details.push(registro.description);

                                      return (
                                        <div key={index} style={{
                                          fontSize: 12,
                                          marginBottom: 6,
                                          padding: '4px 6px',
                                          borderRadius: 4,
                                          background: registro.type === 'pasillera_return' ? '#f6ffed' : '#f5f5f5',
                                          borderLeft: `3px solid ${color || '#d9d9d9'}`,
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>
                                              <span style={{ fontWeight: 600, color }}>{label}</span>
                                              {' · '}
                                              <span style={{ fontWeight: 700 }}>{formatCurrency(registro.amount)}</span>
                                            </span>
                                            <span style={{ color: '#8c8c8c', fontSize: 11 }}>
                                              {new Date(registro.created_at).toLocaleString('es-AR')}
                                            </span>
                                          </div>
                                          {details.length > 0 && (
                                            <div style={{ color: '#595959', fontSize: 11, marginTop: 2 }}>
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
                    {groupIdx < groupList.length - 1 && (
                      <Divider style={{ margin: '16px 0' }} />
                    )}
                  </div>
                ));
              })()}
          </Space>
        </Card>

        {/* Historial de Transacciones */}
        <Card title="Historial de Transacciones" extra={<RefreshBtn tooltip="Actualizar historial" />}>
          <Table
            columns={transactionColumns}
            dataSource={combinedHistory}
            rowKey={(record) => `${record.source}-${record.id}`}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
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
                <Text type="secondary" style={{ fontSize: 13 }}>Sucursal:</Text>
                <Text strong style={{ fontSize: 14, color: '#1d4ed8' }}>{branch.name}</Text>
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
                  {initialBalanceMode === 'total' ? 'Total en caja al abrir *' : 'Monto a Agregar *'}
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
                      : `Total en caja: $${new Intl.NumberFormat('es-CL').format(prevBalance + Number(initialBalance))} (Saldo anterior: $${new Intl.NumberFormat('es-CL').format(prevBalance)})`
                    }
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
                    placeholder={initialBalanceMode === 'total' ? 'Ingrese el monto total' : 'Ingrese monto a agregar'}
                    min={0}
                    precision={2}
                  />
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Saldo Esperado"
                      value={initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)}
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
                    value={calculateOpeningTotal() - (initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0))}
                    precision={0}
                    prefix="$"
                    valueStyle={{
                      color:
                        calculateOpeningTotal() - (initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)) === 0
                          ? '#3f8600'
                          : calculateOpeningTotal() - (initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)) > 0
                            ? '#1890ff'
                            : '#cf1322',
                    }}
                    suffix={
                      calculateOpeningTotal() - (initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)) === 0
                        ? '(Exacto)'
                        : calculateOpeningTotal() - (initialBalanceMode === 'total' ? Number(initialBalance) || 0 : prevBalance + (Number(initialBalance) || 0)) > 0
                          ? '(Sobrante)'
                          : '(Faltante)'
                    }
                  />
                </div>

                {[{ label: '$20.000', state: opening20000, setter: setOpening20000, val: 20000 },
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
                      <Text type="secondary">Total: ${new Intl.NumberFormat('es-CL').format(state * val)}</Text>
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
                    <Text type="secondary">Total: ${new Intl.NumberFormat('es-CL').format(openingCoins)}</Text>
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
                    Monto ingresado: <strong>${new Intl.NumberFormat('es-CL').format(closingSimpleTotal)}</strong>
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

                {[{ label: '$20.000', state: closing20000, setter: setClosing20000, val: 20000 },
                  { label: '$10.000', state: closing10000, setter: setClosing10000, val: 10000 },
                  { label: '$5.000',  state: closing5000,  setter: setClosing5000,  val: 5000  },
                  { label: '$2.000',  state: closing2000,  setter: setClosing2000,  val: 2000  },
                  { label: '$1.000',  state: closing1000,  setter: setClosing1000,  val: 1000  },
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
                      <Text type="secondary">Total: ${new Intl.NumberFormat('es-CL').format(state * val)}</Text>
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
                    <Text type="secondary">Total: ${new Intl.NumberFormat('es-CL').format(closingCoins)}</Text>
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
      </div>
    </AuthenticatedLayout>
  );
}
