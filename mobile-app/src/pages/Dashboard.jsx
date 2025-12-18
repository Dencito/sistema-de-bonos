import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pasilleraService } from '../services/api';
import {
  Wallet,
  TrendingDown,
  DollarSign,
  LogOut,
  RefreshCw,
  History,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pasillera, setPasillera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPasillera();
  }, []);

  const loadPasillera = async () => {
    try {
      setError('');
      const response = await pasilleraService.getMyActive();
      
      if (response.success) {
        setPasillera(response.data.pasillera);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al cargar la información');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available
    }
    await loadPasillera();
  };

  const handleLogout = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available
    }
    await logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 pb-24">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Hola, {user?.name?.split(' ')[0]}</h1>
            <p className="text-primary-100 text-sm">Bienvenido de vuelta</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-primary-500 rounded-lg transition active:bg-primary-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 -mt-16 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-primary-600 font-semibold hover:text-primary-700"
              >
                Reintentar
              </button>
            </div>
          ) : pasillera ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Saldo Disponible</p>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {formatCurrency(pasillera.current_balance)}
                  </h2>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100 rounded-lg transition active:bg-gray-200"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Wallet className="w-4 h-4 text-blue-600 mr-2" />
                    <p className="text-blue-600 text-xs font-medium">Inicial</p>
                  </div>
                  <p className="text-blue-900 font-semibold">
                    {formatCurrency(pasillera.initial_balance)}
                  </p>
                </div>

                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                    <p className="text-red-600 text-xs font-medium">Gastado</p>
                  </div>
                  <p className="text-red-900 font-semibold">
                    {formatCurrency(pasillera.total_payments)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No tienes una pasillera activa</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {pasillera && (
        <div className="px-6 space-y-3">
          <button
            onClick={() => navigate('/register-expense')}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 active:bg-primary-800 transition flex items-center justify-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Gasto
          </button>

          <button
            onClick={() => navigate('/history')}
            className="w-full bg-white text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition flex items-center justify-center shadow border border-gray-200"
          >
            <History className="w-5 h-5 mr-2" />
            Ver Historial
          </button>
        </div>
      )}

      {/* Recent Transactions */}
      {pasillera && pasillera.transactions && pasillera.transactions.length > 0 && (
        <div className="px-6 mt-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Movimientos</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {pasillera.transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.machine}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-red-600">
                  -{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
