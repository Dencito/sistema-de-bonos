import { MobileButton } from '@/Components/MobileButton';
import ModalViewBranchStates from '@/Components/States/ModalViewBranchStates';
import ModalViewUserStates from '@/Components/States/ModalViewUserStates';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Table } from 'antd';
const { Column } = Table;

export default function StatePage({ auth, states, alert }) {
    
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
