import { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Card,
  Tag,
} from "antd";
import {
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { days } from "./days";
import { router } from "@inertiajs/react";
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalCreateBranch({ companies }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [countries, setCountries] = useState();
  const [regions, setRegions] = useState();

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();
  useEffect(() => {
    const getCountries = async () => {
      if (showModal) {
        const response = await fetch(
          "https://restfulcountries.com/api/v1/countries",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS
                }`,
            },
          }
        );
        const data = await response.json();
        setCountries(data?.data);
      }
    };
    const getRegion = async () => {
      if (country !== "" && showModal) {
        const response = await fetch(
          `https://restfulcountries.com/api/v1/countries/${country}/states`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS
                }`,
            },
          }
        );
        const data = await response.json();
        setRegions(data?.data);
      }
    };
    getCountries();
    getRegion();
  }, [showModal, country]);

  const handleDaySelection = (day) => {
    // Si el día ya está seleccionado, lo eliminamos
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
      form.setFieldValue(
        "availableBonusDays",
        form
          .getFieldValue("availableBonusDays")
          ?.filter((shift) => shift?.day !== day)
      );
    } else {
      // Si no está seleccionado, lo añadimos
      setSelectedDays([...selectedDays, day]);
      form.setFieldValue("availableBonusDays", [
        ...(form.getFieldValue("availableBonusDays") || []),
        { day, schedule: [null] },
      ]);
    }
  };

  const onCreate = async (values) => {
    console.log("Received values of form: ", values);
    try {
      const findScheduleUndefined = values?.shifts?.some(
        (shift) => !shift?.schedule || shift?.schedule?.length === 0
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

      setLoading(true);
      //Seleccionarlo directo en el back
      values.company_id = companies?.[0]?.id;
      const { data } = await axios.post(`/branches`, values);
      router.visit("/branches", {
        preserveState: true, // Mantener el estado actual
      });
      data && successMsg(data?.message);
      setLoading(false);
      handleCloseModal();
    } catch (error) {
      const {
        response: { data: dataError },
      } = error;
      setLoading(false);
      return errorMsg(dataError?.message);
    }
  };

  const handleCloseModal = () => {
    setCountry("");
    setRegion("");
    setSelectedDays([]);
    setLoading(false);
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className="my-5"
        type="primary"
        shape="circle"
        icon={<PlusOutlined />}
        size={50}
      />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Crear sucursal</p>}
        open={showModal}
        onCancel={() =>
          !loading &&
          Modal.confirm({
            title: "¿Estás seguro de que quieres salir?",
            content: "Se borrarán todos los datos no guardados.",
            okText: "Sí",
            okType: "danger",
            cancelText: "No",
            onOk() {
              handleCloseModal();
            },
          })
        }
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{
          autoFocus: true,
          htmlType: "submit",
          loading: loading, // Estado de carga del botón
          disabled: loading, // Deshabilitar cuando está cargando
        }}
        cancelButtonProps={{
          disabled: loading, // Deshabilitar cuando está cargando
        }}
        destroyOnClose={() =>
          Modal.confirm({
            title: "¿Estás seguro de que quieres salir?",
            content: "Se borrarán todos los datos no guardados.",
            okText: "Sí",
            okType: "danger",
            cancelText: "No",
            onOk() {
              handleCloseModal();
            },
          })
        }
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            initialValues={{
              modifier: "public",
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
          name="creationDate"
          label="Fecha de creación"
          initialValue={new Date().toJSON().slice(0, 10)}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          name="name"
          label="Nombre de la sucursal"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="numberOfEmployees"
          label="Cantidad de trabajadores"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input
            name="numberOfEmployees"
            onChange={onlyNumberInput}
            showCount
            maxLength={4}
          />
        </Form.Item>

        <Divider className="font-bold text-3xl">Dirección</Divider>

        <div className="flex gap-5">
          <Form.Item
            className="w-6/12"
            name="branchAddressCountry"
            label="país"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Select
              onChange={() =>
                setCountry(
                  form?.getFieldsValue()?.branchAddressCountry
                )
              }
              showSearch
              placeholder="Seleccionar país"
            >
              {countries?.map((country) => (
                <Select.Option
                  key={country?.name}
                  value={country?.name}
                >
                  {country?.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            className="w-6/12"
            name="branchAddressRegion"
            label="Región"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Select showSearch placeholder="Seleccionar region">
              {regions?.map((region) => (
                <Select.Option
                  key={region?.name}
                  value={region?.name}
                >
                  {region?.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="branchAddressProvince"
          label="Provincia"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="branchAddressCommune"
          label="Comuna"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={30} />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-9/12"
            name="branchAddressStreet"
            label="Calle"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Input showCount maxLength={30} />
          </Form.Item>
          <Form.Item
            className="w-3/12"
            name="branchAddressNumber"
            label="Numero"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Input
              name="branchAddressNumber"
              onChange={onlyNumberInput}
              showCount
              maxLength={6}
            />
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

        <Form.List name="shifts">
          {(fields, { add, remove }) => (
            <div
              style={{
                display: "flex",
                rowGap: 16,
                flexDirection: "column",
              }}
            >
              {fields.map((field) => (
                <Card
                  size="small"
                  title={`Turno ${field.name + 1}`}
                  key={field.key}
                  extra={
                    !loading && (
                      <CloseOutlined
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    )
                  }
                >
                  <div className="flex flex-wrap justify-between">
                    <Form.Item
                      className="w-5/12"
                      shouldUpdate
                      rules={[
                        {
                          required: true,
                          message:
                            getValidationRequiredMessage,
                        },
                        {
                          validator(_, value) {
                            const selectedDays = form.getFieldsValue().shifts || [];
                            const currentShift = selectedDays.find((shift) => shift.day_init === value);

                            if (currentShift && currentShift.day_init && currentShift.day_end) {
                              const dayOrder = days.map(day => day.name);
                              if (dayOrder.indexOf(currentShift.day_init) > dayOrder.indexOf(currentShift.day_end)) {
                                return Promise.reject(new Error('El día de inicio debe ser antes o igual al día de fin.'));
                              }
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                      label="Desde"
                      name={[field.name, "day_init"]}
                    >
                      <Select
                        showSearch
                        placeholder="Seleccionar dia"
                      >
                        {days?.map((day) => (
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
                      rules={[
                        {
                          required: true,
                          message:
                            getValidationRequiredMessage,
                        },
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
                      name={[field.name, "day_end"]}
                    >
                      <Select
                        showSearch
                        placeholder="Seleccionar dia"
                      >
                        {days?.map((day) => (
                          <Select.Option
                            disabled={form
                              .getFieldsValue()
                              .shifts?.some(
                                (shift) =>
                                  shift?.day ===
                                  day?.name
                              )}
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
                    <Form.List initialValue={[null]} name={[field.name, "schedule"]}>
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
                                      const currentSchedule = form.getFieldsValue().shifts?.[field.name]?.schedule || [];
                                      const currentEntry = currentSchedule[subField.name];
                                      const endTime = form.getFieldValue(['shifts', field.name, 'schedule', subField.name, 'end']);

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
                                <Input type="time" />
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
                                      const currentSchedule = form.getFieldsValue().shifts?.[field.name]?.schedule || [];
                                      const currentEntry = currentSchedule[subField.name];
                                      const startTime = form.getFieldValue(['shifts', field.name, 'schedule', subField.name, 'start']);

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
                                <Input type="time" />
                              </Form.Item>

                              {!loading && (
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

              {!loading && (
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                >
                  + Agregar dias a trabajar
                </Button>
              )}
            </div>
          )}
        </Form.List>

        <Divider className="font-bold text-3xl">
          Disponibilidad de los bonos
        </Divider>

        <Form.Item>
          <div>
            {days?.map((day) => (
              <Tag.CheckableTag
                key={day?.id}
                checked={selectedDays.includes(day?.name)}
                onChange={() => handleDaySelection(day?.name)}
              >
                {day?.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </Form.Item>

        <Form.List name="availableBonusDays">
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
                    !loading && (
                      <CloseOutlined
                        onClick={() => {
                          console.log(fields, index)
                          handleDaySelection(day); // Eliminar el día y su información asociada
                        }}
                      />
                    )
                  }
                >
                  <Form.Item label="Horarios">
                    <Form.List initialValue={[null]} name={[index, "schedule"]}>
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
                                      const currentSchedule = form.getFieldsValue().availableBonusDays?.[index]?.schedule || [];
                                      const currentEntry = currentSchedule[subField.name];
                                      const endTime = form.getFieldValue(['availableBonusDays', index, 'schedule', subField.name, 'end']);

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
                                <Input type="time" />
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
                                      const currentSchedule = form.getFieldsValue().availableBonusDays?.[index]?.schedule || [];
                                      const currentEntry = currentSchedule[subField.name];
                                      const startTime = form.getFieldValue(['availableBonusDays', index, 'schedule', subField.name, 'start']);

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
                                <Input type="time" />
                              </Form.Item>

                              {!loading && (
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

        {/* <Form.Item noStyle shouldUpdate>
          {() => (
            <Typography>
              <pre>
                {JSON.stringify(form.getFieldsValue(), null, 2)}
              </pre>
            </Typography>
          )}
        </Form.Item> */}
      </Modal>
    </>
  );
}
