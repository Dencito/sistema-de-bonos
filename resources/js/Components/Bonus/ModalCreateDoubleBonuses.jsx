import { useState } from 'react';
import { Form, DatePicker, Modal, Select, Button, Spin, Table, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { CustomButton } from '@components-v2/CustomButton';
import { userService } from '@/Services/api';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ModalCreateDoubleBonuses({ branches, categories }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const handleSearch = async () => {
    try {
      setSearching(true);
      const values = await form.validateFields(['branch_id', 'category_bonus_id', 'search_term']);

      const response = await userService.searchPlayers({
        branch_id: values.branch_id,
        category_bonus_id: values.category_bonus_id,
        search: values.search_term,
      });

      if (response.success) {
        setUsers(response.data.users || []);
        setSelectedUsers([]);
      } else {
        errorMsg(response.message || 'Error al buscar usuarios');
      }
    } catch (error) {
      if (error.name !== 'ValidationError') {
        console.error('Error searching players:', error);
        errorMsg('Error al realizar la búsqueda');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleCreateDoubleBonuses = async () => {
    if (selectedUsers.length === 0) {
      errorMsg('Debe seleccionar al menos un usuario');
      return;
    }

    try {
      setLoading(true);
      const values = await form.validateFields(['date_range']);

      const startDateTime = values.date_range?.[0]?.format('YYYY-MM-DD HH:mm:ss');
      const endDateTime = values.date_range?.[1]?.format('YYYY-MM-DD HH:mm:ss');

      const sendData = {
        user_ids: selectedUsers.map((u) => u.id),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
      };

      const response = await axios.post(route('bonuses.createDoubleBonuses'), sendData);

      if (response.data.success) {
        successMsg(
          response.data.message ||
            `Bonos dobles creados correctamente para ${response.data.count} jugadores`,
        );
        router.visit(window.location.href, {
          preserveState: true,
        });
        handleCloseModal();
      } else {
        errorMsg(response.data.message || 'Error al crear los bonos dobles');
      }
    } catch (error) {
      console.error('Error al crear bonos dobles:', error);
      if (error.response?.data?.message) {
        errorMsg(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMsg(errors.join(', '));
      } else {
        errorMsg('Error al crear los bonos dobles');
      }
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

  const rowSelection = {
    selectedRowKeys: selectedUsers.map((u) => u.id),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedUsers(selectedRows);
    },
  };

  const columns = [
    {
      title: 'Nombre',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.first_last_name}`,
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'RUT',
      key: 'rut',
      render: (_, record) => (record.rutNumbers ? `${record.rutNumbers}-${record.rutDv}` : '-'),
    },
    {
      title: 'Categoría',
      key: 'category',
      render: (_, record) => record.category_bonus?.name || <span className="text-red-500 text-xs">Sin categoría</span>,
    },
    {
      title: 'Monto Doble',
      key: 'amount',
      render: (_, record) => {
        if (!record.category_bonus?.base_amount) return '-';
        return `$${(record.category_bonus.base_amount * 2).toLocaleString('es-CL')}`;
      },
    },
  ];

  return (
    <>
      <CustomButton
        onClick={() => setShowModal(true)}
        title="Crear Bonos Dobles"
        type="primary"
        style={{ marginRight: '10px' }}
      />
      <Modal
        title="Crear Bonos Dobles Personalizados"
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
            onClick={handleCreateDoubleBonuses}
            disabled={selectedUsers.length === 0}
          >
            Crear Bonos Dobles ({selectedUsers.length})
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical">
            <div className="pb-4 mb-4 border-b">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">1. Filtrar Jugadores</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Form.Item label="Sucursal" name="branch_id">
                  <Select
                    placeholder="Todas las sucursales"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {branches?.map((branch) => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Categoría de Bono" name="category_bonus_id">
                  <Select
                    placeholder="Todas las categorías"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {categories?.map((cat) => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name} (${cat.base_amount})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Búsqueda libre" name="search_term">
                  <Input placeholder="Nombre, RUT o usuario..." allowClear />
                </Form.Item>
              </div>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searching}
              >
                Buscar Jugadores
              </Button>
            </div>

            {users.length > 0 ? (
              <div className="mb-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">2. Seleccionar Jugadores ({users.length} encontrados)</h3>
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
            ) : (
              <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                Usa los filtros para buscar y seleccionar jugadores.
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">3. Configuración del Bono</h3>
              <Form.Item
                label="Rango de Fechas (Inicio y Fin)"
                name="date_range"
                rules={[
                  {
                    required: true,
                    message: getValidationRequiredMessage('El rango de fechas'),
                  },
                ]}
              >
                <RangePicker
                  showTime
                  format="DD-MM-YYYY HH:mm:ss"
                  placeholder={['Fecha de inicio', 'Fecha de fin']}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <div className="p-3 text-sm text-blue-800 bg-blue-50 rounded-lg border border-blue-200">
                <strong>Nota:</strong> Se crearán bonos dobles (el doble de su categoría actual) a los <strong>{selectedUsers.length}</strong> jugadores seleccionados para el rango de fechas especificado. Los jugadores sin categoría no recibirán bono.
              </div>
            </div>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
