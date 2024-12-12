import { useState } from "react";
import { Button, Form, Input, message, Modal } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { getValidationRequiredMessage } from "../../Utils/messagesValidationes";

export default function ModalViewCategoryBono({data }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const handleCloseModal = () => {
    setLoading(false)
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  }

  return (
    <>
      {contextHolder}
      <Button onClick={handleOpenModal} icon={<EyeOutlined/>}/>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Datos de {data?.name}</p>}
        open={showModal}
        cancelText="Cancelar"
        onCancel={() => handleCloseModal()}
        destroyOnClose={true}
        okButtonProps={{
          style:{ display: 'none'}
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            disabled
            name="form_in_modal"
            initialValues={data}
            clearOnDestroy
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="name"
          label="Nombre de la categoria"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="base_amount"
          label="Monto base"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input name="base_amount" onChange={onlyNumberInput} showCount maxLength={10} />
        </Form.Item>
      </Modal>
    </>
  );
}