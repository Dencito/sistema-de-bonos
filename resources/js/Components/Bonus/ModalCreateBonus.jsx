import { useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select, Space, Typography, Card, TimePicker, DatePicker } from "antd";
import { CloseOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";
import moment from "moment";
import dayjs from "dayjs";
import { useMessage } from "@/Contexts/MessageShow";

const EnumTypes = {
  basic: 'basic',
  birthday: 'birthday',
  today: 'today'

}
export default function ModalCreateBonus() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [selectType, setSelectType] = useState(null)
  const [selectCompany, setSelectCompany] = useState(null)

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();


  const onCreate = async (values) => {
    console.log('Received values of form: ', values);
    try {
      const startDataTime = form.getFieldValue('start_datetime')?.format('YYYY-MM-DD HH:mm:ss')
      const endDataTime = form.getFieldValue('end_datetime')?.format('YYYY-MM-DD HH:mm:ss')
      const name = form.getFieldValue('name')
      const amount = form.getFieldValue('amount')
      const type = form.getFieldValue('type')
      setLoading(true)
      const sendData = {
        name,
        type,
        amount,
      }
      if (selectType === EnumTypes.basic) {
        sendData.start_datetime = startDataTime
        sendData.endDataTime = endDataTime
      }
      console.log(sendData)
      const { data } = await axios.post(`/bonuses`, sendData);
      router.visit('/users', {
        preserveState: true, // Mantener el estado actual
      });
      data && successMsg(data?.message)
      setLoading(false)
      handleCloseModal()
    } catch (error) {
      console.log(error)
      const { response: { data: dataError } } = error
      setLoading(false)
      return errorMsg(dataError?.message)
    }
  };



  const handleCloseModal = () => {
    setLoading(false)
    setSelectCompany(null)
    setSelectType(null)
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  }

  console.log(selectType)

  return (
    <>
      <Button onClick={handleOpenModal} className="my-5">
        Crear bono
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Crear bono</p>}
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
          label="Nombre del bono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="amount"
          label="Monto"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input name="amount" onChange={onlyNumberInput} showCount maxLength={10} />
        </Form.Item>

        <Form.Item
          name="type"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
          label="Tipo de bono">
          <Select onChange={value => setSelectType(value)} placeholder="Seleccionar dia">
            {
              [
                {
                  id: 1,
                  name: 'basic',
                },
                {
                  id: 2,
                  name: 'birthday',
                },
                {
                  id: 3,
                  name: 'today'
                },
              ]?.map(type => (
                <Select.Option key={type?.id} value={type?.name}>{type?.name}</Select.Option>
              ))
            }
          </Select>
        </Form.Item>

        {
          selectType === EnumTypes.basic &&
          <div className="flex justify-between">
            <Form.Item
              name='start_datetime'
              label="Fecha y hora de inicio"
              rules={[{ required: selectType === EnumTypes.basic, message: 'Por favor, seleccione la fecha y hora de inicio.' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="Seleccionar fecha y hora"
              />
            </Form.Item>
            <Form.Item
              name='end_datetime'
              label="Fecha y hora de fin"
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="Seleccionar fecha y hora"
              />
            </Form.Item>
          </div>
        }



      </Modal>


    </>
  );
}