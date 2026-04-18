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
} from 'antd';
import { DeleteOutlined, ReloadOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

export default function SystemBank({ auth, activeShift, previousBalance, availableUsers = [] }) {
  const [shift, setShift] = useState(activeShift);
  const [prevBalance, setPrevBalance] = useState(previousBalance || 0);
  const [initialBalance, setInitialBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [client, setClient] = useState('');
  const [pasilleras, setPasilleras] = useState(activeShift?.pasilleras || []);
  const [pasilleraUserId, setPasilleraUserId] = useState(null);
  const [pasilleraInitialBalance, setPasilleraInitialBalance] = useState('');
  const [transactions, setTransactions] = useState(activeShift?.transactions || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para conteo de apertura
  const [opening20000, setOpening20000] = useState(0);
  const [opening10000, setOpening10000] = useState(0);
  const [opening5000, setOpening5000] = useState(0);
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

  const handleStartShift = async () => {
    // In simple mode use the direct total; in denomination mode use the calculated sum
    const effectiveTotal = openingSimpleMode
      ? Number(openingSimpleTotal)
      : calculateOpeningTotal();

    if (!initialBalance || Number(initialBalance) <= 0) {
      message.error('Ingrese un saldo a agregar válido (mayor a 0)');
      return;
    }

    if (!openingSimpleMode && effectiveTotal <= 0) {
      message.error('El conteo de billetes no puede ser 0');
      return;
    }

    if (openingSimpleMode && (!openingSimpleTotal || Number(openingSimpleTotal) <= 0)) {
      message.error('Ingrese el monto total de la caja (mayor a 0)');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/cash-management/shift/start', {
        initial_balance: initialBalance,
        opening_total: openingSimpleMode ? openingSimpleTotal : calculateOpeningTotal(),
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

  const handleTransaction = async (type) => {
    if (!amount || amount <= 0) {
      message.error('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/cash-management/transaction', {
        type,
        amount,
        client,
      });

      if (response.data.success) {
        message.success('Transacción registrada correctamente');
        setAmount('');
        setClient('');
        fetchShiftStatus();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al registrar transacción');
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
      render: (type) => {
        const types = {
          transfer: 'Transferencia',
          giro: 'Giro',
          payment: 'Pago por Caja',
          pasillera_payment: 'Pago Pasillera',
          pasillera_return: 'Reintegro Pasillera',
        };
        return types[type] || type;
      },
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Detalle',
      dataIndex: 'description',
      key: 'description',
    },
  ];


  return (
    <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
      <Head title="Sistema de Caja" />

      <div className="container p-4 mx-auto space-y-4">
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
                  <Text strong>Saldo a Agregar</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    value={initialBalance}
                    onChange={setInitialBalance}
                    placeholder="Ingrese saldo a agregar"
                    disabled={shift?.is_active}
                    min={0}
                    precision={2}
                  />
                </div>
                <Statistic
                  title="Saldo Inicial Total"
                  value={prevBalance + (Number(initialBalance) || 0)}
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
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="flex items-center gap-2">
                  <Statistic title="Saldo Actual" value={shift?.current_balance || 0} precision={2} prefix="$" />
                  <RefreshBtn tooltip="Actualizar saldo actual" />
                </div>
                <div className="flex items-center gap-2">
                  <Statistic title="Total Transferencias" value={shift?.total_transfers || 0} precision={2} prefix="$" />
                  <RefreshBtn tooltip="Actualizar transferencias" />
                </div>
                <div className="flex items-center gap-2">
                  <Statistic title="Total Giros" value={shift?.total_giros || 0} precision={2} prefix="$" />
                  <RefreshBtn tooltip="Actualizar giros" />
                </div>
                <div className="flex items-center gap-2">
                  <Statistic title="Total Pagos" value={shift?.total_payments || 0} precision={2} prefix="$" />
                  <RefreshBtn tooltip="Actualizar pagos" />
                </div>
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
              />
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
                onClick={() => handleTransaction('payment')}
                disabled={!shift?.is_active}
                loading={loading}
              >
                Pago por Caja
              </Button>
            </Space>
          </Space>
        </Card>

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

            <Row gutter={[16, 16]}>
              {pasilleras.map((pasillera) => (
                <Col xs={24} md={12} key={pasillera.id}>
                  <Card
                    size="small"
                    title={`Pasillera: ${pasillera.user?.first_name} ${pasillera.user?.first_last_name}`}
                    extra={
                      <Space size="small">
                        <RefreshBtn tooltip={`Actualizar datos de ${pasillera.user?.first_name}`} />
                        <Popconfirm
                          title="¿Eliminar esta pasillera?"
                          onConfirm={() => handleDeletePasillera(pasillera.id)}
                          okText="Sí"
                          cancelText="No"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      </Space>
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
                        <Text strong>{formatCurrency(pasillera.current_balance)}</Text>
                      </Col>
                    </Row>

                    {pasillera.transactions && pasillera.transactions.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <Text strong>Registros:</Text>
                        <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
                          {pasillera.transactions.map((registro, index) => (
                            <div key={index} style={{ fontSize: 12, marginBottom: 4 }}>
                              {registro.type === 'pasillera_payment' ? '' : 'Reintegro '}
                              {formatCurrency(registro.amount)}{' '}
                              {registro.type === 'pasillera_payment'
                                ? `- Máquina: ${registro.machine} -${' '}`
                                : ''}
                              {new Date(registro.created_at).toLocaleString('es-AR')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        </Card>

        {/* Historial de Transacciones */}
        <Card title="Historial de Transacciones" extra={<RefreshBtn tooltip="Actualizar historial" />}>
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey="id"
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
                <Text strong>Total en caja al abrir *</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={openingSimpleTotal}
                  onChange={setOpeningSimpleTotal}
                  placeholder="Ej: 150000"
                  min={1}
                  precision={0}
                  size="large"
                />
                {openingSimpleTotal > 0 && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Monto ingresado: <strong>${new Intl.NumberFormat('es-CL').format(openingSimpleTotal)}</strong>
                  </Text>
                )}
              </div>
            ) : (
              /* DENOMINATION MODE */
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Saldo Esperado"
                      value={prevBalance + (Number(initialBalance) || 0)}
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
                    value={calculateOpeningTotal() - (prevBalance + (Number(initialBalance) || 0))}
                    precision={0}
                    prefix="$"
                    valueStyle={{
                      color:
                        calculateOpeningTotal() - (prevBalance + (Number(initialBalance) || 0)) === 0
                          ? '#3f8600'
                          : calculateOpeningTotal() - (prevBalance + (Number(initialBalance) || 0)) > 0
                            ? '#1890ff'
                            : '#cf1322',
                    }}
                    suffix={
                      calculateOpeningTotal() - (prevBalance + (Number(initialBalance) || 0)) === 0
                        ? '(Exacto)'
                        : calculateOpeningTotal() - (prevBalance + (Number(initialBalance) || 0)) > 0
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
