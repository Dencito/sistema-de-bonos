import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, Modal, Select, Space, Card, Tag } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import { getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from "@inertiajs/react";
import axios from "axios";
import { days } from "./days";
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalEditBranch({ data, states, companies }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [isEditable, setIsEditable] = useState(false);
  const [isEditableAvailableBonusDays, setIsEditableAvailableBonusDays] = useState(false);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [countries, setCountries] = useState()
  const [regions, setRegions] = useState()
  const [selectedDays, setSelectedDays] = useState(data?.available_bonus_days?.map((bonusDays) => bonusDays?.day));

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  }

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


  const onEdit = async (values) => {
    console.log('Received values of form: ', values);
    try {
      setLoading(true)
      const { data: dataUpdate } = await axios.put(`/branches`, { id: data?.id, ...values });
      console.log(dataUpdate)
      if (dataUpdate?.changes?.length === 0) {
        setLoading(false)
        return errorMsg("Usted no modifico ningun dato.")
      }
      router.visit('/branches', {
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
    /* 
    setFormValues(values); */

  };

  const deleteShift = async (shiftIndex, remove) => {
    const shift = form.getFieldValue(['shifts', shiftIndex]);
    console.log(shift)
    if (!shift?.id) {
      return remove(shiftIndex)
    }
    try {
      const { data: dataUpdate } = await axios.delete(`/branches/shifts/${shift?.id}`);
      console.log(dataUpdate)
      router.visit('/branches', {
        preserveState: true,
      });
      if (dataUpdate) {
        remove(shiftIndex)
        return successMsg(dataUpdate?.message);
      }
    } catch (error) {
      const { response: { data: dataError } } = error;
      errorMsg(dataError?.message);
      return { error: true }
    }

  };

  const updateShifts = async () => {
    const values = form.getFieldsValue();
    try {
      const findScheduleUndefined = values?.shifts?.some(
        (shift) => !shift?.schedules || shift?.schedules?.length === 0
      );

      if (
        values?.shifts?.length === 0 ||
        findScheduleUndefined ||
        values?.shifts === undefined
      ) {
        return errorMsg(
          "La sucursal debe contar con al menos un turno con horario definido"
        );
      }
      const { data: dataUpdate } = await axios.put(`/branches/shifts`, {
        branch_id: data?.id,
        shifts: form.getFieldValue('shifts'),
      });
      console.log("shifst update", form.getFieldValue('shifts'))
      router.visit('/branches', {
        preserveState: true,
      });
      dataUpdate && successMsg(dataUpdate?.message);
    } catch (error) {
      const { response: { data: dataError } } = error;
      return errorMsg(dataError?.message);
    }

  };

  const updateShiftsAvailableBonus = async () => {
    const values = form.getFieldsValue();
    try {
      const findAvailableBonusScheduleUndefined =
        values?.available_bonus_days?.some(
          (availableBonusDay) =>
            !availableBonusDay?.schedules ||
            availableBonusDay?.schedules?.length === 0
        );

      if (
        values?.available_bonus_days?.length === 0 ||
        findAvailableBonusScheduleUndefined ||
        values?.available_bonus_days === undefined
      ) {
        return errorMsg(
          "La sucursal debe contar con al menos un horario para los bonos definido"
        );
      }
      const { data: dataUpdate } = await axios.put(`/branches/shifts-available-bonus-days`, {
        branch_id: data?.id,
        available_bonus_days: form.getFieldValue('available_bonus_days'),
      });
      console.log("shifst update", form.getFieldValue('shifts'))
      router.visit('/branches', {
        preserveState: true,
      });
      dataUpdate && successMsg(dataUpdate?.message);
    } catch (error) {
      console.log(error)
      const { response: { data: dataError } } = error;
      return errorMsg(dataError?.message);
    }

  };


  const deleteShiftAvailableBonus = async (shiftIndex, remove) => {
    const shift = form.getFieldValue(['available_bonus_days', shiftIndex]);
    console.log(shift)
    if (!shift?.id) {
      return remove(shiftIndex)
    }
    try {
      const { data: dataUpdate } = await axios.delete(`/branches/shifts-available-bonus-days/${shift?.id}`);
      console.log(dataUpdate)
      router.visit('/branches', {
        preserveState: true,
      });
      if (dataUpdate) {
        remove(shiftIndex)
        return successMsg(dataUpdate?.message);
      }
    } catch (error) {
      const { response: { data: dataError } } = error;
      errorMsg(dataError?.message);
      return { error: true }
    }

  };


  const handleCloseModal = () => {
    setCountry('')
    setRegion('')
    setIsEditable(false)
    setIsEditableAvailableBonusDays(false)
    setSelectedDays(data?.available_bonus_days?.map((bonusDays) => bonusDays?.day))
    setLoading(false)
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleDaySelection = (day) => {
    const currentBonusDays = form.getFieldValue("available_bonus_days") || [];

    // Si el día ya está seleccionado, lo eliminamos
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));

      // Filtramos para eliminar el día de la lista actual
      const updatedBonusDays = currentBonusDays.filter((shift) => shift?.day !== day);
      form.setFieldValue("available_bonus_days", updatedBonusDays);
    } else {
      // Si no está seleccionado, lo añadimos
      setSelectedDays([...selectedDays, day]);

      // Agregamos el nuevo día en el formato correcto
      const updatedBonusDays = [
        ...currentBonusDays,
        {
          day, // Incluimos el campo 'day'
          schedules: [{ start: null, end: null }] // Inicializamos con valores por defecto
        }
      ];

      form.setFieldValue("available_bonus_days", updatedBonusDays);
    }

    console.log(form.getFieldsValue()?.available_bonus_days);
  };



  return (
    <>

      <Button onClick={handleOpenModal} icon={<EditOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Editando: {data?.name}</p>}
        open={showModal}
        onCancel={() => Modal.confirm({
          title: '¿Estás seguro de que quieres salir?',
          content: 'Se borrarán todos los datos no guardados.',
          okText: 'Sí',
          okType: 'danger',
          cancelText: 'No',
          onOk() {
            handleCloseModal();
          },
        })}
        okText="Editar"
        cancelText="Cancelar"
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
          loading: loading,
          disabled: loading,
        }}
        cancelButtonProps={{
          disabled: loading,
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
            onFinish={(values) => onEdit(values)}
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
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="numberOfEmployees"
          label="Cantidad de trabajadores"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input name="numberOfEmployees" onChange={onlyNumberInput} showCount maxLength={4} />
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
            label="País"
            name="branchAddressCountry"
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
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="branchAddressCommune"
          label="Comuna"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-9/12"
            name="branchAddressStreet"
            label="Calle"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input showCount maxLength={30} />
          </Form.Item>
          <Form.Item
            className="w-3/12"
            name="branchAddressNumber"
            label="Numero"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input name="branchAddressNumber" onChange={onlyNumberInput} showCount maxLength={6} />
          </Form.Item>

        </div>
        <div className="flex gap-3">
          <Form.Item
            className="w-6/12"
            name="branchAddressLocal"
            label="Local"
          >
            <Input showCount maxLength={10} />
          </Form.Item>
          <Form.Item
            className="w-6/12"
            name="branchAddressDeptOrHouse"
            label="Departamento / Casa"
          >
            <Input showCount maxLength={10} />
          </Form.Item>

        </div>

        <Divider className="font-bold text-3xl">Turnos</Divider>
        <Card className={`b ${isEditable ? '' : 'bg-gray-200'}`}>
          <Button
            onClick={() => {
              !isEditable ?
                Modal.confirm({
                  title: `¿Estás seguro de que quieres editar los turnos?`,
                  content: 'Al eliminar un turno existente, se borrara, sin vuelta atras.',
                  okText: 'Sí',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk() {
                    setIsEditable(!isEditable);
                  },
                }) :
                setIsEditable(!isEditable);
            }}
            style={{ marginBottom: 16 }}
          >
            {isEditable ? 'Desactivar edición' : 'Activar edición'}
          </Button>
          <Form.List
            name="shifts">
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
                    extra={
                      isEditable && (
                        <CloseOutlined
                          onClick={() => {
                            console.log(form.getFieldValue('shifts').length <= 1)
                            if (form.getFieldValue('shifts').length <= 1) {
                              errorMsg("La sucursal debe tener al menos un turno.")
                            } else {
                              const shift = form.getFieldValue(['shifts', field?.name]);
                              if (!shift?.id) {
                                return remove(field?.name)
                              }
                              Modal.confirm({
                                title: '¿Estás seguro que deseas eliminar el turno junto a sus horarios?',
                                content: 'Se borrarán todos los datos.',
                                okText: 'Sí',
                                okType: 'danger',
                                cancelText: 'No',
                                onOk() {
                                  deleteShift(field?.name, remove);
                                },
                              })
                            }
                          }
                          }
                        />
                      )
                    }
                    style={{
                      opacity: isEditable ? 1 : 0.6,
                      cursor: isEditable ? 'auto' : 'not-allowed',
                    }}
                  >
                    <div className="flex flex-wrap justify-between">
                      <Form.Item
                        className="w-5/12"
                        shouldUpdate
                        rules={[{ required: true, message: getValidationRequiredMessage }, {
                          validator(_, value) {
                            const selectedDays = form.getFieldsValue().shifts || [];
                            const currentShift = selectedDays.find((shift) => shift.day_init === value);

                            if (currentShift && currentShift.day_init && currentShift.day_end) {
                              const dayOrder = days?.map(day => day?.name);
                              if (dayOrder.indexOf(currentShift.day_init) > dayOrder.indexOf(currentShift.day_end)) {
                                return Promise.reject(new Error('El día de inicio debe ser antes o igual al día de fin.'));
                              }
                            }
                            return Promise.resolve();
                          }
                        }]}
                        label="Desde"
                        name={[field.name, 'day_init']}
                      >
                        <Select
                          showSearch
                          placeholder="Seleccionar dia"
                          disabled={!isEditable}
                        >
                          {days?.map(day => (
                            <Select.Option
                              key={day?.id}
                              value={day?.name}
                            >
                              {day?.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        className="w-5/12"
                        shouldUpdate
                        rules={[{ required: true, message: getValidationRequiredMessage },
                        {
                          validator(_, value) {
                            const selectedShifts = form.getFieldsValue().shifts || [];
                            const currentShift = selectedShifts.find((shift) => shift.day_end === value);

                            if (currentShift && currentShift.day_init && currentShift.day_end) {
                              const dayOrder = days?.map(day => day?.name);
                              if (dayOrder.indexOf(currentShift.day_init) > dayOrder.indexOf(currentShift.day_end)) {
                                return Promise.reject(new Error('El día de inicio debe ser antes o igual al día de fin.'));
                              }
                            }
                            return Promise.resolve();
                          }
                        }
                        ]}
                        label="Hasta"
                        name={[field.name, 'day_end']}
                      >
                        <Select
                          showSearch
                          placeholder="Seleccionar dia"
                          disabled={!isEditable}
                        >
                          {days?.map(day => (
                            <Select.Option
                              disabled={
                                form.getFieldsValue().shifts?.some(shift => shift?.day === day?.name)
                              }
                              key={day?.id}
                              value={day?.name}
                            >
                              {day?.name}
                            </Select.Option>
                          ))}
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
                                <Form.Item
                                  label="Hora de inicio"
                                  rules={[
                                    { required: true, message: getValidationRequiredMessage() },
                                    {
                                      validator(_, value) {
                                        const currentSchedule = form.getFieldsValue().shifts?.[field.name]?.schedules || [];
                                        const currentEntry = currentSchedule[subField.name];
                                        const endTime = form.getFieldValue(['shifts', field.name, 'schedules', subField.name, 'end']);

                                        // Solo realizar validaciones si ambas horas están presentes
                                        if (value && endTime) {
                                          if (value >= endTime) {
                                            return Promise.reject(new Error('La hora de inicio debe ser anterior a la hora de fin.'));
                                          }

                                          const isOverlapping = currentSchedule.some((schedule, index) => {
                                            if (index !== subField.name) {
                                              const otherStart = schedule.start;
                                              const otherEnd = schedule.end;
                                              return (
                                                (value >= otherStart && value < otherEnd) ||
                                                (endTime > otherStart && endTime <= otherEnd)
                                              );
                                            }
                                            return false;
                                          });

                                          if (isOverlapping) {
                                            return Promise.reject(new Error('Los horarios no deben solaparse.'));
                                          }
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  name={[subField.name, 'start']}
                                >
                                  <Input
                                    type="time"
                                    disabled={!isEditable}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label="Hora de fin"
                                  rules={[{ required: true, message: getValidationRequiredMessage() },
                                  {
                                    validator(_, value) {
                                      const currentSchedule = form.getFieldsValue().shifts?.[field.name]?.schedules || [];
                                      const currentEntry = currentSchedule[subField.name];
                                      const startTime = form.getFieldValue(['shifts', field.name, 'schedules', subField.name, 'start']);

                                      // Solo realizar validaciones si ambas horas están presentes
                                      if (startTime && value) {
                                        if (startTime >= value) {
                                          return Promise.reject(new Error('La hora de inicio debe ser anterior a la hora de fin.'));
                                        }

                                        const isOverlapping = currentSchedule.some((schedule, index) => {
                                          if (index !== subField.name) {
                                            const otherStart = schedule.start;
                                            const otherEnd = schedule.end;
                                            return (
                                              (startTime >= otherStart && startTime < otherEnd) ||
                                              (value > otherStart && value <= otherEnd)
                                            );
                                          }
                                          return false;
                                        });

                                        if (isOverlapping) {
                                          return Promise.reject(new Error('Los horarios no deben solaparse.'));
                                        }
                                      }

                                      return Promise.resolve();
                                    },
                                  },
                                  ]}
                                  name={[subField.name, 'end']}
                                >
                                  <Input
                                    type="time"
                                    disabled={!isEditable}
                                  />
                                </Form.Item>
                                {isEditable && (
                                  <CloseOutlined
                                    onClick={() => {
                                      if (form.getFieldValue('shifts')?.[field?.name]?.schedules.length <= 1) {
                                        errorMsg("El turno debe tener al menos un horario.")
                                      } else {
                                        subOpt.remove(subField.name);
                                      }
                                    }}
                                  />
                                )}
                              </Space>
                            ))}
                            {isEditable && (
                              <Button
                                type="dashed"
                                onClick={async () => {
                                  subOpt.add();
                                }}
                                block
                              >
                                + Agregar horarios al turno
                              </Button>
                            )}
                          </div>
                        )}
                      </Form.List>
                    </Form.Item>

                  </Card>
                ))}

                {isEditable && (
                  <Button type="dashed" onClick={() => add()} block>
                    + Agregar dias a trabajar
                  </Button>
                )}
              </div>
            )}
          </Form.List>

          {isEditable && (
            <Button
              className="my-10"
              type="primary"
              onClick={async () => {
                updateShifts()
              }}
              block
            >
              Actualizar turnos
            </Button>
          )}
        </Card>

        <Divider className="font-bold text-3xl">Disponibilidad de los bonos</Divider>
        <Button
          onClick={() => {
            !isEditableAvailableBonusDays ?
              Modal.confirm({
                title: `¿Estás seguro de que quieres editar los turnos?`,
                content: 'Al eliminar un turno existente, se borrara, sin vuelta atras.',
                okText: 'Sí',
                okType: 'danger',
                cancelText: 'No',
                onOk() {
                  setIsEditableAvailableBonusDays(!isEditableAvailableBonusDays);
                },
              }) :
              setIsEditableAvailableBonusDays(!isEditableAvailableBonusDays);
          }}
          style={{ marginBottom: 16 }}
        >
          {isEditableAvailableBonusDays ? 'Desactivar edición' : 'Activar edición'}
        </Button>
        <Card className={`b ${isEditableAvailableBonusDays ? '' : 'bg-gray-200'}`} style={{
          opacity: isEditableAvailableBonusDays ? 1 : 0.6,
          cursor: isEditableAvailableBonusDays ? 'auto' : 'not-allowed',
        }}>

          <Form.Item>
            <div>
              {days?.map((day) => (
                <Tag.CheckableTag
                  key={day?.id}
                  checked={selectedDays.includes(day?.name)}
                  onChange={() => isEditableAvailableBonusDays && handleDaySelection(day?.name)}
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
                  display: "flex",
                  rowGap: 16,
                  flexDirection: "column",
                }}
              >
                {selectedDays.map((day, index) => (
                  <Card
                    size="small"
                    title={`Día: ${day}`}
                    key={day}
                    extra={
                      isEditableAvailableBonusDays && (
                        <CloseOutlined
                          onClick={() => {
                            console.log(form.getFieldValue('available_bonus_days').length <= 1)
                            if (form.getFieldValue('available_bonus_days').length <= 1) {
                              errorMsg("La sucursal debe tener al menos un turno.")
                            } else {
                              const shift = form.getFieldValue(['available_bonus_days', index]);
                              if (!shift?.id) {
                                return remove(index)
                              }
                              Modal.confirm({
                                title: '¿Estás seguro que deseas eliminar el turno junto a sus horarios?',
                                content: 'Se borrarán todos los datos.',
                                okText: 'Sí',
                                okType: 'danger',
                                cancelText: 'No',
                                onOk() {
                                  deleteShiftAvailableBonus(index, remove);
                                  handleDaySelection(day);
                                },
                              })
                            }
                          }
                          }
                        />
                      )
                    }
                  >
                    <Form.Item label="Horarios">
                      <Form.List name={[index, "schedules"]}>
                        {(subFields, subOpt) => (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {subFields.map((subField) => (
                              <Space key={subField.key}>
                                <Form.Item
                                  label="Hora de inicio"
                                  rules={[
                                    {
                                      required: true,
                                      message: getValidationRequiredMessage,
                                    },
                                    {
                                      validator(_, value) {
                                        const currentSchedule = form.getFieldsValue().available_bonus_days?.[index]?.schedules || [];
                                        const currentEntry = currentSchedule[subField.name];
                                        const endTime = form.getFieldValue(['available_bonus_days', index, 'schedules', subField.name, 'end']);

                                        // Solo realizar validaciones si ambas horas están presentes
                                        if (value && endTime) {
                                          if (value >= endTime) {
                                            return Promise.reject(new Error('La hora de inicio debe ser anterior a la hora de fin.'));
                                          }

                                          const isOverlapping = currentSchedule.some((schedule, index) => {
                                            if (index !== subField.name) {
                                              const otherStart = schedule.start;
                                              const otherEnd = schedule.end;
                                              return (
                                                (value >= otherStart && value < otherEnd) ||
                                                (endTime > otherStart && endTime <= otherEnd)
                                              );
                                            }
                                            return false;
                                          });

                                          if (isOverlapping) {
                                            return Promise.reject(new Error('Los horarios no deben solaparse.'));
                                          }
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  name={[subField.name, "start"]}
                                >
                                  <Input disabled={!isEditableAvailableBonusDays} type="time" />
                                </Form.Item>

                                <Form.Item
                                  label="Hora de fin"
                                  rules={[
                                    {
                                      required: true,
                                      message: getValidationRequiredMessage,
                                    },
                                    {
                                      validator(_, value) {
                                        const currentSchedule = form.getFieldsValue().available_bonus_days?.[index]?.schedules || [];
                                        const currentEntry = currentSchedule[subField.name];
                                        const startTime = form.getFieldValue(['available_bonus_days', index, 'schedules', subField.name, 'start']);

                                        // Solo realizar validaciones si ambas horas están presentes
                                        if (startTime && value) {
                                          if (startTime >= value) {
                                            return Promise.reject(new Error('La hora de inicio debe ser anterior a la hora de fin.'));
                                          }

                                          const isOverlapping = currentSchedule.some((schedule, index) => {
                                            if (index !== subField.name) {
                                              const otherStart = schedule.start;
                                              const otherEnd = schedule.end;
                                              return (
                                                (startTime >= otherStart && startTime < otherEnd) ||
                                                (value > otherStart && value <= otherEnd)
                                              );
                                            }
                                            return false;
                                          });

                                          if (isOverlapping) {
                                            return Promise.reject(new Error('Los horarios no deben solaparse.'));
                                          }
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  name={[subField.name, "end"]}
                                >
                                  <Input disabled={!isEditableAvailableBonusDays} type="time" />
                                </Form.Item>

                                {isEditableAvailableBonusDays && (
                                  <CloseOutlined onClick={() => subOpt.remove(subField.name)} />
                                )}
                              </Space>
                            ))}

                            {!loading && (
                              <Button type="dashed" onClick={() => subOpt.add()} block>
                                + Agregar horarios al turno
                              </Button>
                            )}
                          </div>
                        )}
                      </Form.List>
                    </Form.Item>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>

          {isEditableAvailableBonusDays && (
            <Button
              className="my-10"
              type="primary"
              onClick={async () => {
                updateShiftsAvailableBonus()
              }}
              block
            >
              Actualizar turnos de los bonos
            </Button>
          )}
        </Card>

        {/* <Form.Item noStyle shouldUpdate>
          {() => (
            <Typography>
              <pre>{JSON.stringify(data?.available_bonus_days, null, 2)}</pre>
            </Typography>
          )}
        </Form.Item> */}
      </Modal>
    </>
  );
}