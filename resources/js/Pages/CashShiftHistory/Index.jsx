import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Tag,
  Statistic,
  Modal,
  Descriptions,
  Tabs,
  Empty,
  message,
  Divider,
  Input,
} from 'antd';
import { ReloadOutlined, EyeOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function CashShiftHistoryIndex({ auth, branches = [], userRole, userBranchId }) {
  const isAdmin = userRole === 1;

  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filters
  const [branchId, setBranchId] = useState(isAdmin ? undefined : userBranchId);
  const [dateRange, setDateRange] = useState(null);
  const [isActive, setIsActive] = useState('all');

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Detail transaction filters
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txMachineFilter, setTxMachineFilter] = useState('all');
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async (page = 1, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = {
        per_page: pageSize,
        page,
      };
      if (branchId) params.branch_id = branchId;
      if (dateRange && dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD');
      if (dateRange && dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD');
      if (isActive !== 'all') params.is_active = isActive;

      const response = await axios.get('/cash-shift-history/list', { params });
      if (response.data.success) {
        const data = response.data.data;
        setShifts(data.data || []);
        setPagination({
          current: data.current_page,
          pageSize: data.per_page,
          total: data.total,
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setBranchId(isAdmin ? undefined : userBranchId);
    setDateRange(null);
    setIsActive('all');
    setTimeout(() => fetchShifts(1), 0);
  };

  const handleViewDetail = async (shiftId) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailData(null);
    setTxTypeFilter('all');
    setTxMachineFilter('all');
    setTxSearch('');
    try {
      const response = await axios.get(`/cash-shift-history/${shiftId}`);
      if (response.data.success) {
        setDetailData(response.data.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al cargar detalle');
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  const getUserName = (user) => {
    if (!user) return '-';
    return [user.first_name, user.first_last_name].filter(Boolean).join(' ') || user.username;
  };

  const typeLabels = {
    transfer: 'Transferencia',
    giro: 'Giro',
    payment: 'Pago por Caja',
    other: 'Otro Gasto',
    pasillera_payment: 'Pago Pasillera',
    pasillera_return: 'Reintegro Pasillera',
  };

  const typeColors = {
    transfer: 'blue',
    giro: 'orange',
    payment: 'purple',
    other: 'gold',
    pasillera_payment: 'geekblue',
    pasillera_return: 'green',
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Sucursal',
      dataIndex: ['branch', 'name'],
      key: 'branch',
      render: (_, r) => r.branch?.name || '-',
    },
    {
      title: 'Usuario',
      dataIndex: 'user',
      key: 'user',
      render: (user) => getUserName(user),
    },
    {
      title: 'Apertura',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (d) => formatDate(d),
    },
    {
      title: 'Cierre',
      dataIndex: 'ended_at',
      key: 'ended_at',
      render: (d) => formatDate(d),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (a) => (a ? <Tag color="green">Abierto</Tag> : <Tag>Cerrado</Tag>),
    },
    {
      title: 'Saldo Inicial',
      dataIndex: 'total_initial_balance',
      key: 'total_initial_balance',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Saldo Actual',
      dataIndex: 'current_balance',
      key: 'current_balance',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Diferencia',
      dataIndex: 'difference',
      key: 'difference',
      render: (v) => {
        const n = Number(v) || 0;
        if (n === 0) return <Tag>Sin diferencia</Tag>;
        return (
          <Tag color={n > 0 ? 'cyan' : 'red'}>
            {n > 0 ? 'SOBRANTE ' : 'FALTANTE '}
            {formatCurrency(Math.abs(n))}
          </Tag>
        );
      },
    },
    {
      title: '# Trans.',
      dataIndex: 'transactions_count',
      key: 'transactions_count',
    },
    {
      title: '# Pasil.',
      dataIndex: 'pasilleras_count',
      key: 'pasilleras_count',
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      render: (_, r) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(r.id)}>
          Ver
        </Button>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => formatDate(d),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (t) => <Tag color={typeColors[t] || 'default'}>{typeLabels[t] || t}</Tag>,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Máquina',
      dataIndex: 'machine',
      key: 'machine',
      render: (v) => v || '-',
    },
    {
      title: 'Tipo Gasto',
      dataIndex: 'expense_type',
      key: 'expense_type',
      render: (v) => v || '-',
    },
    {
      title: 'Cliente',
      dataIndex: 'client',
      key: 'client',
      render: (v) => v || '-',
    },
    {
      title: 'Pasillera',
      dataIndex: 'pasillera',
      key: 'pasillera',
      render: (p) => (p?.user ? getUserName(p.user) : '-'),
    },
    {
      title: 'Operado por',
      key: 'operator',
      width: 160,
      render: (_, record) => {
        if (record.pasillera_id && record.pasillera?.user) {
          const pu = record.pasillera.user;
          return (
            <span>
              {getUserName(pu)} <Tag size="small" color="blue">Pasillera</Tag>
            </span>
          );
        }
        if (record.admin_user) {
          return <span>{getUserName(record.admin_user)}</span>;
        }
        return '-';
      },
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (desc, record) => {
        const parts = [];
        if (record.type === 'deposit') parts.push('Agregar Dinero');
        else if (record.type === 'withdrawal') parts.push('Quitar Dinero');
        if (record.client) parts.push(record.client);
        if (record.machine) parts.push(`Máquina: ${record.machine}`);
        if (record.expense_type) parts.push(record.expense_type);
        if (record.type === 'pasillera_payment' && record.machine) {
          parts.push(`Pago Pasillera - Máquina: ${record.machine}`);
        }
        return parts.length ? parts.join(' | ') : (desc || '-');
      },
    },
  ];

  const pasilleraColumns = [
    {
      title: 'Pasillero',
      dataIndex: 'user',
      key: 'user',
      render: (user) => getUserName(user),
    },
    {
      title: 'Saldo Inicial',
      dataIndex: 'initial_balance',
      key: 'initial_balance',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Total Gastos',
      dataIndex: 'total_payments',
      key: 'total_payments',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Saldo Actual',
      dataIndex: 'current_balance',
      key: 'current_balance',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (a) => (a ? <Tag color="green">Activa</Tag> : <Tag>Inactiva</Tag>),
    },
    {
      title: '# Transacciones',
      dataIndex: 'transactions',
      key: 'transactions_count',
      render: (t) => t?.length || 0,
    },
  ];

  const shift = detailData?.shift;

  // Computed values for detail transaction filters
  const allTransactions = shift?.transactions || [];
  const machineOptions = Array.from(
    new Set(allTransactions.filter((t) => t.machine).map((t) => t.machine))
  ).sort((a, b) => Number(a) - Number(b));

  const filteredTransactions = allTransactions.filter((t) => {
    if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
    if (txMachineFilter !== 'all' && t.machine !== txMachineFilter) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const text = [
        t.description,
        t.client,
        t.machine,
        t.expense_type,
        typeLabels[t.type],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
      <Head title="Historial de Cajas" />

      <div className="container p-4 mx-auto space-y-4">
        <Title level={2} style={{ margin: 0 }}>
          Historial de Turnos de Caja {isAdmin && <Tag color="red">ADMIN</Tag>}
        </Title>

        {/* Filters */}
        <Card title="Filtros">
          <Row gutter={[16, 16]} align="bottom">
            {isAdmin && (
              <Col xs={24} md={6}>
                <Text strong>Sucursal</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Todas"
                  allowClear
                  value={branchId}
                  onChange={setBranchId}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                />
              </Col>
            )}
            <Col xs={24} md={8}>
              <Text strong>Rango de fechas</Text>
              <RangePicker
                style={{ width: '100%', marginTop: 4 }}
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={24} md={5}>
              <Text strong>Estado</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={isActive}
                onChange={setIsActive}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: '1', label: 'Abiertos' },
                  { value: '0', label: 'Cerrados' },
                ]}
              />
            </Col>
            <Col xs={24} md={5}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchShifts(1)} loading={loading}>
                  Buscar
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card
          title="Turnos"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => fetchShifts(pagination.current)} loading={loading}>
              Actualizar
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={shifts}
            loading={loading}
            scroll={{ x: 1500 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: [10, 15, 25, 50, 100],
              onChange: (page, pageSize) => fetchShifts(page, pageSize),
            }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          title={shift ? `Detalle Turno #${shift.id} - ${shift.branch?.name || ''}` : 'Detalle'}
          width={1100}
          footer={<Button onClick={() => setDetailVisible(false)}>Cerrar</Button>}
          destroyOnClose
        >
          {detailLoading ? (
            <div className="py-8 text-center">Cargando...</div>
          ) : !detailData ? (
            <Empty />
          ) : (
            <Tabs
              items={[
                {
                  key: 'info',
                  label: 'Información General',
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
                        <Descriptions.Item label="Sucursal">{shift.branch?.name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Cajero/a">{getUserName(shift.user)}</Descriptions.Item>
                        <Descriptions.Item label="Estado">
                          {shift.is_active ? <Tag color="green">Abierto</Tag> : <Tag>Cerrado</Tag>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Apertura">{formatDate(shift.started_at)}</Descriptions.Item>
                        <Descriptions.Item label="Cierre">{formatDate(shift.ended_at)}</Descriptions.Item>
                        <Descriptions.Item label="Saldo Anterior">{formatCurrency(shift.previous_balance)}</Descriptions.Item>
                        <Descriptions.Item label="Saldo Agregado">{formatCurrency(shift.initial_balance)}</Descriptions.Item>
                        <Descriptions.Item label="Saldo Inicial Total">
                          {formatCurrency(shift.total_initial_balance)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Saldo Actual">{formatCurrency(shift.current_balance)}</Descriptions.Item>
                      </Descriptions>

                      <Card size="small" title="Totales del Turno">
                        <Row gutter={[16, 16]}>
                          <Col xs={12} md={6}>
                            <Statistic title="Transferencias" value={shift.total_transfers || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Giros" value={shift.total_giros || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Pagos por Caja" value={shift.total_payments || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Otros Gastos" value={shift.total_other || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Sorteos" value={shift.total_sorteo || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Bonus Especial" value={shift.total_bonus_especial || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Préstamos" value={shift.total_prestamo || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Depósitos" value={shift.total_deposit || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic title="Retiros" value={shift.total_withdrawal || 0} prefix="$" precision={0} />
                          </Col>
                          <Col xs={12} md={6}>
                            <Statistic
                              title="Diferencia"
                              value={Math.abs(Number(shift.difference) || 0)}
                              prefix="$"
                              precision={0}
                              valueStyle={{
                                color:
                                  Number(shift.difference) === 0
                                    ? undefined
                                    : Number(shift.difference) > 0
                                    ? '#13c2c2'
                                    : '#cf1322',
                              }}
                              suffix={
                                Number(shift.difference) === 0
                                  ? null
                                  : Number(shift.difference) > 0
                                  ? ' (Sobrante)'
                                  : ' (Faltante)'
                              }
                            />
                          </Col>
                        </Row>
                      </Card>

                      {shift.closing_notes && (
                        <Card size="small" title="Notas de cierre">
                          <Text>{shift.closing_notes}</Text>
                        </Card>
                      )}

                      {(shift.opening_total_counted || shift.closing_total_counted) && (
                        <Card size="small" title="Conteo físico" style={{ marginTop: 12 }}>
                          {/* Apertura */}
                          <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 14 }}>Apertura</Text>
                            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                              {[
                                { label: '$20.000', qty: shift.opening_20000, val: 20000 },
                                { label: '$10.000', qty: shift.opening_10000, val: 10000 },
                                { label: '$5.000',  qty: shift.opening_5000,  val: 5000 },
                                { label: '$2.000',  qty: shift.opening_2000,  val: 2000 },
                                { label: '$1.000',  qty: shift.opening_1000,  val: 1000 },
                              ].map((d) => (
                                <Col span={8} key={`o-${d.label}`}>
                                  <div style={{
                                    background: '#f6ffed',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    border: '1px solid #b7eb8f',
                                  }}>
                                    <div style={{ fontSize: 12, color: '#595959' }}>Billetes {d.label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#389e0d' }}>
                                      {d.qty || 0}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                                      = {formatCurrency((d.qty || 0) * d.val)}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                              <Col span={8}>
                                <div style={{
                                  background: '#fff7e6',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  border: '1px solid #ffd591',
                                }}>
                                  <div style={{ fontSize: 12, color: '#595959' }}>Monedas</div>
                                  <div style={{ fontSize: 16, fontWeight: 700, color: '#d46b08' }}>
                                    {formatCurrency(shift.opening_coins || 0)}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>&nbsp;</div>
                                </div>
                              </Col>
                            </Row>
                            <div style={{
                              marginTop: 10,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#f0f0f0',
                              borderRadius: 8,
                              padding: '8px 12px',
                            }}>
                              <span style={{ fontSize: 13, color: '#595959' }}>
                                Total Contado Apertura
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>
                                {formatCurrency(shift.opening_total_counted || 0)}
                              </span>
                            </div>
                          </div>

                          <Divider style={{ margin: '12px 0' }} />

                          {/* Cierre */}
                          <div>
                            <Text strong style={{ fontSize: 14 }}>Cierre</Text>
                            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                              {[
                                { label: '$20.000', qty: shift.closing_20000, val: 20000 },
                                { label: '$10.000', qty: shift.closing_10000, val: 10000 },
                                { label: '$5.000',  qty: shift.closing_5000,  val: 5000 },
                                { label: '$2.000',  qty: shift.closing_2000,  val: 2000 },
                                { label: '$1.000',  qty: shift.closing_1000,  val: 1000 },
                              ].map((d) => (
                                <Col span={8} key={`c-${d.label}`}>
                                  <div style={{
                                    background: '#e6f7ff',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    border: '1px solid #91d5ff',
                                  }}>
                                    <div style={{ fontSize: 12, color: '#595959' }}>Billetes {d.label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#096dd9' }}>
                                      {d.qty || 0}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                                      = {formatCurrency((d.qty || 0) * d.val)}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                              <Col span={8}>
                                <div style={{
                                  background: '#fff7e6',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  border: '1px solid #ffd591',
                                }}>
                                  <div style={{ fontSize: 12, color: '#595959' }}>Monedas</div>
                                  <div style={{ fontSize: 16, fontWeight: 700, color: '#d46b08' }}>
                                    {formatCurrency(shift.closing_coins || 0)}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>&nbsp;</div>
                                </div>
                              </Col>
                            </Row>
                            <div style={{
                              marginTop: 10,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#f0f0f0',
                              borderRadius: 8,
                              padding: '8px 12px',
                            }}>
                              <span style={{ fontSize: 13, color: '#595959' }}>
                                Total Contado Cierre
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>
                                {formatCurrency(shift.closing_total_counted || 0)}
                              </span>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Space>
                  ),
                },
                {
                  key: 'transactions',
                  label: `Transacciones (${filteredTransactions.length}/${shift.transactions?.length || 0})`,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} sm={8} md={6}>
                          <Select
                            style={{ width: '100%' }}
                            placeholder="Filtrar por tipo"
                            value={txTypeFilter}
                            onChange={setTxTypeFilter}
                            allowClear
                            onClear={() => setTxTypeFilter('all')}
                            options={[
                              { value: 'all', label: 'Todos los tipos' },
                              ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
                            ]}
                          />
                        </Col>
                        <Col xs={24} sm={8} md={6}>
                          <Select
                            style={{ width: '100%' }}
                            placeholder="Filtrar por máquina"
                            value={txMachineFilter}
                            onChange={setTxMachineFilter}
                            allowClear
                            onClear={() => setTxMachineFilter('all')}
                            disabled={machineOptions.length === 0}
                            options={[
                              { value: 'all', label: 'Todas las máquinas' },
                              ...machineOptions.map((m) => ({ value: m, label: `Máquina ${m}` })),
                            ]}
                          />
                        </Col>
                        <Col xs={24} sm={8} md={8}>
                          <Input.Search
                            placeholder="Buscar cliente, descripción, gasto..."
                            value={txSearch}
                            onChange={(e) => setTxSearch(e.target.value)}
                            allowClear
                            onSearch={setTxSearch}
                          />
                        </Col>
                        <Col xs={24} sm={24} md={4} style={{ textAlign: 'right' }}>
                          <Button
                            size="small"
                            icon={<ClearOutlined />}
                            onClick={() => {
                              setTxTypeFilter('all');
                              setTxMachineFilter('all');
                              setTxSearch('');
                            }}
                          >
                            Limpiar
                          </Button>
                        </Col>
                      </Row>
                      <Table
                        rowKey="id"
                        columns={transactionColumns}
                        dataSource={filteredTransactions}
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 1000 }}
                        size="small"
                      />
                    </Space>
                  ),
                },
                {
                  key: 'pasilleras',
                  label: `Pasilleras (${shift.pasilleras?.length || 0})`,
                  children: (
                    <Table
                      rowKey="id"
                      columns={pasilleraColumns}
                      dataSource={shift.pasilleras || []}
                      pagination={false}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Table
                            rowKey="id"
                            size="small"
                            columns={transactionColumns.filter((c) => c.key !== 'pasillera')}
                            dataSource={record.transactions || []}
                            pagination={false}
                          />
                        ),
                        rowExpandable: (record) => (record.transactions?.length || 0) > 0,
                      }}
                    />
                  ),
                },
                {
                  key: 'breakdown',
                  label: 'Resumen',
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Card size="small" title="Por tipo de transacción">
                        <Table
                          rowKey="type"
                          size="small"
                          pagination={false}
                          dataSource={detailData.type_breakdown || []}
                          columns={[
                            {
                              title: 'Tipo',
                              dataIndex: 'type',
                              render: (t) => <Tag color={typeColors[t]}>{typeLabels[t] || t}</Tag>,
                            },
                            { title: 'Cantidad', dataIndex: 'count' },
                            {
                              title: 'Total',
                              dataIndex: 'total',
                              render: (v) => formatCurrency(v),
                            },
                          ]}
                        />
                      </Card>

                      <Card size="small" title="Por máquina / tipo de gasto">
                        <Table
                          rowKey="label"
                          size="small"
                          pagination={false}
                          dataSource={detailData.expense_breakdown || []}
                          locale={{ emptyText: 'Sin datos' }}
                          columns={[
                            { title: 'Concepto', dataIndex: 'label' },
                            { title: 'Cantidad', dataIndex: 'count' },
                            {
                              title: 'Total',
                              dataIndex: 'total',
                              render: (v) => formatCurrency(v),
                            },
                          ]}
                        />
                      </Card>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
