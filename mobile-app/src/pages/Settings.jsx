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
    } catch (error) {
      console.error('Error loading company config:', error);
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
    } catch (e) {
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
      } catch (e) {
        // Haptics not available
      }

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Error saving company config:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <SettingsIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-slate-400">Configure la empresa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {saved ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Configuración Guardada!</h3>
              <p className="text-gray-600">Redirigiendo al login...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="888spa"
                  disabled={loading}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ejemplo: 888spa, casino123, etc.
                </p>
              </div>

              {companyName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">URL de la API:</p>
                  <p className="text-sm font-mono text-blue-900 break-all">
                    {constructApiUrl(companyName)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 transition flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || !companyName.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Configure el nombre de la empresa para conectarse al servidor correcto
        </p>
      </div>
    </div>
  );
}
