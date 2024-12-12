import { useForm } from "@inertiajs/react";
import { Modal, Input, Button, Select } from "antd";
import { useState } from "react";

const { Option } = Select;

export default function FilterModal({ filters, states, roles }) {
    const [showModal, setShowModal] = useState(false);
    const InitForm = {
        username: filters.username || "",
        state: filters.state || "",
        role: filters.role || "",
    };
    const { data, setData, get } = useForm(InitForm);

    const handleFilter = () => {
        get(route("users.index"));
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
                title="Filtrar Usuarios"
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
                        <label htmlFor="username">Nombre de usuario</label>
                        <Input
                            className=""
                            id="username"
                            value={data.username}
                            onChange={(e) =>
                                setData("username", e.target.value)
                            }
                            placeholder="Nombre del usuario"
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
                    <div>
                        <label htmlFor="role">Rol </label>
                        <Select
                            className="w-60"
                            id="role"
                            value={data.role}
                            onChange={(value) => setData("role", value)}
                            placeholder="Seleccione un rol"
                        >
                            {roles.map((rol) => (
                                <Option key={rol.id} value={rol.name}>
                                    {rol.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
