import ModalCreateCompany from '@/Components/Companies/ModalCreateCompany';
import ModalDeleteCompany from '@/Components/Companies/ModalDeleteCompany';
import ModalEditCompany from '@/Components/Companies/ModalEditCompany';
import ModalViewBranchesCompany from '@/Components/Companies/ModalViewBranchesCompany';
import ModalViewCompany from '@/Components/Companies/ModalViewCompany';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@/components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import FilterModal from '@/Components/Companies/FilterModal';

const columns = [
    {
        title: "Nombre",
        dataIndex: "name",
        key: "id"
    },
    {
        title: "Dominio",
        dataIndex: "domain",
        key: "domain"
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
            <div className="flex flex-wrap gap-3">
                <ModalViewBranchesCompany data={company} />
                <ModalViewCompany data={company} />
                <ModalEditCompany data={company} />
                <ModalDeleteCompany data={company} />
            </div>
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
            <div className='flex flex-wrap gap-3'>
                <ModalViewCompany data={company} />
                <ModalEditCompany data={company} />
                <ModalDeleteCompany data={company} />
            </div>
        )
    }
];

export default function CompanyPage({ auth, companies, states, filters }) {
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
                            <FilterModal filters={filters} states={states}/>
                            <ModalCreateCompany />
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