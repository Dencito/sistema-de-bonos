import { lazy, Suspense } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';

const LazyModalCreateProduct = lazy(
    () => import('@/Components/Products/ModalCreateProduct')
);
const LazyModalDeleteProduct = lazy(
    () => import('@/Components/Products/ModalDeleteProduct')
);
const LazyModalEditProduct = lazy(
    () => import('@/Components/Products/ModalEditProduct')
);

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
        render: (_, product) => product.price,
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
                    <LazyModalEditProduct data={product} />
                    <LazyModalDeleteProduct data={product} />
                </div>
            </Suspense>
        ),
    },
];

export default function ProductPage({ auth, products }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="z-10 text-xl font-semibold leading-tight text-gray-800">
                    Productos
                </h2>
            }
        >
            <Head title="Productos" />
            <header className="flex justify-between items-center p-4 bg-white shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">Productos</h1>
            </header>
            <div className="overflow-auto z-10 flex-1 p-4">
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="flex justify-end items-center my-3 text-gray-900">
                            <Suspense fallback={<LoadingFallback />}>
                                <LazyModalCreateProduct />
                            </Suspense>
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
