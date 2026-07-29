import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { formatDateTimeCL } from '@/Utils/date';

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'shift_id',
    render: (id) => `Turno #${id}`,
  },
  {
    title: 'Sucursal',
    key: 'branch',
    render: (_, record) => record.branch?.name || 'N/A',
  },
  {
    title: 'Abierto por',
    key: 'opened_by',
    render: (_, record) => {
      if (!record.opened_by) return 'N/A';
      const firstName = record.opened_by.first_name || '';
      const lastName = record.opened_by.first_last_name || '';
      return firstName && lastName ? `${firstName} ${lastName}` : 'N/A';
    },
  },
  {
    title: 'Cerrado por',
    key: 'closed_by',
    render: (_, record) => {
      if (!record.closed_by) return 'No cerrado';
      const firstName = record.closed_by.first_name || '';
      const lastName = record.closed_by.first_last_name || '';
      return firstName && lastName ? `${firstName} ${lastName}` : 'N/A';
    },
  },
  {
    title: 'Hora de apertura',
    dataIndex: 'opening_time',
    key: 'opening_time',
    render: (date) => (date ? formatDateTimeCL(date, { seconds: true }) : 'N/A'),
  },
  {
    title: 'Hora de cierre',
    dataIndex: 'closing_time',
    key: 'closing_time',
    render: (date) => (date ? formatDateTimeCL(date, { seconds: true }) : 'No cerrado'),
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status === 'open' ? 'Abierto' : 'Cerrado'}
        </span>
      );
    },
  },
];

export default function ShiftsPage({ auth, shifts }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={
        <h2 className="z-10 font-semibold text-xl text-gray-800 leading-tight">
          Registro de Turnos
        </h2>
      }
    >
      <Head title="Registro de Turnos" />
      <header className="flex items-center justify-between gap-3 p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl lg:text-4xl">Registro de Turnos</h1>
      </header>
      <div className="flex-1 overflow-auto p-4 z-10">
        <div className="w-full">
          <div className="bg-white shadow-sm sm:rounded-lg">
            <CustomTable
              dataSource={shifts.map((shift) => ({
                ...shift,
                key: `shift_${shift.id}`,
              }))}
              columns={columns}
              scroll={{ x: true }}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
