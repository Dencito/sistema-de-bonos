import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';

const columns = [
    {
        title: 'Usuario',
        key: 'user',
        render: (_, record) =>
            record.user?.first_name + ' ' + record.user?.first_last_name ||
            'N/A',
    },
    {
        title: 'Rol',
        key: 'role',
        render: (_, record) => record.user?.role?.name || 'N/A',
    },
    {
        title: 'Tótem',
        key: 'totem',
        render: (_, record) => record.totem?.name || 'N/A',
    },
    {
        title: 'Sucursal',
        key: 'branch',
        render: (_, record) => record.totem?.branch?.name || 'N/A',
    },
    {
        title: 'Fecha y Hora',
        dataIndex: 'created_at',
        key: 'fingerprint_created',
        render: (date) => {
            const dateObj = new Date(date);
            return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
        },
    },
];

export default function FingerprintLogPage({ auth, fingerprintLogs }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="z-10 font-semibold text-xl text-gray-800 leading-tight">
                    Registros de Huella
                </h2>
            }
        >
            <Head title="Registros de Huella" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">Registros de Huella</h1>
            </header>
            <div className="flex-1 overflow-auto p-4 z-10">
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <CustomTable
                            dataSource={fingerprintLogs.map((log) => ({
                                ...log,
                                key: `fingerprint_${log.id}`,
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
