import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalEditCategoryBono({ data, roles, states }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const { successMsg, errorMsg } = useMessage();

  const [form] = Form.useForm();


  const onUpdate = async (values) => {
    console.log('Received values of form: ', values);
    try {
      setLoading(true)
      const { data: dataUpdate } = await axios.put(`/categories-bonus/${data.id}`, values);
      router.visit('/categories-bonus', {
        preserveState: true, // Mantener el estado actual
      });
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
      <Button onClick={handleOpenModal} icon={<EditOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Editar categoria {data.name}</p>}
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