import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
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
      onError: () => {
        errorMsg('Error al enviar el correo de recuperación', 'error');
      },
    });
  };

  return (
    <GuestLayout>
      <Head title="Recuperar Contraseña" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl text-slate-900">Recuperar contraseña</h1>
        <p className="mt-2 text-slate-500">
          Indicanos tu correo y te enviamos un enlace para restablecerla.
        </p>
      </div>

      {status && <Alert message={status} type="success" showIcon className="mb-6" />}

      <Form name="forgot-password" onFinish={onFinish} layout="vertical">
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
            className="h-12 font-semibold border-0 rounded-lg bg-slate-900 hover:!bg-slate-700"
          >
            Enviar enlace de recuperación
          </Button>
        </Form.Item>
      </Form>

      <p className="mt-6 text-sm text-center text-slate-500">
        <Link href={route('login')} className="font-medium text-slate-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </GuestLayout>
  );
}
