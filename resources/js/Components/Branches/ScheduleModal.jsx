import { useState } from 'react';
import { Modal, Button } from 'antd';
import Schedule from './Schedule';

export default function ScheduleModal({
    open,
    onClose,
    onSave,
    initialValue,
    isEditing,
}) {
    const [selectedSchedule, setSelectedSchedule] = useState(
        initialValue || []
    );

    const handleScheduleChange = (schedules) => {
        setSelectedSchedule(schedules);
    };

    const handleSave = () => {
        onSave(selectedSchedule);
        onClose();
    };

    return (
        <Modal
            title="Horarios"
            open={open}
            onCancel={onClose}
            style={{ top: 20 }}
            width={1200}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" onClick={handleSave}>
                    Guardar
                </Button>,
            ]}
        >
            <Schedule
                isEditing={isEditing}
                onScheduleSave={handleScheduleChange}
                initialSchedules={initialValue}
                isModalOpen={open}
            />
        </Modal>
    );
}
