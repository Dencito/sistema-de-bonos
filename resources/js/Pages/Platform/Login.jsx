import { Head, useForm } from '@inertiajs/react';
import { Input, Button, Alert } from 'antd';
import { LockOutlined, UserOutlined, ApiOutlined } from '@ant-design/icons';

/**
 * Login de la consola de plataforma. No usa la tabla users ni pertenece a
 * ninguna empresa: valida contra storage/app/platform-admins.json.
 */
export default function PlatformLogin({ configured }) {
  const { data, setData, post, processing, errors } = useForm({
    user: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('platform.login.attempt'));
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-10 bg-slate-900">
      <Head title="Consola de plataforma" />

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 shrink-0">
            <ApiOutlined className="text-lg text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white">Consola de plataforma</h1>
            <p className="text-sm text-slate-400">Creación y administración de empresas</p>
          </div>
        </div>

        <div className="p-6 bg-white shadow-xl rounded-xl">
          {!configured && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message="No hay credenciales configuradas"
              description="Corré php artisan platform:admin en el servidor para crear la primera."
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="user" className="block mb-1 text-sm font-medium text-slate-700">
                Usuario
              </label>
              <Input
                id="user"
                size="large"
                autoFocus
                autoComplete="username"
                prefix={<UserOutlined className="text-slate-400" />}
                value={data.user}
                onChange={(e) => setData('user', e.target.value)}
                status={errors.user ? 'error' : ''}
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <Input.Password
                id="password"
                size="large"
                autoComplete="current-password"
                prefix={<LockOutlined className="text-slate-400" />}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                status={errors.password ? 'error' : ''}
              />
            </div>

            {/* El backend manda el error de credenciales y el de rate limit en 'user' */}
            {(errors.user || errors.password) && (
              <p className="text-sm text-red-600">{errors.user || errors.password}</p>
            )}

            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={processing}
              disabled={!configured}
              block
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="mt-4 text-xs text-center text-slate-500">
          Acceso restringido. Los intentos fallidos se limitan por IP.
        </p>
      </div>
    </div>
  );
}
