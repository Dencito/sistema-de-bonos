import { useEffect, useState } from 'react';

export default function useBranchValidateSchedules (shifts) {
  const [canLogin, setCanLogin] = useState(false);

  const dayOfWeekToNumber = {
    "Lunes": 1,
    "Martes": 2,
    "Miercoles": 3,
    "Jueves": 4,
    "Viernes": 5,
    "Sabado": 6,
    "Domingo": 7,
  };

  // Función que verifica si la hora actual está dentro del rango
  const isTimeInRange = (currentTime, startTime, endTime) => {
    const [currentHour, currentMinute] = currentTime?.split(':').map(Number);
    const [startHour, startMinute] = startTime?.split(':').map(Number);
    const [endHour, endMinute] = endTime?.split(':').map(Number);

    const current = currentHour * 60 + currentMinute;
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    // Si el horario pasa de un día a otro (por ejemplo de 19:00 a 00:00)
    if (end < start) {
      return current >= start || current <= end;
    }

    return current >= start && current <= end;
  };

  // Función que valida si el día y la hora actuales están permitidos
  const isShiftValid = () => {
    const now = new Date();
    const currentDay = now?.getDay() === 0 ? 7 : now?.getDay(); // 0 (Domingo) -> 7
    const currentTime = now?.toTimeString().slice(0, 5); // "HH:MM" formato

    // Recorrer los turnos
    for (const shift of shifts) {
      const dayInit = dayOfWeekToNumber[shift?.day_init];
      const dayEnd = dayOfWeekToNumber[shift?.day_end];

      // Verificar si el día actual está dentro del rango de días
      if (
        (dayInit <= currentDay && currentDay <= dayEnd) ||
        (dayEnd < dayInit && (currentDay >= dayInit || currentDay <= dayEnd)) // Días que cruzan de una semana a otra
      ) {
        // Verificar los horarios dentro del día
        for (const schedule of shift?.schedules) {
          if (isTimeInRange(currentTime, schedule?.start, schedule?.end)) {
            return true; // Puede iniciar sesión
          }
        }
      }
    }

    return false; // No puede iniciar sesión
  };

  // Efecto para validar cuando `shifts` cambie
  useEffect(() => {
    if (shifts && shifts?.length > 0) {
      const validShift = isShiftValid();
      setCanLogin(validShift);
    } else {
      setCanLogin(false);
    }
  }, [shifts]);

  return canLogin;
};
