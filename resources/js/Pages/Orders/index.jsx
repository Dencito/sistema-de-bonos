import { lazy, Suspense, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { Select } from 'antd';

const LazyModalCreateOrder = lazy(() => import('@/Components/Orders/ModalCreateOrder'));
const LazyModalDeleteOrder = lazy(() => import('@/Components/Orders/ModalDeleteOrder'));

const LoadingFallback = () => <div className="p-2">Cargando...</div>;

const columns = [
  {
    title: 'Productos',
    key: 'products',
    render: (_, order) => {
      if (!order.products || !Array.isArray(order.products)) return 'N/A';
      return order.products.join(', ');
    },
  },
  {
    title: 'Cantidad',
    key: 'quantity',
    render: (_, order) => order.quantity,
  },
  {
    title: 'Método de Pago',
    key: 'paymentMethod',
    render: (_, order) => order.payment_method || 'N/A',
  },
  {
    title: 'Monto pagado $',
    key: 'paidAmount',
    render: (_, order) => Math.trunc(order.paid_amount) || 'N/A',
  },
  { 
    title: 'Vuelto $',
    key: 'change',
    render: (_, order) => Math.trunc(order.change) || 'N/A',
  },
  {
    title: 'Total $',
    key: 'total',
    render: (_, order) => Math.trunc(order.total) || 'N/A',
  },
  {
    title: 'Acciones',
    key: 'actions',
    render: (_, order) => (
      <Suspense fallback={<LoadingFallback />}>
        <div className="flex flex-wrap gap-3">
          <LazyModalDeleteOrder order={order} />
        </div>
      </Suspense>
    ),
  },
];

export default function OrderPage({ auth, orders, products, branches }) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const userHasBranch = auth.user?.branch_id;

  const handleBranchChange = (value) => {
    setSelectedBranch(value);
    router.get(route('orders.index'), 
      value ? { branch_id: value } : {},
      { preserveState: true, preserveScroll: true }
    );
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={
        <h2 className="z-10 text-xl font-semibold leading-tight text-gray-800">Ventas Cigarros</h2>
      }
    >
      <Head title="Ventas" />
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="text-4xl font-bold">Ventas Cigarros</h1>
      </header>
      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="flex justify-between items-center my-3 text-gray-900 gap-3">
              {!userHasBranch && branches && branches.length > 0 && (
                <Select
                  className="w-64"
                  placeholder="Filtrar por sucursal"
                  value={selectedBranch || undefined}
                  onChange={handleBranchChange}
                  allowClear
                >
                  {branches.map((branch) => (
                    <Select.Option key={branch.id} value={branch.id}>
                      {branch.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
              <div className="ml-auto">
                <Suspense fallback={<LoadingFallback />}>
                  <LazyModalCreateOrder products={products} />
                </Suspense>
              </div>
            </div>
            <CustomTable
              dataSource={orders.map((order) => ({
                ...order,
                key: order.id,
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
