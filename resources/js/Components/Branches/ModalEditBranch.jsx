import { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Select, Space, Card, Tag, Checkbox } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { useMessage } from '@contexts/MessageShow';
import ScheduleModal from './ScheduleModal';
import { countriesService, branchService } from '@services/api';

export default function ModalEditBranch({ data, statuses }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState();
  const [_, setRegions] = useState();
  const [availableScheduleModalVisible, setAvailableScheduleModalVisible] = useState(false);
  const [bonusScheduleModalVisible, setBonusScheduleModalVisible] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [bonusSchedules, setBonusSchedules] = useState([]);
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [attendanceDays, setAttendanceDays] = useState([]);
  const [categoryPayoutDay, setCategoryPayoutDay] = useState(null);
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  };

  // Función para parsear los horarios
  const parseSchedules = (schedules) => {
    if (!schedules) return [];
    try {
      return typeof schedules === 'string' ? JSON.parse(schedules) : schedules;
    } catch (e) {
      console.error('Error parsing schedules:', e);
      return [];
    }
  };

  useEffect(() => {
    if (showModal && data) {
      form.setFieldsValue({
        ...data,
      });

      // Parsear los horarios
      setAvailableSchedules(parseSchedules(data.available_schedules));
      setBonusSchedules(parseSchedules(data.bonus_schedules));
      setCountry(data.branchAddressCountry);

      // Parsear configuración de asistencia
      setAttendanceEnabled(data.bonus_attendance_enabled || false);
      setAttendanceDays(parseSchedules(data.bonus_attendance_days) || []);
      setCategoryPayoutDay(data.bonus_category_payout_day || null);
    }
  }, [data, showModal]);

  useEffect(() => {
    const getCountries = async () => {
      if (showModal) {
        const data = await countriesService.getAll();
        setCountries(data);
      }
    };
    const getRegion = async () => {
      if (country && showModal) {
        const data = await countriesService.getStates(country);
        setRegions(data);
      }
    };
    getCountries();
    getRegion();
  }, [showModal, country]);

  const onEdit = async (values) => {
    try {
      setLoading(true);
      const response = await branchService.update(data?.id, {
        ...values,
        available_schedules: JSON.stringify(availableSchedules || []),
        bonus_schedules: JSON.stringify(bonusSchedules || []),
        bonus_attendance_enabled: attendanceEnabled,
        bonus_attendance_days: JSON.stringify(attendanceDays || []),
        bonus_category_payout_day: categoryPayoutDay,
      });

      if (response.success) {
        successMsg(response.message);
        router.visit('/branches', {
          preserveState: true,
        });
        handleCloseModal();
      } else {
        errorMsg(response.message);
      }
    } catch {
      errorMsg('Error al actualizar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    form.resetFields();
    setCountry('');
    setLoading(false);
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleAvailableScheduleSave = (schedules) => {
    setAvailableSchedules(schedules);
  };

  const handleBonusScheduleSave = (schedules) => {
    setBonusSchedules(schedules);
  };

  return (
    <>
      <Button onClick={handleOpenModal} icon={<EditOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={<p className="text-3xl text-bold">Editando: {data?.name}</p>}
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={onEdit} layout="vertical" initialValues={data}>
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
            <Input name="numberOfEmployees" onChange={onlyNumberInput} showCount maxLength={4} />
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
            <Input name="birthday_amount" onChange={onlyNumberInput} showCount maxLength={15} />
          </Form.Item>

          <Form.Item
            name="status_id"
            label="Estado"
            rules={[
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Select optionLabelProp="label">
              {statuses?.map((status) => (
                <Select.Option key={status.id} value={status.id} label={status.name}>
                  {status.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Dirección</Divider>

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
              <Select
                onChange={() => {
                  setCountry(form?.getFieldsValue()?.branchAddressCountry);
                  form.setFieldValue('branchAddressRegion', '');
                }}
                showSearch
                placeholder="Seleccionar país"
                optionLabelProp="label"
              >
                {countries?.map((country) => (
                  <Select.Option key={country?.name} value={country?.name} label={country?.name}>
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
              <Select showSearch placeholder="Seleccionar región" optionLabelProp="label">
                {(() => {
                  const selectedCountry = countries?.find(
                    (country) => country?.name === form?.getFieldsValue()?.branchAddressCountry,
                  );
                  const regions =
                    selectedCountry?.provinces ||
                    selectedCountry?.states ||
                    selectedCountry?.parishes ||
                    selectedCountry?.districts ||
                    [];
                  return regions.map((region) => (
                    <Select.Option key={region} value={region} label={region}>
                      {region}
                    </Select.Option>
                  ));
                })()}
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
              label="Número"
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
            <Form.Item className="w-6/12" name="branchAddressLocal" label="Local">
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

          <Divider orientation="left">Horarios</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card title="Horarios Disponibles" size="small">
              <Space>
                <Button onClick={() => setAvailableScheduleModalVisible(true)} type="primary">
                  Editar Turnos
                </Button>
                {availableSchedules?.length > 0 && (
                  <Tag color="green">
                    {availableSchedules?.length}{' '}
                    {availableSchedules?.length === 1 ? 'turno creado' : 'turnos creados'}
                  </Tag>
                )}
              </Space>
            </Card>

            <Card title="Horarios de Bonos" size="small">
              <Space>
                <Button onClick={() => setBonusScheduleModalVisible(true)} type="primary">
                  Configurar Horarios de Bonos
                </Button>
                {bonusSchedules?.length > 0 && (
                  <Tag color="blue">{bonusSchedules?.length} horarios configurados</Tag>
                )}
              </Space>
              <ul>
                {bonusSchedules?.map((schedule, index) => (
                  <li key={index}>
                    <strong>{schedule?.day}</strong> -{' '}
                    {schedule?.ranges?.map((range, rangeIndex) => (
                      <span key={rangeIndex}>
                        {range?.start_time} - {range?.end_time}
                        {rangeIndex < schedule?.ranges?.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </Card>
          </Space>

          <Divider orientation="left">Asistencia para Bonos Diarios</Divider>
          <Card size="small">
            <Form.Item label="Activar sistema de asistencia">
              <Checkbox
                checked={attendanceEnabled}
                onChange={(e) => setAttendanceEnabled(e.target.checked)}
              >
                Habilitar sistema de asistencia para bonos diarios
              </Checkbox>
            </Form.Item>

            {attendanceEnabled && (
              <>
                <Form.Item label="Días sin bono (ej: domingo a jueves)">
                  <Select
                    mode="multiple"
                    placeholder="Selecciona días sin bono"
                    value={attendanceDays}
                    onChange={setAttendanceDays}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="lunes">Lunes</Select.Option>
                    <Select.Option value="martes">Martes</Select.Option>
                    <Select.Option value="miercoles">Miércoles</Select.Option>
                    <Select.Option value="jueves">Jueves</Select.Option>
                    <Select.Option value="viernes">Viernes</Select.Option>
                    <Select.Option value="sabado">Sábado</Select.Option>
                    <Select.Option value="domingo">Domingo</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Día de cobro del bono de categoría (ej: sábado)">
                  <Select
                    placeholder="Selecciona día de cobro"
                    value={categoryPayoutDay}
                    onChange={setCategoryPayoutDay}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="lunes">Lunes</Select.Option>
                    <Select.Option value="martes">Martes</Select.Option>
                    <Select.Option value="miercoles">Miércoles</Select.Option>
                    <Select.Option value="jueves">Jueves</Select.Option>
                    <Select.Option value="viernes">Viernes</Select.Option>
                    <Select.Option value="sabado">Sábado</Select.Option>
                    <Select.Option value="domingo">Domingo</Select.Option>
                  </Select>
                </Form.Item>

                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <p><strong>Nota:</strong> El viernes siempre se da bono diario normal. El día de cobro verifica si asistió todos los días configurados + viernes usando fingerprint logs.</p>
                </div>
              </>
            )}
          </Card>

          <Form.Item>
            <Space style={{ marginTop: '16px' }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Actualizar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <ScheduleModal
        isEditing={true}
        open={availableScheduleModalVisible}
        onClose={() => setAvailableScheduleModalVisible(false)}
        onSave={handleAvailableScheduleSave}
        initialValue={availableSchedules}
      />

      <ScheduleModal
        isEditing={true}
        open={bonusScheduleModalVisible}
        onClose={() => setBonusScheduleModalVisible(false)}
        onSave={handleBonusScheduleSave}
        initialValue={bonusSchedules}
      />
    </>
  );
}
