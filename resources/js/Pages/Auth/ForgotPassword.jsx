import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Form, Input, Button, Alert } from 'antd';
import { useMessage } from '@contexts/MessageShow';

export default function ForgotPassword({ status }) {
    const { successMsg, errorMsg } = useMessage();
    const { post, processing } = useForm();

    const onFinish = (values) => {
        post(route('password.email', values), {
            onSuccess: () => {
                successMsg('Se ha enviado el enlace de recuperación a tu correo', 'success');
            },
            onError: (errors) => {
                errorMsg('Error al enviar el correo de recuperación', 'error');
            }
        });
    };

    return (
        <GuestLayout>
            <Head title="Recuperar Contraseña" />

            <div className="mb-4 text-sm text-gray-600">
                ¿Olvidaste tu contraseña? No hay problema. Solo indícanos tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </div>

            {status && (
                <Alert
                    message={status}
                    type="success"
                    showIcon
                    className="mb-4"
                />
            )}

            <Form
                name="forgot-password"
                onFinish={onFinish}
                layout="vertical"
            >
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        {
                            required: true,
                            message: 'Por favor ingresa tu correo electrónico',
                        },
                        {
                            type: 'email',
                            message: 'Ingresa un correo electrónico válido',
                        },
                    ]}
                >
                    <Input size="large" />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={processing}
                        size="large"
                        block
                    >
                        Enviar enlace de recuperación
                    </Button>
                </Form.Item>
            </Form>
        </GuestLayout>
    );
}
