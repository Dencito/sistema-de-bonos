import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Select,
  Button,
  AutoComplete,
  Table,
  Tag,
  Alert,
  Empty,
  Statistic,
  message,
} from 'antd';
import { SearchOutlined, DesktopOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDateTimeCL } from '@/Utils/date';
import { listarEdiciones, resumenEdiciones } from '@/Utils/editHistory';

/* global route */

const TIPOS = {
  payment: 'Pago por Caja',
  tragados: 'Tragados',
  pasillera_payment: 'Pago Pasillera',
};

const COLORES = {
  payment: 'purple',
  tragados: '#391085',
  pasillera_payment: 'geekblue',
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

export default function MachinesIndex({
  auth,
  canSelectBranch,
  branches = [],
  branch,
  machines = [],
}) {
  const [branchId, setBranchId] = useState(branch?.id ?? null);
  const [machine, setMachine] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [opciones, setOpciones] = useState(machines);

  const handleBranchChange = (value) => {
    setBranchId(value);
    setResult(null);
    // Las maquinas sugeridas son las de la sucursal elegida: se piden al buscar
    setOpciones([]);
  };

  const buscar = async () => {
    if (!machine.trim()) {
      message.error('Ingresá el número de máquina');
      return;
    }
    if (canSelectBranch && !branchId) {
      message.error('Elegí una sucursal');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(route('machines.search'), {
        params: { machine: machine.trim(), branch_id: branchId },
      });
      if (data.success) setResult(data.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al buscar la máquina');
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => formatDateTimeCL(d, { seconds: true }),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (t) => <Tag color={COLORES[t] || 'default'}>{TIPOS[t] || t}</Tag>,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v) => <span className="font-semibold tabular-nums">{formatCurrency(v)}</span>,
    },
    { title: 'Cliente', dataIndex: 'client', key: 'client', render: (c) => c || '-' },
    {
      title: 'Registrado por',
      dataIndex: 'registrado_por',
      key: 'registrado_por',
      render: (u, r) => (
        <>
          {u || '-'}
          {r.source === 'pasillera' && <Tag className="ml-1">Pasillera</Tag>}
        </>
      ),
    },
    {
      title: 'Correcciones',
      key: 'edit_history',
      render: (_, r) => {
        const ediciones = listarEdiciones(r.edit_history);
        if (!ediciones.length) return <span className="text-slate-400">-</span>;

        return (
          <div className="text-[11px] leading-tight text-amber-600">
            <div>{resumenEdiciones(r.edit_history)}</div>
            {ediciones.map((e, i) => (
              <div key={i}>
                {e.cambios.join(' · ')}
                {e.atLabel ? ` — ${e.atLabel}` : ''}
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
      <Head title="Consulta por Máquina" />

      <div className="p-4 mx-auto space-y-4 max-w-[1400px] sm:p-6">
        <PageHeader
          title="Consulta por Máquina"
          icon={DesktopOutlined}
          subtitle="Todo lo que se registró en una máquina, separado por turno de caja"
        />

        <Card>
          <div className="flex flex-wrap items-end gap-3">
            {canSelectBranch && (
              <div className="min-w-[220px]">
                <p className="mb-1 text-sm font-medium text-slate-700">Sucursal *</p>
                <Select
                  className="w-full"
                  size="large"
                  placeholder="Elegí una sucursal"
                  value={branchId}
                  onChange={handleBranchChange}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                />
              </div>
            )}

            <div className="min-w-[220px] flex-1">
              <p className="mb-1 text-sm font-medium text-slate-700">N° de máquina *</p>
              <AutoComplete
                className="w-full"
                size="large"
                value={machine}
                onChange={setMachine}
                placeholder="Ej: 12"
                options={opciones.map((m) => ({ value: String(m) }))}
                filterOption={(input, option) =>
                  option.value.toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={buscar}
            >
              Buscar
            </Button>
          </div>

          {!canSelectBranch && branch?.name && (
            <p className="mt-2 text-xs text-slate-500">Sucursal: {branch.name}</p>
          )}
        </Card>

        {result && result.turnos.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={`No hay movimientos para la máquina ${result.machine} en ${result.branch.name}`}
            description="Revisá el número: se guarda como texto libre, así que puede estar cargado distinto (por ejemplo 01 en vez de 1)."
          />
        )}

        {result && result.turnos.length > 0 && (
          <>
            <Card>
              <div className="flex flex-wrap gap-8">
                <Statistic title="Máquina" value={result.machine} />
                <Statistic title="Turnos con movimientos" value={result.turnos.length} />
                <Statistic title="Movimientos" value={result.cantidad_movimientos} />
                <Statistic
                  title="Total general"
                  value={formatCurrency(result.total_general)}
                  valueStyle={{ color: '#cf1322' }}
                />
              </div>
            </Card>

            {result.turnos.map((t) => (
              <Card
                key={t.shift_id}
                title={
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Turno #{t.shift_id}</span>
                    {t.is_active ? <Tag color="green">Abierto</Tag> : <Tag>Cerrado</Tag>}
                    <span className="text-xs font-normal text-slate-500">
                      {t.user ? `${t.user} · ` : ''}
                      {formatDateTimeCL(t.started_at)}
                      {t.ended_at ? ` → ${formatDateTimeCL(t.ended_at)}` : ' → en curso'}
                    </span>
                  </div>
                }
                extra={<span className="font-bold tabular-nums">{formatCurrency(t.total)}</span>}
              >
                <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-600">
                  {Object.entries(t.por_tipo).map(([tipo, d]) => (
                    <span key={tipo}>
                      <Tag color={COLORES[tipo] || 'default'}>{TIPOS[tipo] || tipo}</Tag>
                      {d.cantidad} · {formatCurrency(d.total)}
                    </span>
                  ))}
                </div>

                <Table
                  columns={columnas}
                  dataSource={t.movimientos}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            ))}
          </>
        )}

        {!result && (
          <Card>
            <Empty description="Ingresá un número de máquina para ver sus movimientos" />
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
