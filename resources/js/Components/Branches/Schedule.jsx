import { useEffect, useState } from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import { SaveOutlined, ClearOutlined } from '@ant-design/icons';
import { days } from '@components/Branches/days';

export default function Schedule({ onScheduleSave }) {
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

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            setSelectionStart(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

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

    const handleMouseDown = (day, hour) => {
        if (savedSchedules.length === 3) {
            message.error(
                'Se ha alcanzado el límite máximo de 3 turnos.'
            );
            return;
        }
        if (blockedSlots[`${day}-${hour}`]) return;

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
                    if (!blockedSlots[slotKey]) {
                        newSelectedSlots[slotKey] = isSelecting.isSelecting;
                    }
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
        if (!blockedSlots[slotKey]) {
            setSelectedSlots((prev) => ({
                ...prev,
                [slotKey]: !prev[slotKey],
            }));
        }
    };

    const handleSaveSchedule = () => {
        if (Object.keys(selectedSlots).length === 0) {
            message.error('Por favor selecciona al menos un horario');
            return;
        }

        // Generar el siguiente nombre de turno (A, B, C, etc.)
        const nextShiftLetter = String.fromCharCode(65 + savedSchedules.length);
        const currentShiftName = nextShiftLetter;

        // Agrupar slots por día y encontrar el último slot de cada día
        const slotsByDay = {};
        const lastSlotByDay = {};
        Object.keys(selectedSlots).forEach((slot) => {
            const [day, hour] = slot.split('-');
            if (!slotsByDay[day]) {
                slotsByDay[day] = [];
            }
            slotsByDay[day].push(parseInt(hour));

            if (!lastSlotByDay[day] || parseInt(hour) > lastSlotByDay[day]) {
                lastSlotByDay[day] = parseInt(hour);
            }
        });

        // Procesar los slots de cada día
        const schedules = [];
        Object.entries(slotsByDay).forEach(([day, hours]) => {
            const ranges = processOvernight(day, hours);
            schedules.push(...ranges);
        });

        // Agrupar los rangos por día
        const groupedSchedules = schedules.reduce((acc, schedule) => {
            const existingDay = acc.find((s) => s.day === schedule.day);
            if (existingDay) {
                existingDay.ranges.push({
                    start_time: schedule.start_time,
                    end_time: schedule.end_time,
                });
            } else {
                acc.push({
                    day: schedule.day,
                    ranges: [
                        {
                            start_time: schedule.start_time,
                            end_time: schedule.end_time,
                        },
                    ],
                });
            }
            return acc;
        }, []);

        // Ordenar los días según el orden en el array days
        groupedSchedules.sort((a, b) => {
            const dayIndexA = days.findIndex((d) => d.name === a.day);
            const dayIndexB = days.findIndex((d) => d.name === b.day);
            return dayIndexA - dayIndexB;
        });

        const shiftColor = getRandomColor();
        const shiftData = {
            name: `Turno ${currentShiftName}`,
            schedules: groupedSchedules,
            color: shiftColor,
        };

        setSavedSchedules([...savedSchedules, shiftData]);

        // Actualizar slots bloqueados y sus colores
        const newBlockedSlots = { ...blockedSlots };
        const newBlockedSlotsColors = { ...blockedSlotsColors };
        Object.keys(selectedSlots).forEach((slot) => {
            const [day, hour] = slot.split('-');
            if (parseInt(hour) !== lastSlotByDay[day]) {
                newBlockedSlots[slot] = true;
                newBlockedSlotsColors[slot] = shiftColor;
            }
        });

        setBlockedSlots(newBlockedSlots);
        setBlockedSlotsColors(newBlockedSlotsColors);
        setSelectedSlots({});

        onScheduleSave([...savedSchedules, shiftData]);
        message.success('Turno guardado exitosamente');
    };

    const processOvernight = (day, hours) => {
        // Agrupar las horas consecutivas
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

        // Procesar cada grupo de horas consecutivas
        const ranges = [];
        groups.forEach((group) => {
            const startHour = group[0];
            const endHour = group[group.length - 1];

            if (startHour >= 48) {
                // Si todo el grupo está después de medianoche
                ranges.push({
                    day: days[
                        (days.findIndex((d) => d.name === day) + 1) %
                            days.length
                    ].name,
                    start_time: `${Math.floor((startHour - 48) / 2)
                        .toString()
                        .padStart(
                            2,
                            '0'
                        )}:${(startHour - 48) % 2 === 0 ? '00' : '30'}`,
                    end_time: `${Math.floor((endHour - 48) / 2)
                        .toString()
                        .padStart(
                            2,
                            '0'
                        )}:${(endHour - 48) % 2 === 0 ? '00' : '30'}`,
                });
            } else if (endHour < 48) {
                // Si todo el grupo está antes de medianoche
                ranges.push({
                    day,
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
                // Si el grupo cruza la medianoche, separar en dos rangos
                const midnightIndex = group.findIndex((h) => h >= 48);
                const beforeMidnight = group.slice(0, midnightIndex);
                const afterMidnight = group.slice(midnightIndex);

                if (beforeMidnight.length > 0) {
                    ranges.push({
                        day,
                        start_time: `${Math.floor(beforeMidnight[0] / 2)
                            .toString()
                            .padStart(
                                2,
                                '0'
                            )}:${beforeMidnight[0] % 2 === 0 ? '00' : '30'}`,
                        end_time: '24:00',
                    });
                }

                if (afterMidnight.length > 0) {
                    ranges.push({
                        day: days[
                            (days.findIndex((d) => d.name === day) + 1) %
                                days.length
                        ].name,
                        start_time: '00:00',
                        end_time: `${Math.floor(
                            (afterMidnight[afterMidnight.length - 1] - 48) / 2
                        )
                            .toString()
                            .padStart(
                                2,
                                '0'
                            )}:${(afterMidnight[afterMidnight.length - 1] - 48) % 2 === 0 ? '00' : '30'}`,
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
        message.success('Todos los turnos han sido eliminados');
    };

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
                        {hours.map((_, index) => (
                            <div
                                key={`${day.name}-${index}`}
                                className={`h-[30px] border border-gray-200 rounded cursor-pointer transition-all duration-200 
                                    ${
                                        blockedSlots[`${day.name}-${index}`]
                                            ? blockedSlotsColors[
                                                  `${day.name}-${index}`
                                              ] || 'bg-gray-300'
                                            : selectedSlots[
                                                    `${day.name}-${index}`
                                                ]
                                              ? 'bg-blue-500 border-blue-500'
                                              : 'hover:bg-blue-50 hover:border-blue-400'
                                    } cursor-${blockedSlots[`${day.name}-${index}`] ? 'not-allowed' : 'pointer'}`}
                                onMouseDown={() =>
                                    handleMouseDown(day.name, index)
                                }
                                onMouseEnter={() =>
                                    handleMouseEnter(day.name, index)
                                }
                                onMouseUp={handleMouseUp}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                {savedSchedules.length !== 3 && <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveSchedule}
                    disabled={
                        Object.values(selectedSlots).filter(Boolean).length ===
                        0
                    }
                >
                    Guardar Turno
                </Button>}

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
        </Card>
    );
}
