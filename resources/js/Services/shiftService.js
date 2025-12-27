import axios from 'axios';

export const shiftService = {
  getShiftStatus: async () => {
    try {
      const response = await axios.get('/shifts/status');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el estado del turno:', error);
      throw error;
    }
  },

  startShift: async () => {
    try {
      const response = await axios.post('/shifts/start');
      return response.data;
    } catch (error) {
      console.error('Error al iniciar el turno:', error);
      throw error;
    }
  },

  endShift: async () => {
    try {
      const response = await axios.post('/shifts/end');
      return response.data;
    } catch (error) {
      console.error('Error al finalizar el turno:', error);
      throw error;
    }
  },

  getAllShifts: async () => {
    try {
      const response = await axios.get('/shifts');
      return response.data;
    } catch (error) {
      console.error('Error al obtener todos los turnos:', error);
      throw error;
    }
  },
};

export default shiftService;
