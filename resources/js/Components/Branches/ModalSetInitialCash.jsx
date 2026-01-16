import React, { useState } from 'react';
import { Modal, Button, InputNumber, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function ModalSetInitialCash({ branch }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialValue, setInitialValue] = useState('');
    const [loading, setLoading] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setInitialValue('');
    };

    const handleSubmit = async () => {
        if (!initialValue || initialValue <= 0) {
            message.error('Ingrese un valor inicial válido');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/cash-management/admin/set-initial-value', {
                branch_id: branch.id,
                admin_initial_value: initialValue,
            });

            if (response.data.success) {
                message.success('Valor inicial de caja establecido correctamente');
                setIsModalOpen(false);
                setInitialValue('');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Error al establecer valor inicial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={showModal}
                style={{ backgroundColor: '#52c41a' }}
            >
                Valor Inicial Caja
            </Button>

            <Modal
                title={`Establecer Valor Inicial de Caja - ${branch.name}`}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={handleCancel}
                okText="Establecer Valor"
                cancelText="Cancelar"
                confirmLoading={loading}
            >
                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <p style={{ marginBottom: 10, fontWeight: 'bold' }}>
                        Valor Inicial de Caja:
                    </p>
                    <p style={{ marginBottom: 15, fontSize: '12px', color: '#666' }}>
                        Este valor solo puede establecerse cuando la caja está vacía (sin saldo anterior ni turnos activos).
                    </p>
                    <InputNumber
                        style={{ width: '100%' }}
                        value={initialValue}
                        onChange={setInitialValue}
                        placeholder="Ingrese el valor inicial"
                        min={0}
                        precision={0}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={value => value.replace(/\$\s?|(\.*)/g, '')}
                    />
                </div>
            </Modal>
        </>
    );
}
