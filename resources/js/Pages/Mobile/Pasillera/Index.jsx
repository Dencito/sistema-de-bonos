import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
  Card,
  Input,
  Button,
  InputNumber,
  Modal,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Select,
  List,
  Empty,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  HistoryOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MobilePasillera({ auth }) {
  const [pasillera, setPasillera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [machine, setMachine] = useState('');
  const [description, setDescription] = useState('');
  const [machines, setMachines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactionType, setTransactionType] = useState('transfer');
  const [client, setClient] = useState('');
  const [expenseType, setExpenseType] = useState('');

  const TRANSACTION_TYPES = [
    { value: 'transfer', label: 'Transferencia' },
    { value: 'giro', label: 'Giro' },
    { value: 'payment', label: 'Pago por Caja' },
    { value: 'other', label: 'Otro Gasto' },
    { value: 'sorteo', label: 'Sorteo' },
    { value: 'bonus_especial', label: 'Bono Especial' },
    { value: 'prestamo', label: 'Préstamo' },
  ];

  const showMachine = transactionType === 'payment';
  const showClient = !showMachine;
  const showExpenseType = transactionType === 'other';

  useEffect(() => {
    loadData();
    loadMachines();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/pasillera/api/my-active');

      if (response.data.success) {
        setPasillera(response.data.data.pasillera);
        setTransactions(response.data.data.pasillera.transactions || []);
      } else {
        setPasillera(null);
        message.warning(response.data.message);
      }
    } catch (error) {
      console.error('Error loading pasillera:', error);
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const response = await axios.get('/pasillera/api/machines');
      if (response.data.success) {
        setMachines(response.data.data);
      }
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    message.success('Datos actualizados');
  };

  const handleSubmitTransaction = async () => {
    if (!amount || amount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }

    if (transactionType === 'payment' && !machine) {
      message.error('Seleccione una máquina');
      return;
    }

    if (transactionType === 'other' && !expenseType) {
      message.error('Ingrese el tipo de gasto');
      return;
    }

    if (amount > pasillera.current_balance) {
      message.error('Saldo insuficiente');
      return;
    }

    Modal.confirm({
      title: '¿Confirmar transacción?',
      content: (
        <div>
          <p>
            <strong>Tipo:</strong>{' '}
            {TRANSACTION_TYPES.find((t) => t.value === transactionType)?.label}
          </p>
          <p>
            <strong>Monto:</strong> ${formatNumber(amount)}
          </p>
          {client && (
            <p>
              <strong>Cliente:</strong> {client}
            </p>
          )}
          {machine && (
            <p>
              <strong>Máquina:</strong> {machine}
            </p>
          )}
          {expenseType && (
            <p>
              <strong>Tipo Gasto:</strong> {expenseType}
            </p>
          )}
          {description && (
            <p>
              <strong>Descripción:</strong> {description}
            </p>
          )}
          <p>
            <strong>Saldo restante:</strong> ${formatNumber(pasillera.current_balance - amount)}
          </p>
        </div>
      ),
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSubmitting(true);
        try {
          const response = await axios.post('/pasillera/api/transaction', {
            type: transactionType,
            amount: parseFloat(amount),
            client: client || null,
            machine: machine || null,
            expense_type: expenseType || null,
            description: description || null,
          });

          if (response.data.success) {
            message.success(response.data.message);
            setPasillera(response.data.data.pasillera);
            setTransactions(response.data.data.pasillera.transactions || []);

            setAmount('');
            setMachine('');
            setClient('');
            setExpenseType('');
            setDescription('');
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Error al registrar transacción');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleSubmitExpense = async () => {
    if (!amount || amount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }

    if (!machine) {
      message.error('Seleccione una máquina');
      return;
    }

    if (amount > pasillera.current_balance) {
      message.error('Saldo insuficiente');
      return;
    }

    Modal.confirm({
      title: '¿Confirmar gasto?',
      content: (
        <div>
          <p>
            <strong>Máquina:</strong> {machine}
          </p>
          <p>
            <strong>Monto:</strong> ${formatNumber(amount)}
          </p>
          {description && (
            <p>
              <strong>Descripción:</strong> {description}
            </p>
          )}
          <p>
            <strong>Saldo restante:</strong> ${formatNumber(pasillera.current_balance - amount)}
          </p>
        </div>
      ),
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSubmitting(true);
        try {
          const response = await axios.post('/pasillera/api/expense', {
            amount: parseFloat(amount),
            machine: machine,
            description: description || null,
          });

          if (response.data.success) {
            message.success('Gasto registrado correctamente');
            setPasillera(response.data.data.pasillera);
            setTransactions(response.data.data.pasillera.transactions || []);

            setAmount('');
            setMachine('');
            setDescription('');
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Error al registrar gasto');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const formatCurrency = (num) => {
    return `$${formatNumber(num)}`;
  };

  const getBalanceStatus = () => {
    if (!pasillera) return 'default';
    const percentage = (pasillera.current_balance / pasillera.initial_balance) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'danger';
  };

  const getBalanceColor = () => {
    const status = getBalanceStatus();
    if (status === 'success') return '#52c41a';
    if (status === 'warning') return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!pasillera) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Head title="Pasillera Mobile" />
        <Card style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4}>Sin Pasillera Activa</Title>
                <Text type="secondary">
                  No tienes una pasillera activa asignada. Contacta al administrador.
                </Text>
              </div>
            }
          >
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
              Actualizar
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        paddingBottom: '20px',
      }}
    >
      <Head title="Pasillera Mobile" />

      {/* Header */}
      <div
        style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              💰 Pasillera
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {auth.user.first_name} {auth.user.first_last_name}
            </Text>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              type="text"
              size="large"
            />
          </Col>
        </Row>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Balance Card */}
        <Card
          style={{
            marginBottom: '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            background: 'white',
          }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Saldo Disponible
                </Text>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: getBalanceColor(),
                    margin: '10px 0',
                  }}
                >
                  {formatCurrency(pasillera.current_balance)}
                </div>
                <div
                  style={{
                    height: '8px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '10px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(pasillera.current_balance / pasillera.initial_balance) * 100}%`,
                      background: getBalanceColor(),
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </Col>
            <Col span={12}>
              <Statistic
                title="Saldo Inicial"
                value={pasillera.initial_balance}
                prefix="$"
                valueStyle={{ fontSize: '18px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Total Gastado"
                value={pasillera.total_payments}
                prefix="$"
                valueStyle={{ fontSize: '18px', color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Register Transaction Form */}
        <Card
          title={
            <span>
              <DollarOutlined /> Registrar Transacción
            </span>
          }
          style={{
            marginBottom: '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Tipo de Transacción *</Text>
              <Select
                size="large"
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Seleccionar tipo"
                value={transactionType}
                onChange={setTransactionType}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <Select.Option key={t.value} value={t.value}>
                    {t.label}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {transactionType === 'payment' && (
              <div>
                <Text strong>Máquina *</Text>
                <Select
                  size="large"
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder="Seleccionar máquina"
                  value={machine}
                  onChange={setMachine}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {machines.map((m) => (
                    <Select.Option key={m.code} value={m.code}>
                      {m.name} ({m.code})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}

            {transactionType !== 'payment' && (
              <div>
                <Text strong>Cliente (opcional)</Text>
                <Input
                  size="large"
                  style={{ marginTop: '8px' }}
                  placeholder="Nombre del cliente"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>
            )}

            {transactionType === 'other' && (
              <div>
                <Text strong>Tipo de Gasto *</Text>
                <Input
                  size="large"
                  style={{ marginTop: '8px' }}
                  placeholder="Ej: Compra de suministros"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                />
              </div>
            )}

            <div>
              <Text strong>Monto *</Text>
              <InputNumber
                size="large"
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Ingrese monto"
                value={amount}
                onChange={setAmount}
                min={0}
                max={pasillera.current_balance}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => value.replace(/\$\s?|(\.*)/g, '')}
              />
            </div>

            <div>
              <Text strong>Descripción (opcional)</Text>
              <TextArea
                size="large"
                style={{ marginTop: '8px' }}
                placeholder="Agregar nota o descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<CheckCircleOutlined />}
              onClick={handleSubmitTransaction}
              loading={submitting}
              disabled={!amount || amount <= 0}
              style={{
                height: '50px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Registrar Transacción
            </Button>
          </Space>
        </Card>

        {/* Recent Transactions */}
        <Card
          title={
            <span>
              <HistoryOutlined /> Últimas Transacciones
            </span>
          }
          extra={
            <Button type="link" onClick={() => setShowHistory(true)}>
              Ver todas
            </Button>
          }
          style={{
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {transactions.length === 0 ? (
            <Empty
              description="No hay transacciones registradas"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={transactions.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.machine}</span>
                        <Text strong style={{ color: '#ff4d4f' }}>
                          -{formatCurrency(item.amount)}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        {item.description && (
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.description}
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      {/* History Modal */}
      <Modal
        title="Historial Completo"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width="100%"
        style={{ top: 0, maxWidth: '600px', margin: '0 auto' }}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <List
          dataSource={transactions}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.machine}</span>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      -{formatCurrency(item.amount)}
                    </Text>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(item.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Text>
                    {item.description && (
                      <div style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.description}
                        </Text>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
