import MobileButton from '@/Components/MobileButton';
import ModalViewBranchStatuses from '@/Components/Statuses/ModalViewBranchStatuses';
import ModalViewUserStatuses from '@/Components/Statuses/ModalViewUserStatuses';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Table } from 'antd';

export default function StatusPage({ auth, statuses }) {
    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'id',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, status) => (
                <div className="flex flex-wrap gap-3">
                    <ModalViewUserStatuses
                        data={status.users}
                        status={status.name}
                    />
                    <ModalViewBranchStatuses
                        data={status.branches}
                        status={status.name}
                    />
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    panel
                </h2>
            }
        >
            <Head title="Estados" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">Estados</h1>
            </header>
            <div className="flex-1 overflow-auto p-4 z-10">
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-end"></div>
                        <Table
                            dataSource={statuses.map((status) => ({
                                ...status,
                                key: status.id,
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
