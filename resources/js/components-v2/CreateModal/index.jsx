import { useEffect } from "react";
import { Button, Form, Input, Modal } from "antd";

export function CreateModal({
    isOpen,
    onClose,
    entityType,
    fields,
    onSubmit,
    modalStyles,
    initialValues,
    loading,
}) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (isOpen) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            }
        }
    }, [isOpen, initialValues]);

    return (
        <Modal
            title={`Crear ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    Crear
                </Button>,
            ]}
            style={modalStyles}
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                {fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        rules={field.rules}
                    >
                        {field.component ? (
                            field.component
                        ) : (
                            <Input placeholder={`Ingrese ${field.label}`} />
                        )}
                    </Form.Item>
                ))}
            </Form>
        </Modal>
    );
}
