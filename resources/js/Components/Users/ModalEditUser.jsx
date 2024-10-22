import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select, Space, Typography, Card, TimePicker } from "antd";
import { CloseOutlined, MinusCircleOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalEditUser({ data, roles, branches, companies, states }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [selectCompany, setSelectCompany] = useState(data.company_id)

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();


  const onUpdate = async (values) => {
    console.log('Received values of form: ', values);
    try {
      setLoading(true)
      console.log(data.id)
      const { data: dataUpdate } = await axios.put(`/users/${data.id}`, values);
      router.visit(window.location.href, {
        preserveState: true, // Mantener el estado actual
      });
      console.log(dataUpdate)
      dataUpdate && successMsg(dataUpdate?.message)
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
    setSelectCompany(null)
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  return (
    <>
      
      <Button onClick={handleOpenModal} icon={<EditOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Editar Usuario {data.username}</p>}
        open={showModal}
        onCancel={() => !loading && Modal.confirm({
          title: '¿Estás seguro de que quieres salir?',
          content: 'Se borrarán todos los datos no guardados.',
          okText: 'Sí',
          okType: 'danger',
          cancelText: 'No',
          onOk() {
            handleCloseModal();
          },
        })}
        okText='Editar'
        cancelText="Cancelar"
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
          loading: loading, // Estado de carga del botón
          disabled: loading, // Deshabilitar cuando está cargando
        }}
        cancelButtonProps={{
          disabled: loading, // Deshabilitar cuando está cargando
        }}
        destroyOnClose={() => Modal.confirm({
          title: '¿Estás seguro de que quieres salir?',
          content: 'Se borrarán todos los datos no guardados.',
          okText: 'Sí',
          okType: 'danger',
          cancelText: 'No',
          onOk() {
            handleCloseModal();
          },
        })}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            initialValues={data}
            disabled={loading}
            clearOnDestroy
            onFinish={(values) => onUpdate(values)}
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
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select showSearch placeholder="Seleccione la sucursal">
            {
              branches?.map(branch => (
                <Select.Option key={branch?.id} value={branch?.id}>{branch?.name}</Select.Option>
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