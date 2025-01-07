import { useForm } from '@inertiajs/react';
import { Modal, Input, Button, Select, Form } from 'antd';
import { useState } from 'react';

const { Option } = Select;

export default function FilterModal({ filters, statuses }) {
    const [showModal, setShowModal] = useState(false);
    const InitForm = {
        name: filters.name || '',
        status: filters.status || '',
    };
    const { data, setData, get, form } = useForm(InitForm);

    const handleFilter = () => {
        get(route('companies.index'));
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleFinish = () => {
        handleFilter();
    };

    return (
        <>
            <Button onClick={handleOpenModal} className="">
                Filtros
            </Button>
            <Modal
                style={{ top: 20 }}
                title={<p className="text-bold text-3xl">Filtrar compañias</p>}
                open={showModal}
                okText="Filtrar"
                cancelText="Cancelar"
                onCancel={() => handleCloseModal()}
                onOk={() => form.submit()}
                destroyOnClose={true}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{
                        name: data.name,
                        status: data.status,
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="name">Nombre de la empresa</label>
                            <Form.Item name="name">
                                <Input
                                    className=""
                                    id="name"
                                    placeholder="Nombre de la empresa"
                                />
                            </Form.Item>
                        </div>

                        <div>
                            <label htmlFor="status">Estado </label>
                            <Form.Item name="status">
                                <Select
                                    className="w-60"
                                    id="status"
                                    placeholder="Seleccione un estado"
                                >
                                    {statuses.map((status) => (
                                        <Option
                                            key={status.id}
                                            value={status.name}
                                        >
                                            {status.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                    </div>
                </Form>
                <div className="flex justify-end mt-4">
                    <Button
                        danger
                        onClick={() => {
                            setData(InitForm);
                            window.location.replace(window.location.pathname);
                        }}
                    >
                        Limpiar
                    </Button>
                </div>
            </Modal>
        </>
    );
}
