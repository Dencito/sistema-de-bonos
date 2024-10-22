import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select, Space, Typography, Card, TimePicker } from "antd";
import { CloseOutlined, MinusCircleOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";

export default function ModalViewCategoryBono({data, states, roles}) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [showAlerts, setShowAlerts] = useState({
    success: { state: false, message: "" },
    error: { state: false, message: "" },
  });

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const successMsg = () => {
    messageApi.open({
      type: 'success',
      content: 'usuario creada exitosamente.',
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };

  const errorMsg = (content) => {
    messageApi.open({
      type: 'error',
      content,
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };


  const onCreate = async (values) => {
    console.log('Received values of form: ', values);
    try {
      setLoading(true)
      const { data } = await axios.post(`/users`, values);
      router.visit('/users', {
        preserveState: true, // Mantener el estado actual
      });
      data && successMsg(data?.message)
      setLoading(false)
      handleCloseModal()
    } catch (error) {
      const { response: { data: dataError } } = error
      setLoading(false)
      return errorMsg(dataError?.message)
    }
  };



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
        okText="Ok"
        cancelText="Salir"
        onCancel={() => handleCloseModal()}
        destroyOnClose={() => handleCloseModal()}
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            disabled
            name="form_in_modal"
            initialValues={data}
            clearOnDestroy
            onFinish={() => handleCloseModal()}
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