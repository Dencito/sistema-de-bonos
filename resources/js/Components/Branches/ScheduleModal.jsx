import { useState } from "react";
import { Modal, Button } from "antd";
import Schedule from "./Schedule";

export default function ScheduleModal({ open, onClose, onSave, initialValue }) {
  const [selectedSchedule, setSelectedSchedule] = useState(initialValue || []);

  const handleScheduleChange = (schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleOk = () => {
    onSave(selectedSchedule);
    onClose();
  };

  return (
    <Modal
      title="Seleccionar Horarios"
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Guardar
        </Button>,
      ]}
    >
      <Schedule onScheduleSave={handleScheduleChange} />
    </Modal>
  );
}
