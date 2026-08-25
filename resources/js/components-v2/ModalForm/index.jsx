import { useCallback } from 'react';
import { Modal, Form } from 'antd';

export function ModalForm({
  title,
  showModal,
  loading,
  onClose,
  form,
  onSubmit,
  children,
  okText = 'Guardar',
  cancelText = 'Cancelar',
  initialValues = {},
  disabled = false,
}) {
  const handleCancel = useCallback(() => {
    if (loading) return;
    Modal.confirm({
      title: '¿Estás seguro de que quieres salir?',
      content: 'Se borrarán todos los datos no guardados.',
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: onClose,
    });
  }, [loading, onClose]);

  return (
    <Modal
      style={{ top: 20 }}
      title={<p className="text-bold text-3xl">{title}</p>}
      open={showModal}
      onCancel={handleCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        autoFocus: true,
        loading,
        htmlType: 'submit',
      }}
      cancelButtonProps={{ disabled: loading }}
      destroyOnClose
      afterClose={() => form?.resetFields()}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="form_in_modal"
          disabled={disabled}
          initialValues={initialValues}
          onFinish={(values) => {
            onSubmit(values);
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
