import { MobileButton } from '@/Components/MobileButton';
import ModalViewRole from '@/Components/Roles/ModalViewRole';
import useBranchValidateSchedules from '@/Hooks/useBranchValidateSchedules';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Table } from 'antd';
const { Column } = Table;

export default function RolePage({ auth, roles }) {
    const canLogin = useBranchValidateSchedules(auth?.branch?.shifts);

    if (!canLogin && (auth?.role !== "Dueño" && auth?.role !== "Super Admin" && auth?.role !== "Admin")) {
        return <div className="flex justify-center items-center min-h-screen">
            <Head title="Roles" />
            <h1 className='text-3xl font-bold'>Usted esta fuera de su horario laboral</h1>
        </div>
    }

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
                    Roles
                </h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-end">
                        </div>
                        <Table className='overflow-auto' dataSource={roles.map(role => ({ ...role, key: role.id }))}>
                            <Column title="Nombre" dataIndex="name" key="id" />
                            <Column
                                title="Acciones"
                                key="actions"
                                render={(_, role) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewRole data={role} />
                                    </div>
                                )}
                            />
                        </Table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}