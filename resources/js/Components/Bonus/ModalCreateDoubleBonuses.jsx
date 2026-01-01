import { useState } from 'react';
import {
    Form,
    DatePicker,
    Modal,
    Select,
    Button,
    message,
    Spin,
} from 'antd';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { CustomButton } from '@components-v2/CustomButton';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ModalCreateDoubleBonuses({ branches }) {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const handleCreateDoubleBonuses = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const startDateTime = values.date_range?.[0]?.format(
                'YYYY-MM-DD HH:mm:ss'
            );
            const endDateTime = values.date_range?.[1]?.format(
                'YYYY-MM-DD HH:mm:ss'
            );

            const sendData = {
                branch_id: values.branch_id,
                start_datetime: startDateTime,
                end_datetime: endDateTime,
            };

            const response = await axios.post(
                route('bonuses.createDoubleBonuses'),
                sendData
            );

            if (response.data.success) {
                successMsg(
                    response.data.message ||
                        `Bonos dobles creados correctamente para ${response.data.count} jugadores`
                );
                router.visit(window.location.href, {
                    preserveState: true,
                });
                handleCloseModal();
            } else {
                errorMsg(
                    response.data.message || 'Error al crear los bonos dobles'
                );
            }
        } catch (error) {
            console.error('Error al crear bonos dobles:', error);
            if (error.response?.data?.message) {
                errorMsg(error.response.data.message);
            } else if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                errorMsg(errors.join(', '));
            } else {
                errorMsg('Error al crear los bonos dobles');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setLoading(false);
        form.resetFields();
    };

    return (
        <>
            <CustomButton
                onClick={() => setShowModal(true)}
                title="Crear Bonos Dobles"
                type="primary"
                style={{ marginRight: '10px' }}
            />
            <Modal
                title="Crear Bonos Dobles por Sucursal"
                open={showModal}
                onCancel={handleCloseModal}
                width={600}
                footer={[
                    <Button key="cancel" onClick={handleCloseModal}>
                        Cancelar
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handleCreateDoubleBonuses}
                    >
                        Crear Bono Adicional Doble
                    </Button>,
                ]}
            >
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical">
                        <div className="space-y-4">
                            <p className="text-gray-600 mb-4">
                                Esta función creará bonos dobles (basados en la
                                categoría de bono de cada usuario) para todos
                                los jugadores de la sucursal seleccionada.
                            </p>

                            <Form.Item
                                label="Sucursal"
                                name="branch_id"
                                rules={[
                                    {
                                        required: true,
                                        message: getValidationRequiredMessage(
                                            'La sucursal'
                                        ),
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Seleccione una sucursal"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children
                                            .toLowerCase()
                                            .indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {branches?.map((branch) => (
                                        <Option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Rango de Fechas (Inicio y Fin)"
                                name="date_range"
                                rules={[
                                    {
                                        required: true,
                                        message: getValidationRequiredMessage(
                                            'El rango de fechas'
                                        ),
                                    },
                                ]}
                            >
                                <RangePicker
                                    showTime
                                    format="DD-MM-YYYY HH:mm:ss"
                                    placeholder={[
                                        'Fecha de inicio',
                                        'Fecha de fin',
                                    ]}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                <strong>Nota:</strong> Se crearán bonos dobles
                                para todos los jugadores (role_id = 6) que
                                tengan asignada la sucursal seleccionada. El
                                monto del bono será el doble del monto base de
                                la categoría de bono de cada jugador.
                            </div>
                        </div>
                    </Form>
                </Spin>
            </Modal>
        </>
    );
}
