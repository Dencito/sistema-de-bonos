import { useEffect, useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { getValidationRequiredMessage } from "@utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@contexts/MessageShow";

export default function ModalRequestMoreBranches() {
    const [showModal, setShowModal] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [country, setCountry] = useState("");

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();
    useEffect(() => {
        const getCountries = async () => {
            if (showModal) {
                const response = await fetch(
                    `${import.meta.env.VITE_RESTFUL_COUNTRIES_URL}/countries`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${
                                import.meta.env.VITE_API_KEY_COUNTRYS
                            }`,
                        },
                    }
                );
                const data = await response.json();
                setCountries(data?.data);
            }
        };
        const getRegion = async () => {
            if (country !== "" && showModal) {
                const response = await fetch(
                    `${import.meta.env.VITE_RESTFUL_COUNTRIES_URL}/countries/${country}/states`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${
                                import.meta.env.VITE_API_KEY_COUNTRYS
                            }`,
                        },
                    }
                );
                const data = await response.json();
                setRegions(data?.data);
            }
        };
        getCountries();
        getRegion();
    }, [showModal, country]);

    const handleDaySelection = (day) => {
        // Si el día ya está seleccionado, lo eliminamos
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
            form.setFieldValue(
                "availableBonusDays",
                form
                    .getFieldValue("availableBonusDays")
                    ?.filter((shift) => shift?.day !== day)
            );
        } else {
            // Si no está seleccionado, lo añadimos
            setSelectedDays([...selectedDays, day]);
            form.setFieldValue("availableBonusDays", [
                ...(form.getFieldValue("availableBonusDays") || []),
                { day, schedule: [null] },
            ]);
        }
    };

    const onCreate = async (values) => {
        try {
            setLoading(true);
            const { data } = await axios.post(
                `/branches/request_more_branches`,
                values
            );
            router.visit("/branches", {
                preserveState: true, // Mantener el estado actual
            });
            data && successMsg(data?.message);
            setLoading(false);
            handleCloseModal();
        } catch (error) {
            const {
                response: { data: dataError },
            } = error;
            setLoading(false);
            return errorMsg(dataError?.message);
        }
    };

    const handleCloseModal = () => {
        setCountry("");
        setSelectedDays([]);
        setLoading(false);
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const onlyNumberInput = (e) => {
        const cleanedValue = e.target.value.replace(/\D/g, "");
        form.setFieldsValue({ [e.target.name]: cleanedValue });
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
                        title: "¿Estás seguro de que quieres salir?",
                        content: "Se borrarán todos los datos no guardados.",
                        okText: "Sí",
                        okType: "danger",
                        cancelText: "No",
                        onOk() {
                            handleCloseModal();
                        },
                    })
                }
                okText="Solicitar"
                cancelText="Cancelar"
                okButtonProps={{
                    autoFocus: true,
                    htmlType: "submit",
                    loading: loading, // Estado de carga del botón
                    disabled: loading, // Deshabilitar cuando está cargando
                }}
                cancelButtonProps={{
                    disabled: loading, // Deshabilitar cuando está cargando
                }}
                destroyOnClose={() =>
                    Modal.confirm({
                        title: "¿Estás seguro de que quieres salir?",
                        content: "Se borrarán todos los datos no guardados.",
                        okText: "Sí",
                        okType: "danger",
                        cancelText: "No",
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
                            modifier: "public",
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
