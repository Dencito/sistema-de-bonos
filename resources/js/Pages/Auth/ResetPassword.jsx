import { Form, Input, Button } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';

export default function ResetPassword({ token, email }) {
  const { showMessage } = useMessage();
  const { post, processing } = useForm();

  const onFinish = (values) => {
    post(
      route('password.store', {
        ...values,
        token: token,
        email: email,
      }),
      {
        onSuccess: () => {
          showMessage('Tu contraseña ha sido restablecida correctamente', 'success');
        },
        onError: () => {
          showMessage('Error al restablecer la contraseña', 'error');
        },
      },
    );
  };

  return (
    <GuestLayout>
      <Head title="Restablecer Contraseña" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl text-slate-900">Nueva contraseña</h1>
        <p className="mt-2 text-slate-500">Elegí una contraseña de al menos 8 caracteres.</p>
      </div>

      <Form name="reset-password" onFinish={onFinish} layout="vertical" initialValues={{ email }}>
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
          <Input size="large" disabled />
        </Form.Item>

        <Form.Item
          label="Nueva Contraseña"
          name="password"
          rules={[
            {
              required: true,
              message: 'Por favor ingresa tu nueva contraseña',
            },
            {
              min: 8,
              message: 'La contraseña debe tener al menos 8 caracteres',
            },
          ]}
        >
          <Input.Password size="large" />
        </Form.Item>

        <Form.Item
          label="Confirmar Contraseña"
          name="password_confirmation"
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Por favor confirma tu contraseña',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              },
            }),
          ]}
        >
          <Input.Password size="large" />
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
            Restablecer contraseña
          </Button>
        </Form.Item>
      </Form>
    </GuestLayout>
  );
}
