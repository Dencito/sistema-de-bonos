import { useEffect, useState } from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import { SaveOutlined, EditOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
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

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            setSelectionStart(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const hours = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    const handleMouseDown = (day, hour) => {
        // No permitir selección en slots bloqueados
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

            const startDay = days.findIndex((d) => d.name === selectionStart.day);
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
                    // Solo seleccionar si el slot no está bloqueado
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
                        .padStart(2, '0')}:${rangeStart % 2 === 0 ? '00' : '30'}`;
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

        // Actualizar slots bloqueados
        const newBlockedSlots = { ...blockedSlots };
        Object.entries(selectedSlots).forEach(([slot, isSelected]) => {
            if (isSelected) {
                newBlockedSlots[slot] = true;
            }
        });
        setBlockedSlots(newBlockedSlots);

        setSavedSchedules([...savedSchedules, ...schedules]);
        setSelectedSlots({});
        onScheduleSave(schedules);
        message.success('Turno guardado exitosamente');
    };

    const handleEditSchedule = (index) => {
        const schedule = savedSchedules[index];
        // Convertir el horario guardado a slots seleccionados
        const newSelectedSlots = {};
        schedule.ranges.forEach((range) => {
            const startHour = parseInt(range.start_time.split(':')[0]) * 2 +
                (range.start_time.split(':')[1] === '30' ? 1 : 0);
            const endHour = parseInt(range.end_time.split(':')[0]) * 2 +
                (range.end_time.split(':')[1] === '30' ? 1 : 0);
            
            for (let h = startHour; h <= endHour; h++) {
                newSelectedSlots[`${schedule.day}-${h}`] = true;
            }
        });

        // Eliminar los slots bloqueados correspondientes
        const newBlockedSlots = { ...blockedSlots };
        Object.keys(newSelectedSlots).forEach((slot) => {
            delete newBlockedSlots[slot];
        });

        setBlockedSlots(newBlockedSlots);
        setSelectedSlots(newSelectedSlots);
        
        // Eliminar el horario que se está editando
        const newSchedules = [...savedSchedules];
        newSchedules.splice(index, 1);
        setSavedSchedules(newSchedules);
    };

    const handleDeleteSchedule = (index) => {
        const schedule = savedSchedules[index];
        // Eliminar los slots bloqueados correspondientes
        const newBlockedSlots = { ...blockedSlots };
        schedule.ranges.forEach((range) => {
            const startHour = parseInt(range.start_time.split(':')[0]) * 2 +
                (range.start_time.split(':')[1] === '30' ? 1 : 0);
            const endHour = parseInt(range.end_time.split(':')[0]) * 2 +
                (range.end_time.split(':')[1] === '30' ? 1 : 0);
            
            for (let h = startHour; h <= endHour; h++) {
                delete newBlockedSlots[`${schedule.day}-${h}`];
            }
        });

        setBlockedSlots(newBlockedSlots);
        const newSchedules = [...savedSchedules];
        newSchedules.splice(index, 1);
        setSavedSchedules(newSchedules);
        message.success('Turno eliminado exitosamente');
    };

    const handleClearAll = () => {
        setBlockedSlots({});
        setSelectedSlots({});
        setSavedSchedules([]);
        message.success('Todos los turnos han sido eliminados');
    };

    return (
        <Card className="p-5 max-w-[1400px] mx-auto select-none">
            <div className="overflow-x-auto pt-10">
                <div className="grid grid-cols-[120px_repeat(48,minmax(30px,1fr))] gap-0.5 items-center">
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
                        className="grid grid-cols-[120px_repeat(48,minmax(30px,1fr))] gap-0.5 items-center"
                    >
                        <div className="p-2 font-medium text-left sticky left-0 bg-white z-10 text-sm">
                            {day.name}
                        </div>
                        {hours.map((_, index) => (
                            <div
                                key={`${day.name}-${index}`}
                                className={`h-[30px] border border-gray-200 rounded cursor-pointer transition-all duration-200 
                                    ${blockedSlots[`${day.name}-${index}`] 
                                        ? 'bg-gray-300 cursor-not-allowed' 
                                        : selectedSlots[`${day.name}-${index}`]
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'hover:bg-blue-50 hover:border-blue-400'
                                    }`}
                                onMouseDown={() => handleMouseDown(day.name, index)}
                                onMouseEnter={() => handleMouseEnter(day.name, index)}
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
                    disabled={Object.values(selectedSlots).filter(Boolean).length === 0}
                >
                    Guardar Turno
                </Button>
                
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

            {savedSchedules.length > 0 && (
                <Card title="Turnos Guardados" className="mt-4">
                    {savedSchedules.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                            <div>
                                <strong>{schedule.day}:</strong>{' '}
                                {schedule.ranges.map((range, rangeIndex) => (
                                    <span key={rangeIndex}>
                                        {range.start_time} a {range.end_time}
                                        {rangeIndex < schedule.ranges.length - 1 ? ' - ' : ''}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="default"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditSchedule(index)}
                                >
                                    Editar
                                </Button>
                                <Popconfirm
                                    title="¿Estás seguro de eliminar este turno?"
                                    onConfirm={() => handleDeleteSchedule(index)}
                                    okText="Sí"
                                    cancelText="No"
                                >
                                    <Button
                                        type="default"
                                        danger
                                        icon={<DeleteOutlined />}
                                    >
                                        Eliminar
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </Card>
    );
}
