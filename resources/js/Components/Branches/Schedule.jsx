import { useEffect, useState } from 'react';
import { Button, Card, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { days } from '@components/Branches/days';

export default function Schedule({ field, onScheduleSave }) {
    const [selectedSlots, setSelectedSlots] = useState({});
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [isSelecting, setIsSelecting] = useState({
        active: false,
        isSelecting: false,
    });
    const [selectionStart, setSelectionStart] = useState(null);

    useEffect(() => {
        // Agregar listener para detener la selección si el mouse sale de la ventana
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            setSelectionStart(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const hours = Array.from(
        { length: 24 },
        (_, i) => i.toString().padStart(2, '0') + ':00'
    );

    const handleMouseDown = (day, hour) => {
        setIsSelecting(true);
        setSelectionStart({ day, hour });
        // Determinar si vamos a seleccionar o deseleccionar basado en el estado actual del primer slot
        const slotKey = `${day}-${hour}`;
        const isSlotSelected = selectedSlots[slotKey];
        // Guardamos la acción (seleccionar o deseleccionar) en el estado
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

            // Aplicar la misma acción (seleccionar o deseleccionar) a todos los slots en el rango
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
        // Primero agrupamos por día
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

        // Procesamos cada día para obtener los rangos de horas
        const schedules = Object.entries(groupedByDay).map(([day, hours]) => {
            // Ordenamos las horas y encontramos los rangos
            hours.sort((a, b) => a - b);
            const ranges = [];
            let rangeStart = hours[0];
            let prevHour = hours[0];

            for (let i = 1; i <= hours.length; i++) {
                if (i === hours.length || hours[i] !== prevHour + 1) {
                    // Fin del rango actual
                    ranges.push({
                        start_time: `${rangeStart.toString().padStart(2, '0')}:00`,
                        end_time: `${(prevHour + 1).toString().padStart(2, '0')}:00`,
                    });
                    if (i < hours.length) {
                        // Comenzar nuevo rango
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
        setSavedSchedules(schedules);
        onScheduleSave(schedules);
        message.success('Horarios guardados exitosamente');
    };

    return (
        <Card className="p-5 max-w-[1400px] mx-auto select-none">
            <div className="overflow-x-auto pt-10">
                <div className="grid grid-cols-[120px_repeat(24,minmax(45px,1fr))] gap-0.5 items-center">
                    <div className="day-label">Día/Hora</div>
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="relative h-[50px] flex items-start justify-center"
                        >
                            <span className="absolute top-0 origin-left -rotate-45 whitespace-nowrap text-sm text-gray-600 mt-2.5">
                                {hour}
                            </span>
                        </div>
                    ))}
                </div>

                {days.map((day) => (
                    <div
                        key={day.name}
                        className="grid grid-cols-[120px_repeat(24,minmax(45px,1fr))] gap-0.5 items-center"
                    >
                        <div className="p-2 font-medium text-left sticky left-0 bg-white z-10 text-sm">
                            {day.name}
                        </div>
                        {hours.map((_, index) => (
                            <div
                                key={`${day.name}-${index}`}
                                className={`h-[35px] border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-400
                  ${selectedSlots[`${day.name}-${index}`] ? 'bg-blue-500 border-blue-500' : ''}`}
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

            <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveSchedule}
                className="mt-4"
            >
                Guardar Horarios
            </Button>

            {savedSchedules.length > 0 && (
                <Card title="Horarios Guardados" className="mt-4">
                    {savedSchedules.map((schedule, index) => (
                        <div key={index}>
                            <strong>{schedule.day}:</strong>{' '}
                            {schedule.ranges.map((range, rangeIndex) => (
                                <span key={rangeIndex}>
                                    {range.start_time} a {range.end_time}
                                    {rangeIndex < schedule.ranges.length - 1
                                        ? ' - '
                                        : ''}
                                </span>
                            ))}
                        </div>
                    ))}
                </Card>
            )}
        </Card>
    );
}
