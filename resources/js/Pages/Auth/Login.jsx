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

      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl text-slate-900">
          {auth?.users === 0 ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        <p className="mt-2 text-slate-500">
          {auth?.users === 0
            ? 'Registrá el primer usuario del sistema.'
            : 'Ingresá tus credenciales para continuar.'}
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
            prefix={<User className="w-4 h-4 text-slate-400" />}
            placeholder={auth?.users === 0 ? 'Nombre de usuario' : 'Usuario, email o teléfono'}
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
            prefix={<Lock className="w-4 h-4 text-slate-400" />}
            placeholder="Contraseña"
            className="rounded-lg"
          />
        </Form.Item>

        <div className="flex items-center justify-between">
          <Form.Item className="mb-0">
            <Checkbox
              name="remember"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
              className="text-slate-600"
            >
              Recordarme
            </Checkbox>
          </Form.Item>
          <Link
            href={route('password.request')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
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
            className="w-full h-12 font-semibold border-0 rounded-lg bg-slate-900 hover:!bg-slate-700"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {auth?.users === 0 ? 'Crear cuenta' : 'Ingresar'}
          </Button>
        </Form.Item>
      </Form>
    </GuestLayout>
  );
}
