import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMessage } from '@/contexts/MessageShow';
import { roleNames } from '@/Utils/constants';
import { authService } from '@/Services/api';

export default function Login({ status, auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });
    const { successMsg, errorMsg } = useMessage();

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const handleCreateOwner = async (values) => {
        const { data } = await axios.post(`/users/owner`, values);
        router.visit(route('login'));
        data && successMsg(data?.message)
    }

    const submit = async () => {
        const { login, password } = data;
        console.log('Iniciando proceso de login en frontend', { 
            login, 
            remember: data.remember,
            auth, 
            'session_cookie': document.cookie.includes('laravel_session'),
            'xsrf_token': document.cookie.includes('XSRF-TOKEN'),
            'cookies': document.cookie
        });
        
        if (auth?.users === 0) {
            console.log('No hay usuarios, creando owner');
            return handleCreateOwner({
                username: login,
                password,
                role: roleNames.duenio,
            });
        }

        try {
            console.log('Enviando solicitud de login al backend', { 
                route: '/login',
                login,
                remember: data.remember
            });
            
            const response = await authService.login({ login, password, remember: data.remember });
            console.log('Respuesta del servidor de login:', response);
            
            if (response.success) {
                console.log('Login exitoso en frontend', { 
                    response,
                    'session_cookie_after': document.cookie.includes('laravel_session'),
                    'xsrf_token_after': document.cookie.includes('XSRF-TOKEN'),
                    'cookies_after': document.cookie
                });
                router.visit(route('dashboard'));
            } else {
                console.error('Error de login reportado por el servidor:', response.message);
                errorMsg(response.message);
            }
        } catch (error) {
            console.error('Error crítico en solicitud de login:', error);
            errorMsg(error);
        }
    };

    return (
        <GuestLayout>
            <Head title="Inicio de sesión" />

            {status && <Alert message={status} type="success" showIcon className="mb-4" />}
            <h1 className='text-3xl font-bold mb-4'>{auth?.users === 0 ? 'Registrar Dueño' : 'Ingresar'}</h1>

            <Form
                onFinish={submit}
                layout="vertical"
            >
                <Form.Item
                    label={auth?.users === 0 ? "Nombre de usuario" : "Usuario o Email o Teléfono"}
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
                    <Button type="primary" htmlType="submit" loading={processing} className="ms-4">
                        Ingresar
                    </Button>
                </Form.Item>
            </Form>
            <Link href={route('password.request')} className="text-sm text-gray-600 hover:text-gray-900">
    ¿Olvidaste tu contraseña?
</Link>
        </GuestLayout>
    );
}
