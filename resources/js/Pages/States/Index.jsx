import ModalCreateCompany from '@/Components/Companies/ModalCreateCompany';
import { MobileButton } from '@/Components/MobileButton';
import ModalCreateState from '@/Components/States/ModalCreateState';
import ModalDeleteState from '@/Components/States/ModalDeleteState';
import ModalEditState from '@/Components/States/ModalEditState';
import ModalViewBranchStates from '@/Components/States/ModalViewBranchStates';
import ModalViewUserStates from '@/Components/States/ModalViewUserStates';
import useBranchValidateSchedules from '@/Hooks/useBranchValidateSchedules';
import useCompanySelection from '@/Hooks/useCompanySelection';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Breadcrumb, Button, Select, Spin, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
const { Column, ColumnGroup, } = Table;

const index = ({ auth, states, alert }) => {
    const { companySelect, loading, changeCompany } = useCompanySelection();
    const canLogin = useBranchValidateSchedules(auth?.branch?.shifts);

    /* if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Head title="Estados" />
                <Spin size="large" />
            </div>
        );
    } */

    /* if (!canLogin && (auth?.role !== "Dueño" && auth?.role !== "Super Admin" && auth?.role !== "Admin")) {
        return <div className="flex justify-center items-center min-h-screen">
            <Head title="Estados" />
            <h1 className='text-3xl font-bold'>Usted esta fuera de su horario laboral</h1>
        </div>
    } */

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">panel</h2>}
        >
            <Head title="Sucursales" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className='text-4xl font-bold'>
                    Estados
                </h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-end">
                        </div>
                        <Table className='overflow-auto' dataSource={states.map(state => ({ ...state, key: state.id }))}>
                            <Column title="Nombre" dataIndex="name" key="id" />
                            <Column
                                title="Acciones"
                                key="actions"
                                render={(_, state) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewUserStates data={state.users} state={state.name} />
                                        <ModalViewBranchStates data={state.branches} state={state.name} />
                                        {/* <ModalEditState data={State} />
                                        <ModalDeleteState data={State}/> */}
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