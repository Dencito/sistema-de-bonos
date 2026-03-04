import { lazy, Suspense, useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { Select } from 'antd';

const LazyModalCreateProduct = lazy(() => import('@/Components/Products/ModalCreateProduct'));
const LazyModalDeleteProduct = lazy(() => import('@/Components/Products/ModalDeleteProduct'));
const LazyModalEditProduct = lazy(() => import('@/Components/Products/ModalEditProduct'));

const LoadingFallback = () => <div className="p-2">Cargando...</div>;

const getStockColor = (quantity) => {
  if (quantity < 10) return 'bg-red-500';
  if (quantity >= 10 && quantity <= 30) return 'bg-amber-500';
  return 'bg-green-500';
};

const columns = [
  {
    title: 'Nombre',
    key: 'name',
    render: (_, product) => product.name,
  },
  {
    title: 'Código',
    key: 'code',
    render: (_, product) => product.code,
  },
  {
    title: 'Precio $',
    key: 'price',
    render: (_, product) => Intl.NumberFormat('en-US').format(Math.trunc(product.price)) || 'N/A',
  },
  {
    title: 'Stock',
    key: 'quantity',
    render: (_, product) => (
      <span className={`${getStockColor(product.quantity)} text-white px-2 py-1 rounded`}>
        {product.quantity}
      </span>
    ),
  },
  {
    title: 'Acciones',
    key: 'actions',
    render: (_, product) => (
      <Suspense fallback={<LoadingFallback />}>
        <div className="flex flex-wrap gap-3">
          <LazyModalEditProduct product={product} />
          <LazyModalDeleteProduct product={product} />
        </div>
      </Suspense>
    ),
  },
];

export default function ProductPage({ auth, products, branches }) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const userHasBranch = auth.user?.branch_id;

  const handleBranchChange = (value) => {
    setSelectedBranch(value);
    router.get(route('products.index'), value ? { branch_id: value } : {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const totalQuantity = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  }, [products]);

  const totalAmount = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.price * product.quantity || 0), 0);
  }, [products]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="z-10 text-xl font-semibold leading-tight text-gray-800">Productos</h2>}
    >
      <Head title="Productos" />
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="text-4xl font-bold">Productos</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Cantidad Total</div>
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('en-US').format(totalQuantity)}
          </div>
          <div className="mt-2 text-sm text-gray-600">Valor Total</div>
          <div className="text-2xl font-bold text-green-600">
            ${new Intl.NumberFormat('en-US').format(Math.trunc(totalAmount))}
          </div>
        </div>
      </header>
      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="flex gap-3 justify-between items-center my-3 text-gray-900">
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
                  <LazyModalCreateProduct branches={branches} />
                </Suspense>
              </div>
            </div>
            <CustomTable
              dataSource={products.map((product) => ({
                ...product,
                key: product.id,
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
