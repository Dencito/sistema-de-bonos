import axios from 'axios';

export const cashManagementService = {
    getShiftStatus: async () => {
        try {
            const response = await axios.get('/cash-management/shift-status');
            return response.data;
        } catch (error) {
            console.error('Error al obtener el estado del turno de caja:', error);
            throw error;
        }
    },

    startShift: async (initialBalance) => {
        try {
            const response = await axios.post('/cash-management/shift/start', {
                initial_balance: initialBalance,
            });
            return response.data;
        } catch (error) {
            console.error('Error al iniciar el turno de caja:', error);
            throw error;
        }
    },

    endShift: async () => {
        try {
            const response = await axios.post('/cash-management/shift/end');
            return response.data;
        } catch (error) {
            console.error('Error al finalizar el turno de caja:', error);
            throw error;
        }
    },

    addTransaction: async (type, amount, client, machine) => {
        try {
            const response = await axios.post('/cash-management/transaction', {
                type,
                amount,
                client,
                machine,
            });
            return response.data;
        } catch (error) {
            console.error('Error al agregar transacción:', error);
            throw error;
        }
    },

    getTransactions: async () => {
        try {
            const response = await axios.get('/cash-management/transactions');
            return response.data;
        } catch (error) {
            console.error('Error al obtener transacciones:', error);
            throw error;
        }
    },

    addPasillera: async (name, initialBalance) => {
        try {
            const response = await axios.post('/cash-management/pasillera', {
                name,
                initial_balance: initialBalance,
            });
            return response.data;
        } catch (error) {
            console.error('Error al agregar pasillera:', error);
            throw error;
        }
    },

    addPasilleraPayment: async (pasilleraId, amount, machine) => {
        try {
            const response = await axios.post(`/cash-management/pasillera/${pasilleraId}/payment`, {
                amount,
                machine,
            });
            return response.data;
        } catch (error) {
            console.error('Error al agregar pago de pasillera:', error);
            throw error;
        }
    },

    resetPasillera: async (pasilleraId, newBalance) => {
        try {
            const response = await axios.put(`/cash-management/pasillera/${pasilleraId}/reset`, {
                new_balance: newBalance,
            });
            return response.data;
        } catch (error) {
            console.error('Error al reiniciar pasillera:', error);
            throw error;
        }
    },

    deletePasillera: async (pasilleraId) => {
        try {
            const response = await axios.delete(`/cash-management/pasillera/${pasilleraId}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar pasillera:', error);
            throw error;
        }
    },
};

export default cashManagementService;
