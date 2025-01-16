import { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { branchService } from '@services/api';

export default function ModalRequestMoreBranches() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const onCreate = async (values) => {
        try {
            setLoading(true);
            const response = await branchService.requestMore(values);
            if (response.success) {
                successMsg(response.message);
                router.visit('/branches', {
                    preserveState: true,
                });
                handleCloseModal();
            } else {
                errorMsg(response.message);
            }
        } catch {
            errorMsg('Error al solicitar más sucursales');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setLoading(false);
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const onlyNumberInput = (e) => {
        form.setFieldsValue({
            [e.target.name]: e.target.value.replace(/\D/g, ''),
        });
    };

    return (
        <>
            <Button onClick={handleOpenModal} className="my-5">
                Solicitar mas sucursales
            </Button>
            <Modal
                style={{ top: 20 }}
                title={
                    <p className="text-bold text-3xl">Solicitar sucursales</p>
                }
                open={showModal}
                onCancel={() =>
                    !loading &&
                    Modal.confirm({
                        title: '¿Estás seguro de que quieres salir?',
                        content: 'Se borrarán todos los datos no guardados.',
                        okText: 'Sí',
                        okType: 'danger',
                        cancelText: 'No',
                        onOk() {
                            handleCloseModal();
                        },
                    })
                }
                okText="Solicitar"
                cancelText="Cancelar"
                okButtonProps={{
                    autoFocus: true,
                    htmlType: 'submit',
                    loading: loading, // Estado de carga del botón
                    disabled: loading, // Deshabilitar cuando está cargando
                }}
                cancelButtonProps={{
                    disabled: loading, // Deshabilitar cuando está cargando
                }}
                destroyOnClose={() =>
                    Modal.confirm({
                        title: '¿Estás seguro de que quieres salir?',
                        content: 'Se borrarán todos los datos no guardados.',
                        okText: 'Sí',
                        okType: 'danger',
                        cancelText: 'No',
                        onOk() {
                            handleCloseModal();
                        },
                    })
                }
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        initialValues={{
                            modifier: 'public',
                        }}
                        disabled={loading}
                        clearOnDestroy
                        onFinish={(values) => onCreate(values)}
                    >
                        {dom}
                    </Form>
                )}
            >
                <Form.Item
                    name="qty"
                    label="Cantidad de sucursales"
                    rules={[
                        {
                            required: true,
                            message: getValidationRequiredMessage,
                        },
                    ]}
                >
                    <Input
                        name="branchAddressNumber"
                        onChange={onlyNumberInput}
                        showCount
                        maxLength={6}
                    />
                </Form.Item>
            </Modal>
        </>
    );
}
