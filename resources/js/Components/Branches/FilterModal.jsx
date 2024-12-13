import { useForm } from "@inertiajs/react";
import { Modal, Input, Button, Select } from "antd";
import { useState } from "react";

const { Option } = Select;

export default function FilterModal({ filters, states }) {
    const [showModal, setShowModal] = useState(false);
    const InitForm = {
        name: filters.name || "",
        state: filters.state || "",
    };
    const { data, setData, get } = useForm(InitForm);

    const handleFilter = () => {
        get(route("branches.index"));
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    return (
        <>
            <Button onClick={handleOpenModal} className="">
                Filtros
            </Button>
            <Modal
                title="Filtrar Sucursales"
                open={showModal}
                onClose={handleCloseModal}
                onCancel={handleCloseModal}
                footer={[
                    <Button
                        key="close"
                        danger
                        onClick={() => {
                            setData(InitForm);
                            window.location.replace(window.location.pathname);
                        }}
                    >
                        Limpiar
                    </Button>,
                    <Button key="close" onClick={handleCloseModal}>
                        Cerrar
                    </Button>,
                    <Button key="apply" type="primary" onClick={handleFilter}>
                        Aplicar Filtros
                    </Button>,
                ]}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="name">Nombre de la sucursal</label>
                        <Input
                            className=""
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Nombre de la sucursal"
                        />
                    </div>
                    <div>
                        <label htmlFor="state">Estado </label>
                        <Select
                            className="w-60"
                            id="state"
                            value={data.state}
                            onChange={(value) => setData("state", value)}
                            placeholder="Seleccione un estado"
                        >
                            {states.map((state) => (
                                <Option key={state.id} value={state.name}>
                                    {state.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
