import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Tag,
  Alert,
  Radio,
  message,
  Empty,
} from 'antd';
import {
  TeamOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  MergeCellsOutlined,
  BankOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { MODAL_SCROLL_BODY } from '@/Utils/constants';

const money = (v) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

export default function BankClients({ auth }) {
  const [clientes, setClientes] = useState([]);
  const [paginacion, setPaginacion] = useState({ current: 1, pageSize: 25, total: 0 });
  const [busqueda, setBusqueda] = useState('');
  // Arranca en true: la primera respuesta todavia no llego
  const [cargando, setCargando] = useState(true);

  const [duplicados, setDuplicados] = useState([]);
  const [buscandoDup, setBuscandoDup] = useState(false);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();

  // Fusión: de un grupo de fichas repetidas se elige cuál queda
  const [grupoFusion, setGrupoFusion] = useState(null);
  const [quedaId, setQuedaId] = useState(null);
  const [fusionando, setFusionando] = useState(false);

  const cargar = useCallback(
    async (page = 1, pageSize = 25) => {
      setCargando(true);
      try {
        const res = await axios.get('/banks/clients/list', {
          params: { page, per_page: pageSize, search: busqueda || undefined },
        });
        if (res.data.success) {
          setClientes(res.data.data.data);
          setPaginacion({
            current: res.data.data.current_page,
            pageSize: res.data.data.per_page,
            total: res.data.data.total,
          });
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Error al cargar clientes');
      } finally {
        setCargando(false);
      }
    },
    [busqueda],
  );

  useEffect(() => {
    cargar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarDuplicados = async () => {
    setBuscandoDup(true);
    try {
      const res = await axios.get('/banks/clients/duplicates');
      if (res.data.success) {
        setDuplicados(res.data.data);
        if (!res.data.data.length) message.success('No se encontraron fichas repetidas');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al buscar duplicados');
    } finally {
      setBuscandoDup(false);
    }
  };

  const guardar = async () => {
    const values = await form.validateFields();
    try {
      const res = editando
        ? await axios.put(`/banks/clients/${editando.id}`, values)
        : await axios.post('/banks/clients', values);
      message.success(res.data.message, 5);
      setModal(false);
      cargar(paginacion.current);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo guardar');
    }
  };

  const fusionar = async () => {
    if (!quedaId) {
      message.error('Elegí cuál ficha queda');
      return;
    }
    setFusionando(true);
    try {
      const res = await axios.post('/banks/clients/merge', {
        keep_id: quedaId,
        merge_ids: grupoFusion.clientes.map((c) => c.id),
      });
      message.success(res.data.message, 6);
      setGrupoFusion(null);
      setQuedaId(null);
      buscarDuplicados();
      cargar(paginacion.current);
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo unir');
    } finally {
      setFusionando(false);
    }
  };

  const columnas = [
    {
      title: 'ID planilla',
      dataIndex: 'external_id',
      key: 'external_id',
      width: 110,
      render: (v) => v || <span className="text-slate-400">-</span>,
    },
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Movs', dataIndex: 'movs', key: 'movs', align: 'right', width: 80 },
    {
      title: 'Cargado',
      dataIndex: 'total_cargado',
      key: 'cargado',
      align: 'right',
      render: (v) => <span className="tabular-nums text-emerald-700">{money(v)}</span>,
    },
    {
      title: 'Retirado',
      dataIndex: 'total_retirado',
      key: 'retirado',
      align: 'right',
      render: (v) => <span className="tabular-nums text-red-700">{money(v)}</span>,
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      render: (v) => (v ? <Tag color="green">Activo</Tag> : <Tag>Inactivo</Tag>),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, r) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditando(r);
            form.setFieldsValue(r);
            setModal(true);
          }}
        />
      ),
    },
  ];

  return (
    <AuthenticatedLayout auth={auth} user={auth?.user} role={auth?.role}>
      <Head title="Clientes Bancos" />

      <div className="p-4 mx-auto space-y-4 max-w-[1300px] sm:p-6">
        <PageHeader
          title="Clientes de Bancos Online"
          icon={TeamOutlined}
          subtitle="Una ficha por persona. Acá se unen las que quedaron repetidas."
        />

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Input.Search
              className="max-w-xs"
              placeholder="Nombre o ID"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onSearch={() => cargar(1)}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditando(null);
                form.resetFields();
                setModal(true);
              }}
            >
              Nuevo cliente
            </Button>
            <Button icon={<MergeCellsOutlined />} loading={buscandoDup} onClick={buscarDuplicados}>
              Buscar repetidos
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={cargando}
              onClick={() => cargar(paginacion.current)}
            >
              Actualizar
            </Button>
            <Link href="/banks" className="ml-auto">
              <Button icon={<BankOutlined />}>Volver a Bancos</Button>
            </Link>
          </div>
        </Card>

        {duplicados.length > 0 && (
          <Card title={`Fichas que parecen repetidas (${duplicados.length})`} size="small">
            <Alert
              type="warning"
              showIcon
              className="mb-3"
              message="Al unir, los movimientos de las fichas descartadas pasan a la que elijas"
              description="Las fichas descartadas no se borran: quedan marcadas como unidas, así siempre se puede rastrear de dónde vino cada movimiento."
            />
            <div className="space-y-2">
              {duplicados.map((g, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 p-2 border rounded-lg border-slate-200"
                >
                  <Tag color="orange">{g.motivo}</Tag>
                  <span className="text-sm">
                    {g.clientes
                      .map((c) => `${c.name}${c.external_id ? ` (#${c.external_id})` : ''}`)
                      .join('  ·  ')}
                  </span>
                  <Button
                    size="small"
                    type="primary"
                    className="ml-auto"
                    onClick={() => {
                      setGrupoFusion(g);
                      setQuedaId(g.clientes[0]?.id ?? null);
                    }}
                  >
                    Unir
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card size="small">
          <Table
            rowKey="id"
            columns={columnas}
            dataSource={clientes}
            loading={cargando}
            size="small"
            scroll={{ x: 800 }}
            locale={{ emptyText: <Empty description="Todavía no hay clientes cargados" /> }}
            pagination={{
              ...paginacion,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100],
              showTotal: (total, r) => `${r[0]}-${r[1]} de ${total} clientes`,
              onChange: (p, ps) => cargar(p, ps),
            }}
          />
        </Card>

        <Modal
          open={modal}
          title={editando ? `Editar ${editando.name}` : 'Nuevo cliente'}
          onCancel={() => setModal(false)}
          onOk={guardar}
          okText="Guardar"
          cancelText="Cancelar"
          centered
          styles={MODAL_SCROLL_BODY}
          destroyOnClose
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="name"
              label="Nombre"
              rules={[{ required: true, message: 'Ingresá el nombre' }]}
            >
              <Input maxLength={150} />
            </Form.Item>
            <Form.Item
              name="external_id"
              label="ID de la planilla"
              extra="El número con el que figura en el Excel"
            >
              <Input maxLength={30} />
            </Form.Item>
            <Form.Item name="notes" label="Notas">
              <Input.TextArea rows={2} maxLength={255} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          open={!!grupoFusion}
          title="Unir fichas"
          onCancel={() => setGrupoFusion(null)}
          onOk={fusionar}
          confirmLoading={fusionando}
          okText="Unir"
          cancelText="Cancelar"
          centered
          styles={MODAL_SCROLL_BODY}
        >
          <p className="mb-3 text-sm text-slate-600">¿Cuál ficha queda? El resto se une a esa.</p>
          <Radio.Group value={quedaId} onChange={(e) => setQuedaId(e.target.value)}>
            <Space direction="vertical">
              {grupoFusion?.clientes?.map((c) => (
                <Radio key={c.id} value={c.id}>
                  {c.name}
                  {c.external_id && <span className="text-slate-400"> (#{c.external_id})</span>}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
