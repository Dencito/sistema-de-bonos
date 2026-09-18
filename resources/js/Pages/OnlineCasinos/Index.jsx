import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Row,
  Col,
  Statistic,
  Alert,
  Skeleton,
  Tag,
  Space,
  Input,
} from 'antd';
import { GlobalOutlined, ReloadOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const { RangePicker } = DatePicker;

/** Día abreviado en español: "vie", "sáb". Sin tocar el locale global. */
const diaCorto = (d) => dayjs(d).locale('es').format('ddd').replace('.', '');

const money = (v, moneda = 'CLP') =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda || 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const colorNeto = (v) => (Number(v) < 0 ? '#cf1322' : '#15803d');

/**
 * Clave temporal, solo del lado del cliente.
 *
 * Ojo: esto NO es seguridad. La clave viaja en el bundle de JS y cualquiera
 * que abra las herramientas del navegador la lee, igual que puede pegarle
 * directo a /online-casinos/report. Es una cortina para que no se asome
 * cualquiera que pase por la pantalla; el control de verdad es el permiso
 * del servidor (BankAccess).
 */
const CLAVE = 'Cesar123.!@';
const LLAVE_SESION = 'casinos-online-ok';

/** Atajos de período: es lo que más se mira. */
const ATAJOS = [
  { label: 'Hoy', desde: () => dayjs(), hasta: () => dayjs() },
  {
    label: 'Ayer',
    desde: () => dayjs().subtract(1, 'day'),
    hasta: () => dayjs().subtract(1, 'day'),
  },
  { label: 'Últimos 7 días', desde: () => dayjs().subtract(6, 'day'), hasta: () => dayjs() },
  { label: 'Este mes', desde: () => dayjs().startOf('month'), hasta: () => dayjs() },
  {
    label: 'Mes pasado',
    desde: () => dayjs().subtract(1, 'month').startOf('month'),
    hasta: () => dayjs().subtract(1, 'month').endOf('month'),
  },
];

export default function OnlineCasinosIndex({ auth, defaultRange = [], configured = true }) {
  const [rango, setRango] = useState([
    defaultRange[0] ? dayjs(defaultRange[0]) : dayjs().startOf('month'),
    defaultRange[1] ? dayjs(defaultRange[1]) : dayjs(),
  ]);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Dura lo que dure la pestaña: si cierra el navegador, vuelve a pedirla
  const [abierto, setAbierto] = useState(() => {
    try {
      return sessionStorage.getItem(LLAVE_SESION) === '1';
    } catch {
      return false;
    }
  });
  const [clave, setClave] = useState('');
  const [claveMal, setClaveMal] = useState(false);

  const destrabar = () => {
    if (clave !== CLAVE) {
      setClaveMal(true);
      return;
    }
    try {
      sessionStorage.setItem(LLAVE_SESION, '1');
    } catch {
      // Navegador con el almacenamiento bloqueado: entra igual, pero
      // va a volver a preguntar en la próxima pantalla
    }
    setClave('');
    setClaveMal(false);
    setAbierto(true);
  };

  const trabar = () => {
    try {
      sessionStorage.removeItem(LLAVE_SESION);
    } catch {
      // Nada que limpiar
    }
    setDatos(null);
    setAbierto(false);
  };

  const cargar = useCallback(async () => {
    if (!rango?.[0] || !rango?.[1]) return;

    setCargando(true);
    setError('');
    try {
      const res = await axios.get('/online-casinos/report', {
        params: {
          start: rango[0].format('YYYY-MM-DD'),
          end: rango[1].format('YYYY-MM-DD'),
        },
      });
      if (res.data.success) setDatos(res.data.data);
    } catch (e) {
      // El backend manda el motivo ya escrito para leer (sesión vencida, etc.)
      const motivo = e.response?.data?.message || 'No se pudo traer el reporte';
      setError(motivo);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [rango]);

  useEffect(() => {
    // Mientras esté trabado no se pide nada al servidor
    if (configured && abierto) cargar();
    else setCargando(false);
  }, [cargar, configured, abierto]);

  const t = datos?.totales;
  const moneda = datos?.moneda || 'CLP';

  const columnas = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 130,
      render: (d) => (
        <span>
          {dayjs(d).format('DD/MM/YYYY')}
          <span className="ml-2 text-xs text-slate-400">{diaCorto(d)}</span>
        </span>
      ),
    },
    {
      title: 'Entradas',
      dataIndex: 'entradas',
      key: 'entradas',
      align: 'right',
      render: (v, r) => (
        <div>
          <div className="font-semibold tabular-nums text-emerald-700">{money(v, moneda)}</div>
          <div className="text-[11px] text-slate-400">{r.entradas_cant} movs</div>
        </div>
      ),
    },
    {
      title: 'Salidas',
      dataIndex: 'salidas',
      key: 'salidas',
      align: 'right',
      render: (v, r) => (
        <div>
          <div className="font-semibold tabular-nums text-red-700">{money(v, moneda)}</div>
          <div className="text-[11px] text-slate-400">{r.salidas_cant} movs</div>
        </div>
      ),
    },
    {
      title: 'Neto',
      dataIndex: 'neto',
      key: 'neto',
      align: 'right',
      render: (v) => (
        <span className="font-bold tabular-nums" style={{ color: colorNeto(v) }}>
          {money(v, moneda)}
        </span>
      ),
    },
    {
      title: 'Cuentas',
      dataIndex: 'cuentas',
      key: 'cuentas',
      align: 'right',
      width: 90,
      render: (v) => <span className="text-slate-500">{v}</span>,
    },
  ];

  if (!abierto) {
    return (
      <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
        <Head title="Reporte Casinos Online" />

        <div className="p-4 mx-auto max-w-[460px] sm:p-6">
          <Card className="mt-10">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center justify-center mb-2 rounded-full w-14 h-14 bg-slate-100">
                <LockOutlined style={{ fontSize: 22, color: '#475569' }} />
              </div>
              <p className="text-lg font-semibold text-slate-900">Reporte Casinos Online</p>
              <p className="text-sm text-slate-500">
                Esta pantalla pide una clave. Pedísela a quien corresponda.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <Input.Password
                autoFocus
                size="large"
                value={clave}
                placeholder="Clave"
                status={claveMal ? 'error' : ''}
                onChange={(e) => {
                  setClave(e.target.value);
                  setClaveMal(false);
                }}
                onPressEnter={destrabar}
              />

              {claveMal && <p className="text-sm text-red-600">La clave no es esa.</p>}

              <Button type="primary" size="large" block onClick={destrabar}>
                Entrar
              </Button>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
      <Head title="Reporte Casinos Online" />

      <div className="p-4 mx-auto space-y-4 max-w-[1300px] sm:p-6">
        <PageHeader
          title="Reporte Casinos Online"
          icon={GlobalOutlined}
          subtitle="Lo que movieron las cuentas online, día por día"
        />

        {!configured && (
          <Alert
            type="warning"
            showIcon
            message="Falta configurar el acceso"
            description="Hay que cargar MIADMIN_COOKIE y MIADMIN_ACCOUNTS en el .env del servidor."
          />
        )}

        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px]">
              <p className="mb-1 text-sm font-medium text-slate-700">Período</p>
              <RangePicker
                className="w-full"
                value={rango}
                onChange={setRango}
                format="DD/MM/YYYY"
                allowClear={false}
                disabledDate={(d) => d && d > dayjs().endOf('day')}
              />
            </div>

            <Button icon={<ReloadOutlined />} loading={cargando} onClick={cargar}>
              Actualizar
            </Button>

            <Space size={4} wrap className="ml-auto">
              {ATAJOS.map((a) => (
                <Button key={a.label} size="small" onClick={() => setRango([a.desde(), a.hasta()])}>
                  {a.label}
                </Button>
              ))}
              <Button
                size="small"
                icon={<LockOutlined />}
                onClick={trabar}
                title="Volver a pedir la clave"
              >
                Bloquear
              </Button>
            </Space>
          </div>
        </Card>

        {error && (
          <Alert
            type="error"
            showIcon
            message="No se pudo traer el reporte"
            description={error}
            action={
              <Button size="small" onClick={cargar}>
                Reintentar
              </Button>
            }
          />
        )}

        {cargando && !datos && (
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

        {t && (
          <>
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Entradas"
                    value={money(t.entradas, moneda)}
                    valueStyle={{ color: '#15803d' }}
                  />
                  <p className="text-xs text-slate-400">{t.entradas_cant} movimientos</p>
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Salidas"
                    value={money(t.salidas, moneda)}
                    valueStyle={{ color: '#cf1322' }}
                  />
                  <p className="text-xs text-slate-400">{t.salidas_cant} movimientos</p>
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Neto del período"
                    value={money(t.neto, moneda)}
                    valueStyle={{ color: colorNeto(t.neto), fontWeight: 700 }}
                  />
                  <p className="text-xs text-slate-400">
                    {t.dias} día{t.dias !== 1 ? 's' : ''}
                  </p>
                </Col>
                <Col xs={12} md={6}>
                  <Statistic title="Días en verde" value={`${t.dias_positivos} / ${t.dias}`} />
                  <p className="text-xs text-slate-400">{t.dias_negativos} en rojo</p>
                </Col>
              </Row>

              {(datos.mejor_dia || datos.peor_dia) && (
                <div className="flex flex-wrap gap-4 pt-3 mt-3 text-xs border-t text-slate-600 border-slate-200">
                  {datos.mejor_dia && (
                    <span>
                      Mejor día: <strong>{dayjs(datos.mejor_dia.fecha).format('DD/MM')}</strong>{' '}
                      <Tag color="green" className="ml-1">
                        {money(datos.mejor_dia.neto, moneda)}
                      </Tag>
                    </span>
                  )}
                  {datos.peor_dia && Number(datos.peor_dia.neto) < 0 && (
                    <span>
                      Peor día: <strong>{dayjs(datos.peor_dia.fecha).format('DD/MM')}</strong>{' '}
                      <Tag color="red" className="ml-1">
                        {money(datos.peor_dia.neto, moneda)}
                      </Tag>
                    </span>
                  )}
                </div>
              )}
            </Card>

            <Card size="small" title="Día por día">
              <Table
                rowKey="fecha"
                size="small"
                columns={columnas}
                dataSource={[...datos.dias].reverse()}
                loading={cargando}
                scroll={{ x: 700 }}
                pagination={{ pageSize: 31, hideOnSinglePage: true }}
                rowClassName={(r) => (Number(r.neto) < 0 ? 'bg-red-50/60' : '')}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong className="tabular-nums text-emerald-700">
                          {money(t.entradas, moneda)}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <strong className="tabular-nums text-red-700">
                          {money(t.salidas, moneda)}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <strong className="tabular-nums" style={{ color: colorNeto(t.neto) }}>
                          {money(t.neto, moneda)}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
