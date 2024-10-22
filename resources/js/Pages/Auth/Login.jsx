import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = () => {
        post(route('login')); // No es necesario llamar a e.preventDefault()
    };

    return (
        <GuestLayout>
            <Head title="Inicio de sesión" />

            {status && <Alert message={status} type="success" showIcon className="mb-4" />}

            <Form
                onFinish={submit}  // Elimina e.preventDefault, ya que Ant Design maneja esto internamente
                layout="vertical"
            >
                <Form.Item
                    label="Usuario o Email o Teléfono"
                    validateStatus={errors.login ? 'error' : ''}
                    help={errors.login ? "Credenciales incorrectas" : ''}
                >
                    <Input
                        id="login"
                        name="login"
                        value={data.login}
                        onChange={(e) => setData('login', e.target.value)}
                        autoComplete="login"
                        autoFocus
                    />
                </Form.Item>

                <Form.Item
                    label="Contraseña"
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password}
                >
                    <Input.Password
                        id="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                    />
                </Form.Item>

                <Form.Item>
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                    >
                        Recordarme
                    </Checkbox>
                </Form.Item>

                <Form.Item className="flex items-center justify-end">
                    {/* Uncomment the below block if password reset is enabled */}
                    {/* {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="underline text-sm text-gray-600 hover:text-gray-900"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    )} */}
                    
                    <Button type="primary" htmlType="submit" loading={processing} className="ms-4">
                        Ingresar
                    </Button>
                </Form.Item>
            </Form>
        </GuestLayout>
    );
}
