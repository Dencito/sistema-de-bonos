import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select, Space, Typography, Card, TimePicker, Tag } from "antd";
import { CloseOutlined, EditOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { days } from "./days";

export default function ModalViewBranch({ data, states, companies }) {
  console.log(data, data?.available_bonus_days?.map((bonusDays) => bonusDays?.day))
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(data?.available_bonus_days?.map((bonusDays) => bonusDays.day));
  const [errors, setErrors] = useState([]);
  const [errorsNameRut, setErrorsNameRut] = useState({
    nombre: false,
    rut: false
  });
  const [showAlerts, setShowAlerts] = useState({
    success: { state: false, message: "" },
    error: { state: false, message: "" },
  });
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [countries, setCountries] = useState()
  const [regions, setRegions] = useState()

  const [form] = Form.useForm();
  //change later
  form?.setFieldsValue(data)
  const [formValues, setFormValues] = useState();
  const [messageApi, contextHolder] = message.useMessage();
  const successMsg = () => {
    messageApi.open({
      type: 'success',
      content: 'Sucursal editada exitosamente.',
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };

  const errorMsg = () => {
    messageApi.open({
      type: 'error',
      content: 'Ocurrio un error al editar la sucursal, revise los campos.',
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };

  useEffect(() => {
    const getCountries = async () => {
      if (showModal) {
        const response = await fetch("https://restfulcountries.com/api/v1/countries", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS}`,
          },
        });
        const data = await response.json()
        setCountries(data?.data)
      }
    }
    const getRegion = async () => {
      if (country !== '' && showModal) {
        const response = await fetch(`https://restfulcountries.com/api/v1/countries/${country}/states`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS}`,
          },
        });
        const data = await response.json()
        setRegions(data?.data)
      }
    }
    getCountries()
    getRegion()


  }, [showModal, country])


  const onCreate = async (values) => {
    console.log('Received values of form: ', values);
    const token = Cookies.get("user");
    const response = await fetch(`${import.meta.env.VITE_API_URL}/branches`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(values),
    });
    const data = await response?.json();
    !response.ok && errorMsg(data?.message || 'Error al editar la sucursal')
    response.ok && successMsg()
    console.log(data)
    setFormValues(values);
    //setShowModal(false);
  };


  const handleDaySelection = (day) => {
    // Si el día ya está seleccionado, lo eliminamos
    if (selectedDays?.includes(day)) {
      setSelectedDays(selectedDays?.filter(d => d !== day));
      form.setFieldValue('availableBonusDays', form?.getFieldValue('availableBonusDays')?.filter(shift => shift?.day !== day));
    } else {
      // Si no está seleccionado, lo añadimos
      setSelectedDays([...selectedDays, day]);
      form.setFieldValue('availableBonusDays', [...(form.getFieldValue('availableBonusDays') || []), { day, schedule: [null] }]);
    }
  };


  const handleAlert = (type, message) => {
    setShowAlerts({ ...showAlerts, [type]: { state: true, message } });
    return setTimeout(() => {
      setShowAlerts({ ...showAlerts, [type]: { state: false, message: "" } });
    }, 2500);
  };


  const handleCloseModal = () => {
    setCountry('')
    setRegion('')
    setErrors([])
    setErrorsNameRut({
      nombre: false,
      rut: false
    })
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  return (
    <>
      <Button onClick={handleOpenModal} icon={<EyeOutlined />} />
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
          name="creationDate"
          label="Fecha de creación"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          name="name"
          label="Nombre de la sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="numberOfEmployees"
          label="Cantidad de trabajadores"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input type="number" />
        </Form.Item>


        <Form.Item
          name="company_id"
          label="Seleccione la empresa"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select showSearch placeholder="Seleccione la empresa">
            {
              companies?.map(company => (
                <Select.Option key={company?.id} value={company?.id}>{company?.name}</Select.Option>
              ))
            }
          </Select>
        </Form.Item>

        <Form.Item
          name="state_id"
          label="Seleccione el estado"
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

        <Divider className="font-bold text-3xl">Dirección</Divider>

        <div className="flex gap-5">
          <Form.Item
            className="w-6/12"
            name="branchAddressCountry"
            label="País"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Select onChange={() => setCountry(form?.getFieldsValue()?.branchAddressCountry)} showSearch placeholder="Seleccionar país">
              {
                countries?.map(country => (
                  <Select.Option key={country?.name} value={country?.name}>{country?.name}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            className="w-6/12"
            label="Región"
            name="branchAddressRegion"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Select showSearch placeholder="Seleccionar región">
              {
                regions?.map(region => (
                  <Select.Option key={region?.name} value={region?.name}>{region?.name}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="branchAddressProvince"
          label="Provincia"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="branchAddressCommune"
          label="Comuna"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-9/12"
            name="branchAddressStreet"
            label="Calle"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            className="w-3/12"
            name="branchAddressNumber"
            label="Numero"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input type="number" />
          </Form.Item>

        </div>
        <div className="flex gap-3">
          <Form.Item
            className="w-6/12"
            name="branchAddressLocal"
            label="Local"
          >
            <Input />
          </Form.Item>
          <Form.Item
            className="w-6/12"
            name="branchAddressDeptOrHouse"
            label="Departamento / Casa"
          >
            <Input />
          </Form.Item>

        </div>

        <Divider className="font-bold text-3xl">Turnos</Divider>


        <Form.List name="shifts">
          {(fields, { add, remove }) => (
            <div
              style={{
                display: 'flex',
                rowGap: 16,
                flexDirection: 'column',
              }}
            >
              {fields.map((field) => (
                <Card
                  size="small"
                  title={`Turno ${field.name + 1}`}
                  key={field.key}

                >
                  <div className="flex flex-wrap justify-between">
                    <Form.Item className="w-5/12" shouldUpdate rules={[{ required: true, message: getValidationRequiredMessage }]} label="Desde" name={[field.name, 'day_init']}>
                      <Select showSearch placeholder="Seleccionar region">
                        {
                          days?.map(day => (
                            <Select.Option key={day?.id} value={day?.name}>{day?.name}</Select.Option>
                          ))
                        }
                      </Select>
                    </Form.Item>
                    <Form.Item className="w-5/12" shouldUpdate rules={[{ required: true, message: getValidationRequiredMessage }]} label="Hasta" name={[field.name, 'day_end']}>
                      <Select showSearch placeholder="Seleccionar region">
                        {
                          days?.map(day => (
                            <Select.Option disabled={form.getFieldsValue().shifts?.some(shift => shift?.day === day?.name)} key={day?.id} value={day?.name}>{day?.name}</Select.Option>
                          ))
                        }
                      </Select>
                    </Form.Item>
                  </div>

                  <Form.Item label="Horarios">
                    <Form.List name={[field.name, 'schedules']}>
                      {(subFields, subOpt) => (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {subFields.map((subField) => (
                            <Space key={subField.key}>
                              <Form.Item label="Hora de inicio" rules={[{ required: true, message: getValidationRequiredMessage }]} name={[subField.name, 'start']}>
                                <Input type="time" />
                              </Form.Item>
                              <Form.Item label="Hora de fin" rules={[{ required: true, message: getValidationRequiredMessage }]} name={[subField.name, 'end']}>
                                <Input type="time" />
                              </Form.Item>

                            </Space>
                          ))}
                        </div>
                      )}
                    </Form.List>
                  </Form.Item>
                </Card >
              ))}

            </div>
          )}
        </Form.List>

        <Divider className="font-bold text-3xl">Disponibilidad de los bonos</Divider>

        <Form.Item >
          <div>
            {days?.map(day => (
              <Tag.CheckableTag
                key={day?.id}
                checked={selectedDays?.includes(day?.name)}
              >
                {day?.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </Form.Item>

        <Form.List name="available_bonus_days">
          {(fields, { add, remove }) => (
            <div
              style={{
                display: 'flex',
                rowGap: 16,
                flexDirection: 'column',
              }}
            >
              {selectedDays.map((day, index) => (
                <Card
                  size="small"
                  title={`Día: ${day}`}
                  key={day}
                >
                  <Form.List name={[index, 'schedules']}>
                    {(subFields, subOpt) => (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {subFields.map((subField) => (
                          <Space key={subField.key} align="baseline">
                            <Form.Item
                              label="Hora de inicio"
                              rules={[{ required: true, message: getValidationRequiredMessage }]}
                              name={[subField.name, 'start']}
                            >
                              <Input type="time" />
                            </Form.Item>
                            <Form.Item
                              label="Hora de fin"
                              rules={[{ required: true, message: getValidationRequiredMessage }]}
                              name={[subField.name, 'end']}
                            >
                              <Input type="time" />
                            </Form.Item>
                          </Space>
                        ))}
                      </div>
                    )}
                  </Form.List>
                </Card>
              ))}
            </div>
          )}
        </Form.List>

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