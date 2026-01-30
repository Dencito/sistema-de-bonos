import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pasilleraService } from '../services/api';
import { ArrowLeft, DollarSign, RefreshCw, Calendar } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function History() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setError('');
      const response = await pasilleraService.getHistory(100);
      
      if (response.success) {
        setTransactions(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al cargar el historial');
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
    } catch {
      // Haptics not available
    }
    await loadHistory();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const groupByDate = (transactions) => {
    const groups = {};
    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    return groups;
  };

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupByDate(transactions);
  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 rounded-lg transition hover:bg-gray-100 active:bg-gray-200"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Historial</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg transition hover:bg-gray-100 active:bg-gray-200"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 text-white bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="text-center">
          <p className="mb-1 text-sm text-primary-100">Total Gastado</p>
          <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          <p className="mt-2 text-sm text-primary-100">{transactions.length} transacciones</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-6">
        {error ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Reintentar
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-gray-600">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedTransactions)
              .sort((a, b) => new Date(b) - new Date(a))
              .map((dateKey) => (
                <div key={dateKey}>
                  <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                    {getDateLabel(dateKey)}
                  </h3>
                  <div className="overflow-hidden bg-white rounded-xl shadow">
                    {groupedTransactions[dateKey].map((transaction, index) => (
                      <div
                        key={transaction.id}
                        className={`flex items-center justify-between p-4 ${
                          index !== groupedTransactions[dateKey].length - 1
                            ? 'border-b border-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex flex-1 items-center">
                          <div className="flex flex-shrink-0 justify-center items-center mr-4 w-12 h-12 bg-red-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {transaction.machine}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.created_at)}
                            </p>
                            {transaction.description && (
                              <p className="mt-1 text-xs text-gray-400 truncate">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4 text-right">
                          <p className="font-bold text-red-600">
                            -{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
