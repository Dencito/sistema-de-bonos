import { useState } from 'react';
import { Form, Input, DatePicker, Modal, Select, Table, Button, message, Checkbox } from 'antd';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { CustomButton } from '@components-v2/CustomButton';
import { bonusService, userService } from '@services/api';
import { SearchOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/Utils/date';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ModalCreateCustomBonus() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const columns = [
    {
      title: 'Nombre',
      key: 'name',
      render: (_, user) => (
        <span>
          {user?.first_name} {user?.second_name} {user?.first_last_name} {user?.second_last_name}
        </span>
      ),
    },
    {
      title: 'RUT/Código',
      key: 'rut',
      render: (_, user) => (
        <span>
          {user?.rutNumbers && user?.rutDv ? `${user.rutNumbers}-${user.rutDv}` : user?.code}
        </span>
      ),
    },
    {
      title: 'Bonos Diarios',
      dataIndex: 'daily_bonuses_count',
      key: 'daily_bonuses_count',
    },
    {
      title: 'Última Marca',
      key: 'last_fingerprint',
      render: (_, user) => <span>{formatDateTime(user?.fingerprint_logs?.[0]?.created_at)}</span>,
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedUsers.map((user) => user.id),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedUsers(selectedRows);
    },
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const values = await form.validateFields(['date_range', 'bonus_count', 'bonus_type']);

      const dateRange = values.date_range;
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
      const bonusCount = values.bonus_count;
      const bonusType = values.bonus_type;

      // Llamada al API para buscar usuarios según los criterios
      const response = await userService.filterByBonus({
        start_date: startDate,
        end_date: endDate,
        bonus_count: bonusCount,
        bonus_type: bonusType,
      });

      if (response.success) {
        const usersData = response.data.users || [];
        setUsers(usersData);
        // Seleccionar solo los IDs de los usuarios
        setSelectedUsers(usersData.map((user) => ({ id: user.id })));
        message.success(`Se encontraron ${usersData.length} usuarios`);
      } else {
        message.error(response.message || 'Error al buscar usuarios');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      message.error('Error al buscar usuarios: ' + (error.message || 'Error desconocido'));
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateBonuses = async () => {
    if (selectedUsers.length === 0) {
      message.warning('Debe seleccionar al menos un usuario');
      return;
    }

    try {
      setLoading(true);
      const values = await form.validateFields([
        'amount',
        'start_datetime',
        'end_datetime',
        'replicate_daily',
      ]);

      const startDateTime = values.start_datetime?.format('YYYY-MM-DD HH:mm:ss');
      const endDateTime = values.end_datetime?.format('YYYY-MM-DD HH:mm:ss');

      // Extraer solo los IDs de los usuarios seleccionados
      const userIds = selectedUsers.map((user) => user.id);

      const createPromises = [];

      if (values.replicate_daily && values.start_datetime && values.end_datetime) {
        const startDay = values.start_datetime.startOf('day');
        const endDay = values.end_datetime.startOf('day');
        const daysDiff = endDay.diff(startDay, 'day');

        for (let i = 0; i <= daysDiff; i++) {
          let dStart = values.start_datetime.add(i, 'day').startOf('day');
          let dEnd = dStart.clone().endOf('day');

          const sendData = {
            amount: values.amount,
            start_datetime: dStart.format('YYYY-MM-DD HH:mm:ss'),
            end_datetime: dEnd.format('YYYY-MM-DD HH:mm:ss'),
            user_ids: userIds,
          };
          createPromises.push(bonusService.createMultiple(sendData));
        }
      } else {
        const sendData = {
          amount: values.amount,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          user_ids: userIds,
        };
        createPromises.push(bonusService.createMultiple(sendData));
      }

      // Esperar a que todas las promesas se resuelvan
      const results = await Promise.allSettled(createPromises);

      const hasSuccess = results.some(
        (result) => result.status === 'fulfilled' && result.value.success,
      );
      const hasError = results.some(
        (result) => result.status === 'rejected' || !result.value.success,
      );

      // Mostrar alertas
      if (hasSuccess && !hasError) {
        successMsg(`Bonos creados correctamente para los usuarios seleccionados`);
      } else if (hasSuccess && hasError) {
        message.warning(`Algunos bonos se crearon, pero hubo errores en otros`);
      } else if (hasError) {
        errorMsg(`No se pudieron crear los bonos`);
      }

      // Actualizar la página y cerrar el modal
      router.visit(window.location.href, {
        preserveState: true,
      });
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear bonos:', error);
      errorMsg('Error al crear los bonos');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLoading(false);
    setSearching(false);
    setUsers([]);
    setSelectedUsers([]);
    form.resetFields();
  };

  return (
    <>
      <CustomButton
        onClick={() => setShowModal(true)}
        title="Crear Bonos Personalizados"
        type="primary"
        style={{ marginRight: '10px' }}
      />
      <Modal
        title="Crear Bonos Personalizados"
        open={showModal}
        onCancel={handleCloseModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleCreateBonuses}
            disabled={selectedUsers.length === 0}
          >
            Crear Bonos ({selectedUsers.length})
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <div className="pb-4 mb-4 border-b">
            <h3 className="mb-3 text-lg font-semibold">Filtrar Usuarios</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Form.Item
                label="Tipo de Bono"
                name="bonus_type"
                rules={[
                  {
                    required: true,
                    message: getValidationRequiredMessage('El tipo de bono'),
                  },
                ]}
                initialValue="daily"
              >
                <Select placeholder="Seleccione tipo de bono">
                  <Option value="daily">Bonos Diarios</Option>
                  <Option value="all">Todos los Bonos</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Min. Cantidad de Bonos"
                name="bonus_count"
                rules={[
                  {
                    required: true,
                    message: getValidationRequiredMessage('La cantidad de bonos'),
                  },
                ]}
              >
                <Input placeholder="Ej: 5" type="number" min="1" />
              </Form.Item>

              <Form.Item
                label="Rango de Fechas"
                name="date_range"
                rules={[
                  {
                    required: true,
                    message: getValidationRequiredMessage('El rango de fechas'),
                  },
                ]}
              >
                <RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </div>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={searching}
            >
              Buscar Usuarios
            </Button>
          </div>

          {users.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-3 text-lg font-semibold">Usuarios Encontrados ({users.length})</h3>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={users.map((user) => ({
                  ...user,
                  key: user.id,
                }))}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ y: 240 }}
              />
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="mb-3 text-lg font-semibold">Configuración del Bono</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Form.Item
                  label="Monto"
                  name="amount"
                  rules={[
                    {
                      required: true,
                      message: getValidationRequiredMessage('El monto'),
                    },
                    {
                      validator: (_, value) => {
                        if (value < 1) {
                          return Promise.reject('El monto debe ser mayor o igual a 1');
                        }
                        if (value > 9999999.99) {
                          return Promise.reject('El monto no puede ser mayor a $9.999.999,99');
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="Ingrese el monto"
                    type="number"
                    min="0"
                    max="9999999.99"
                    step="0.01"
                    onKeyPress={(e) => {
                      if (!/[\d.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item label="Fecha de inicio" name="start_datetime">
                  <DatePicker
                    showTime
                    format="DD-MM-YYYY HH:mm:ss"
                    placeholder="Seleccione fecha de inicio"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="Fecha de fin" name="end_datetime">
                  <DatePicker
                    showTime
                    format="DD-MM-YYYY HH:mm:ss"
                    placeholder="Seleccione fecha de fin"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item name="replicate_daily" valuePropName="checked">
                  <Checkbox>Replicar día a día</Checkbox>
                </Form.Item>
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
}
