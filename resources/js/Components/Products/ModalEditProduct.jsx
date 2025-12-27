import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { productService } from '@services/api';

export default function ModalEditProduct({ data }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  useEffect(() => {
    if (showModal && data) {
      form.setFieldsValue({
        name: data.name,
        code: data.code,
        price: data.price,
      });
    }
  }, [showModal, data, form]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const onEdit = async (values) => {
    try {
      setLoading(true);
      const response = await productService.update(data.id, values);
      successMsg(response.message);
      handleCloseModal();
      router.reload();
    } catch (error) {
      errorMsg(error?.response?.data?.message || 'Error al actualizar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpenModal} icon={<EditOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-3xl text-bold">Editar producto</p>}
        confirmLoading={loading}
        zIndex={20}
        open={showModal}
        onCancel={() =>
          !loading &&
          Modal.confirm({
            title: '¿Estás seguro de que quieres salir?',
            content: 'Se borrarán todos los cambios no guardados.',
            okText: 'Sí',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              handleCloseModal();
            },
          })
        }
        okText="Actualizar"
        cancelText="Cancelar"
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
        }}
        destroyOnClose={() =>
          !loading &&
          Modal.confirm({
            title: '¿Estás seguro de que quieres salir?',
            content: 'Se borrarán todos los cambios no guardados.',
            okText: 'Sí',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              handleCloseModal();
            },
          })
        }
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            disabled={loading}
            className="z-40"
            clearOnDestroy
            onFinish={(values) => onEdit(values)}
            onFinishFailed={() => errorMsg('Verifica todos los campos')}
          >
            {loading && (
              <Spin
                size="large"
                tip={
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-2xl text-bold">Actualizando producto</p>
                  </div>
                }
                fullscreen
              />
            )}
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="name"
          label="Nombre"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={255} />
        </Form.Item>
        <Form.Item
          name="code"
          label="Código"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={255} />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Stock"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          name="price"
          label="Precio"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input type="number" step="0.01" min="0" />
        </Form.Item>
      </Modal>
    </>
  );
}
