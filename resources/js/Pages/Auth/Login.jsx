import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useMessage } from '@/Contexts/MessageShow';

export default function Login({ status, canResetPassword, auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });
    const { successMsg, errorMsg } = useMessage();

    console.log(auth)

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

    const submit = () => {
        if (auth?.users === 0) {
            const { login: username, password} = data
            return handleCreateOwner({ username, password,  role: 'Dueño'  })
        } else {
            post(route('login')); // No es necesario llamar a e.preventDefault()
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
        </GuestLayout>
    );
}
