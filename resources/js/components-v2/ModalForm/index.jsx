import { Modal, Form } from 'antd';

export function ModalForm({
  title,
  showModal,
  loading,
  onClose,
  onSubmit,
  children,
  okText = 'Guardar',
  cancelText = 'Cancelar',
  initialValues = {},
}) {
  const [form] = Form.useForm();

  return (
    <Modal
      style={{ top: 20 }}
      title={<p className="text-bold text-3xl">{title}</p>}
      open={showModal}
      onCancel={() => {
        Modal.confirm({
          title: '¿Estás seguro de que quieres salir?',
          content: 'Se borrarán todos los datos no guardados.',
          okText: 'Sí',
          okType: 'danger',
          cancelText: 'No',
          onOk: onClose,
        });
      }}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        autoFocus: true,
        loading,
        htmlType: 'submit',
      }}
      cancelButtonProps={{ disabled: loading }}
      destroyOnClose
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="form_in_modal"
          initialValues={initialValues}
          onFinish={(values) => {
            onSubmit(values);
            form.resetFields();
          }}
        >
          {dom}
        </Form>
      )}
    >
      {children}
    </Modal>
  );
}
