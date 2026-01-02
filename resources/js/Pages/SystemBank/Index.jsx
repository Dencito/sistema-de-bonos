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
import {
    DeleteOutlined,
    ReloadOutlined,
    PlusOutlined,
} from '@ant-design/icons';
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

    const handleStartShift = async () => {
        if (!initialBalance || initialBalance <= 0) {
            message.error('Ingrese un saldo inicial válido');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/cash-management/shift/start', {
                initial_balance: initialBalance,
            });

            if (response.data.success) {
                message.success('Turno iniciado correctamente');
                setShift(response.data.data);
                setInitialBalance('');
                fetchShiftStatus();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Error al iniciar turno');
        } finally {
            setLoading(false);
        }
    };

    const handleEndShift = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/cash-management/shift/end');

            if (response.data.success) {
                message.success('Turno cerrado correctamente');
                setShift(null);
                setPasilleras([]);
                setTransactions([]);
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

    const handlePasilleraPayment = async (pasilleraId, monto, maquina) => {
        if (!monto || monto <= 0 || !maquina) {
            message.error('Complete todos los campos correctamente');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`/cash-management/pasillera/${pasilleraId}/payment`, {
                amount: monto,
            });

            if (response.data.success) {
                message.success('Pago registrado correctamente');
                fetchShiftStatus();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Error al registrar pago');
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

            <div className="container mx-auto p-4 space-y-4">
                <Title level={2}>Sistema de Gestión de Caja</Title>

                {/* Control de Caja */}
                <Card title="Control de Caja">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }} size="large">
                                <Statistic
                                    title="Saldo Anterior"
                                    value={prevBalance}
                                    precision={2}
                                    prefix="$"
                                />
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
                                        onClick={handleStartShift}
                                        disabled={!initialBalance}
                                        loading={loading}
                                        block
                                    >
                                        Iniciar Turno
                                    </Button>
                                ) : (
                                    <Popconfirm
                                        title="¿Está seguro de cerrar el turno?"
                                        onConfirm={handleEndShift}
                                        okText="Sí"
                                        cancelText="No"
                                    >
                                        <Button type="primary" danger loading={loading} block>
                                            Cerrar Turno
                                        </Button>
                                    </Popconfirm>
                                )}
                            </Space>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Statistic
                                    title="Saldo Actual"
                                    value={shift?.current_balance || 0}
                                    precision={2}
                                    prefix="$"
                                />
                                <Statistic
                                    title="Total Transferencias"
                                    value={shift?.total_transfers || 0}
                                    precision={2}
                                    prefix="$"
                                />
                                <Statistic
                                    title="Total Giros"
                                    value={shift?.total_giros || 0}
                                    precision={2}
                                    prefix="$"
                                />
                                <Statistic
                                    title="Total Pagos"
                                    value={shift?.total_payments || 0}
                                    precision={2}
                                    prefix="$"
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Nueva Transacción */}
                <Card title="Nueva Transacción">
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
                <Card title="Control de Pasilleras">
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
                                    {availableUsers.map(user => (
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

                                        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="small">
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                placeholder="Monto"
                                                id={`monto-${pasillera.id}`}
                                                disabled={!shift?.is_active}
                                                min={0}
                                                precision={2}
                                            />
                                            <Input
                                                placeholder="Máquina"
                                                id={`maquina-${pasillera.id}`}
                                                disabled={!shift?.is_active}
                                            />
                                            <Space style={{ width: '100%' }}>
                                                {/* <Button
                                                    type="primary"
                                                    onClick={() => {
                                                        const montoInput = document.getElementById(`monto-${pasillera.id}`);
                                                        const maquinaInput = document.getElementById(`maquina-${pasillera.id}`);
                                                        if (montoInput && maquinaInput) {
                                                            const monto = montoInput.value;
                                                            const maquina = maquinaInput.value;
                                                            if (monto && maquina) {
                                                                handlePasilleraPayment(pasillera.id, monto, maquina);
                                                                montoInput.value = '';
                                                                maquinaInput.value = '';
                                                            }
                                                        }
                                                    }}
                                                    disabled={!shift?.is_active}
                                                    loading={loading}
                                                    block
                                                >
                                                    Registrar Pago
                                                </Button> */}
                                                <Button
                                                    icon={<ReloadOutlined />}
                                                    onClick={() => handleResetPasillera(pasillera.id)}
                                                >
                                                    Reiniciar
                                                </Button>
                                            </Space>
                                        </Space>
                                        {
                                            console.log(pasillera.transactions)
                                        }

                                        {pasillera.transactions && pasillera.transactions.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <Text strong>Registros:</Text>
                                                <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
                                                    {pasillera.transactions.map((registro, index) => (
                                                        <div key={index} style={{ fontSize: 12, marginBottom: 4 }}>
                                                            {registro.type === 'pasillera_payment' ? '' : 'Reintegro '}
                                                            {formatCurrency(registro.amount)} {registro.type === 'pasillera_payment' ? `- Máquina: ${registro.machine} -${' '}` : ''}
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
                <Card title="Historial de Transacciones">
                    <Table
                        columns={transactionColumns}
                        dataSource={transactions}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 800 }}
                    />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
