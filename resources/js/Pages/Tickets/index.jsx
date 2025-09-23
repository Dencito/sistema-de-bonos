import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { useState, useEffect } from 'react';
import { Button, DatePicker, Form, Select, Space, Card } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { format } from 'date-fns';

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
        render: (date) => {
            const dateObj = new Date(date);
            return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
        },
    },
];

export default function TicketPage({ auth, tickets, users, branches, totems, filters }) {
    const { data, setData, get, processing } = useForm({
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        user_id: filters?.user_id || '',
        type: filters?.type || '',
        branch_id: filters?.branch_id || '',
        per_page: filters?.per_page || 25,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Initialize dates properly when component loads
    useEffect(() => {
        // Set default date range if none provided (last 7 days)
        if (!data.start_date && !data.end_date) {
            // Get current date
            const today = dayjs();
            
            // Create end date (today)
            const end = today.format('YYYY-MM-DD');
            
            // Create start date (7 days ago)
            const start = today.subtract(7, 'day').format('YYYY-MM-DD');
            
            setData({
                ...data,
                start_date: start,
                end_date: end
            });
            
            console.log('Default date range set:', start, 'to', end);
        }
    }, []);
    
    const ticketTypes = [
        { value: 'Bono Extraordinario', label: 'Bono Extraordinario' },
        { value: 'Bono Cumpleaños', label: 'Bono Cumpleaños' },
        { value: 'Bono diario', label: 'Bono diario' },
    ];

    const handleSearch = () => {
        get(route('tickets.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setData({
            start_date: '',
            end_date: '',
            user_id: '',
            type: '',
            branch_id: '',
            per_page: 25,
        });
        get(route('tickets.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page, pageSize) => {
        setData('per_page', pageSize);
        get(route('tickets.index', { page }), {
            preserveState: true,
            replace: true,
        });
    };

    // Función para exportar a Excel
    const exportToExcel = async () => {
        setExporting(true);
        try {
            // Preparar los parámetros de filtrado
            const params = {};
            
            if (data.start_date) {
                params.start_date = data.start_date;
            }
            
            if (data.end_date) {
                params.end_date = data.end_date;
            }
            
            if (data.user_id) {
                params.user_id = data.user_id;
            }
            
            if (data.type) {
                params.type = data.type;
            }
            
            if (data.branch_id) {
                params.branch_id = data.branch_id;
            }
            
            // Llamar al endpoint de exportación
            const response = await axios.get(route('tickets.export'), { params });
            
            // Crear el contenido CSV
            let csvContent = 'ID,Usuario,Sucursal,Tipo,Monto Total,Fecha de Creación\n';
            
            // Agregar filas de datos
            response.data.tickets.forEach(ticket => {
                const row = [
                    `Ticket #${ticket.id}`,
                    `${ticket.user?.first_name || ''} ${ticket.user?.first_last_name || ''}`,
                    ticket.totem?.branch?.name || 'N/A',
                    ticket.type,
                    `$${Math.floor(ticket.total_amount)}`,
                    format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm:ss')
                ];
                csvContent += row.join(',') + '\n';
            });
            
            // Agregar resumen
            csvContent += '\nResumen\n';
            csvContent += `Fecha Inicial,${data.start_date}\n`;
            csvContent += `Fecha Final,${data.end_date}\n`;
            csvContent += `Total Tickets,${response.data.summary.total_tickets}\n`;
            csvContent += `Monto Total,$${Math.floor(response.data.summary.total_amount)}\n`;
            
            // Agregar resumen por tipo de ticket
            csvContent += '\nTipo de Ticket,Cantidad,Monto\n';
            Object.entries(response.data.summary.ticket_types).forEach(([type, data]) => {
                csvContent += `${type},${data.count},$${Math.floor(data.amount)}\n`;
            });
            
            // Agregar resumen por sucursal
            csvContent += '\nSucursal,Cantidad,Monto\n';
            Object.entries(response.data.summary.by_branch).forEach(([branch, data]) => {
                csvContent += `${branch},${data.total},$${Math.floor(data.amount)}\n`;
            });
            
            // Crear y descargar el archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `tickets_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Error al exportar tickets:', error);
            alert('Error al exportar los tickets. Por favor intente nuevamente.');
        } finally {
            setExporting(false);
        }
    };

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
                    <div className="mb-4 flex justify-between">
                        <div>
                            <Button 
                                type="primary" 
                                icon={<FilterOutlined />} 
                                onClick={() => setShowFilters(!showFilters)}
                                className="mr-2"
                            >
                                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                            </Button>
                        </div>
                        <div>
                            <Button 
                                type="primary" 
                                icon={<DownloadOutlined />} 
                                onClick={exportToExcel}
                                loading={exporting}
                            >
                                Exportar a Excel
                            </Button>
                        </div>
                    </div>

                    {showFilters && (
                        <Card className="mb-4">
                            <Form layout="vertical">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Form.Item label="Fecha Inicio">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.start_date ? dayjs(data.start_date) : null}
                                            onChange={(date, dateString) => setData('start_date', dateString)}
                                            placeholder="Seleccione fecha inicio"
                                        />
                                    </Form.Item>
                                    <Form.Item label="Fecha Fin">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.end_date ? dayjs(data.end_date) : null}
                                            onChange={(date, dateString) => setData('end_date', dateString)}
                                            placeholder="Seleccione fecha fin"
                                        />
                                    </Form.Item>
                                    <Form.Item label="Usuario">
                                        <Select
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="Seleccione usuario"
                                            optionFilterProp="children"
                                            value={data.user_id || undefined}
                                            onChange={(value) => setData('user_id', value)}
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            allowClear
                                        >
                                            {users?.map((user) => (
                                                <Select.Option key={user.id} value={user.id}>
                                                    {user.first_name} {user.first_last_name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Tipo de Ticket">
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Seleccione tipo"
                                            value={data.type || undefined}
                                            onChange={(value) => setData('type', value)}
                                            allowClear
                                        >
                                            {ticketTypes.map((type) => (
                                                <Select.Option key={type.value} value={type.value}>
                                                    {type.label}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Sucursal">
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Seleccione sucursal"
                                            value={data.branch_id || undefined}
                                            onChange={(value) => setData('branch_id', value)}
                                            allowClear
                                        >
                                            {branches?.map((branch) => (
                                                <Select.Option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Registros por página">
                                        <Select
                                            style={{ width: '100%' }}
                                            value={data.per_page}
                                            onChange={(value) => setData('per_page', value)}
                                        >
                                            <Select.Option value={10}>10</Select.Option>
                                            <Select.Option value={25}>25</Select.Option>
                                            <Select.Option value={50}>50</Select.Option>
                                            <Select.Option value={100}>100</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button onClick={handleClearFilters}>Limpiar</Button>
                                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={processing}>
                                        Buscar
                                    </Button>
                                </div>
                            </Form>
                        </Card>
                    )}

                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <CustomTable
                            dataSource={tickets.data?.map((ticket) => ({
                                ...ticket,
                                key: `ticket_${ticket.id}`,
                            })) || []}
                            columns={columns}
                            scroll={{ x: true }}
                            pagination={{
                                current: tickets.current_page,
                                pageSize: parseInt(data.per_page),
                                total: tickets.total,
                                onChange: handlePageChange,
                                showSizeChanger: false,
                            }}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
