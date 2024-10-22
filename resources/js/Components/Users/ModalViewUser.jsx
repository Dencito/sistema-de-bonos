import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select, Space, Typography, Card, TimePicker } from "antd";
import { CloseOutlined, MinusCircleOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";

export default function ModalViewUser({data, states, roles}) {
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
      router.visit(window.location.href, {
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

  return (
    <>
      {contextHolder}
      <Button onClick={handleOpenModal} icon={<EyeOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Datos de {data?.username}</p>}
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
          name="username"
          label="Nombre de usuario"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo electrónico"
          rules={[
            {
              type: 'email',
              message: getValidationEmailMessage,
            },]}
        >
          <Input type="email" showCount maxLength={60} />
        </Form.Item>

        <Form.Item
          name="password"
          label="Contraseña"
        >

          <Input type="password" showCount min={8} maxLength={30} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Teléfono"
        >

          <Input showCount maxLength={10} />
        </Form.Item>

        <Form.Item
          name="role"
          label="Rol"
          initialValue={data.roles[0].name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select showSearch placeholder="Seleccione el rol">
            {
              roles?.map(role => (
                <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
              ))
            }
          </Select>
        </Form.Item>

        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select showSearch placeholder="Seleccione el estado">
            {
              states?.map(state => (
                <Select.Option key={state?.id} value={state?.id}>{state?.name}</Select.Option>
              ))
            }
          </Select>
        </Form.Item>

        {/* <Form.Item noStyle shouldUpdate>
          {() => (
            <Typography>
              <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
            </Typography>
          )}
        </Form.Item> */}
      </Modal>


    </>
  );
}