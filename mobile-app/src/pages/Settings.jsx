import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function Settings() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanyConfig();
  }, []);

  const loadCompanyConfig = async () => {
    try {
      const { value } = await Preferences.get({ key: 'company_name' });
      if (value) {
        setCompanyName(value);
      }
    } catch {
      // Haptics not available
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert('Por favor ingrese el nombre de la empresa');
      return;
    }

    setLoading(true);
    setSaved(false);

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }

    try {
      await Preferences.set({
        key: 'company_name',
        value: companyName.trim().toLowerCase(),
      });

      setSaved(true);
      
      try {
        await Haptics.notification({ type: 'success' });
      } catch {
        // Haptics not available
      }

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch {
      // Haptics not available
      alert('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const constructApiUrl = (company) => {
    if (!company) return '';
    return `https://${company.trim().toLowerCase()}.rentamania.cl/api/mobile`;
  };

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 safe-top safe-bottom">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex justify-center items-center mb-4 w-20 h-20 bg-blue-600 rounded-full">
            <SettingsIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Configuración</h1>
          <p className="text-slate-400">Configure la empresa</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-xl">
          {saved ? (
            <div className="py-8 text-center">
              <div className="inline-flex justify-center items-center mb-4 w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">¡Configuración Guardada!</h3>
              <p className="text-gray-600">Redirigiendo al login...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="company" className="block mb-2 text-sm font-medium text-gray-700">
                  Nombre de la Empresa
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-4 py-3 w-full rounded-lg border border-gray-300 transition outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="888spa"
                  disabled={loading}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Ejemplo: 888spa, casino123, etc.
                </p>
              </div>

              {companyName && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="mb-1 text-xs text-gray-600">URL de la API:</p>
                  <p className="font-mono text-sm text-blue-900 break-all">
                    {constructApiUrl(companyName)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                  className="flex flex-1 justify-center items-center py-3 font-semibold text-gray-800 bg-gray-200 rounded-lg transition hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || !companyName.trim()}
                  className="flex flex-1 justify-center items-center py-3 font-semibold text-white bg-blue-600 rounded-lg transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 w-5 h-5" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-center text-slate-400">
          Configure el nombre de la empresa para conectarse al servidor correcto
        </p>
      </div>
    </div>
  );
}
