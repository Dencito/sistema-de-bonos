import { useState } from "react";
import { Form, Input, Select, DatePicker } from "antd";
import { getValidationRequiredMessage } from "@utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@contexts/MessageShow";
import { ModalForm } from "@components-v2/ModalForm";
import { CustomButton } from "@components-v2/CustomButton";

const EnumTypes = {
    basic: "basic",
    birthday: "birthday",
    today: "today",
};
export default function ModalCreateBonus() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectType, setSelectType] = useState(null);
    const [selectCompany, setSelectCompany] = useState(null);

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    const onCreate = async (values) => {
        try {
            const startDataTime = form
                .getFieldValue("start_datetime")
                ?.format("YYYY-MM-DD HH:mm:ss");
            const endDataTime = form
                .getFieldValue("end_datetime")
                ?.format("YYYY-MM-DD HH:mm:ss");
            const name = form.getFieldValue("name");
            const amount = form.getFieldValue("amount");
            const type = form.getFieldValue("type");
            setLoading(true);
            const sendData = {
                name,
                type,
                amount,
            };
            if (selectType === EnumTypes.basic) {
                sendData.start_datetime = startDataTime;
                sendData.endDataTime = endDataTime;
            }
            const { data } = await axios.post(`/bonuses`, sendData);
            router.visit("/users", {
                preserveState: true, // Mantener el estado actual
            });
            data && successMsg(data?.message);
            setLoading(false);
            form.resetFields();
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
        setLoading(false);
        setSelectCompany(null);
        setSelectType(null);
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
            <CustomButton onClick={handleOpenModal} className="my-5">
                Crear bono
            </CustomButton>
            <ModalForm
                title="Crear bono"
                showModal={showModal}
                loading={loading}
                form={form}
                onClose={handleCloseModal}
                onSubmit={onCreate}
                initialValues={{}}
            >
                <>
                    <Form.Item
                        name="name"
                        label="Nombre del bono"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input showCount maxLength={30} />
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label="Monto"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input
                            name="amount"
                            onChange={onlyNumberInput}
                            showCount
                            maxLength={10}
                        />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Tipo de bono"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Select
                            onChange={(value) => setSelectType(value)}
                            placeholder="Seleccionar tipo"
                        >
                            {Object.values(EnumTypes).map((type, index) => (
                                <Select.Option key={index} value={type}>
                                    {type}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {selectType === EnumTypes.basic && (
                        <div className="flex justify-between">
                            <Form.Item
                                name="start_datetime"
                                label="Fecha y hora de inicio"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Por favor, seleccione la fecha y hora de inicio.",
                                    },
                                ]}
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    placeholder="Seleccionar fecha y hora"
                                />
                            </Form.Item>
                            <Form.Item
                                name="end_datetime"
                                label="Fecha y hora de fin"
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    placeholder="Seleccionar fecha y hora"
                                />
                            </Form.Item>
                        </div>
                    )}
                </>
            </ModalForm>
        </>
    );
}
