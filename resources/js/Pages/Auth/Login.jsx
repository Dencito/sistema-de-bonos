import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { roleNames } from '@utils/constants';
import { authService } from '@services/api';
import { getRouteParams } from '@utils/helpers';

export default function Login({ status, auth }) {
  const { data, setData, processing, errors, reset } = useForm({
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
    try {
      const { data } = await authService.register(values);
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
      const response = await authService.login({
        login,
        password,
        remember: data.remember,
      });
      if (response.success) {
        router.visit(route('dashboard'));
      } else {
        console.error('Error de login reportado por el servidor:', response.message);
        errorMsg(response.message);
      }
    } catch (error) {
      errorMsg(error);
    }
  };

  return (
    <GuestLayout>
      <Head title="Inicio de sesión" />

      {status && <Alert message={status} type="success" showIcon className="mb-4" />}
      <h1 className="text-3xl font-bold mb-4">
        {auth?.users === 0 ? 'Registrar Dueño' : 'Ingresar'}
      </h1>

      <Form onFinish={submit} layout="vertical">
        <Form.Item
          label={auth?.users === 0 ? 'Nombre de usuario' : 'Usuario o Email o Teléfono'}
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
      <Link href={route('password.request', getRouteParams())} className="text-sm text-gray-600 hover:text-gray-900">
        ¿Olvidaste tu contraseña?
      </Link>
    </GuestLayout>
  );
}
