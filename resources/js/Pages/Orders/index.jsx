import { lazy, Suspense, useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { Select, Input, Button } from 'antd';

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
    render: (_, order) =>
      new Intl.NumberFormat('en-US').format(Math.trunc(order.paid_amount)) || 'N/A',
  },
  {
    title: 'Vuelto $',
    key: 'change',
    render: (_, order) => new Intl.NumberFormat('en-US').format(Math.trunc(order.change)) || 'N/A',
  },
  {
    title: 'Total $',
    key: 'total',
    render: (_, order) => new Intl.NumberFormat('en-US').format(Math.trunc(order.total)) || 'N/A',
  },
  {
    title: 'Usuario',
    key: 'user',
    render: (_, order) => {
      if (!order.user) return 'N/A';
      return `${order.user.first_name} ${order.user.first_last_name}`.trim() || 'N/A';
    },
  },
  {
    title: 'Fecha',
    key: 'created_at',
    render: (_, order) => {
      if (!order.created_at) return 'N/A';
      return new Date(order.created_at).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    },
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

export default function OrderPage({ auth, orders, products, branches, salesAccumulator = 0 }) {
  const [filters, setFilters] = useState({
    branch_id: '',
    quantity: '',
    payment_method: '',
    paid_amount_min: '',
    paid_amount_max: '',
    total_min: '',
    total_max: '',
  });
  const userHasBranch = auth.user?.branch_id;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params[key] = filters[key];
    });
    router.get(route('orders.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setFilters({
      branch_id: '',
      quantity: '',
      payment_method: '',
      paid_amount_min: '',
      paid_amount_max: '',
      total_min: '',
      total_max: '',
    });
    router.get(
      route('orders.index'),
      {},
      {
        preserveState: true,
        preserveScroll: true,
      },
    );
  };

  const formattedTotal = useMemo(() => {
    return parseFloat(salesAccumulator) || 0;
  }, [salesAccumulator]);

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
        <div className="text-right">
          <div className="text-sm text-gray-600">Total de Ventas</div>
          <div className="text-2xl font-bold text-green-600">
            ${new Intl.NumberFormat('en-US').format(Math.trunc(formattedTotal))}
          </div>
        </div>
      </header>
      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="flex flex-col gap-3 my-3 text-gray-900">
              <div className="flex flex-wrap gap-3 items-center">
                {!userHasBranch && branches && branches.length > 0 && (
                  <Select
                    className="w-48"
                    placeholder="Sucursal"
                    value={filters.branch_id || undefined}
                    onChange={(value) => handleFilterChange('branch_id', value)}
                    allowClear
                    style={{ color: '#333' }}
                  >
                    {branches.map((branch) => (
                      <Select.Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
                <Input
                  className="w-28"
                  placeholder="Cantidad"
                  value={filters.quantity}
                  onChange={(e) => handleFilterChange('quantity', e.target.value)}
                  allowClear
                  style={{ color: '#333' }}
                />
                <Select
                  className="w-36"
                  placeholder="Método pago"
                  value={filters.payment_method || undefined}
                  onChange={(value) => handleFilterChange('payment_method', value)}
                  allowClear
                  style={{ color: '#333' }}
                >
                  <Select.Option value="efectivo">Efectivo</Select.Option>
                  <Select.Option value="tarjeta">Tarjeta</Select.Option>
                  <Select.Option value="transferencia">Transferencia</Select.Option>
                </Select>
                <Input
                  className="w-28"
                  placeholder="Monto min"
                  value={filters.paid_amount_min}
                  onChange={(e) => handleFilterChange('paid_amount_min', e.target.value)}
                  allowClear
                  style={{ color: '#333' }}
                />
                <Input
                  className="w-28"
                  placeholder="Monto max"
                  value={filters.paid_amount_max}
                  onChange={(e) => handleFilterChange('paid_amount_max', e.target.value)}
                  allowClear
                  style={{ color: '#333' }}
                />
                <Input
                  className="w-28"
                  placeholder="Total min"
                  value={filters.total_min}
                  onChange={(e) => handleFilterChange('total_min', e.target.value)}
                  allowClear
                  style={{ color: '#333' }}
                />
                <Input
                  className="w-28"
                  placeholder="Total max"
                  value={filters.total_max}
                  onChange={(e) => handleFilterChange('total_max', e.target.value)}
                  allowClear
                  style={{ color: '#333' }}
                />
                <Button type="primary" onClick={applyFilters}>
                  Filtrar
                </Button>
                <Button onClick={clearFilters}>Limpiar</Button>
                <div className="ml-auto">
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyModalCreateOrder products={products} />
                  </Suspense>
                </div>
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
