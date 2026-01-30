import { useEffect, useState } from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import { SaveOutlined, ClearOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { days } from '@components/Branches/days';

export default function Schedule({ onScheduleSave, isEditing, initialSchedules = [] }) {
  const [selectedSlots, setSelectedSlots] = useState({});
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState({});
  const [blockedSlotsColors, setBlockedSlotsColors] = useState({});
  const [usedColors, setUsedColors] = useState([]);
  const [isSelecting, setIsSelecting] = useState({
    active: false,
    isSelecting: false,
  });
  const [selectionStart, setSelectionStart] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
      setSelectionStart(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      const newBlockedSlots = {};
      const newBlockedSlotsColors = {};

      initialSchedules.forEach((schedule) => {
        schedule.schedules.forEach((dailySchedule) => {
          const { day, ranges } = dailySchedule;
          ranges.forEach((range) => {
            const startParts = range.start_time.split(':');
            const endParts = range.end_time.split(':');

            const startHour = parseInt(startParts[0]);
            const startMinute = startParts[1] === '30' ? 1 : 0;
            const endHour = parseInt(endParts[0]);
            const endMinute = endParts[1] === '30' ? 1 : 0;

            if (!isNaN(startHour) && !isNaN(endHour)) {
              const startSlot = startHour * 2 + startMinute;
              const endSlot = endHour * 2 + endMinute;

              for (let h = startSlot; h <= endSlot; h++) {
                const slotKey = `${day}-${h}`;
                newBlockedSlots[slotKey] = true;
                newBlockedSlotsColors[slotKey] = schedule.color;
              }
            }
          });
        });
      });

      setBlockedSlots(newBlockedSlots);
      setBlockedSlotsColors(newBlockedSlotsColors);
      setSavedSchedules(initialSchedules);
    }
  }, [initialSchedules]);

  const hours = Array.from({ length: 49 }, (_, i) => {
    if (i === 48) return '24:00';
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const colorVariants = [
    'bg-blue-400', // Azul
    'bg-red-400', // Rojo
    'bg-amber-400', // Ámbar
    'bg-emerald-400', // Esmeralda
  ];

  const getRandomColor = () => {
    // Si todos los colores han sido usados, reiniciar la lista
    if (usedColors.length === colorVariants.length) {
      setUsedColors([]);
      return colorVariants[0];
    }

    // Filtrar los colores que no han sido usados
    const availableColors = colorVariants.filter((color) => !usedColors.includes(color));

    // Seleccionar un color aleatorio de los disponibles
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const selectedColor = availableColors[randomIndex];

    // Agregar el color seleccionado a la lista de usados
    setUsedColors((prev) => [...prev, selectedColor]);

    return selectedColor;
  };

  const isEdgeSlot = (day, hour) => {
    // Si estamos editando, permitir seleccionar slots del turno actual
    if (editingSchedule) {
      const isCurrentScheduleSlot = editingSchedule.schedules.some((schedule) => {
        if (schedule.day !== day) return false;
        return schedule.ranges.some((range) => {
          const startHour =
            parseInt(range.start_time.split(':')[0]) * 2 +
            (range.start_time.split(':')[1] === '30' ? 1 : 0);
          const endHour =
            parseInt(range.end_time.split(':')[0]) * 2 +
            (range.end_time.split(':')[1] === '30' ? 1 : 0);
          return hour >= startHour && hour <= endHour;
        });
      });
      if (isCurrentScheduleSlot) return true;
    }

    // Permitir solapar en cualquier posición
    // Siempre devolvemos true para permitir seleccionar cualquier slot
    return true;
  };

  const handleMouseDown = (day, hour) => {
    if (savedSchedules.length === 3 && !editingSchedule) {
      message.error('Se ha alcanzado el límite máximo de 3 turnos.');
      return;
    }

    // Permitir selección en cualquier slot, incluso si ya está ocupado por otro turno

    setIsSelecting(true);
    setSelectionStart({ day, hour });
    const slotKey = `${day}-${hour}`;
    const isSlotSelected = selectedSlots[slotKey];
    setIsSelecting({ active: true, isSelecting: !isSlotSelected });
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day, hour) => {
    if (isSelecting.active && selectionStart) {
      const newSelectedSlots = { ...selectedSlots };

      const startDay = days.findIndex((d) => d.name === selectionStart.day);
      const currentDay = days.findIndex((d) => d.name === day);
      const startHour = selectionStart.hour;

      // Permitir seleccionar cualquier slot, incluso si ya está ocupado
      // Siempre permitimos la selección

      for (let d = Math.min(startDay, currentDay); d <= Math.max(startDay, currentDay); d++) {
        for (let h = Math.min(startHour, hour); h <= Math.max(startHour, hour); h++) {
          const slotKey = `${days[d].name}-${h}`;
          newSelectedSlots[slotKey] = isSelecting.isSelecting;
        }
      }
      setSelectedSlots(newSelectedSlots);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting({ active: false, isSelecting: false });
    setSelectionStart(null);
  };

  const toggleSlot = (day, hour) => {
    const slotKey = `${day}-${hour}`;
    setSelectedSlots((prev) => ({
      ...prev,
      [slotKey]: !prev[slotKey],
    }));
  };

  // Función para generar array de times basado en ranges
  const generateTimesFromRanges = (ranges) => {
    // Usar un Set para evitar duplicados automáticamente
    const timeSet = new Set();

    ranges.forEach((range) => {
      // Ignorar rangos vacíos (00:00 a 00:00)
      if (range.start_time === '00:00' && range.end_time === '00:00') {
        return;
      }

      const [startHour, startMin] = range.start_time.split(':').map(Number);
      const [endHour, endMin] = range.end_time.split(':').map(Number);

      // Convertir a minutos desde medianoche
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // Si end_time es 24:00, convertir a minutos del día siguiente
      if (endHour === 24) {
        endMinutes = 24 * 60;
      }

      // Generar intervalos de 1 minuto (minuto a minuto)
      for (let minutes = startMinutes; minutes <= endMinutes; minutes++) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        // Usar Set.add() en lugar de comprobar includes y push
        timeSet.add(timeStr);
      }
    });

    // Convertir el Set a Array y ordenar
    return Array.from(timeSet).sort((a, b) => {
      // Convertir a minutos para comparar correctamente
      const [aHour, aMin] = a.split(':').map(Number);
      const [bHour, bMin] = b.split(':').map(Number);
      const aMinutes = aHour * 60 + aMin;
      const bMinutes = bHour * 60 + bMin;
      return aMinutes - bMinutes;
    });
  };

  const handleSaveSchedule = () => {
    if (Object.keys(selectedSlots).length === 0) {
      message.error('Por favor selecciona al menos un horario');
      return;
    }

    // Agrupar slots por día
    const slotsByDay = {};
    Object.keys(selectedSlots).forEach((slot) => {
      if (selectedSlots[slot]) {
        // Solo procesar slots que están seleccionados
        const [day, hour] = slot.split('-');
        if (!slotsByDay[day]) {
          slotsByDay[day] = [];
        }
        slotsByDay[day].push(parseInt(hour));
      }
    });

    // Crear schedules
    const groupedSchedules = Object.entries(slotsByDay).map(([day, hours]) => {
      hours.sort((a, b) => a - b);
      const ranges = processOvernight(day, hours);
      const timesArray = generateTimesFromRanges(ranges);
      return {
        day,
        ranges: ranges.map((range) => ({ ...range })),
        times: timesArray,
      };
    });

    // Ordenar por día
    groupedSchedules.sort((a, b) => {
      const dayIndexA = days.findIndex((d) => d.name === a.day);
      const dayIndexB = days.findIndex((d) => d.name === b.day);
      return dayIndexA - dayIndexB;
    });

    let updatedSchedules;
    if (editingSchedule) {
      // Si estamos editando, actualizar el turno existente
      updatedSchedules = savedSchedules.map((schedule) =>
        schedule === editingSchedule
          ? {
              ...schedule,
              schedules: groupedSchedules,
            }
          : schedule,
      );
      setEditingSchedule(null); // Salir del modo edición
    } else {
      // Si es un nuevo turno, crear uno nuevo
      const nextShiftLetter = String.fromCharCode(65 + savedSchedules.length);
      const currentShiftName = nextShiftLetter;
      const shiftColor = getRandomColor();

      const shiftData = {
        name: `Turno ${currentShiftName}`,
        color: shiftColor,
        schedules: groupedSchedules,
      };
      updatedSchedules = [...savedSchedules, shiftData];
    }

    // Mantenemos los slots bloqueados para visualización pero permitimos solapamiento
    const newBlockedSlots = {};
    const newBlockedSlotsColors = {};

    // Guardar los colores de los slots para visualización
    updatedSchedules.forEach((schedule) => {
      schedule.schedules.forEach((dailySchedule) => {
        const { day, ranges } = dailySchedule;
        ranges.forEach((range) => {
          const startParts = range.start_time.split(':');
          const endParts = range.end_time.split(':');
          const startHour = parseInt(startParts[0]) * 2 + (startParts[1] === '30' ? 1 : 0);
          const endHour = parseInt(endParts[0]) * 2 + (endParts[1] === '30' ? 1 : 0);

          for (let h = startHour; h <= endHour; h++) {
            const slotKey = `${day}-${h}`;
            // Marcamos como bloqueado para visualización pero permitimos solapamiento
            newBlockedSlots[slotKey] = true;
            newBlockedSlotsColors[slotKey] = schedule.color;
          }
        });
      });
    });

    setBlockedSlots(newBlockedSlots);
    setBlockedSlotsColors(newBlockedSlotsColors);
    setSavedSchedules(updatedSchedules);
    setSelectedSlots({});
    onScheduleSave(updatedSchedules);
    message.success(
      editingSchedule ? 'Turno actualizado exitosamente' : 'Turno guardado exitosamente',
    );
  };

  const handleEditSchedule = (shift) => {
    const newSelectedSlots = {};

    // Limpiar los slots bloqueados y colores del turno que se va a editar
    const newBlockedSlots = { ...blockedSlots };
    const newBlockedSlotsColors = { ...blockedSlotsColors };

    shift.schedules.forEach((dailySchedule) => {
      const { day, ranges } = dailySchedule;
      ranges.forEach((range) => {
        const startHour =
          parseInt(range.start_time.split(':')[0]) * 2 +
          (range.start_time.split(':')[1] === '30' ? 1 : 0);
        const endHour =
          parseInt(range.end_time.split(':')[0]) * 2 +
          (range.end_time.split(':')[1] === '30' ? 1 : 0);

        for (let h = startHour; h <= endHour; h++) {
          const slotKey = `${day}-${h}`;
          newSelectedSlots[slotKey] = true;
          // Eliminamos los bloques y colores del turno que estamos editando
          delete newBlockedSlots[slotKey];
          delete newBlockedSlotsColors[slotKey];
        }
      });
    });

    setBlockedSlots(newBlockedSlots);
    setBlockedSlotsColors(newBlockedSlotsColors);
    setSelectedSlots(newSelectedSlots);
    setEditingSchedule(shift);
  };

  const handleClearAll = () => {
    setBlockedSlots({});
    setBlockedSlotsColors({});
    setSelectedSlots({});
    setSavedSchedules([]);
    setUsedColors([]); // Reiniciar los colores usados
    onScheduleSave([]); // Notificar al padre que los horarios se han limpiado
    message.success('Todos los turnos han sido eliminados');
  };

  const handleDeleteSchedule = (shift) => {
    // Eliminar los slots del turno eliminado
    const newBlockedSlots = { ...blockedSlots };
    const newBlockedSlotsColors = { ...blockedSlotsColors };

    // Remover los slots del turno a eliminar
    shift.schedules.forEach((dailySchedule) => {
      const { day, ranges } = dailySchedule;
      ranges.forEach((range) => {
        const startParts = range.start_time.split(':');
        const endParts = range.end_time.split(':');
        const startHour = parseInt(startParts[0]) * 2 + (startParts[1] === '30' ? 1 : 0);
        const endHour = parseInt(endParts[0]) * 2 + (endParts[1] === '30' ? 1 : 0);

        for (let h = startHour; h <= endHour; h++) {
          const slotKey = `${day}-${h}`;
          delete newBlockedSlots[slotKey];
          delete newBlockedSlotsColors[slotKey];
        }
      });
    });

    // Actualizar el estado con los nuevos slots
    setBlockedSlots(newBlockedSlots);
    setBlockedSlotsColors(newBlockedSlotsColors);

    // Actualizar la lista de turnos
    const newSchedules = savedSchedules.filter((schedule) => schedule !== shift);
    setSavedSchedules(newSchedules);

    // Notificar al componente padre del cambio
    onScheduleSave(newSchedules);

    message.success('Turno eliminado correctamente');
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setSelectedSlots({});
    // Restaurar los slots bloqueados y colores desde los horarios guardados
    const newBlockedSlots = {};
    const newBlockedSlotsColors = {};
    savedSchedules.forEach((schedule) => {
      schedule.schedules.forEach((dailySchedule) => {
        const { day, ranges } = dailySchedule;
        ranges.forEach((range) => {
          const startParts = range.start_time.split(':');
          const endParts = range.end_time.split(':');
          const startHour = parseInt(startParts[0]) * 2 + (startParts[1] === '30' ? 1 : 0);
          const endHour = parseInt(endParts[0]) * 2 + (endParts[1] === '30' ? 1 : 0);
          for (let h = startHour; h <= endHour; h++) {
            const slotKey = `${day}-${h}`;
            newBlockedSlots[slotKey] = true;
            newBlockedSlotsColors[slotKey] = schedule.color;
          }
        });
      });
    });
    setBlockedSlots(newBlockedSlots);
    setBlockedSlotsColors(newBlockedSlotsColors);
  };

  const groupedSchedules = savedSchedules.reduce((acc, schedule) => {
    if (!schedule.schedules || !Array.isArray(schedule.schedules)) {
      return acc;
    }

    schedule.schedules.forEach((item) => {
      if (!item.day || !Array.isArray(item.ranges)) {
        return;
      }
      const { day, ranges } = item;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(...ranges);
    });

    return acc;
  }, {});

  const processOvernight = (day, hours) => {
    hours.sort((a, b) => a - b);
    const groups = [];
    let currentGroup = [hours[0]];

    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === hours[i - 1] + 1) {
        currentGroup.push(hours[i]);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [hours[i]];
      }
    }
    groups.push(currentGroup);

    const ranges = [];
    groups.forEach((group) => {
      const startHour = group[0];
      const endHour = group[group.length - 1];

      if (startHour >= 48) {
        ranges.push({
          start_time: `${Math.floor((startHour - 48) / 2)
            .toString()
            .padStart(2, '0')}:${(startHour - 48) % 2 === 0 ? '00' : '30'}`,
          end_time: `${Math.floor((endHour - 48) / 2)
            .toString()
            .padStart(2, '0')}:${(endHour - 48) % 2 === 0 ? '00' : '30'}`,
        });
      } else if (endHour < 48) {
        ranges.push({
          start_time: `${Math.floor(startHour / 2)
            .toString()
            .padStart(2, '0')}:${startHour % 2 === 0 ? '00' : '30'}`,
          end_time: `${Math.floor(endHour / 2)
            .toString()
            .padStart(2, '0')}:${endHour % 2 === 0 ? '00' : '30'}`,
        });
      } else {
        const midnightIndex = group.findIndex((h) => h >= 48);
        const beforeMidnight = group.slice(0, midnightIndex);
        const afterMidnight = group.slice(midnightIndex);

        if (beforeMidnight.length > 0) {
          ranges.push({
            start_time: `${Math.floor(beforeMidnight[0] / 2)
              .toString()
              .padStart(2, '0')}:${beforeMidnight[0] % 2 === 0 ? '00' : '30'}`,
            end_time: '24:00',
          });
        }

        if (afterMidnight.length > 0) {
          ranges.push({
            start_time: '00:00',
            end_time: `${Math.floor((afterMidnight[afterMidnight.length - 1] - 48) / 2)
              .toString()
              .padStart(2, '0')}:${
              (afterMidnight[afterMidnight.length - 1] - 48) % 2 === 0 ? '00' : '30'
            }`,
          });
        }
      }
    });

    return ranges;
  };

  return (
    <Card className="p-5 max-w-[1400px] mx-auto select-none">
      <div className="mb-4 text-sm text-gray-600">
        <div className="flex gap-2 items-center mb-1">
          <div className="w-4 h-4 border-2 border-black"></div>
          <span>Slots disponibles para solapar con otros turnos</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border border-gray-300"></div>
          <span>Slots disponibles para selección normal</span>
        </div>
      </div>
      <div className="overflow-x-auto pt-10">
        <div className="grid grid-cols-[120px_repeat(49,minmax(30px,1fr))] gap-0.5 items-center">
          <div className="day-label">Día/Hora</div>
          {hours.map((hour) => (
            <div key={hour} className="relative h-[40px] flex items-start justify-center">
              <span className="absolute top-0 origin-left -rotate-45 whitespace-nowrap text-xs text-gray-600 mt-2.5">
                {hour}
              </span>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div
            key={day.name}
            className="grid grid-cols-[120px_repeat(49,minmax(30px,1fr))] gap-0.5 items-center"
          >
            <div className="sticky left-0 z-10 p-2 text-sm font-medium text-left bg-white">
              {day.name}
            </div>
            {hours.map((_, index) => {
              const slotKey = `${day.name}-${index}`;
              const isBlocked = blockedSlots[slotKey];
              const isSelected = selectedSlots[slotKey];
              const isEditingSlot =
                editingSchedule &&
                editingSchedule.schedules.some(
                  (schedule) =>
                    schedule.day === day.name &&
                    schedule.ranges.some((range) => {
                      const startHour =
                        parseInt(range.start_time.split(':')[0]) * 2 +
                        (range.start_time.split(':')[1] === '30' ? 1 : 0);
                      const endHour =
                        parseInt(range.end_time.split(':')[0]) * 2 +
                        (range.end_time.split(':')[1] === '30' ? 1 : 0);
                      return index >= startHour && index <= endHour;
                    }),
                );

              let slotStyle = '';
              let tooltipText = '';

              if (isSelected) {
                // Slot seleccionado - Azul brillante con sombra
                slotStyle =
                  'bg-blue-500 border-blue-600 shadow-md hover:bg-blue-600 transition-all';
              } else if (isEditingSlot) {
                // Slot en edición - Color original con borde amarillo brillante y efecto de pulso
                slotStyle = `${blockedSlotsColors[slotKey]} border-yellow-400 border-2 animate-pulse`;
                tooltipText = 'Editando turno';
              } else if (isBlocked) {
                // Todos los slots bloqueados tienen borde negro para indicar que se pueden solapar
                slotStyle = `${blockedSlotsColors[slotKey]} border-black border-2 hover:brightness-110 transition-all`;
                tooltipText = 'Click para solapar con este turno';
              } else {
                // Slot disponible - Blanco con borde negro
                slotStyle = 'bg-white hover:bg-gray-50 border-black border-2 transition-all';
              }

              return (
                <div
                  key={`${day.name}-${index}`}
                  className={`relative rounded border cursor-pointer h-[30px] ${slotStyle} group`}
                  style={{
                    opacity: isSelected ? 1 : isEditingSlot ? 0.9 : isBlocked ? 0.85 : 1,
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title={tooltipText}
                  onMouseDown={() => handleMouseDown(day.name, index)}
                  onMouseEnter={() => handleMouseEnter(day.name, index)}
                  onMouseUp={handleMouseUp}
                >
                  {tooltipText && (
                    <div className="hidden absolute -top-7 left-1/2 z-50 p-1 text-xs text-white whitespace-nowrap bg-black rounded transform -translate-x-1/2 group-hover:block">
                      {tooltipText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        {(savedSchedules.length !== 3 || editingSchedule) && (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSchedule}
            disabled={Object.values(selectedSlots).filter(Boolean).length === 0}
          >
            {editingSchedule ? 'Guardar Cambios' : 'Guardar Turno'}
          </Button>
        )}

        {editingSchedule && (
          <Button type="default" onClick={handleCancelEdit}>
            Cancelar Edición
          </Button>
        )}

        <Popconfirm
          title="¿Estás seguro de eliminar todos los turnos?"
          onConfirm={handleClearAll}
          okText="Sí"
          cancelText="No"
        >
          <Button
            type="default"
            danger
            icon={<ClearOutlined />}
            disabled={savedSchedules.length === 0}
          >
            Limpiar Todo
          </Button>
        </Popconfirm>
      </div>
      {isEditing && Object.entries(groupedSchedules).length > 0 && (
        <Card title="Turnos Guardados">
          <div className="pt-2 mt-2 space-y-4">
            {savedSchedules.map((scheduleItem, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="mb-2 text-lg font-semibold text-gray-700">
                    {scheduleItem.name}
                  </div>
                  <div className="grid gap-2">
                    {scheduleItem.schedules.map((dailySchedule, dayIndex) => {
                      // Filtrar rangos válidos (que no sean 00:00 a 00:00)
                      const validRanges = dailySchedule.ranges.filter(
                        (range) => !(range.start_time === '00:00' && range.end_time === '00:00'),
                      );

                      // Si no hay rangos válidos, no mostrar este día
                      if (validRanges.length === 0) return null;

                      return (
                        <div key={dayIndex} className="flex gap-2 items-center">
                          <span className="font-medium min-w-[100px] text-gray-600">
                            {dailySchedule.day}:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {validRanges.map((range, rangeIndex) => (
                              <span
                                key={rangeIndex}
                                className="px-3 py-1 bg-white rounded border border-gray-200"
                              >
                                {range.start_time} a {range.end_time}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEditSchedule(scheduleItem)}
                      disabled={editingSchedule !== null}
                    >
                      {editingSchedule === scheduleItem ? 'Editando...' : 'Editar'}
                    </Button>
                    <Popconfirm
                      title="¿Estás seguro de eliminar este turno?"
                      onConfirm={() => handleDeleteSchedule(scheduleItem)}
                      okText="Sí"
                      cancelText="No"
                      disabled={editingSchedule === scheduleItem}
                    >
                      <Button
                        type="default"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={editingSchedule === scheduleItem}
                      >
                        Eliminar
                      </Button>
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </Card>
  );
}
