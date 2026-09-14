import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Table,
  Button,
  Select,
  DatePicker,
  Tag,
  Modal,
  Empty,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  EyeOutlined,
  BankOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { MODAL_SCROLL_BODY } from '@/Utils/constants';

const { RangePicker } = DatePicker;

const money = (v) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const fecha = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-');

/** Cuánto duró el turno, en un formato corto. */
const duracion = (desde, hasta) => {
  if (!desde) return '-';

  const minutos = dayjs(hasta || undefined).diff(dayjs(desde), 'minute');
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h ${minutos % 60} min`;

  return `${Math.floor(horas / 24)} d ${horas % 24} h`;
};

export default function BankShifts({ auth }) {
  const [turnos, setTurnos] = useState([]);
  const [paginacion, setPaginacion] = useState({ current: 1, pageSize: 20, total: 0 });
  // Arranca en true: la primera respuesta todavia no llego
  const [cargando, setCargando] = useState(true);

  const [rango, setRango] = useState(null);
  const [estado, setEstado] = useState('all');

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargar = useCallback(
    async (page = 1, pageSize = 20) => {
      setCargando(true);
      try {
        const res = await axios.get('/banks/shifts/list', {
          params: {
            page,
            per_page: pageSize,
            start_date: rango?.[0]?.format('YYYY-MM-DD'),
            end_date: rango?.[1]?.format('YYYY-MM-DD'),
            is_active: estado,
          },
        });
        if (res.data.success) {
          setTurnos(res.data.data.data);
          setPaginacion({
            current: res.data.data.current_page,
            pageSize: res.data.data.per_page,
            total: res.data.data.total,
          });
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Error al cargar los turnos');
      } finally {
        setCargando(false);
      }
    },
    [rango, estado],
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const verDetalle = async (id) => {
    setCargandoDetalle(true);
    setDetalle({ cargando: true });
    try {
      const res = await axios.get(`/banks/shifts/${id}`);
      if (res.data.success) setDetalle(res.data.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al cargar el turno');
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const columnas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (activo, r) =>
        activo ? (
          <Tag color="green">Abierto</Tag>
        ) : r.source === 'import' ? (
          <Tag color="purple">Importación</Tag>
        ) : (
          <Tag>Cerrado</Tag>
        ),
    },
    {
      title: 'Abrió',
      key: 'abrio',
      render: (_, r) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{r.opened_by_name || '—'}</div>
          <div className="text-slate-500">{fecha(r.opened_at)}</div>
        </div>
      ),
    },
    {
      title: 'Cerró',
      key: 'cerro',
      render: (_, r) =>
        r.closed_at ? (
          <div className="text-xs">
            <div className="font-medium text-slate-800">{r.closed_by_name || '—'}</div>
            <div className="text-slate-500">{fecha(r.closed_at)}</div>
          </div>
        ) : (
          <span className="text-xs text-emerald-700">En curso</span>
        ),
    },
    {
      title: 'Duración',
      key: 'duracion',
      width: 110,
      render: (_, r) => <span className="text-xs">{duracion(r.opened_at, r.closed_at)}</span>,
    },
    { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right', width: 80 },
    {
      title: 'Cargas',
      dataIndex: 'cargas',
      key: 'cargas',
      align: 'right',
      render: (v) => <span className="tabular-nums text-emerald-700">{money(v)}</span>,
    },
    {
      title: 'Retiros',
      dataIndex: 'retiros',
      key: 'retiros',
      align: 'right',
      render: (v) => <span className="tabular-nums text-red-700">{money(v)}</span>,
    },
    {
      title: 'Neto',
      dataIndex: 'neto',
      key: 'neto',
      align: 'right',
      render: (v) => (
        <span
          className="font-bold tabular-nums"
          style={{ color: Number(v) < 0 ? '#cf1322' : '#0f172a' }}
        >
          {money(v)}
        </span>
      ),
    },
    {
      title: 'Notas',
      key: 'notas',
      render: (_, r) => (
        <div className="text-[11px] text-slate-500">
          {r.opening_note && <div>Apertura: {r.opening_note}</div>}
          {r.closing_note && <div>Cierre: {r.closing_note}</div>}
          {!r.opening_note && !r.closing_note && <span className="text-slate-300">-</span>}
        </div>
      ),
    },
    {
      title: '',
      key: 'acciones',
      fixed: 'right',
      width: 80,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => verDetalle(r.id)}>
          Ver
        </Button>
      ),
    },
  ];

  const turno = detalle?.turno;

  return (
    <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
      <Head title="Historial de Turnos" />

      <div className="p-4 mx-auto space-y-4 max-w-[1500px] sm:p-6">
        <PageHeader
          title="Historial de Turnos"
          icon={HistoryOutlined}
          subtitle="Quién abrió y cerró cada turno, y qué se movió en cada uno"
        />

        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px]">
              <p className="mb-1 text-sm font-medium text-slate-700">Período de apertura</p>
              <RangePicker
                className="w-full"
                value={rango}
                onChange={setRango}
                format="DD/MM/YYYY"
              />
            </div>
            <div className="min-w-[160px]">
              <p className="mb-1 text-sm font-medium text-slate-700">Estado</p>
              <Select
                className="w-full"
                value={estado}
                onChange={setEstado}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: '1', label: 'Abiertos' },
                  { value: '0', label: 'Cerrados' },
                ]}
              />
            </div>
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setRango(null);
                setEstado('all');
              }}
            >
              Limpiar
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={cargando}
              onClick={() => cargar(paginacion.current)}
            >
              Actualizar
            </Button>
            <Link href="/banks" className="ml-auto">
              <Button icon={<BankOutlined />}>Volver a Bancos</Button>
            </Link>
          </div>
        </Card>

        <Card size="small">
          <Table
            rowKey="id"
            columns={columnas}
            dataSource={turnos}
            loading={cargando}
            size="small"
            scroll={{ x: 1300 }}
            rowClassName={(r) => (r.is_active ? 'bg-emerald-50/60' : '')}
            locale={{ emptyText: <Empty description="Todavía no hay turnos" /> }}
            pagination={{
              ...paginacion,
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100],
              showTotal: (total, r) => `${r[0]}-${r[1]} de ${total} turnos`,
              onChange: (p, ps) => cargar(p, ps),
            }}
          />
        </Card>

        <Modal
          open={!!detalle}
          onCancel={() => setDetalle(null)}
          title={turno ? `Turno #${turno.id}` : 'Detalle del turno'}
          width={1100}
          centered
          styles={MODAL_SCROLL_BODY}
          footer={<Button onClick={() => setDetalle(null)}>Cerrar</Button>}
          destroyOnClose
        >
          {cargandoDetalle || detalle?.cargando ? (
            <div className="py-8 text-center text-slate-500">Cargando...</div>
          ) : !turno ? (
            <Empty />
          ) : (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic title="Movimientos" value={turno.movs} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Cargas"
                    value={money(turno.cargas)}
                    valueStyle={{ color: '#15803d', fontSize: 18 }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Retiros"
                    value={money(turno.retiros)}
                    valueStyle={{ color: '#cf1322', fontSize: 18 }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Neto"
                    value={money(turno.neto)}
                    valueStyle={{ fontSize: 18, fontWeight: 700 }}
                  />
                </Col>
              </Row>

              <div className="p-3 text-sm border rounded-lg border-slate-200 bg-slate-50">
                <div>
                  <strong>Abrió:</strong> {turno.opened_by_name || '—'} · {fecha(turno.opened_at)}
                  {turno.opening_note && <> · {turno.opening_note}</>}
                </div>
                <div>
                  <strong>Cerró:</strong>{' '}
                  {turno.closed_at ? (
                    <>
                      {turno.closed_by_name || '—'} · {fecha(turno.closed_at)}
                      {turno.closing_note && <> · {turno.closing_note}</>}
                    </>
                  ) : (
                    <span className="text-emerald-700">todavía en curso</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Duración: {duracion(turno.opened_at, turno.closed_at)}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card size="small" title="Por cuenta">
                  <Table
                    rowKey="cuenta"
                    size="small"
                    pagination={false}
                    dataSource={detalle.por_cuenta}
                    columns={[
                      { title: 'Cuenta', dataIndex: 'cuenta', key: 'cuenta' },
                      { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right' },
                      {
                        title: 'Neto',
                        dataIndex: 'neto',
                        key: 'neto',
                        align: 'right',
                        render: money,
                      },
                    ]}
                  />
                </Card>
                <Card size="small" title="Por tipo">
                  <Table
                    rowKey="tipo"
                    size="small"
                    pagination={false}
                    dataSource={detalle.por_tipo}
                    columns={[
                      { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
                      { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right' },
                      {
                        title: 'Neto',
                        dataIndex: 'neto',
                        key: 'neto',
                        align: 'right',
                        render: money,
                      },
                    ]}
                  />
                </Card>
              </div>

              <Card size="small" title={`Movimientos (${detalle.movimientos.length})`}>
                <Table
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800, y: 320 }}
                  pagination={false}
                  dataSource={detalle.movimientos}
                  columns={[
                    {
                      title: 'Fecha',
                      dataIndex: 'date',
                      key: 'date',
                      render: (d) => dayjs(d).format('DD/MM/YYYY'),
                    },
                    {
                      title: 'Cuenta',
                      key: 'cuenta',
                      render: (_, r) => r.account?.name || '-',
                    },
                    {
                      title: 'Cliente',
                      key: 'cliente',
                      render: (_, r) => r.client?.name || '-',
                    },
                    {
                      title: 'Monto',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (v) => (
                        <span
                          className="font-semibold tabular-nums"
                          style={{ color: Number(v) < 0 ? '#cf1322' : '#15803d' }}
                        >
                          {money(v)}
                        </span>
                      ),
                    },
                    {
                      title: 'Cargó',
                      key: 'user',
                      render: (_, r) =>
                        r.user
                          ? `${r.user.first_name || ''} ${r.user.first_last_name || ''}`.trim() ||
                            r.user.username
                          : '-',
                    },
                  ]}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
