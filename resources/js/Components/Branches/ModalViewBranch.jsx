import { useState } from "react";
import { Button, Divider, Form, Input, Modal, Select, Space,  Card,Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { getValidationRequiredMessage } from "@utils/messagesValidationes";
import { days } from "./days";

export default function ModalViewBranch({ data, states, companies }) {
  const [showModal, setShowModal] = useState(false);
  // const [selectedDays, setSelectedDays] = useState(data?.available_bonus_days?.map((bonusDays) => bonusDays.day));

  const [form] = Form.useForm();
  //change later
  form?.setFieldsValue(data)

  const handleCloseModal = () => {
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
        cancelText="Cerrar"
        onCancel={handleCloseModal}
        destroyOnClose
        okButtonProps={{ style: { display: 'none' } }}
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
        {/* Datos de la sucursal */}
        <Form.Item name="creationDate" label="Fecha de creación">
          <Input disabled />
        </Form.Item>
        <Form.Item name="name" label="Nombre de la sucursal" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Input />
        </Form.Item>
        <Form.Item name="numberOfEmployees" label="Cantidad de trabajadores" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="company_id" label="Seleccione la empresa" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Select showSearch placeholder="Seleccione la empresa">
            {companies?.map((company) => (
              <Select.Option key={company?.id} value={company?.id}>
                {company?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="state_id" label="Seleccione el estado" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Select showSearch placeholder="Seleccione el estado">
            {states?.map((state) => (
              <Select.Option key={state?.id} value={state?.id}>
                {state?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Dirección de la sucursal */}
        <Divider className="font-bold text-3xl">Dirección</Divider>
        <div className="flex gap-5">
          <Form.Item className="w-6/12" name="branchAddressCountry" label="País" rules={[{ required: true, message: getValidationRequiredMessage }]}>
            <Select showSearch placeholder="Seleccionar país">
              <Select.Option>{data?.branchAddressCountry}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item className="w-6/12" name="branchAddressRegion" label="Región" rules={[{ required: true, message: getValidationRequiredMessage }]}>
            <Select showSearch placeholder="Seleccionar región">
              <Select.Option>{data?.branchAddressRegion}</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <Form.Item name="branchAddressProvince" label="Provincia" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Input />
        </Form.Item>
        <Form.Item name="branchAddressCommune" label="Comuna" rules={[{ required: true, message: getValidationRequiredMessage }]}>
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item className="w-9/12" name="branchAddressStreet" label="Calle" rules={[{ required: true, message: getValidationRequiredMessage }]}>
            <Input />
          </Form.Item>
          <Form.Item className="w-3/12" name="branchAddressNumber" label="Número" rules={[{ required: true, message: getValidationRequiredMessage }]}>
            <Input type="number" />
          </Form.Item>
        </div>
        <div className="flex gap-3">
          <Form.Item className="w-6/12" name="branchAddressLocal" label="Local">
            <Input />
          </Form.Item>
          <Form.Item className="w-6/12" name="branchAddressDeptOrHouse" label="Departamento / Casa">
            <Input />
          </Form.Item>
        </div>

        {/* Turnos */}
        <Divider className="font-bold text-3xl">Turnos</Divider>
        <Form.List name="shifts">
          {(fields) => (
            <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
              {fields.map((field) => (
                <Card size="small" title={`Turno ${field.name + 1}`} key={field.key}>
                  <div className="flex flex-wrap justify-between">
                    <Form.Item
                      className="w-5/12"
                      label="Desde"
                      name={[field.name, 'day_init']}
                      rules={[{ required: true, message: getValidationRequiredMessage }]}
                    >
                      <Select showSearch placeholder="Seleccionar día">
                        {days?.map((day) => (
                          <Select.Option key={day?.id} value={day?.name}>
                            {day?.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      className="w-5/12"
                      label="Hasta"
                      name={[field.name, 'day_end']}
                      rules={[{ required: true, message: getValidationRequiredMessage }]}
                    >
                      <Select showSearch placeholder="Seleccionar día">
                        {days?.map((day) => (
                          <Select.Option
                            disabled={form.getFieldsValue().shifts?.some((shift) => shift?.day === day?.name)}
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
                      {(subFields) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {subFields.map((subField) => (
                            <Space key={subField.key}>
                              <Form.Item label="Hora de inicio" name={[subField.name, 'start']} rules={[{ required: true, message: getValidationRequiredMessage }]}>
                                <Input type="time" />
                              </Form.Item>
                              <Form.Item label="Hora de fin" name={[subField.name, 'end']} rules={[{ required: true, message: getValidationRequiredMessage }]}>
                                <Input type="time" />
                              </Form.Item>
                            </Space>
                          ))}
                        </div>
                      )}
                    </Form.List>
                  </Form.Item>
                </Card>
              ))}
            </div>
          )}
        </Form.List>

        {/* Disponibilidad de los bonos */}
        <Divider className="font-bold text-3xl">Disponibilidad de los bonos</Divider>
        <Form.Item>
          <div>
            {data?.available_bonus_days?.map((bonus) => (
              <Tag.CheckableTag key={bonus?.id} checked>
                {bonus?.day}
              </Tag.CheckableTag>
            ))}
          </div>
        </Form.Item>
      </Modal>
    </>
  );
}