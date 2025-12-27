import { lazy, Suspense } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';

const LazyModalCreateTotem = lazy(() => import('@/Components/Totems/ModalCreateTotem'));

const LoadingFallback = () => <div className="p-2">Cargando...</div>;

const columns = [
  {
    title: 'Nombre',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Código',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'Sucursal',
    key: 'branch',
    render: (_, record) => record.branch?.name || 'N/A',
  },
  {
    title: 'Estado',
    key: 'active',
    render: (_, record) => (
      <div
        className={`${
          record.active ? 'bg-green-300' : 'bg-red-200'
        } font-bold rounded-full text-center p-1 w-6 h-6`}
      ></div>
    ),
  },
];

export default function TotemPage({ auth, totems, branches }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="z-10 font-semibold text-xl text-gray-800 leading-tight">Tótems</h2>}
    >
      <Head title="Tótems" />
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="text-4xl font-bold">Tótems</h1>
      </header>
      <div className="flex-1 overflow-auto p-4 z-10">
        <div className="w-full">
          <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="text-gray-900 my-3 flex items-center justify-end">
              <Suspense fallback={<LoadingFallback />}>
                <LazyModalCreateTotem branches={branches} />
              </Suspense>
            </div>
            <CustomTable
              dataSource={totems.map((totem) => ({
                ...totem,
                key: totem.id,
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
