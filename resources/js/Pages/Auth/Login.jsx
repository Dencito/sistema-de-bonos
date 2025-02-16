import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { roleNames } from '@utils/constants';
import { authService } from '@services/api';

export default function Login({ status, auth }) {
    const { data, setData, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });
    const { successMsg } = useMessage();
    
    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const handleCreateOwner = async (values) => {
        try {
            const resp = await authService.register(values);
            if (data) {
                successMsg(data?.message);
                router.visit(route('login'));
            }
        } catch (error) {
            console.error('Error creating owner:', error);
        }
    };

    const submit = async () => {
        const { login, password } = data;
        if (auth?.users === 0) {
            return handleCreateOwner({
                username: login,
                password,
                role: roleNames.duenio,
            });
        }

        try {
            const response = await authService.login({ login, password });
            if (response.success) {
                router.visit('/login', {
                    preserveState: true,
                });
            }
        } catch (error) {
            console.error('Login request failed:', error);
        }
    };

    return (
        <GuestLayout>
            <Head title="Inicio de sesión" />

            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {auth?.users === 0 ? 'Registrar Dueño' : 'Bienvenido de nuevo'}
                    </h1>
                    <p className="text-gray-600">
                        {auth?.users === 0 
                            ? 'Configure su cuenta de administrador'
                            : 'Ingrese sus credenciales para continuar'
                        }
                    </p>
                </div>

                {status && (
                    <Alert
                        message={status}
                        type="success"
                        showIcon
                        className="mb-6"
                    />
                )}

                <Form 
                    onFinish={submit} 
                    layout="vertical"
                    className="space-y-4"
                >
                    <Form.Item
                        label={
                            <span className="text-gray-700 font-medium">
                                {auth?.users === 0
                                    ? 'Nombre de usuario'
                                    : 'Usuario o Email o Teléfono'
                                }
                            </span>
                        }
                        validateStatus={errors.login ? 'error' : ''}
                        help={errors.login ? 'Credenciales incorrectas' : ''}
                    >
                        <Input
                            id="login"
                            name="login"
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            autoComplete="login"
                            autoFocus
                            className="rounded-lg"
                            size="large"
                            placeholder={auth?.users === 0 ? "Ingrese su nombre de usuario" : "Ingrese su usuario, email o teléfono"}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-gray-700 font-medium">Contraseña</span>}
                        validateStatus={errors.password ? 'error' : ''}
                        help={errors.password}
                    >
                        <Input.Password
                            id="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            className="rounded-lg"
                            size="large"
                            placeholder="Ingrese su contraseña"
                        />
                    </Form.Item>

                    <div className="flex items-center justify-between mb-6">
                        <Form.Item 
                            className="mb-0"
                            style={{ marginBottom: 0 }}
                        >
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            >
                                <span className="text-gray-600">Recordarme</span>
                            </Checkbox>
                        </Form.Item>

                        <Link
                            href={route('password.request')}
                            className="text-sm text-cyan-600 hover:text-cyan-500 font-medium"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 border-0 rounded-lg text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            {auth?.users === 0 ? 'Crear cuenta' : 'Iniciar sesión'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </GuestLayout>
    );
}
