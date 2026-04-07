import { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import axios from 'axios';

export default function ChangePasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.put(route('profile.password.update'), {
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      if (response.data.error === false) {
        toast.success(response.data.message || 'Contraseña actualizada exitosamente');
        form.resetFields();
        onClose();
      } else {
        toast.error(response.data.message || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      
      if (error.response?.data?.errors) {
        // Mostrar errores de validación
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((msg) => toast.error(msg));
        });
      } else {
        toast.error(error.response?.data?.message || 'Error al actualizar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <LockOutlined className="text-blue-600" />
          <span>Cambiar Contraseña</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        className="mt-4"
      >
        <Form.Item
          label="Contraseña Actual"
          name="current_password"
          rules={[
            { required: true, message: 'Por favor ingrese su contraseña actual' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Ingrese su contraseña actual"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Nueva Contraseña"
          name="password"
          rules={[
            { required: true, message: 'Por favor ingrese su nueva contraseña' },
            { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Ingrese su nueva contraseña"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Confirmar Nueva Contraseña"
          name="password_confirmation"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Por favor confirme su nueva contraseña' },
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
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirme su nueva contraseña"
            size="large"
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Cambiar Contraseña
          </Button>
        </div>
      </Form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800 font-semibold mb-1">
          Requisitos de seguridad:
        </p>
        <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
          <li>La contraseña debe tener al menos 8 caracteres</li>
          <li>Debe ingresar su contraseña actual correctamente</li>
          <li>La nueva contraseña debe ser diferente a la actual</li>
        </ul>
      </div>
    </Modal>
  );
}
