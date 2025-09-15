import { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Modal, Select, Table, Button, Spin, message } from 'antd';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { CustomButton } from '@components-v2/CustomButton';
import { bonusService, userService } from '@services/api';
import { SearchOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/Utils/date';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ModalCreateCustomBonus() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bonusType, setBonusType] = useState('daily');

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const columns = [
        {
            title: 'Nombre',
            key: 'name',
            render: (_, user) => (
                <span>
                    {user?.first_name} {user?.second_name} {user?.first_last_name} {user?.second_last_name}
                </span>
            ),
        },
        {
            title: 'RUT/Código',
            key: 'rut',
            render: (_, user) => (
                <span>
                    {user?.rutNumbers && user?.rutDv ? `${user.rutNumbers}-${user.rutDv}` : user?.code}
                </span>
            ),
        },
        {
            title: 'Bonos Diarios',
            dataIndex: 'daily_bonuses_count',
            key: 'daily_bonuses_count',
        },
        {
            title: 'Última Marca',
            key: 'last_fingerprint',
            render: (_, user) => (
                <span>
                    {formatDateTime(user?.fingerprint_logs?.[0]?.created_at, 'dd/MM/yyyy HH:mm')}
                </span>
            ),
        }
    ];

    const rowSelection = {
        selectedRowKeys: selectedUsers.map(user => user.id),
        onChange: (selectedRowKeys, selectedRows) => {
            setSelectedUsers(selectedRows);
        },
    };

    const handleSearch = async () => {
        try {
            setSearching(true);
            const values = await form.validateFields(['date_range', 'bonus_count', 'bonus_type']);
            
            const dateRange = values.date_range;
            const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
            const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
            const bonusCount = values.bonus_count;
            const bonusType = values.bonus_type;

            // Llamada al API para buscar usuarios según los criterios
            const response = await userService.filterByBonus({
                start_date: startDate,
                end_date: endDate,
                bonus_count: bonusCount,
                bonus_type: bonusType
            });

            if (response.success) {
                setUsers(response.data.users || []);
                message.success(`Se encontraron ${(response.data.users || []).length} usuarios`);
            } else {
                message.error(response.message || 'Error al buscar usuarios');
                setUsers([]);
            }
        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            message.error('Error al buscar usuarios: ' + (error.message || 'Error desconocido'));
            setUsers([]);
        } finally {
            setSearching(false);
        }
    };

    const handleCreateBonuses = async () => {
        if (selectedUsers.length === 0) {
            message.warning('Debe seleccionar al menos un usuario');
            return;
        }

        try {
            setLoading(true);
            const values = await form.validateFields(['amount', 'start_datetime', 'end_datetime']);
            
            const startDateTime = values.start_datetime?.format('YYYY-MM-DD HH:mm:ss');
            const endDateTime = values.end_datetime?.format('YYYY-MM-DD HH:mm:ss');
            
            const userIds = selectedUsers.map(user => user.id);
            
            const response = await bonusService.createMultiple({
                user_ids: userIds,
                amount: values.amount,
                start_datetime: startDateTime,
                end_datetime: endDateTime
            });

            if (response.success) {
                successMsg(`Bonos creados correctamente para ${userIds.length} usuarios`);
                router.visit(window.location.href, {
                    preserveState: true,
                });
                handleCloseModal();
            } else {
                errorMsg(response.message || 'Error al crear los bonos');
            }
        } catch (error) {
            console.error('Error al crear bonos:', error);
            errorMsg('Error al crear los bonos');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setLoading(false);
        setSearching(false);
        setUsers([]);
        setSelectedUsers([]);
        form.resetFields();
    };

    return (
        <>
            <CustomButton
                onClick={() => setShowModal(true)}
                title="Crear Bonos Personalizados"
                type="primary"
                style={{ marginRight: '10px' }}
            />
            <Modal
                title="Crear Bonos Personalizados"
                open={showModal}
                onCancel={handleCloseModal}
                width={800}
                footer={[
                    <Button key="cancel" onClick={handleCloseModal}>
                        Cancelar
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handleCreateBonuses}
                        disabled={selectedUsers.length === 0}
                    >
                        Crear Bonos ({selectedUsers.length})
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical">
                    <div className="border-b pb-4 mb-4">
                        <h3 className="text-lg font-semibold mb-3">Filtrar Usuarios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Form.Item
                                label="Tipo de Bono"
                                name="bonus_type"
                                rules={[
                                    {
                                        required: true,
                                        message: getValidationRequiredMessage('El tipo de bono'),
                                    },
                                ]}
                                initialValue="daily"
                            >
                                <Select
                                    placeholder="Seleccione tipo de bono"
                                    onChange={(value) => setBonusType(value)}
                                >
                                    <Option value="daily">Bonos Diarios</Option>
                                    <Option value="all">Todos los Bonos</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Cantidad de Bonos"
                                name="bonus_count"
                                rules={[
                                    {
                                        required: true,
                                        message: getValidationRequiredMessage('La cantidad de bonos'),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Ej: 5"
                                    type="number"
                                    min="1"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Rango de Fechas"
                                name="date_range"
                                rules={[
                                    {
                                        required: true,
                                        message: getValidationRequiredMessage('El rango de fechas'),
                                    },
                                ]}
                            >
                                <RangePicker
                                    style={{ width: '100%' }}
                                    format="DD-MM-YYYY"
                                />
                            </Form.Item>
                        </div>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={searching}
                        >
                            Buscar Usuarios
                        </Button>
                    </div>

                    {users.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-3">Usuarios Encontrados ({users.length})</h3>
                            <Table
                                rowSelection={rowSelection}
                                columns={columns}
                                dataSource={users.map(user => ({ ...user, key: user.id }))}
                                size="small"
                                pagination={{ pageSize: 5 }}
                                scroll={{ y: 240 }}
                            />
                        </div>
                    )}

                    {selectedUsers.length > 0 && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-3">Configuración del Bono</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Form.Item
                                    label="Monto"
                                    name="amount"
                                    rules={[
                                        {
                                            required: true,
                                            message: getValidationRequiredMessage('El monto'),
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (value < 1) {
                                                    return Promise.reject(
                                                        'El monto debe ser mayor o igual a 1'
                                                    );
                                                }
                                                if (value > 9999999.99) {
                                                    return Promise.reject(
                                                        'El monto no puede ser mayor a $9.999.999,99'
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="Ingrese el monto"
                                        type="number"
                                        min="0"
                                        max="9999999.99"
                                        step="0.01"
                                        onKeyPress={(e) => {
                                            if (!/[\d.]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item label="Fecha de inicio" name="start_datetime">
                                    <DatePicker
                                        showTime
                                        format="DD-MM-YYYY HH:mm:ss"
                                        placeholder="Seleccione fecha de inicio"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>

                                <Form.Item label="Fecha de fin" name="end_datetime">
                                    <DatePicker
                                        showTime
                                        format="DD-MM-YYYY HH:mm:ss"
                                        placeholder="Seleccione fecha de fin"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>
        </>
    );
}
