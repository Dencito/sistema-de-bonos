import ModalCreateCategoryBono from '@/Components/CategoriesBonus/ModalCreateCategoryBono';
import ModalDeleteCategoryBono from '@/Components/CategoriesBonus/ModalDeleteCategoryBono';
import ModalEditCategoryBono from '@/Components/CategoriesBonus/ModalEditCategoryBono';
import ModalViewCategoryBono from '@/Components/CategoriesBonus/ModalViewCategoryBono';
import ModalViewUserCategories from '@/Components/CategoriesBonus/ModalViewUserCategories';
import ModalCreateCompany from '@/Components/Companies/ModalCreateCompany';
import { MobileButton } from '@/Components/MobileButton';
import useBranchValidateSchedules from '@/Hooks/useBranchValidateSchedules';
import useCompanySelection from '@/Hooks/useCompanySelection';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Breadcrumb, Button, Input, Select, Spin, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
const { Column, ColumnGroup, } = Table;

const index = ({ auth, categoriesBonus, filters, alert }) => {
    const { companySelect, loading, changeCompany } = useCompanySelection();
    const canLogin = useBranchValidateSchedules(auth?.branch?.shifts);
    const { data, setData, get } = useForm({
        name: filters?.name || '',
        state: filters?.state || ''
    });

    const handleFilter = () => {
        get(route('companies.index'));
    };

    /* if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Head title="Categorias de bonos" />
                <Spin size="large" />
            </div>
        );
    } */

    /* if (!canLogin && (auth?.role !== "Dueño" && auth?.role !== "Super Admin" && auth?.role !== "Admin")) {
        return <div className="flex justify-center items-center min-h-screen">
            <Head title="Categorias de bonos" />
            <h1 className='text-3xl font-bold'>Usted esta fuera de su horario laboral</h1>
        </div>
    } */
    const role = auth.role
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
        >
            <Head title="Categorias de bonos" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className='text-4xl font-bold'>
                    Categoria de bonos
                </h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-end">
                            {
                                (role === 'Dueño' ||
                                    role === 'Super Admin')
                                &&
                                <ModalCreateCategoryBono />
                            }
                        </div>

                        <Table className='overflow-auto' dataSource={categoriesBonus.map(categoryBonus => ({ ...categoryBonus, key: categoryBonus.id }))}>
                            <Column title="Nombre" dataIndex="name" key="id" />
                            <Column
                                title="Usuarios"
                                key="quantity"
                                render={(_, category) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <p>{category.users.length}</p>
                                    </div>
                                )}
                            />
                            {/* <Column title="Rut" dataIndex="rutNumbers" render={(_, record) => `${record.rutNumbers}-${record.rutDv}`} key="rutVerification" />
                            <Column
                                title="Sucursales"
                                key="branches"
                                render={(_, company) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewBranchesCompany company={company.name} data={company.branches} />
                                    </div>
                                )}
                            />
                            <Column title="Estado" key="state" render={(_, companie) => (
                                <p className={`${companie.state.name === 'Activo' && 'bg-green-300' ||
                                    companie.state.name === 'Inactivo' && 'bg-red-200' ||
                                    companie.state.name === 'En revisión' && 'bg-orange-300' ||
                                    companie.state.name === 'Borrado' && 'bg-red-400'
                                    } font-bold rounded-lg text-center p-1`}>{companie.state.name}</p>
                            )} /> */}
                            <Column
                                title="Acciones"
                                key="actions"
                                render={(_, category) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewUserCategories data={category.users} category={category.name} />
                                        <ModalViewCategoryBono data={category} />
                                        <ModalEditCategoryBono data={category} />
                                        <ModalDeleteCategoryBono data={category} />
                                        {/* {company.db_name && <ModalChangeCompany data={company} />} */}
                                    </div>
                                )}
                            />

                        </Table>
                        {/* <Typography>
                            <pre>{JSON.stringify(companies, null, 2)}</pre>
                        </Typography> */}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    )
}

export default index