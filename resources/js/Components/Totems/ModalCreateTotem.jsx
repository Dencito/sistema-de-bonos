import { useState } from 'react';
import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import axios from 'axios';

export default function ModalCreateTotem({ branches }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const onCreate = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/totems', values);

      if (response.data) {
        handleCloseModal();
        router.visit('/totems', {
          preserveState: true,
        });
        return successMsg('Tótem creado exitosamente');
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 'Error al crear el tótem';
      return errorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    form.resetFields();
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className="my-5"
        type="primary"
        shape="circle"
        icon={<PlusOutlined />}
        size={50}
        aria-label="Crear nuevo tótem"
      />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Crear Tótem</p>}
        confirmLoading={loading}
        zIndex={20}
        open={showModal}
        onCancel={() =>
          !loading &&
          Modal.confirm({
            title: '¿Estás seguro de que quieres salir?',
            content: 'Se borrarán todos los datos no guardados.',
            okText: 'Sí',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              handleCloseModal();
            },
          })
        }
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_create_totem"
            initialValues={{
              active: true,
            }}
            disabled={loading}
            className="z-40"
            onFinish={(values) => onCreate(values)}
            onFinishFailed={() => errorMsg('Verifica todos los campos')}
          >
            {dom}
          </Form>
        )}
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
          <Input showCount maxLength={50} placeholder="Ingrese el código único del tótem" />
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
          <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" defaultChecked />
        </Form.Item>
      </Modal>
    </>
  );
}
