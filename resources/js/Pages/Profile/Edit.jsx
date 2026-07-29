import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ChangePasswordModal from '@/Components/ChangePasswordModal';
import { Card, Input, Button, Alert, Row, Col, Tag, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { roleDisplayNames } from '@/Utils/constants';
import { formatDateCL } from '@/Utils/date';

/**
 * El controlador solo valida username y email, asi que son los unicos campos
 * editables. El resto lo administra un rol superior desde Usuarios y se muestra
 * como referencia.
 */
export default function ProfileEdit({ auth, mustVerifyEmail, status }) {
  const user = auth.user ?? {};
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const { data, setData, patch, processing, errors, isDirty, setDefaults } = useForm({
    username: user.username ?? '',
    email: user.email ?? '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    patch(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => {
        // Sin esto los defaults quedan en los valores viejos: lo recien guardado
        // sigue contando como sucio y volver al valor anterior apaga el boton.
        setDefaults();
        message.success('Perfil actualizado');
      },
      onError: () => message.error('Revisá los campos marcados'),
    });
  };

  const fullName =
    [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
      .filter(Boolean)
      .join(' ') || '—';

  const rut = user.rutNumbers && user.rutDv ? `${user.rutNumbers}-${user.rutDv}` : null;

  // Los roles superiores no tienen sucursal asignada, tienen varias o ninguna
  const branchLabel =
    user.branch?.name || user.branches?.map((b) => b.name).join(', ') || 'Sin sucursal asignada';

  const infoRows = [
    { label: 'Nombre', value: fullName },
    { label: 'Rol', value: roleDisplayNames[auth.role] || auth.role || '—' },
    { label: 'Sucursal', value: branchLabel },
    { label: 'Empresa', value: user.company?.name || user.branch?.company?.name || '—' },
    { label: 'RUT', value: rut || '—' },
    {
      label: 'Teléfono',
      value: [user.prefix, user.phone].filter(Boolean).join(' ') || '—',
    },
    { label: 'Fecha de ingreso', value: user.entry_date ? formatDateCL(user.entry_date) : '—' },
  ];

  return (
    <AuthenticatedLayout auth={auth} user={auth.user} role={auth.role}>
      <Head title="Mi Perfil" />

      <div className="p-4 mx-auto space-y-4 max-w-[1200px] sm:p-6">
        <PageHeader
          title="Mi Perfil"
          icon={UserOutlined}
          subtitle={`${roleDisplayNames[auth.role] || auth.role || 'Usuario'} · ${branchLabel}`}
        />

        {status && <Alert type="success" showIcon message={status} />}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="Datos de la cuenta">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Usuario
                  </label>
                  <Input
                    id="username"
                    size="large"
                    prefix={<IdcardOutlined className="text-slate-400" />}
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    status={errors.username ? 'error' : ''}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block mb-1 text-sm font-medium text-slate-700">
                    Correo
                  </label>
                  <Input
                    id="email"
                    type="email"
                    size="large"
                    prefix={<MailOutlined className="text-slate-400" />}
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    status={errors.email ? 'error' : ''}
                    autoComplete="email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {mustVerifyEmail && !user.email_verified_at && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Tu correo no está verificado"
                    description="Si lo cambiás, vas a tener que verificarlo de nuevo."
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={processing}
                    disabled={!isDirty}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <div className="space-y-4">
              <Card title="Seguridad">
                <p className="mb-4 text-sm text-slate-500">
                  Tu contraseña debe tener al menos 8 caracteres y ser distinta a la actual.
                </p>
                <Button
                  size="large"
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalOpen(true)}
                  block
                >
                  Cambiar contraseña
                </Button>
              </Card>

              <Card title="Datos administrados por tu supervisor">
                <dl className="space-y-3">
                  {infoRows.map((row) => (
                    <div key={row.label} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-sm text-slate-500">{row.label}</dt>
                      <dd className="text-sm font-medium text-right break-words text-slate-900">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-sm text-slate-500">Huella</dt>
                    <dd>
                      <Tag color={user.has_fingerprint ? 'green' : 'default'}>
                        {user.has_fingerprint ? 'Registrada' : 'Sin registrar'}
                      </Tag>
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </AuthenticatedLayout>
  );
}
