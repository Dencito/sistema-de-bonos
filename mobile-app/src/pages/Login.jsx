import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, Settings } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkCompanyConfig();
  }, []);

  const checkCompanyConfig = async () => {
    try {
      const { value } = await Preferences.get({ key: 'company_name' });
      if (value) {
        setCompanyName(value);
      }
    } catch (error) {
      console.error('Error loading company config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate company configuration
    if (!companyName) {
      setError('Por favor configure la empresa primero. Presione el ícono de configuración.');
      try {
        await Haptics.notification({ type: 'ERROR' });
      } catch {
        // Haptics not available
      }
      return;
    }

    setLoading(true);

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Error al iniciar sesión');
      try {
        await Haptics.notification({ type: 'ERROR' });
      } catch {
        // Haptics not available
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 safe-top safe-bottom">
      {/* Settings Button - Only visible when logged out */}
      <button
        onClick={() => navigate('/settings')}
        className="absolute top-6 right-6 p-3 rounded-full shadow-lg transition bg-slate-800 hover:bg-slate-700 active:bg-slate-600"
      >
        <Settings className="w-6 h-6 text-white" />
      </button>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex justify-center items-center mb-4 w-20 h-20 rounded-full bg-primary-600">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Pasillera</h1>
          <p className="text-slate-400">Sistema de Gestión de Gastos</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
                Nombre de Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-3 w-full rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="usuario"
                required
                disabled={loading}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 w-full rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-4 py-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex justify-center items-center py-3 w-full font-semibold text-white rounded-lg transition bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-2 text-center">
          {companyName && (
            <div className="inline-block px-4 py-2 rounded-lg bg-slate-800">
              <p className="text-xs text-slate-400">Empresa configurada:</p>
              <p className="text-sm font-semibold text-white">{companyName}</p>
            </div>
          )}
          <p className="text-sm text-slate-400">
            v1.0.0 - Sistema de Casino
          </p>
        </div>
      </div>
    </div>
  );
}
