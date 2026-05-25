import { useState } from 'react';
import { Button, Divider, Form, Input, Modal, Select, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';

export default function ModalViewBranch({ data, statuses, companies }) {
  const [showModal, setShowModal] = useState(false);

  const [form] = Form.useForm();
  //change later
  form?.setFieldsValue(data);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const parsedSchedules = JSON.parse(data.available_schedules || '[]');

  const formatSchedule = (data) => {
    let result = '';

    const maxDayLength = Math.max(
      ...data.flatMap((item) => item.schedules.map((schedule) => schedule.day.length)),
    );

    const maxRangeLength = Math.max(
      ...data.flatMap((item) =>
        item.schedules.flatMap((schedule) =>
          schedule.ranges
            .filter((range) => !(range.start_time === '00:00' && range.end_time === '00:00'))
            .map((range) => `${range.start_time} - ${range.end_time}`.length),
        ),
      ),
    );

    data.forEach((item, index) => {
      result += `\nTurno ${String.fromCharCode(65 + index)}\n`;
      item.schedules.forEach((schedule) => {
        const day = schedule.day.padEnd(maxDayLength, ' ');
        const filteredRanges = schedule.ranges.filter(
          (range) => !(range.start_time === '00:00' && range.end_time === '00:00'),
        );
        if (filteredRanges.length > 0) {
          const ranges = filteredRanges
            .map((range) => `${range.start_time} - ${range.end_time}`)
            .join(' | ')
            .padEnd(maxRangeLength, ' ');
          result += `${day} : ${ranges}\n`;
        }
      });
    });
    return result.trim();
  };

  return (
    <>
      <Button onClick={handleOpenModal} icon={<EyeOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Ver sucursal</p>}
        open={showModal}
        cancelText="Cerrar"
        onCancel={() => handleCloseModal()}
        destroyOnClose={true}
        okButtonProps={{
          style: {
            display: 'none',
          },
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            disabled
            name="form_in_modal"
            initialValues={{
              name: data?.name,
              company_id: data?.company_id,
              status_id: data?.status_id,
              branchAddressStreet: data?.branchAddressStreet,
              branchAddressNumber: data?.branchAddressNumber,
              branchAddressLocal: data?.branchAddressLocal,
              branchAddressDeptOrHouse: data?.branchAddressDeptOrHouse,
            }}
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
          <Input />
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
          <Input type="number" />
        </Form.Item>
        <Form.Item
          name="birthday_amount"
          label="Monto de bono de cumpleaños"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          name="company_id"
          label="Seleccione la empresa"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select showSearch placeholder="Seleccione la empresa" optionLabelProp="label">
            {companies?.map((company) => (
              <Select.Option key={company?.id} value={company?.id} label={company?.name}>
                {company?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Seleccione el estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select showSearch placeholder="Seleccione el estado" optionLabelProp="label">
            {statuses?.map((status) => (
              <Select.Option key={status?.id} value={status?.id} label={status?.name}>
                {status?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider className="font-bold text-3xl">Dirección</Divider>
        <div className="flex gap-5">
          <Form.Item
            className="w-6/12"
            name="branchAddressCountry"
            label="País"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Select showSearch placeholder="Seleccionar país">
              <Select.Option>{data?.branchAddressCountry}</Select.Option>
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
            <Select showSearch placeholder="Seleccionar región">
              <Select.Option>{data?.branchAddressRegion}</Select.Option>
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
          <Input />
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
          <Input />
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
            <Input />
          </Form.Item>
          <Form.Item
            className="w-3/12"
            name="branchAddressNumber"
            label="Número"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
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

        <Divider className="font-bold text-3xl">Turnos</Divider>
        <div className="schedules">
          {parsedSchedules.length > 0 ? (
            <>
              <pre
                style={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre',
                }}
              >
                {formatSchedule(parsedSchedules)}
              </pre>
            </>
          ) : (
            <p>No hay turnos creados</p>
          )}
        </div>

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

        <Divider className="font-bold text-3xl">Asistencia para Bonos Diarios</Divider>
        <Form.Item label="Sistema de asistencia habilitado">
          <Input value={data?.bonus_attendance_enabled ? 'Sí' : 'No'} disabled />
        </Form.Item>

        {data?.bonus_attendance_enabled && (
          <>
            <Form.Item label="Días sin bono">
              <Input
                value={
                  data?.bonus_attendance_days
                    ? (Array.isArray(data.bonus_attendance_days)
                        ? data.bonus_attendance_days.join(', ')
                        : (typeof data.bonus_attendance_days === 'string'
                            ? JSON.parse(data.bonus_attendance_days).join(', ')
                            : 'No configurado'))
                    : 'No configurado'
                }
                disabled
              />
            </Form.Item>

            <Form.Item label="Día de cobro del bono de categoría">
              <Input value={data?.bonus_category_payout_day || 'No configurado'} disabled />
            </Form.Item>
          </>
        )}
      </Modal>
    </>
  );
}
