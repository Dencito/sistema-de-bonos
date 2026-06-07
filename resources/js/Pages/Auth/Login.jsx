import { useEffect } from 'react';
import { Form, Input, Checkbox, Button, Alert } from 'antd';
import GuestLayout from '@layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { roleNames } from '@utils/constants';
import { authService } from '@services/api';
import { Lock, User, ArrowRight } from 'lucide-react';

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

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {auth?.users === 0 ? 'Crear Cuenta' : 'Bienvenido de nuevo'}
        </h1>
        <p className="text-gray-600">
          {auth?.users === 0
            ? 'Registra el primer usuario del sistema'
            : 'Ingresa tus credenciales para acceder'}
        </p>
      </div>

      {status && <Alert message={status} type="success" showIcon className="mb-6" />}

      <Form onFinish={submit} layout="vertical" className="space-y-5">
        <Form.Item
          label={auth?.users === 0 ? 'Nombre de usuario' : 'Usuario, Email o Teléfono'}
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
            size="large"
            prefix={<User className="w-4 h-4 text-gray-400" />}
            placeholder={auth?.users === 0 ? 'Ingresa tu nombre de usuario' : 'Ingresa tu usuario, email o teléfono'}
            className="rounded-lg"
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
            size="large"
            prefix={<Lock className="w-4 h-4 text-gray-400" />}
            placeholder="Ingresa tu contraseña"
            className="rounded-lg"
          />
        </Form.Item>

        <div className="flex items-center justify-between">
          <Form.Item className="mb-0">
            <Checkbox
              name="remember"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
              className="text-gray-600"
            >
              Recordarme
            </Checkbox>
          </Form.Item>
          <Link
            href={route('password.request')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={processing}
            size="large"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 border-0 hover:from-blue-600 hover:to-cyan-600 h-12 font-semibold rounded-lg shadow-md"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {auth?.users === 0 ? 'Crear Cuenta' : 'Ingresar'}
          </Button>
        </Form.Item>
      </Form>
    </GuestLayout>
  );
}
