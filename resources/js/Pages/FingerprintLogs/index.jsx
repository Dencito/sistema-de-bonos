import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { CustomTable } from '@components-v2/CustomTable';
import MobileButton from '@/Components/MobileButton';
import { useState, useEffect } from 'react';
import { Button, DatePicker, Form, Select, Card } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const columns = [
  {
    title: 'Usuario',
    key: 'user',
    render: (_, record) => record.user?.first_name + ' ' + record.user?.first_last_name || 'N/A',
  },
  {
    title: 'Rol',
    key: 'role',
    render: (_, record) => record.user?.role?.name || 'N/A',
  },
  {
    title: 'Tipo',
    key: 'type',
    dataIndex: 'type',
    render: (type) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          type === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {type || 'N/A'}
      </span>
    ),
  },
  {
    title: 'Sucursal',
    key: 'branch',
    render: (_, record) => record.branch?.name || 'N/A',
  },
  {
    title: 'Fecha y Hora',
    dataIndex: 'created_at',
    key: 'fingerprint_created',
    render: (date) => {
      const dateObj = new Date(date);
      return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    },
  },
];

export default function FingerprintLogPage({
  auth,
  fingerprintLogs,
  users,
  branches,
  shifts,
  filters,
}) {
  const { data, setData, get, processing } = useForm({
    start_date: filters?.start_date || '',
    end_date: filters?.end_date || '',
    user_id: filters?.user_id || '',
    role_id: filters?.role_id || '',
    branch_id: filters?.branch_id || '',
    per_page: filters?.per_page || 25,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Initialize dates properly when component loads
  useEffect(() => {
    // Set default date range if none provided (last 7 days)
    if (!data.start_date && !data.end_date) {
      // Get current date
      const today = dayjs();

      // Create end date (today)
      const end = today.format('YYYY-MM-DD');

      // Create start date (7 days ago)
      const start = today.subtract(7, 'day').format('YYYY-MM-DD');

      setData({
        ...data,
        start_date: start,
        end_date: end,
      });
    }
  }, []);

  const handleSearch = () => {
    // Filtrar parámetros vacíos antes de enviar
    const params = Object.fromEntries(
      Object.entries(data).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined,
      ),
    );

    get(route('fingerprint-logs.index', params), {
      preserveState: true,
      replace: true,
    });
  };

  const handleClearFilters = () => {
    const clearedData = {
      start_date: '',
      end_date: '',
      user_id: '',
      role_id: '',
      branch_id: '',
      per_page: 25,
    };
    setData(clearedData);

    // Solo enviar per_page
    get(route('fingerprint-logs.index', { per_page: 25 }), {
      preserveState: true,
      replace: true,
    });
  };

  const handlePageChange = (page, pageSize) => {
    setData('per_page', pageSize);

    // Filtrar parámetros vacíos antes de enviar
    const params = Object.fromEntries(
      Object.entries({ ...data, per_page: pageSize, page }).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined,
      ),
    );

    get(route('fingerprint-logs.index', params), {
      preserveState: true,
      replace: true,
    });
  };

  // Función para exportar a Excel
  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Preparar los parámetros de filtrado
      const params = {};

      if (data.start_date) {
        params.start_date = data.start_date;
      }

      if (data.end_date) {
        params.end_date = data.end_date;
      }

      if (data.user_id) {
        params.user_id = data.user_id;
      }

      if (data.role_id) {
        params.role_id = data.role_id;
      }

      if (data.branch_id) {
        params.branch_id = data.branch_id;
      }

      // Llamar al endpoint de exportación
      const response = await axios.get(route('fingerprint-logs.export'), {
        params,
      });

      // Preparar datos para Excel
      const logsData = response.data.fingerprintLogs.map((log) => ({
        Usuario: `${log.user?.first_name || ''} ${log.user?.first_last_name || ''}`,
        Rol: log.user?.role?.name || 'N/A',
        Tipo: log.type || 'N/A',
        Tótem: log.totem?.name || 'N/A',
        Sucursal: log?.branch?.name || 'N/A',
        'Fecha y Hora': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      }));

      // Crear hoja de registros
      const ws1 = XLSX.utils.json_to_sheet(logsData);

      // Crear hoja de resumen
      const summaryData = [
        { Campo: 'Fecha Inicial', Valor: data.start_date },
        { Campo: 'Fecha Final', Valor: data.end_date },
        {
          Campo: 'Total Registros',
          Valor: response.data.summary.total_logs,
        },
        {},
        { Campo: 'Resumen por Sucursal', Valor: '' },
        ...Object.entries(response.data.summary.by_branch).map(([branch, count]) => ({
          Campo: branch,
          Valor: count,
        })),
        {},
        { Campo: 'Resumen por Rol', Valor: '' },
        ...Object.entries(response.data.summary.by_role).map(([role, count]) => ({
          Campo: role,
          Valor: count,
        })),
      ];
      const ws2 = XLSX.utils.json_to_sheet(summaryData);

      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws1, 'Registros');
      XLSX.utils.book_append_sheet(workbook, ws2, 'Resumen');

      // Descargar archivo
      XLSX.writeFile(workbook, `registros_huella_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    } catch (error) {
      console.error('Error al exportar registros:', error);
      alert('Error al exportar los registros. Por favor intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={
        <h2 className="z-10 text-xl font-semibold leading-tight text-gray-800">
          Registros de Huella
        </h2>
      }
    >
      <Head title="Registros de Huella" />
      <header className="flex items-center justify-between gap-3 p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl lg:text-4xl">Registros de Huella</h1>
      </header>
      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          <div className="flex justify-between mb-4">
            <div>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                className="mr-2"
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
            </div>
            <div>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
                loading={exporting}
              >
                Exportar a Excel
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="mb-4">
              <Form layout="vertical">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Form.Item label="Turno">
                    <Select
                      showSearch
                      style={{ width: '100%' }}
                      placeholder="Seleccione turno"
                      optionFilterProp="children"
                      value={undefined}
                      onChange={(value) => {
                        if (value) {
                          // Buscar el turno seleccionado
                          const selectedShift = shifts.find((s) => s.id === value);
                          if (selectedShift) {
                            // Establecer las fechas del turno CON HORA
                            const startDate = dayjs(selectedShift.opening_time).format(
                              'YYYY-MM-DD HH:mm:ss',
                            );
                            const endDate = selectedShift.closing_time
                              ? dayjs(selectedShift.closing_time).format('YYYY-MM-DD HH:mm:ss')
                              : dayjs().format('YYYY-MM-DD HH:mm:ss');

                            setData({
                              ...data,
                              start_date: startDate,
                              end_date: endDate,
                              branch_id: selectedShift.branch_id || data.branch_id,
                            });
                          }
                        }
                      }}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      allowClear
                    >
                      {shifts?.map((shift) => (
                        <Select.Option key={shift.id} value={shift.id}>
                          {shift.display_name}
                        </Select.Option>
                      ))}
                    </Select>
                    <div className="mt-1 text-xs text-gray-500">
                      Al seleccionar un turno, se establecerán automáticamente las fechas
                    </div>
                  </Form.Item>

                  <Form.Item label="Fecha Inicio">
                    <DatePicker
                      style={{ width: '100%' }}
                      value={data.start_date ? dayjs(data.start_date) : null}
                      onChange={(date, dateString) => {
                        setData('start_date', dateString);
                      }}
                      placeholder="Seleccione fecha inicio"
                    />
                  </Form.Item>
                  <Form.Item label="Fecha Fin">
                    <DatePicker
                      style={{ width: '100%' }}
                      value={data.end_date ? dayjs(data.end_date) : null}
                      onChange={(date, dateString) => {
                        setData('end_date', dateString);
                      }}
                      placeholder="Seleccione fecha fin"
                    />
                  </Form.Item>
                  <Form.Item label="Usuario">
                    <Select
                      showSearch
                      style={{ width: '100%' }}
                      placeholder="Seleccione usuario"
                      optionFilterProp="children"
                      value={data.user_id || undefined}
                      onChange={(value) => setData('user_id', value || '')}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      allowClear
                    >
                      {users?.map((user) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.first_name} {user.first_last_name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Sucursal">
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Seleccione sucursal"
                      value={data.branch_id || undefined}
                      onChange={(value) => setData('branch_id', value || '')}
                      allowClear
                    >
                      {branches?.map((branch) => (
                        <Select.Option key={branch.id} value={branch.id}>
                          {branch.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Registros por página">
                    <Select
                      style={{ width: '100%' }}
                      value={data.per_page}
                      onChange={(value) => setData('per_page', value)}
                    >
                      <Select.Option value={10}>10</Select.Option>
                      <Select.Option value={25}>25</Select.Option>
                      <Select.Option value={50}>50</Select.Option>
                      <Select.Option value={100}>100</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button onClick={handleClearFilters}>Limpiar</Button>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={processing}
                  >
                    Buscar
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          <div className="bg-white shadow-sm sm:rounded-lg">
            <CustomTable
              dataSource={
                fingerprintLogs.data?.map((log) => ({
                  ...log,
                  key: `fingerprint_${log.id}`,
                })) || []
              }
              columns={columns}
              scroll={{ x: true }}
              pagination={{
                current: fingerprintLogs.current_page,
                pageSize: parseInt(data.per_page),
                total: fingerprintLogs.total,
                onChange: handlePageChange,
                showSizeChanger: false,
              }}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
