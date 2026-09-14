import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Table,
  Button,
  Space,
  Row,
  Col,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  InputNumber,
  Input,
  Upload,
  Alert,
  Statistic,
  Popconfirm,
  Radio,
  Skeleton,
  message,
  Empty,
} from 'antd';
import {
  BankOutlined,
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { listarEdiciones, resumenEdiciones } from '@/Utils/editHistory';
import { MODAL_SCROLL_BODY } from '@/Utils/constants';
import SelectCreatable from '@/Components/SelectCreatable';

const { RangePicker } = DatePicker;

// Los decimales llegan como string desde Laravel: sin Number() el + concatena
const money = (v) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const KIND_COLORS = {
  carga: 'green',
  retiro: 'red',
  traspaso: 'blue',
  ajuste: 'orange',
};

const colorSaldo = (v) => (Number(v) < 0 ? '#cf1322' : '#0f172a');

export default function BanksIndex({ auth, accounts = [], kinds = [] }) {
  const [cuentas, setCuentas] = useState(accounts);
  const [tipos, setTipos] = useState(kinds);
  const [rango, setRango] = useState([dayjs().startOf('month'), dayjs()]);
  const [cuentaId, setCuentaId] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [resumen, setResumen] = useState(null);
  const [movs, setMovs] = useState([]);
  const [paginacion, setPaginacion] = useState({ current: 1, pageSize: 25, total: 0 });
  const [cargando, setCargando] = useState(false);

  const [modalMov, setModalMov] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  // Tiene que quedar acá arriba y llamarse una sola vez por render: es un hook.
  const kindElegido = Form.useWatch('kind', form);

  const [modalImport, setModalImport] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importando, setImportando] = useState(false);

  const [clientes, setClientes] = useState([]);

  // Alta de un tipo: nombre + signo. El signo no se puede adivinar.
  const [nuevoTipo, setNuevoTipo] = useState(null);
  const [guardandoTipo, setGuardandoTipo] = useState(false);

  // Turno abierto. Sin turno no se puede cargar nada.
  const [turno, setTurno] = useState(null);
  // Arranca en true: hasta que responde el servidor no sabemos si hay turno,
  // y mostrar "Abrir turno" para despues cambiarlo a "Cerrar" confunde.
  const [cargandoTurno, setCargandoTurno] = useState(true);
  const [turnoOcupado, setTurnoOcupado] = useState(false);
  const [modalTurno, setModalTurno] = useState(null); // 'abrir' | 'cerrar'
  const [notaTurno, setNotaTurno] = useState('');
  // Saldo con el que arranca cada cuenta: el sistema propone, el usuario corrige
  const [saldosApertura, setSaldosApertura] = useState([]);

  const filtros = useCallback(
    () => ({
      start_date: rango?.[0]?.format('YYYY-MM-DD'),
      end_date: rango?.[1]?.format('YYYY-MM-DD'),
      bank_account_id: cuentaId || undefined,
      kind: tipo || undefined,
      search: busqueda || undefined,
    }),
    [rango, cuentaId, tipo, busqueda],
  );

  const cargar = useCallback(
    async (page = 1, pageSize = paginacion.pageSize) => {
      setCargando(true);
      try {
        const [s, m] = await Promise.all([
          axios.get('/banks/summary', { params: filtros() }),
          axios.get('/banks/movements', { params: { ...filtros(), page, per_page: pageSize } }),
        ]);
        if (s.data.success) setResumen(s.data.data);
        if (m.data.success) {
          setMovs(m.data.data.data);
          setPaginacion({
            current: m.data.data.current_page,
            pageSize: m.data.data.per_page,
            total: m.data.data.total,
          });
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Error al cargar los bancos');
      } finally {
        setCargando(false);
      }
    },
    [filtros, paginacion.pageSize],
  );

  useEffect(() => {
    cargar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango, cuentaId, tipo]);

  const cargarTurno = useCallback(async () => {
    setCargandoTurno(true);
    try {
      const res = await axios.get('/banks/shifts/current');
      if (res.data.success) setTurno(res.data.data);
    } catch {
      // el error de permisos ya se ve en el resto de la pantalla
    } finally {
      setCargandoTurno(false);
    }
  }, []);

  useEffect(() => {
    cargarTurno();
  }, [cargarTurno]);

  // Los clientes se piden una sola vez para el selector del formulario
  useEffect(() => {
    axios
      .get('/banks/clients/list', { params: { per_page: 200 } })
      .then((r) => r.data.success && setClientes(r.data.data.data))
      .catch(() => {});
  }, []);

  // El tipo se elige afuera: el modal ya abre sabiendo qué se está cargando.
  const abrirNuevo = (slug) => {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), kind: slug });
    setModalMov(true);
  };

  const abrirEdicion = (m) => {
    setEditando(m);
    form.setFieldsValue({
      date: dayjs(m.date),
      bank_account_id: m.bank_account_id,
      bank_client_id: m.bank_client_id,
      amount: Number(m.amount),
      kind: m.kind,
      description: m.description,
    });
    setModalMov(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      const payload = { ...values, date: values.date.format('YYYY-MM-DD') };
      const res = editando
        ? await axios.put(`/banks/movements/${editando.id}`, payload)
        : await axios.post('/banks/movements', payload);
      message.success(res.data.message);
      setModalMov(false);
      cargar(paginacion.current);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    try {
      const res = await axios.delete(`/banks/movements/${id}`);
      message.success(res.data.message);
      cargar(paginacion.current);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const previsualizar = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    setImportando(true);
    try {
      const res = await axios.post('/banks/imports/preview', fd);
      if (res.data.success) {
        setPreview(res.data.data);
        setArchivo(file);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo leer la planilla');
      setPreview(null);
      setArchivo(null);
    } finally {
      setImportando(false);
    }
    return false; // Upload no sube solo: primero se previsualiza
  };

  const confirmarImport = async () => {
    const fd = new FormData();
    fd.append('file', archivo);
    setImportando(true);
    try {
      const res = await axios.post('/banks/imports', fd);
      message.success(res.data.message, 6);
      setModalImport(false);
      setPreview(null);
      setArchivo(null);
      cargar(1);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo importar', 6);
    } finally {
      setImportando(false);
    }
  };

  // Alta desde el propio selector: si la cuenta o el cliente no están, se
  // crean sin salir del formulario y quedan elegidos.
  const crearCuenta = async (nombre) => {
    const res = await axios.post('/banks/accounts', { name: nombre });
    if (!res.data.success) return null;

    const cuenta = res.data.data;
    setCuentas((prev) => [...prev, cuenta]);
    message.success(res.data.message);

    return { value: cuenta.id, label: cuenta.name };
  };

  const crearCliente = async (nombre) => {
    const res = await axios.post('/banks/clients', { name: nombre });
    if (!res.data.success) return null;

    const cliente = res.data.data;
    setClientes((prev) => [...prev, cliente]);
    message.success(res.data.message, 5);

    return { value: cliente.id, label: cliente.name };
  };

  // Al abrir se traen los saldos propuestos para poder revisarlos
  const abrirModalTurno = async (accion) => {
    setNotaTurno('');
    setModalTurno(accion);

    if (accion !== 'abrir') return;

    try {
      const res = await axios.get('/banks/shifts/proposed');
      if (res.data.success) {
        setSaldosApertura(res.data.data.map((c) => ({ ...c, declarado: c.saldo })));
      }
    } catch {
      setSaldosApertura([]);
    }
  };

  const confirmarTurno = async () => {
    setTurnoOcupado(true);
    try {
      const res = await axios.post(`/banks/shifts/${modalTurno === 'abrir' ? 'open' : 'close'}`, {
        [modalTurno === 'abrir' ? 'opening_note' : 'closing_note']: notaTurno || undefined,
        ...(modalTurno === 'abrir'
          ? {
              balances: Object.fromEntries(
                saldosApertura.map((c) => [c.id, Number(c.declarado) || 0]),
              ),
            }
          : {}),
      });
      message.success(res.data.message);
      setTurno(modalTurno === 'abrir' ? res.data.data : null);
      setModalTurno(null);
      setNotaTurno('');
      cargar(1);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo cambiar el turno', 6);
    } finally {
      setTurnoOcupado(false);
    }
  };

  // Un tipo nuevo no se puede crear solo con el nombre: hay que saber si suma o
  // resta, porque de eso depende el saldo. Por eso el alta abre un paso más.
  const confirmarTipo = async () => {
    if (!nuevoTipo?.nombre?.trim()) {
      message.error('Ponele un nombre al tipo');
      return;
    }

    setGuardandoTipo(true);
    try {
      const res = await axios.post('/banks/kinds', {
        name: nuevoTipo.nombre.trim(),
        sign: nuevoTipo.signo,
      });
      const tipo = res.data.data;
      setTipos((prev) => [...prev, tipo]);
      message.success(res.data.message);
      // Queda elegido: es lo que el usuario venía a cargar
      form.setFieldValue('kind', tipo.slug);
      setNuevoTipo(null);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo crear el tipo');
    } finally {
      setGuardandoTipo(false);
    }
  };

  const opcionesCuenta = cuentas.map((a) => ({ value: a.id, label: a.name }));
  const opcionesTipo = tipos.map((t) => ({ value: t.slug, label: t.name }));
  const nombreTipo = (slug) => tipos.find((t) => t.slug === slug)?.name || slug;

  const columnas = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Cuenta',
      key: 'account',
      render: (_, r) => r.account?.name || '-',
    },
    {
      title: 'Cliente',
      key: 'client',
      render: (_, r) =>
        r.client ? (
          <>
            {r.client.name}
            {r.client.external_id && (
              <span className="ml-1 text-xs text-slate-400">#{r.client.external_id}</span>
            )}
          </>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: 'Tipo',
      dataIndex: 'kind',
      key: 'kind',
      width: 110,
      render: (k) => <Tag color={KIND_COLORS[k] || 'default'}>{nombreTipo(k)}</Tag>,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 130,
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
          ? `${r.user.first_name || ''} ${r.user.first_last_name || ''}`.trim() || r.user.username
          : '-',
    },
    {
      title: 'Detalle',
      key: 'description',
      render: (_, r) => {
        const ediciones = listarEdiciones(r.edit_history);
        return (
          <div className="text-xs">
            {r.description && <div className="text-slate-600">{r.description}</div>}
            {ediciones.length > 0 && (
              <div className="text-amber-600">
                <div>{resumenEdiciones(r.edit_history)}</div>
                {ediciones.map((e, i) => (
                  <div key={i}>
                    {e.cambios.join(' · ')}
                    {e.atLabel ? ` — ${e.atLabel}` : ''}
                  </div>
                ))}
              </div>
            )}
            {!r.description && !ediciones.length && <span className="text-slate-400">-</span>}
          </div>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEdicion(r)} />
          <Popconfirm
            title={r.transfer_group_id ? 'Se borran las dos patas del traspaso' : '¿Eliminar?'}
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => eliminar(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Tabla de saldos de apertura: lo que propone el sistema y lo que se declara
  const columnasApertura = [
    { title: 'Cuenta', dataIndex: 'name', key: 'name' },
    {
      title: 'Propuesto',
      dataIndex: 'saldo',
      key: 'saldo',
      align: 'right',
      render: (v) => <span className="tabular-nums text-slate-500">{money(v)}</span>,
    },
    {
      title: 'Real',
      key: 'declarado',
      align: 'right',
      width: 150,
      render: (_, r) => (
        <InputNumber
          size="small"
          className="w-full"
          value={r.declarado}
          onChange={(v) =>
            setSaldosApertura((prev) =>
              prev.map((c) => (c.id === r.id ? { ...c, declarado: v ?? 0 } : c)),
            )
          }
        />
      ),
    },
  ];

  const resumenApertura = (filas) => {
    const propuesto = filas.reduce((a, c) => a + Number(c.saldo || 0), 0);
    const real = filas.reduce((a, c) => a + Number(c.declarado || 0), 0);
    const dif = real - propuesto;

    return (
      <Table.Summary.Row>
        <Table.Summary.Cell index={0}>
          <strong>Total</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">
          <span className="tabular-nums text-slate-500">{money(propuesto)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          <strong className="tabular-nums">{money(real)}</strong>
          {dif !== 0 && (
            <div className="text-[11px] text-amber-600">
              {dif > 0 ? 'sobran ' : 'faltan '}
              {money(Math.abs(dif))}
            </div>
          )}
        </Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  const t = resumen?.totales;
  const tipoElegido = tipos.find((x) => x.slug === kindElegido);
  const esTraspaso = tipoElegido?.sign === 'transfer';

  return (
    <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
      <Head title="Bancos Online" />

      <div className="p-4 mx-auto space-y-4 max-w-[1500px] sm:p-6">
        <PageHeader
          title="Bancos Online"
          icon={BankOutlined}
          subtitle="Cuentas de la empresa, movimientos y saldos"
        />

        {/* Turno: sin uno abierto no se puede cargar nada.
            Mientras no sabemos si hay turno no mostramos ninguno de los dos
            estados: si no, se ve "Abrir turno" y al segundo cambia a "Cerrar". */}
        <Card
          className={
            cargandoTurno
              ? 'border-slate-200'
              : turno
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-amber-300 bg-amber-50/40'
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            {cargandoTurno ? (
              <Skeleton active title={false} paragraph={{ rows: 1, width: '70%' }} />
            ) : turno ? (
              <>
                <Tag color="green" className="m-0">
                  Turno #{turno.id} abierto
                </Tag>
                <span className="text-sm text-slate-700">
                  Lo abrió <strong>{turno.opened_by_name || '—'}</strong> el{' '}
                  {dayjs(turno.opened_at).format('DD/MM/YYYY HH:mm')}
                </span>
                <span className="text-sm text-slate-500">
                  {turno.movs} movimiento(s) · neto{' '}
                  <strong className="tabular-nums">{money(turno.neto)}</strong>
                </span>
                <Button
                  danger
                  className="ml-auto"
                  loading={turnoOcupado}
                  onClick={() => abrirModalTurno('cerrar')}
                >
                  Cerrar turno
                </Button>
              </>
            ) : (
              <>
                <Tag color="orange" className="m-0">
                  Sin turno abierto
                </Tag>
                <span className="text-sm text-slate-700">
                  Abrí un turno para poder cargar movimientos.
                </span>
                <Button
                  type="primary"
                  className="ml-auto"
                  loading={turnoOcupado}
                  onClick={() => abrirModalTurno('abrir')}
                >
                  Abrir turno
                </Button>
              </>
            )}
            {!cargandoTurno && (
              <Link href="/banks/shifts">
                <Button icon={<HistoryOutlined />}>Historial de turnos</Button>
              </Link>
            )}
          </div>
        </Card>

        <Card>
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} md={8}>
              <p className="mb-1 text-sm font-medium text-slate-700">Período</p>
              <RangePicker
                className="w-full"
                value={rango}
                onChange={setRango}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </Col>
            <Col xs={12} md={5}>
              <p className="mb-1 text-sm font-medium text-slate-700">Cuenta</p>
              <Select
                className="w-full"
                allowClear
                placeholder="Todas"
                value={cuentaId}
                onChange={setCuentaId}
                options={opcionesCuenta}
              />
            </Col>
            <Col xs={12} md={4}>
              <p className="mb-1 text-sm font-medium text-slate-700">Tipo</p>
              <Select
                className="w-full"
                allowClear
                placeholder="Todos"
                value={tipo}
                onChange={setTipo}
                options={opcionesTipo}
              />
            </Col>
            <Col xs={24} md={7}>
              <p className="mb-1 text-sm font-medium text-slate-700">Buscar</p>
              <Input.Search
                placeholder="Cliente, ID o detalle"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onSearch={() => cargar(1)}
                allowClear
              />
            </Col>
          </Row>

          {/* Los tipos son la forma de cargar: se eligen acá afuera y el modal
              abre directo con ese tipo. No hay un "nuevo movimiento" generico. */}
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-200">
            {tipos.map((t) => (
              <Button
                key={t.slug}
                type="primary"
                loading={cargandoTurno}
                disabled={!turno}
                title={turno ? undefined : 'Abrí un turno para cargar movimientos'}
                onClick={() => abrirNuevo(t.slug)}
              >
                {t.name}
              </Button>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setNuevoTipo({ nombre: '', signo: 'out' })}
            >
              Nuevo tipo
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Button icon={<UploadOutlined />} onClick={() => setModalImport(true)}>
              Importar planilla
            </Button>
            <Link href="/banks/clients">
              <Button icon={<TeamOutlined />}>Clientes</Button>
            </Link>
            <Button
              icon={<ReloadOutlined />}
              loading={cargando}
              onClick={() => cargar(paginacion.current)}
            >
              Actualizar
            </Button>
          </div>
        </Card>

        {/* Con un turno abierto las cifras son del turno, y arrancan en cero en
            cada turno nuevo. Sin turno, son del período del filtro. */}
        {(cargandoTurno || cargando) && !t && (
          <Card>
            <Row gutter={[16, 16]}>
              {[0, 1, 2, 3].map((i) => (
                <Col xs={12} md={6} key={i}>
                  <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 1, width: '90%' }} />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {(turno || t) && !cargandoTurno && (
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic
                  title={
                    turno ? `Saldo al abrir el turno #${turno.id}` : 'Saldo al inicio del período'
                  }
                  value={money(turno ? turno.apertura : t.saldo_inicio_periodo)}
                  valueStyle={{
                    color: colorSaldo(turno ? turno.apertura : t.saldo_inicio_periodo),
                  }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={turno ? 'Cargas del turno' : 'Cargas'}
                  value={money(turno ? turno.cargas : t.cargas)}
                  valueStyle={{ color: '#15803d' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={turno ? 'Retiros del turno' : 'Retiros'}
                  value={money(turno ? turno.retiros : t.retiros)}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Saldo actual"
                  value={money(turno ? turno.saldo_actual : t?.saldo_actual)}
                  valueStyle={{
                    color: colorSaldo(turno ? turno.saldo_actual : t?.saldo_actual),
                    fontWeight: 700,
                  }}
                />
              </Col>
            </Row>
            <p className="mt-2 text-xs text-slate-500">
              {turno
                ? `${turno.movs} movimiento(s) en este turno · neto ${money(turno.neto)}. Las cifras arrancan en cero en cada turno: el período de arriba solo filtra la tabla.`
                : `${t.movs} movimiento(s) en el período · neto ${money(t.neto)}. Abrí un turno para ver las cifras del turno.`}
            </p>
          </Card>
        )}

        {!resumen && cargando && (
          <Card title="Saldo por cuenta" size="small">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        )}

        {resumen && (
          <Card title="Saldo por cuenta" size="small">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
              dataSource={resumen.cuentas}
              columns={[
                { title: 'Cuenta', dataIndex: 'name', key: 'name' },
                {
                  title: 'Saldo inicio',
                  dataIndex: 'saldo_inicio_periodo',
                  key: 'ini',
                  align: 'right',
                  render: (v) => <span className="tabular-nums">{money(v)}</span>,
                },
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
                { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right' },
                {
                  title: 'Saldo actual',
                  dataIndex: 'saldo_actual',
                  key: 'act',
                  align: 'right',
                  render: (v) => (
                    <span className="font-bold tabular-nums" style={{ color: colorSaldo(v) }}>
                      {money(v)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        )}

        <Card title="Movimientos" size="small">
          <Table
            rowKey="id"
            columns={columnas}
            dataSource={movs}
            loading={cargando}
            size="small"
            scroll={{ x: 1200 }}
            locale={{ emptyText: <Empty description="No hay movimientos para estos filtros" /> }}
            pagination={{
              ...paginacion,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100, 200],
              showTotal: (total, r) => `${r[0]}-${r[1]} de ${total}`,
              onChange: (p, ps) => cargar(p, ps),
            }}
          />
        </Card>

        {/* Alta / edición */}
        <Modal
          open={modalMov}
          title={
            editando ? `Editar movimiento #${editando.id}` : tipoElegido?.name || 'Nuevo movimiento'
          }
          onCancel={() => setModalMov(false)}
          onOk={guardar}
          confirmLoading={guardando}
          okText="Guardar"
          cancelText="Cancelar"
          centered
          styles={MODAL_SCROLL_BODY}
          destroyOnClose
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="date"
              label="Fecha"
              rules={[{ required: true, message: 'Elegí la fecha' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>

            {/* El tipo ya vino elegido desde afuera: acá solo viaja en el form */}
            <Form.Item name="kind" hidden rules={[{ required: true }]}>
              <Input type="hidden" />
            </Form.Item>

            <Form.Item
              name="bank_account_id"
              label={esTraspaso ? 'Cuenta de origen' : 'Cuenta'}
              rules={[{ required: true, message: 'Elegí la cuenta' }]}
            >
              <SelectCreatable
                allowClear={false}
                placeholder="Elegí o escribí una cuenta nueva"
                options={opcionesCuenta}
                onCreate={crearCuenta}
                createLabel={(t) => `Agregar la cuenta "${t}"`}
              />
            </Form.Item>

            {esTraspaso && !editando && (
              <Form.Item
                name="to_bank_account_id"
                label="Cuenta de destino"
                rules={[{ required: true, message: 'Elegí la cuenta de destino' }]}
              >
                <SelectCreatable
                  allowClear={false}
                  placeholder="Elegí o escribí una cuenta nueva"
                  options={opcionesCuenta}
                  onCreate={crearCuenta}
                  createLabel={(t) => `Agregar la cuenta "${t}"`}
                />
              </Form.Item>
            )}

            <Form.Item name="bank_client_id" label="Cliente">
              <SelectCreatable
                placeholder="Elegí uno o escribí el nombre para crearlo"
                options={clientes.map((c) => ({
                  value: c.id,
                  label: c.external_id ? `${c.name} (#${c.external_id})` : c.name,
                }))}
                onCreate={crearCliente}
                createLabel={(t) => `Agregar el cliente "${t}"`}
              />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Monto"
              extra={
                esTraspaso
                  ? 'Se escribe en positivo: el sistema lo resta del origen y lo suma al destino.'
                  : tipoElegido?.sign === 'both'
                    ? 'Este tipo usa el signo que escribas: positivo suma, negativo resta.'
                    : `Se escribe en positivo: "${tipoElegido?.name || 'el tipo'}" ${
                        tipoElegido?.sign === 'out' ? 'resta' : 'suma'
                      } del saldo.`
              }
              rules={[{ required: true, message: 'Ingresá el monto' }]}
            >
              <InputNumber
                className="w-full"
                min={-99999999}
                formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(v) => v.replace(/\$\s?|\./g, '')}
              />
            </Form.Item>

            <Form.Item name="description" label="Detalle">
              <Input.TextArea rows={2} maxLength={255} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Abrir / cerrar turno */}
        <Modal
          open={!!modalTurno}
          title={modalTurno === 'abrir' ? 'Abrir turno' : `Cerrar turno #${turno?.id ?? ''}`}
          onCancel={() => {
            setModalTurno(null);
            setNotaTurno('');
          }}
          onOk={confirmarTurno}
          confirmLoading={turnoOcupado}
          okText={modalTurno === 'abrir' ? 'Abrir' : 'Cerrar'}
          okButtonProps={{ danger: modalTurno === 'cerrar' }}
          cancelText="Cancelar"
          centered
          destroyOnClose
        >
          {modalTurno === 'cerrar' && turno && (
            <div className="p-3 mb-3 text-sm border rounded-lg border-slate-200 bg-slate-50">
              <div>
                Abrió con <strong className="tabular-nums">{money(turno.apertura)}</strong>
              </div>
              <div>
                {turno.movs} movimiento(s) · cargas {money(turno.cargas)} · retiros{' '}
                {money(turno.retiros)} · neto {money(turno.neto)}
              </div>
              <div className="pt-1 mt-1 border-t border-slate-200">
                Cierra con <strong className="tabular-nums">{money(turno.saldo_actual)}</strong>
              </div>
            </div>
          )}

          {modalTurno === 'abrir' && (
            <>
              <p className="mb-1 text-sm font-medium text-slate-700">
                Saldo con el que arranca cada cuenta
              </p>
              <p className="mb-2 text-xs text-slate-500">
                Viene del cierre del turno anterior. Si no coincide con la realidad corregilo: la
                diferencia queda registrada.
              </p>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                className="mb-4"
                dataSource={saldosApertura}
                columns={columnasApertura}
                summary={resumenApertura}
              />
            </>
          )}

          <p className="mb-1 text-sm font-medium text-slate-700">
            Nota {modalTurno === 'abrir' ? 'de apertura' : 'de cierre'} (opcional)
          </p>
          <Input.TextArea
            rows={2}
            maxLength={255}
            value={notaTurno}
            onChange={(e) => setNotaTurno(e.target.value)}
            placeholder={modalTurno === 'abrir' ? 'Ej: turno tarde' : 'Ej: sin novedad'}
          />
          <p className="mt-3 text-xs text-slate-500">
            Queda registrado quién {modalTurno === 'abrir' ? 'abre' : 'cierra'} y cuándo.
          </p>
        </Modal>

        {/* Alta de tipo: el signo define si suma o resta */}
        <Modal
          open={!!nuevoTipo}
          title="Nuevo tipo de movimiento"
          onCancel={() => setNuevoTipo(null)}
          onOk={confirmarTipo}
          confirmLoading={guardandoTipo}
          okText="Crear tipo"
          cancelText="Cancelar"
          centered
          destroyOnClose
        >
          <p className="mb-1 text-sm font-medium text-slate-700">Nombre</p>
          <Input
            autoFocus
            maxLength={60}
            className="mb-4"
            placeholder="Ej: Comisión plan"
            value={nuevoTipo?.nombre}
            onChange={(e) => setNuevoTipo((t) => ({ ...t, nombre: e.target.value }))}
            onPressEnter={confirmarTipo}
          />

          <p className="mb-3 text-sm text-slate-600">
            ¿Qué le hace este tipo al saldo de la cuenta?
          </p>
          <Radio.Group
            value={nuevoTipo?.signo}
            onChange={(e) => setNuevoTipo((t) => ({ ...t, signo: e.target.value }))}
          >
            <Space direction="vertical">
              <Radio value="out">Resta de la cuenta (egreso)</Radio>
              <Radio value="in">Suma a la cuenta (ingreso)</Radio>
              <Radio value="both">Según el monto que se escriba</Radio>
            </Space>
          </Radio.Group>
        </Modal>

        {/* Importador */}
        <Modal
          open={modalImport}
          title="Importar planilla de bancos"
          width={800}
          centered
          styles={MODAL_SCROLL_BODY}
          onCancel={() => {
            setModalImport(false);
            setPreview(null);
            setArchivo(null);
          }}
          footer={
            <Space>
              <Button
                onClick={() => {
                  setModalImport(false);
                  setPreview(null);
                  setArchivo(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                disabled={!preview}
                loading={importando}
                onClick={confirmarImport}
              >
                Confirmar importación
              </Button>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message="Exportá la hoja como CSV"
            description="Se leen solo las columnas del libro de movimientos (FECHA, ID, nombre, las cuentas, cajero y asunto). Los bloques de resumen de saldos se ignoran: los saldos se recalculan acá."
          />

          <Upload.Dragger
            accept=".csv,text/csv"
            maxCount={1}
            beforeUpload={previsualizar}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              {archivo ? archivo.name : 'Arrastrá el CSV o hacé clic para elegirlo'}
            </p>
          </Upload.Dragger>

          {preview && (
            <div className="mt-4 space-y-3">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="Movimientos" value={preview.movimientos} />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Cargas"
                    value={money(preview.cargas)}
                    valueStyle={{ color: '#15803d', fontSize: 18 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Retiros"
                    value={money(preview.retiros)}
                    valueStyle={{ color: '#cf1322', fontSize: 18 }}
                  />
                </Col>
              </Row>

              {preview.periodo && (
                <p className="text-sm text-slate-600">
                  Período: {dayjs(preview.periodo[0]).format('DD/MM/YYYY')} a{' '}
                  {dayjs(preview.periodo[1]).format('DD/MM/YYYY')}
                </p>
              )}

              <Table
                size="small"
                rowKey="cuenta"
                pagination={false}
                dataSource={preview.por_cuenta}
                columns={[
                  { title: 'Cuenta', dataIndex: 'cuenta', key: 'cuenta' },
                  { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right' },
                  {
                    title: 'Cargas',
                    dataIndex: 'cargas',
                    key: 'cargas',
                    align: 'right',
                    render: money,
                  },
                  {
                    title: 'Retiros',
                    dataIndex: 'retiros',
                    key: 'retiros',
                    align: 'right',
                    render: money,
                  },
                ]}
              />

              {preview.problemas?.sin_fecha?.filas > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={`${preview.problemas.sin_fecha.filas} fila(s) sin fecha por ${money(
                    preview.problemas.sin_fecha.monto,
                  )}`}
                  description={`Se importan con la fecha de hoy y quedan marcadas en el detalle. Líneas del archivo: ${preview.problemas.sin_fecha.lineas.join(', ')}`}
                />
              )}

              {preview.problemas?.sin_id?.filas > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={`${preview.problemas.sin_id.filas} fila(s) sin ID de cliente por ${money(
                    preview.problemas.sin_id.monto,
                  )}`}
                  description="Se importan igual; el cliente se resuelve por nombre si lo tiene."
                />
              )}

              {preview.cuentas_desconocidas?.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  message="Columnas que no se reconocieron"
                  description={`${preview.cuentas_desconocidas.join(', ')}. Esas columnas NO se importan.`}
                />
              )}

              {preview.problemas?.cajeros_sin_usuario?.length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  message="Cajeros sin usuario en el sistema"
                  description={`${preview.problemas.cajeros_sin_usuario.join(', ')}. El nombre queda en el detalle del movimiento.`}
                />
              )}

              {preview.clientes_nuevos?.length > 0 && (
                <>
                  <p className="mt-2 mb-1 text-sm font-medium">
                    Clientes nuevos (
                    {preview.clientes_nuevos_total ?? preview.clientes_nuevos.length})
                    {preview.clientes_nuevos_total > preview.clientes_nuevos.length && (
                      <span className="ml-1 font-normal text-slate-500">
                        — se muestran los {preview.clientes_nuevos.length} con más movimientos
                      </span>
                    )}
                  </p>
                  <Table
                    size="small"
                    rowKey={(r) => `${r.external_id}-${r.nombre}`}
                    pagination={{ pageSize: 5 }}
                    dataSource={preview.clientes_nuevos}
                    columns={[
                      { title: 'ID', dataIndex: 'external_id', key: 'id', render: (v) => v || '-' },
                      { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
                      { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right' },
                      {
                        title: 'Se parece a',
                        dataIndex: 'parecidos',
                        key: 'parecidos',
                        render: (p) =>
                          p?.length ? (
                            <span className="text-amber-600">{p.join(', ')}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          ),
                      },
                    ]}
                  />
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
