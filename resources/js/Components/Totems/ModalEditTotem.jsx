import { useState } from 'react';
import { Form, Input, Select, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { ModalForm } from '@components-v2/ModalForm';
import { CustomButton } from '@components-v2/CustomButton';
import axios from 'axios';

export default function ModalEditTotem({ data, branches }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const onUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(`/totems/${data.id}`, values);

      if (response.data) {
        successMsg('Tótem actualizado exitosamente');
        router.visit(window.location.href, {
          preserveState: true,
        });
        handleCloseModal();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el tótem';
      errorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setLoading(false);
    setShowModal(false);
    form.resetFields();
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <CustomButton
        onClick={handleOpenModal}
        type="primary"
        icon={<EditOutlined />}
        aria-label="Editar tótem"
      />
      <ModalForm
        title="Editar Tótem"
        open={showModal}
        onCancel={handleCloseModal}
        onFinish={onUpdate}
        form={form}
        loading={loading}
        okText="Actualizar"
        cancelText="Cancelar"
        initialValues={{
          name: data?.name,
          code: data?.code,
          branch_id: data?.branch_id,
          active: data?.active ?? true,
        }}
      >
        <Form.Item
          name="name"
          label="Nombre del Tótem"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={255} placeholder="Ingrese el nombre del tótem" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Código del Tótem"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={50} placeholder="Ingrese el código único del tótem" disabled />
        </Form.Item>

        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Seleccione una sucursal"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {branches?.map((branch) => (
              <Select.Option key={`branch_${branch.id}`} value={branch.id}>
                {branch.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="active" label="Estado" valuePropName="checked">
          <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
        </Form.Item>
      </ModalForm>
    </>
  );
}
