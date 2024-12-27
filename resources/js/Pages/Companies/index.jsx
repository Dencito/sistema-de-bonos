import { lazy, Suspense } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import FilterModal from '@/Components/Companies/FilterModal';

const LazyModalCreateCompany = lazy(() => import('@/Components/Companies/ModalCreateCompany'));
const LazyModalDeleteCompany = lazy(() => import('@/Components/Companies/ModalDeleteCompany'));
const LazyModalEditCompany = lazy(() => import('@/Components/Companies/ModalEditCompany'));
const LazyModalViewBranchesCompany = lazy(() => import('@/Components/Companies/ModalViewBranchesCompany'));
const LazyModalViewCompany = lazy(() => import('@/Components/Companies/ModalViewCompany'));

const LoadingFallback = () => <div className="p-2">Cargando...</div>;

const columns = [
    {
        title: "Nombre",
        dataIndex: "name",
        key: "id"
    },
    {
        title: "Dominio",
        dataIndex: "domain",
        key: "domain",
        render: (domain) => (
            <a 
                href={`https://${domain}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
            >
                {domain}
            </a>
        )
    },
    {
        title: "Rut",
        key: "rutVerification",
        render: (_, record) => `${record.rutNumbers}-${record.rutDv}`
    },
    {
        title: "Max. sucursales",
        dataIndex: "max_branches",
        key: "max_branches"
    },
    {
        title: "Sucursales",
        key: "branches",
        render: (_, company) => (
            <Suspense fallback={<LoadingFallback />}>
                <div className="flex flex-wrap gap-3">
                    <LazyModalViewBranchesCompany company={company.name} data={company.branches} />
                </div>
            </Suspense>
        )
    },
    {
        title: "Estado",
        key: "state",
        render: (_, company) => (
            <div className={`${company?.state?.name === 'Activo' && 'bg-green-300' ||
                company?.state?.name === 'Inactivo' && 'bg-red-200' ||
                company?.state?.name === 'En revisión' && 'bg-orange-300' ||
                company?.state?.name === 'Borrado' && 'bg-red-400'
                } font-bold rounded-full text-center p-1 w-6 h-6`}></div>
        )
    },
    {
        title: "Acciones",
        key: "actions",
        render: (_, company) => (
            <Suspense fallback={<LoadingFallback />}>
                <div className='flex flex-wrap gap-3'>
                    <LazyModalViewCompany data={company} />
                    <LazyModalEditCompany data={company} />
                    <LazyModalDeleteCompany data={company} />
                </div>
            </Suspense>
        )
    }
];

export default function CompanyPage({ auth, companies, statuses, filters }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="z-10 font-semibold text-xl text-gray-800 leading-tight">Empresas</h2>}
        >
            <Head title="Empresas" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className='text-4xl font-bold'>
                    Empresas
                </h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-between">
                            <FilterModal filters={filters} statuses={statuses}/>
                            <Suspense fallback={<LoadingFallback />}>
                                <LazyModalCreateCompany />
                            </Suspense>
                        </div>
                        <CustomTable 
                            dataSource={companies.map(company => ({ ...company, key: company.id }))}
                            columns={columns}
                            scroll={{ x: true }}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}