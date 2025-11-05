import { useState } from 'react';
import { Button, Form, Input, Modal, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { productService } from '@services/api';

export default function ModalCreateProduct() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const onCreate = async (values) => {
        try {
            setLoading(true);
            const response = await productService.create(values);
            successMsg(response.message);
            handleCloseModal();
            router.reload();
        } catch (error) {
            errorMsg(
                error?.response?.data?.message || 'Error al crear el producto.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleOpenModal}
                className="mx-2"
                type="primary"
                icon={<PlusOutlined />}
            >
                Crear Producto
            </Button>
            <Modal
                style={{ top: 20 }}
                title={<p className="text-3xl text-bold">Crear producto</p>}
                confirmLoading={loading}
                zIndex={20}
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
                okText="Crear"
                cancelText="Cancelar"
                okButtonProps={{
                    autoFocus: true,
                    htmlType: 'submit',
                }}
                destroyOnClose={() =>
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
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        disabled={loading}
                        className="z-40"
                        clearOnDestroy
                        onFinish={(values) => onCreate(values)}
                        onFinishFailed={() =>
                            errorMsg('Verifica todos los campos')
                        }
                    >
                        {loading && (
                            <Spin
                                size="large"
                                tip={
                                    <div className="flex flex-col justify-center items-center">
                                        <p className="text-2xl text-bold">
                                            Creando producto
                                        </p>
                                    </div>
                                }
                                fullscreen
                            />
                        )}
                        {dom}
                    </Form>
                )}
            >
                <Form.Item
                    name="name"
                    label="Nombre"
                    rules={[
                        {
                            required: true,
                            message: getValidationRequiredMessage,
                        },
                    ]}
                >
                    <Input showCount maxLength={255} />
                </Form.Item>
                <Form.Item
                    name="code"
                    label="Código"
                    rules={[
                        {
                            required: true,
                            message: getValidationRequiredMessage,
                        },
                    ]}
                >
                    <Input showCount maxLength={255} />
                </Form.Item>
                <Form.Item
                    name="stock"
                    label="Stock"
                    rules={[
                        {
                            required: true,
                            message: getValidationRequiredMessage,
                        },
                        {
                            type: 'number',
                            min: 0,
                            message: 'La cantidad debe ser mayor o igual a 0.',
                        },
                    ]}
                >
                    <Input type="number" min="0" />
                </Form.Item>
                <Form.Item
                    name="price"
                    label="Precio"
                    rules={[
                        {
                            required: true,
                            message: getValidationRequiredMessage,
                        },
                    ]}
                >
                    <Input type="number" step="0.01" min="0" />
                </Form.Item>
            </Modal>
        </>
    );
}
