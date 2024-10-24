import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalCreateCategoryBono({ roles, states, branches, companies }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [selectCompany, setSelectCompany] = useState(null)

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();


  const onCreate = async (values) => {
    console.log('Received values of form: ', values);
    try {
      setLoading(true)
      const { data } = await axios.post(`/categories-bonus`, values);
      router.visit('/categories-bonus', {
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
    setSelectCompany(null)
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
      <Button onClick={handleOpenModal} className="my-5" type="primary" shape="circle" icon={<PlusOutlined />} size={50} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Crear categoria</p>}
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
        okText='Crear'
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
            initialValues={{
              modifier: 'public',
            }}
            disabled={loading}
            clearOnDestroy
            onFinish={(values) => onCreate(values)}
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