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

export default function FingerprintLogPage({ auth, fingerprintLogs, users, branches, totems, shifts, filters }) {
    const { data, setData, get, processing } = useForm({
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        user_id: filters?.user_id || '',
        role_id: filters?.role_id || '',
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
        }
    }, []);

    const handleSearch = () => {
        // Filtrar parámetros vacíos antes de enviar
        const params = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
        
        get(route('fingerprint-logs.index', params), {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        const clearedData = {
            start_date: '',
            end_date: '',
            user_id: '',
            role_id: '',
            branch_id: '',
            per_page: 25,
        };
        setData(clearedData);
        
        // Solo enviar per_page
        get(route('fingerprint-logs.index', { per_page: 25 }), {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page, pageSize) => {
        setData('per_page', pageSize);
        
        // Filtrar parámetros vacíos antes de enviar
        const params = Object.fromEntries(
            Object.entries({ ...data, per_page: pageSize, page }).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
        
        get(route('fingerprint-logs.index', params), {
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

            if (data.role_id) {
                params.role_id = data.role_id;
            }

            if (data.branch_id) {
                params.branch_id = data.branch_id;
            }

            // Llamar al endpoint de exportación
            const response = await axios.get(route('fingerprint-logs.export'), { params });

            // Crear el contenido CSV
            let csvContent = 'Usuario,Rol,Tótem,Sucursal,Fecha y Hora\n';

            // Agregar filas de datos
            response.data.fingerprintLogs.forEach(log => {
                const row = [
                    `${log.user?.first_name || ''} ${log.user?.first_last_name || ''}`,
                    log.user?.role?.name || 'N/A',
                    log.totem?.name || 'N/A',
                    log.totem?.branch?.name || 'N/A',
                    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')
                ];
                csvContent += row.join(',') + '\n';
            });

            // Agregar resumen
            csvContent += '\nResumen\n';
            csvContent += `Fecha Inicial,${data.start_date}\n`;
            csvContent += `Fecha Final,${data.end_date}\n`;
            csvContent += `Total Registros,${response.data.summary.total_logs}\n`;

            // Agregar resumen por sucursal
            csvContent += '\nSucursal,Cantidad\n';
            Object.entries(response.data.summary.by_branch).forEach(([branch, count]) => {
                csvContent += `${branch},${count}\n`;
            });

            // Agregar resumen por rol
            csvContent += '\nRol,Cantidad\n';
            Object.entries(response.data.summary.by_role).forEach(([role, count]) => {
                csvContent += `${role},${count}\n`;
            });

            // Crear y descargar el archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `registros_huella_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error al exportar registros:', error);
            alert('Error al exportar los registros. Por favor intente nuevamente.');
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
                                    <Form.Item label="Turno">
                                        <Select
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="Seleccione turno"
                                            optionFilterProp="children"
                                            value={undefined}
                                            onChange={(value) => {
                                                if (value) {
                                                    // Buscar el turno seleccionado
                                                    const selectedShift = shifts.find(s => s.id === value);
                                                    if (selectedShift) {
                                                        // Establecer las fechas del turno CON HORA
                                                        const startDate = dayjs(selectedShift.opening_time).format('YYYY-MM-DD HH:mm:ss');
                                                        const endDate = selectedShift.closing_time 
                                                            ? dayjs(selectedShift.closing_time).format('YYYY-MM-DD HH:mm:ss')
                                                            : dayjs().format('YYYY-MM-DD HH:mm:ss');
                                                        
                                                        setData({
                                                            ...data,
                                                            start_date: startDate,
                                                            end_date: endDate,
                                                            branch_id: selectedShift.branch_id || data.branch_id
                                                        });
                                                    }
                                                }
                                            }}
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            allowClear
                                        >
                                            {shifts?.map((shift) => (
                                                <Select.Option key={shift.id} value={shift.id}>
                                                    {shift.display_name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Al seleccionar un turno, se establecerán automáticamente las fechas
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Fecha Inicio">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.start_date ? dayjs(data.start_date) : null}
                                            onChange={(date, dateString) => {
                                                setData('start_date', dateString);
                                            }}
                                            placeholder="Seleccione fecha inicio"
                                        />
                                    </Form.Item>
                                    <Form.Item label="Fecha Fin">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.end_date ? dayjs(data.end_date) : null}
                                            onChange={(date, dateString) => {
                                                setData('end_date', dateString);
                                            }}
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
                                            onChange={(value) => setData('user_id', value || '')}
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
                                    <Form.Item label="Sucursal">
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Seleccione sucursal"
                                            value={data.branch_id || undefined}
                                            onChange={(value) => setData('branch_id', value || '')}
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
                            dataSource={fingerprintLogs.data?.map((log) => ({
                                ...log,
                                key: `fingerprint_${log.id}`,
                            })) || []}
                            columns={columns}
                            scroll={{ x: true }}
                            pagination={{
                                current: fingerprintLogs.current_page,
                                pageSize: parseInt(data.per_page),
                                total: fingerprintLogs.total,
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