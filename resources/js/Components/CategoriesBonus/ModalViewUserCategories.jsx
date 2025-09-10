import { useState } from 'react';
import { Button, Form, List, Modal } from 'antd';

export default function ModalViewUserCategories({ data, category }) {
    const [showModal, setShowModal] = useState(false);
    const [form] = Form.useForm();

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    return (
        <>
            <Button
                onClick={handleOpenModal}
                className="hover:border-green-300"
            >
                Ver usuarios
            </Button>
            <Modal
                style={{ top: 20 }}
                title={
                    <p className="text-bold text-3xl">Usuarios: {category}</p>
                }
                open={showModal}
                cancelText="Cancelar"
                onCancel={() => handleCloseModal()}
                destroyOnClose={true}
                okButtonProps={{
                    style: { display: 'none' },
                }}
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        disabled
                        name="form_in_modal"
                        initialValues={{
                            modifier: 'public',
                        }}
                        clearOnDestroy
                    >
                        {dom}
                    </Form>
                )}
            >
                <List
                    size="small"
                    bordered
                    dataSource={data}
                    renderItem={(item) => (
                        <List.Item>
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium text-blue-600">
                                        {item.username && (
                                            <span className="mr-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                @{item.username}
                                            </span>
                                        )}
                                        <span className="text-gray-800">
                                            {item.first_name} {item.second_name || ''} {item.first_last_name} {item.second_last_name || ''}
                                        </span>
                                    </div>
                                </div>
                                {item.cargo && (
                                    <div className="text-xs text-gray-500 flex items-center">
                                        <span className="mr-1">Cargo:</span>
                                        <span className="font-medium">{item.cargo}</span>
                                    </div>
                                )}
                            </div>
                        </List.Item>
                    )}
                />
            </Modal>
        </>
    );
}
