import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { useState, useEffect } from 'react';
import { Button, DatePicker, Form, Select, Space, Card } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

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
        shift_id: filters?.shift_id || '',
        per_page: filters?.per_page || 25,
    });

    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        get(route('fingerprint-logs.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setData({
            start_date: '',
            end_date: '',
            user_id: '',
            role_id: '',
            branch_id: '',
            shift_id: '',
            per_page: 25,
        });
        get(route('fingerprint-logs.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page, pageSize) => {
        setData('per_page', pageSize);
        get(route('fingerprint-logs.index', { page }), {
            preserveState: true,
            replace: true,
        });
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
                    <div className="mb-4">
                        <Button 
                            type="primary" 
                            icon={<FilterOutlined />} 
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        </Button>
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
                                            value={data.shift_id || undefined}
                                            onChange={(value) => {
                                                // Al seleccionar un turno, limpiar las fechas
                                                setData({
                                                    ...data,
                                                    shift_id: value,
                                                    start_date: '',
                                                    end_date: ''
                                                });
                                            }}
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            allowClear
                                            onClear={() => setData('shift_id', '')}
                                        >
                                            {shifts?.map((shift) => (
                                                <Select.Option key={shift.id} value={shift.id}>
                                                    {shift.display_name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Al seleccionar un turno, se ignorarán los filtros de fecha
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Fecha Inicio">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.start_date ? new Date(data.start_date) : null}
                                            onChange={(date, dateString) => {
                                                // Al seleccionar una fecha, limpiar el turno
                                                setData({
                                                    ...data,
                                                    start_date: dateString,
                                                    shift_id: ''
                                                });
                                            }}
                                            placeholder="Seleccione fecha inicio"
                                            disabled={!!data.shift_id}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Fecha Fin">
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={data.end_date ? new Date(data.end_date) : null}
                                            onChange={(date, dateString) => {
                                                // Al seleccionar una fecha, limpiar el turno
                                                setData({
                                                    ...data,
                                                    end_date: dateString,
                                                    shift_id: ''
                                                });
                                            }}
                                            placeholder="Seleccione fecha fin"
                                            disabled={!!data.shift_id}
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
