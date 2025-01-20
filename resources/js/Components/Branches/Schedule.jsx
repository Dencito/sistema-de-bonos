import { useEffect, useState } from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import { SaveOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';
import { days } from '@components/Branches/days';

export default function Schedule({ onScheduleSave }) {
    const [selectedSlots, setSelectedSlots] = useState({});
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState({});
    const [isSelecting, setIsSelecting] = useState({
        active: false,
        isSelecting: false,
    });
    const [selectionStart, setSelectionStart] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

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

    const handleMouseDown = (day, hour) => {
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
        const groupedByDay = Object.entries(selectedSlots)
            .filter(([, isSelected]) => isSelected)
            .reduce((acc, [slot]) => {
                const [day, hour] = slot.split('-');
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(parseInt(hour));
                return acc;
            }, {});

        const schedules = Object.entries(groupedByDay).map(([day, hours]) => {
            hours.sort((a, b) => a - b);
            const ranges = [];
            let rangeStart = hours[0];
            let prevHour = hours[0];

            for (let i = 1; i <= hours.length; i++) {
                if (i === hours.length || hours[i] !== prevHour + 1) {
                    const start = `${Math.floor(rangeStart / 2)
                        .toString()
                        .padStart(
                            2,
                            '0'
                        )}:${rangeStart % 2 === 0 ? '00' : '30'}`;
                    const end = `${Math.floor(prevHour / 2)
                        .toString()
                        .padStart(2, '0')}:${prevHour % 2 === 0 ? '00' : '30'}`;
                    ranges.push({
                        start_time: start,
                        end_time: end,
                    });
                    if (i < hours.length) {
                        rangeStart = hours[i];
                    }
                }
                if (i < hours.length) {
                    prevHour = hours[i];
                }
            }

            return {
                day,
                ranges,
            };
        });

        // Actualizar slots bloqueados, excluyendo el último slot de cada rango
        const newBlockedSlots = { ...blockedSlots };
        Object.entries(selectedSlots).forEach(([slot, isSelected]) => {
            if (isSelected) {
                const [day, hour] = slot.split('-');
                const hourNum = parseInt(hour);
                const hours = groupedByDay[day];

                // Si no es el último slot del rango, bloquearlo
                if (hourNum !== Math.max(...hours)) {
                    newBlockedSlots[slot] = true;
                }
            }
        });

        if (editingIndex !== null) {
            const newSchedules = [...savedSchedules];
            newSchedules[editingIndex] = schedules[0];
            setSavedSchedules(newSchedules);
            setEditingIndex(null);
        } else {
            setSavedSchedules([...savedSchedules, ...schedules]);
        }

        setBlockedSlots(newBlockedSlots);
        setSelectedSlots({});
        setEditingSchedule(null);
        onScheduleSave(schedules);
        message.success('Turno guardado exitosamente');
    };

    const handleCancelEdit = () => {
        if (editingSchedule) {
            // Restaurar los slots bloqueados del horario que se estaba editando
            const newBlockedSlots = { ...blockedSlots };
            editingSchedule.ranges.forEach((range) => {
                const startHour =
                    parseInt(range.start_time.split(':')[0]) * 2 +
                    (range.start_time.split(':')[1] === '30' ? 1 : 0);
                const endHour =
                    parseInt(range.end_time.split(':')[0]) * 2 +
                    (range.end_time.split(':')[1] === '30' ? 1 : 0);

                for (let h = startHour; h < endHour; h++) {
                    newBlockedSlots[`${editingSchedule.day}-${h}`] = true;
                }
            });
            setBlockedSlots(newBlockedSlots);
        }
        setSelectedSlots({});
        setEditingSchedule(null);
        setEditingIndex(null);
    };

    const handleClearAll = () => {
        setBlockedSlots({});
        setSelectedSlots({});
        setSavedSchedules([]);
        setEditingSchedule(null);
        setEditingIndex(null);
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
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : selectedSlots[
                                                    `${day.name}-${index}`
                                                ]
                                              ? 'bg-blue-500 border-blue-500'
                                              : 'hover:bg-blue-50 hover:border-blue-400'
                                    }`}
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
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveSchedule}
                    disabled={
                        Object.values(selectedSlots).filter(Boolean).length ===
                        0
                    }
                >
                    {editingSchedule ? 'Guardar Cambios' : 'Guardar Turno'}
                </Button>

                {editingSchedule && (
                    <Button
                        type="default"
                        icon={<CloseOutlined />}
                        onClick={handleCancelEdit}
                    >
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
        </Card>
    );
}
