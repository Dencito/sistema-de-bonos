import { useState } from 'react';
import { Form, Input, DatePicker, Modal } from 'antd';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { CustomButton } from '@components-v2/CustomButton';
import { bonusService } from '@services/api';

export default function ModalCreateBonus({ data }) {
    if (!data) return null;
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const onCreate = async () => {
        try {
            const values = await form.validateFields();

            setLoading(true);
            const sendData = {
                amount: values.amount,
                user_id: data.id,
            };

            const response = await bonusService.create(sendData);
            if (response.success) {
                successMsg(response.message);
                router.visit(window.location.href, {
                    preserveState: true,
                });
                form.resetFields();
                handleCloseModal();
            } else {
                errorMsg(response.message);
            }
        } catch {
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
                title="Crear bono"
                type="primary"
            />
            <Modal
                title="Crear Bono"
                open={showModal}
                onCancel={handleCloseModal}
                onOk={onCreate}
                confirmLoading={loading}
                okText="Crear"
                cancelText="Cancelar"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Monto"
                        name="amount"
                        rules={[
                            {
                                required: true,
                                message:
                                    getValidationRequiredMessage('El monto'),
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
                </Form>
            </Modal>
        </>
    );
}
