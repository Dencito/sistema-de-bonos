import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';

const columns = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'ticket_id',
        render: (id) => `Ticket #${id}`,
    },
    {
        title: 'Usuario',
        key: 'user',
        render: (_, record) =>
            record.user?.first_name + ' ' + record.user?.first_last_name ||
            'N/A',
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
        title: 'Tipo',
        dataIndex: 'type',
        key: 'ticket_type',
    },
    {
        title: 'Monto Total',
        dataIndex: 'total_amount',
        key: 'ticket_amount',
        render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
    },
    {
        title: 'Fecha de Creación',
        dataIndex: 'created_at',
        key: 'ticket_created',
        render: (date) => new Date(date).toLocaleDateString(),
    },
];

export default function TicketPage({ auth, tickets }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="z-10 font-semibold text-xl text-gray-800 leading-tight">
                    Tickets
                </h2>
            }
        >
            <Head title="Tickets" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">Tickets</h1>
            </header>
            <div className="flex-1 overflow-auto p-4 z-10">
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <CustomTable
                            dataSource={tickets.map((ticket) => ({
                                ...ticket,
                                key: `ticket_${ticket.id}`,
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
