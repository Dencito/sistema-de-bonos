import { useEffect, useState } from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import {
    SaveOutlined,
    ClearOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { days } from '@components/Branches/days';

export default function Schedule({
    onScheduleSave,
    isEditing,
    initialSchedules = [],
}) {
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
        'bg-green-300', // Verde claro
        'bg-red-300', // Rojo claro
        'bg-blue-300', // Azul claro
        'bg-purple-300', // Morado claro
        'bg-yellow-300', // Amarillo claro
        'bg-pink-300', // Rosa claro
        'bg-indigo-300', // Índigo claro
        'bg-teal-300', // Verde azulado
        'bg-orange-300', // Naranja claro
        'bg-cyan-300', // Cian claro
        'bg-lime-300', // Lima claro
        'bg-fuchsia-300', // Fucsia claro
        'bg-emerald-300', // Esmeralda claro
        'bg-violet-300', // Violeta claro
        'bg-amber-300', // Ámbar claro
        'bg-rose-300', // Rosa oscuro
        'bg-sky-300', // Celeste claro
        'bg-green-200', // Verde más claro
        'bg-blue-200', // Azul más claro
        'bg-purple-200', // Morado más claro
    ];

    const getRandomColor = () => {
        // Si todos los colores han sido usados, reiniciar la lista
        if (usedColors.length === colorVariants.length) {
            setUsedColors([]);
            return colorVariants[0];
        }

        // Filtrar los colores que no han sido usados
        const availableColors = colorVariants.filter(
            (color) => !usedColors.includes(color)
        );

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
            const isCurrentScheduleSlot = editingSchedule.schedules.some(schedule => {
                if (schedule.day !== day) return false;
                return schedule.ranges.some(range => {
                    const startHour = parseInt(range.start_time.split(':')[0]) * 2 + (range.start_time.split(':')[1] === '30' ? 1 : 0);
                    const endHour = parseInt(range.end_time.split(':')[0]) * 2 + (range.end_time.split(':')[1] === '30' ? 1 : 0);
                    return hour >= startHour && hour <= endHour;
                });
            });
            if (isCurrentScheduleSlot) return true;
        }

        // Verificar si el slot es el primer o último slot de algún turno existente
        for (const schedule of savedSchedules) {
            if (schedule === editingSchedule) continue;
            
            const daySchedules = schedule.schedules.find(s => s.day === day);
            if (!daySchedules) continue;

            for (const range of daySchedules.ranges) {
                const startHour = parseInt(range.start_time.split(':')[0]) * 2 + (range.start_time.split(':')[1] === '30' ? 1 : 0);
                const endHour = parseInt(range.end_time.split(':')[0]) * 2 + (range.end_time.split(':')[1] === '30' ? 1 : 0);

                // Es un slot válido si es el primer o último slot del turno
                if (hour === startHour || hour === endHour) {
                    return true;
                }

                // Si está dentro del rango (excepto primer y último slot), no es válido
                if (hour > startHour && hour < endHour) {
                    return false;
                }
            }
        }

        // Si no hay slots bloqueados en este día y hora, está permitido
        return !blockedSlots[`${day}-${hour}`];
    };

    const handleMouseDown = (day, hour) => {
        if (savedSchedules.length === 3 && !editingSchedule) {
            message.error('Se ha alcanzado el límite máximo de 3 turnos.');
            return;
        }

        // Solo permitir selección si es un slot del borde o está libre
        if (!isEdgeSlot(day, hour)) {
            message.error('Solo puedes seleccionar el primer o último slot de los turnos existentes');
            return;
        }

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

            const startDay = days.findIndex(
                (d) => d.name === selectionStart.day
            );
            const currentDay = days.findIndex((d) => d.name === day);
            const startHour = selectionStart.hour;

            // Verificar si todos los slots en el rango son válidos
            let allSlotsValid = true;
            for (
                let d = Math.min(startDay, currentDay);
                d <= Math.max(startDay, currentDay);
                d++
            ) {
                for (
                    let h = Math.min(startHour, hour);
                    h <= Math.max(startHour, hour);
                    h++
                ) {
                    if (!isEdgeSlot(days[d].name, h)) {
                        allSlotsValid = false;
                        break;
                    }
                }
                if (!allSlotsValid) break;
            }

            if (allSlotsValid) {
                for (
                    let d = Math.min(startDay, currentDay);
                    d <= Math.max(startDay, currentDay);
                    d++
                ) {
                    for (
                        let h = Math.min(startHour, hour);
                        h <= Math.max(startHour, hour);
                        h++
                    ) {
                        const slotKey = `${days[d].name}-${h}`;
                        newSelectedSlots[slotKey] = isSelecting.isSelecting;
                    }
                }
                setSelectedSlots(newSelectedSlots);
            }
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

    const handleSaveSchedule = () => {
        if (Object.keys(selectedSlots).length === 0) {
            message.error('Por favor selecciona al menos un horario');
            return;
        }

        // Agrupar slots por día
        const slotsByDay = {};
        Object.keys(selectedSlots).forEach((slot) => {
            const [day, hour] = slot.split('-');
            if (!slotsByDay[day]) {
                slotsByDay[day] = [];
            }
            slotsByDay[day].push(parseInt(hour));
        });

        // Crear schedules
        const groupedSchedules = Object.entries(slotsByDay).map(
            ([day, hours]) => {
                hours.sort((a, b) => a - b);
                const ranges = processOvernight(day, hours);
                return {
                    day,
                    ranges: ranges.map((range) => ({ ...range })),
                };
            }
        );

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
                    : schedule
            );
            setEditingSchedule(null); // Salir del modo edición
        } else {
            // Si es un nuevo turno, crear uno nuevo
            const nextShiftLetter = String.fromCharCode(
                65 + savedSchedules.length
            );
            const currentShiftName = nextShiftLetter;
            const shiftColor = getRandomColor();

            const shiftData = {
                name: `Turno ${currentShiftName}`,
                color: shiftColor,
                schedules: groupedSchedules,
            };
            updatedSchedules = [...savedSchedules, shiftData];
        }

        // Actualizar slots bloqueados
        const newBlockedSlots = { ...blockedSlots };
        const newBlockedSlotsColors = { ...blockedSlotsColors };

        Object.keys(selectedSlots).forEach((slot) => {
            const [day, hour] = slot.split('-');
            const slotKey = `${day}-${hour}`;
            newBlockedSlots[slotKey] = true;
            newBlockedSlotsColors[slotKey] = editingSchedule
                ? editingSchedule.color
                : updatedSchedules[updatedSchedules.length - 1].color;
        });

        setBlockedSlots(newBlockedSlots);
        setBlockedSlotsColors(newBlockedSlotsColors);
        setSavedSchedules(updatedSchedules);
        setSelectedSlots({});
        onScheduleSave(updatedSchedules);
        message.success(
            editingSchedule
                ? 'Turno actualizado exitosamente'
                : 'Turno guardado exitosamente'
        );
    };

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
                        .padStart(2, '0')}:${
                        (startHour - 48) % 2 === 0 ? '00' : '30'
                    }`,
                    end_time: `${Math.floor((endHour - 48) / 2)
                        .toString()
                        .padStart(2, '0')}:${
                        (endHour - 48) % 2 === 0 ? '00' : '30'
                    }`,
                });
            } else if (endHour < 48) {
                ranges.push({
                    start_time: `${Math.floor(startHour / 2)
                        .toString()
                        .padStart(
                            2,
                            '0'
                        )}:${startHour % 2 === 0 ? '00' : '30'}`,
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
                            .padStart(2, '0')}:${
                            beforeMidnight[0] % 2 === 0 ? '00' : '30'
                        }`,
                        end_time: '24:00',
                    });
                }

                if (afterMidnight.length > 0) {
                    ranges.push({
                        start_time: '00:00',
                        end_time: `${Math.floor(
                            (afterMidnight[afterMidnight.length - 1] - 48) / 2
                        )
                            .toString()
                            .padStart(2, '0')}:${
                            (afterMidnight[afterMidnight.length - 1] - 48) %
                                2 ===
                            0
                                ? '00'
                                : '30'
                        }`,
                    });
                }
            }
        });

        return ranges;
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

    const handleEditSchedule = (shift) => {
        const newSelectedSlots = {};
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
                    newSelectedSlots[`${day}-${h}`] = true;
                }
            });
        });

        const newBlockedSlots = { ...blockedSlots };
        Object.keys(newSelectedSlots).forEach((slot) => {
            delete newBlockedSlots[slot];
        });

        setBlockedSlots(newBlockedSlots);
        setSelectedSlots(newSelectedSlots);
        setEditingSchedule(shift);
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
                const startHour =
                    parseInt(startParts[0]) * 2 +
                    (startParts[1] === '30' ? 1 : 0);
                const endHour =
                    parseInt(endParts[0]) * 2 + (endParts[1] === '30' ? 1 : 0);

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
        const newSchedules = savedSchedules.filter(
            (schedule) => schedule !== shift
        );
        setSavedSchedules(newSchedules);

        // Notificar al componente padre del cambio
        onScheduleSave(newSchedules);

        message.success('Turno eliminado correctamente');
    };

    const handleCancelEdit = () => {
        setEditingSchedule(null);
        setSelectedSlots({});
        // Restore blocked slots from saved schedules
        const newBlockedSlots = {};
        const newBlockedSlotsColors = {};
        savedSchedules.forEach((schedule) => {
            schedule.schedules.forEach((dailySchedule) => {
                const { day, ranges } = dailySchedule;
                ranges.forEach((range) => {
                    const startParts = range.start_time.split(':');
                    const endParts = range.end_time.split(':');
                    const startHour =
                        parseInt(startParts[0]) * 2 +
                        (startParts[1] === '30' ? 1 : 0);
                    const endHour =
                        parseInt(endParts[0]) * 2 +
                        (endParts[1] === '30' ? 1 : 0);
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

    return (
        <Card className="p-5 max-w-[1400px] mx-auto select-none">
            <div className="overflow-x-auto pt-10">
                <div className="grid grid-cols-[120px_repeat(49,minmax(30px,1fr))] gap-0.5 items-center">
                    <div className="day-label">Día/Hora</div>
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="relative h-[40px] flex items-start justify-center"
                        >
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
                        <div className="p-2 font-medium text-left sticky left-0 bg-white z-10 text-sm">
                            {day.name}
                        </div>
                        {hours.map((_, index) => {
                            const slotKey = `${day.name}-${index}`;
                            const isBlocked = blockedSlots[slotKey];
                            const isSelected = selectedSlots[slotKey];
                            const isEdge = isEdgeSlot(day.name, index);
                            const isEditingSlot = editingSchedule && editingSchedule.schedules.some(schedule => 
                                schedule.day === day.name && schedule.ranges.some(range => {
                                    const startHour = parseInt(range.start_time.split(':')[0]) * 2 + (range.start_time.split(':')[1] === '30' ? 1 : 0);
                                    const endHour = parseInt(range.end_time.split(':')[0]) * 2 + (range.end_time.split(':')[1] === '30' ? 1 : 0);
                                    return index >= startHour && index <= endHour;
                                })
                            );
                            
                            let slotStyle = '';
                            if (isSelected) {
                                slotStyle = 'bg-blue-600 border-blue-700 shadow-md';
                            } else if (isEditingSlot) {
                                slotStyle = `${blockedSlotsColors[slotKey]} border-yellow-500 border-2`;
                            } else if (isBlocked) {
                                if (isEdge) {
                                    slotStyle = `${blockedSlotsColors[slotKey]} border-green-500 border-2 hover:brightness-110`;
                                } else {
                                    slotStyle = `${blockedSlotsColors[slotKey]} border-gray-500`;
                                }
                            } else if (isEdge) {
                                slotStyle = 'bg-green-50 hover:bg-green-100 border-green-400 border-dashed border-2';
                            } else {
                                slotStyle = 'bg-gray-200 border-gray-300 cursor-not-allowed';
                            }
                            
                            return (
                                <div
                                    key={`${day.name}-${index}`}
                                    className={`h-[30px] border rounded cursor-pointer transition-all duration-200 ${slotStyle}`}
                                    style={{
                                        opacity: isSelected ? 1 : isBlocked ? 0.9 : 1,
                                    }}
                                    onMouseDown={() => handleMouseDown(day.name, index)}
                                    onMouseEnter={() => handleMouseEnter(day.name, index)}
                                    onMouseUp={handleMouseUp}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                {(savedSchedules.length !== 3 || editingSchedule) && (
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveSchedule}
                        disabled={
                            Object.values(selectedSlots).filter(Boolean)
                                .length === 0
                        }
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
                    <div className="mt-2 pt-2 space-y-4">
                        {savedSchedules.map((scheduleItem, index) => (
                            <div
                                key={index}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="text-lg font-semibold mb-2 text-gray-700">
                                        {scheduleItem.name}
                                    </div>
                                    <div className="grid gap-2">
                                        {scheduleItem.schedules.map(
                                            (dailySchedule, dayIndex) => {
                                                // Filtrar rangos válidos (que no sean 00:00 a 00:00)
                                                const validRanges = dailySchedule.ranges.filter(
                                                    range => !(range.start_time === '00:00' && range.end_time === '00:00')
                                                );
                                                
                                                // Si no hay rangos válidos, no mostrar este día
                                                if (validRanges.length === 0) return null;

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="font-medium min-w-[100px] text-gray-600">
                                                            {dailySchedule.day}:
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {validRanges.map(
                                                                (range, rangeIndex) => (
                                                                    <span
                                                                        key={rangeIndex}
                                                                        className="bg-white px-3 py-1 rounded border border-gray-200"
                                                                    >
                                                                        {range.start_time} a {range.end_time}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            type="default"
                                            icon={<EditOutlined />}
                                            onClick={() =>
                                                handleEditSchedule(scheduleItem)
                                            }
                                            disabled={editingSchedule !== null}
                                        >
                                            {editingSchedule === scheduleItem
                                                ? 'Editando...'
                                                : 'Editar'}
                                        </Button>
                                        <Popconfirm
                                            title="¿Estás seguro de eliminar este turno?"
                                            onConfirm={() =>
                                                handleDeleteSchedule(
                                                    scheduleItem
                                                )
                                            }
                                            okText="Sí"
                                            cancelText="No"
                                            disabled={
                                                editingSchedule ===
                                                scheduleItem
                                            }
                                        >
                                            <Button
                                                type="default"
                                                danger
                                                icon={<DeleteOutlined />}
                                                disabled={
                                                    editingSchedule ===
                                                    scheduleItem
                                                }
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
