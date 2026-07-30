import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Input, Button, Alert, Card, Table, Tag, InputNumber } from 'antd';
import { ApiOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { formatDateTimeCL } from '@/Utils/date';

/**
 * Consola de plataforma. Crear una empresa acá solo crea la fila y sus tablas:
 * no copia el proyecto ni crea subdominios. La empresa queda disponible en
 * /{slug}/ sobre este mismo deploy.
 */
export default function PlatformConsole({ companies = [], baseUrl }) {
  const { flash } = usePage().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    slug: '',
    email: '',
    phone: '',
    max_branches: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('platform.companies.store'), {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  const columns = [
    { title: 'Empresa', dataIndex: 'name', key: 'name' },
    {
      title: 'Identificador',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <code className="text-xs">{slug}</code>,
    },
    {
      title: 'URL de acceso',
      key: 'url',
      render: (_, r) =>
        r.slug ? (
          <a href={`/${r.slug}/login`} className="text-xs">
            {baseUrl}/{r.slug}/login
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (a) => (a ? <Tag color="green">Activa</Tag> : <Tag>Inactiva</Tag>),
    },
    {
      title: 'Creada',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => formatDateTimeCL(d),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Head title="Consola de plataforma" />

      <header className="bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mx-auto max-w-[1200px] sm:p-6">
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 shrink-0">
              <ApiOutlined className="text-lg text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">Consola de plataforma</h1>
              <p className="text-sm text-slate-400">{companies.length} empresa(s)</p>
            </div>
          </div>
          <Button icon={<LogoutOutlined />} onClick={() => router.post(route('platform.logout'))}>
            Salir
          </Button>
        </div>
      </header>

      <div className="p-4 mx-auto space-y-4 max-w-[1200px] sm:p-6">
        {flash?.status && <Alert type="success" showIcon message={flash.status} />}

        <Card title="Crear empresa">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium text-slate-700">
                  Nombre *
                </label>
                <Input
                  id="name"
                  size="large"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  status={errors.name ? 'error' : ''}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block mb-1 text-sm font-medium text-slate-700">
                  Identificador *
                </label>
                <Input
                  id="slug"
                  size="large"
                  placeholder="ej: sanpablo"
                  value={data.slug}
                  onChange={(e) =>
                    setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
                  }
                  status={errors.slug ? 'error' : ''}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Es el prefijo de las tablas y el segmento de la URL. No se puede cambiar después.
                </p>
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-slate-700">
                  Correo
                </label>
                <Input
                  id="email"
                  type="email"
                  size="large"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  status={errors.email ? 'error' : ''}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block mb-1 text-sm font-medium text-slate-700">
                  Teléfono
                </label>
                <Input
                  id="phone"
                  size="large"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="max_branches"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Máximo de sucursales *
                </label>
                <InputNumber
                  id="max_branches"
                  size="large"
                  min={1}
                  max={500}
                  className="w-full"
                  value={data.max_branches}
                  onChange={(v) => setData('max_branches', v ?? 1)}
                />
                {errors.max_branches && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_branches}</p>
                )}
              </div>
            </div>

            {data.slug && (
              <Alert
                type="info"
                showIcon
                message={
                  <span className="text-sm">
                    Va a quedar accesible en{' '}
                    <code>
                      {baseUrl}/{data.slug}/login
                    </code>
                  </span>
                }
              />
            )}

            <div className="flex justify-end">
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={processing}
              >
                Crear empresa
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Empresas">
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="id"
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            locale={{ emptyText: 'Todavía no hay empresas' }}
          />
        </Card>
      </div>
    </div>
  );
}
