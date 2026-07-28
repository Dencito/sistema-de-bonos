import { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Select, Space, Card, Tag, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import ScheduleModal from './ScheduleModal';
import { countriesService, branchService } from '@services/api';

export default function ModalCreateBranch({ companies }) {
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
  const [ticketsEnabled, setTicketsEnabled] = useState(true);

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

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

  const handleAvailableScheduleSave = (schedules) => {
    setAvailableSchedules(schedules);
    form.setFieldsValue({ available_schedules: JSON.stringify(schedules) });
  };

  const handleBonusScheduleSave = (schedules) => {
    setBonusSchedules(schedules);
    form.setFieldsValue({ bonus_schedules: JSON.stringify(schedules) });
  };

  const onCreate = async (values) => {
    try {
      setLoading(true);

      // Asegurarse de que company_id esté establecido
      if (!values.company_id && companies?.length > 0) {
        values.company_id = companies[0].id;
      }

      const { success, message } = await branchService.create({
        ...values,
        bonus_attendance_enabled: attendanceEnabled,
        bonus_attendance_days: JSON.stringify(attendanceDays || []),
        bonus_category_payout_day: categoryPayoutDay,
        tickets_enabled: ticketsEnabled,
      });
      if (!success) {
        errorMsg(message);
        return;
      }
      successMsg(message);
      router.visit(window.location.href, {
        preserveState: false,
      });
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la sucursal';
      errorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setCountry('');
    setAvailableSchedules([]);
    setBonusSchedules([]);
    setAttendanceEnabled(false);
    setAttendanceDays([]);
    setCategoryPayoutDay(null);
    setTicketsEnabled(true);
    form.resetFields();
    setLoading(false);
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  };

  return (
    <>
      <Button
        type="primary"
        onClick={handleOpenModal}
        icon={<PlusOutlined />}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 hover:from-blue-600 hover:to-cyan-600"
      >
        Nueva Sucursal
      </Button>
      <Modal
        style={{ top: 20 }}
        title={
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <PlusOutlined className="text-white text-sm" />
            </div>
            <span className="text-lg font-semibold">Crear Nueva Sucursal</span>
          </div>
        }
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        className="rounded-2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <Form form={form} onFinish={onCreate} layout="vertical" className="space-y-6">
            {/* Información General */}
            <Card
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold">Información General</span>
                </div>
              }
              className="shadow-sm border-gray-200"
              size="small"
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="creationDate"
                  label="Fecha de creación"
                  initialValue={new Date().toJSON().slice(0, 10)}
                  className="col-span-2"
                >
                  <Input disabled className="bg-gray-50" />
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
                  className="col-span-2"
                >
                  <Input showCount maxLength={30} placeholder="Ej: Sucursal Centro" />
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
                    placeholder="0"
                  />
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
                  <Input
                    name="birthday_amount"
                    onChange={onlyNumberInput}
                    showCount
                    maxLength={15}
                    placeholder="0"
                  />
                </Form.Item>
              </div>
            </Card>

            {/* Dirección */}
            <Card
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold">Dirección</span>
                </div>
              }
              className="shadow-sm border-gray-200"
              size="small"
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
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
                      <Select.Option
                        key={country?.name}
                        value={country?.name}
                        label={country?.name}
                      >
                        {country?.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
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
                  <Input showCount maxLength={30} placeholder="Ej: Santiago" />
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
                  <Input showCount maxLength={30} placeholder="Ej: Providencia" />
                </Form.Item>

                <Form.Item
                  name="branchAddressStreet"
                  label="Calle"
                  rules={[
                    {
                      required: true,
                      message: getValidationRequiredMessage,
                    },
                  ]}
                  className="col-span-2"
                >
                  <Input showCount maxLength={30} placeholder="Ej: Av. Libertador" />
                </Form.Item>

                <Form.Item
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
                    placeholder="123"
                  />
                </Form.Item>

                <Form.Item name="branchAddressLocal" label="Local">
                  <Input showCount maxLength={10} placeholder="Ej: Local 1" />
                </Form.Item>

                <Form.Item
                  name="branchAddressDeptOrHouse"
                  label="Departamento / Casa"
                  className="col-span-2"
                >
                  <Input showCount maxLength={10} placeholder="Ej: Depto 101" />
                </Form.Item>
              </div>
            </Card>

            {/* Horarios */}
            <Card
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold">Horarios</span>
                </div>
              }
              className="shadow-sm border-gray-200"
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Horarios Disponibles</p>
                      <p className="text-sm text-blue-700">Configura los turnos de trabajo</p>
                    </div>
                    <Button
                      onClick={() => setAvailableScheduleModalVisible(true)}
                      type="primary"
                      className="bg-blue-600"
                    >
                      {availableSchedules.length === 3 ? 'Ver turnos' : 'Agregar turno'}
                    </Button>
                  </div>
                  {availableSchedules.length > 0 && (
                    <div className="mt-3 flex items-center space-x-2">
                      <Tag color="green" className="m-0">
                        {availableSchedules.length}{' '}
                        {availableSchedules.length === 1 ? 'turno creado' : 'turnos creados'}
                      </Tag>
                      {availableSchedules.length === 3 && (
                        <Tag color="orange" className="m-0">
                          Límite máximo alcanzado
                        </Tag>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">Horarios de Bonos</p>
                      <p className="text-sm text-purple-700">Configura cuándo se pagan los bonos</p>
                    </div>
                    <Button
                      onClick={() => setBonusScheduleModalVisible(true)}
                      type="primary"
                      className="bg-purple-600"
                    >
                      Configurar
                    </Button>
                  </div>
                  {bonusSchedules.length > 0 && (
                    <div className="mt-3">
                      <Tag color="purple" className="m-0">
                        {bonusSchedules.length} horarios configurados
                      </Tag>
                    </div>
                  )}
                </div>
              </Space>
            </Card>

            {/* Asistencia para Bonos Diarios */}
            <Card
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold">Asistencia para Bonos Diarios</span>
                </div>
              }
              className="shadow-sm border-gray-200"
              size="small"
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={attendanceEnabled}
                    onChange={(e) => setAttendanceEnabled(e.target.checked)}
                    className="mt-1"
                  >
                    <span className="font-medium">Activar sistema de asistencia</span>
                  </Checkbox>
                </div>

                {attendanceEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                    <Form.Item
                      label="Días sin bono"
                      extra="Selecciona los días donde no se paga bono (ej: domingo a jueves)"
                    >
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

                    <Form.Item
                      label="Día de cobro del bono"
                      extra="Día donde se verifica asistencia y se paga bono acumulado"
                    >
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

                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <p>
                        <strong>Nota:</strong> El viernes siempre se da bono diario normal. El día
                        de cobro verifica si asistió todos los días configurados + viernes usando
                        registros de huella.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Configuracion de Tickets */}
            <Card
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold">Configuracion de Tickets</span>
                </div>
              }
              className="shadow-sm border-gray-200"
              size="small"
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={ticketsEnabled}
                    onChange={(e) => setTicketsEnabled(e.target.checked)}
                    className="mt-1"
                  >
                    <span className="font-medium">Habilitar tickets de bonos</span>
                  </Checkbox>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p>
                    <strong>Nota:</strong> Si los tickets estan desactivados, al marcar la huella
                    solo se registrara la asistencia sin generar tickets de bonos.
                  </p>
                </div>
              </div>
            </Card>

            <Form.Item hidden name="available_schedules">
              <Input />
            </Form.Item>

            <Form.Item hidden name="bonus_schedules">
              <Input />
            </Form.Item>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button onClick={handleCloseModal} size="large">
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 hover:from-blue-600 hover:to-cyan-600"
              >
                Crear Sucursal
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <ScheduleModal
        open={availableScheduleModalVisible}
        onClose={() => setAvailableScheduleModalVisible(false)}
        onSave={handleAvailableScheduleSave}
        initialValue={availableSchedules}
      />

      <ScheduleModal
        open={bonusScheduleModalVisible}
        onClose={() => setBonusScheduleModalVisible(false)}
        onSave={handleBonusScheduleSave}
        initialValue={bonusSchedules}
      />
    </>
  );
}
