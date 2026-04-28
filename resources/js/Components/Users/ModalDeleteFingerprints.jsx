import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal, Tooltip } from 'antd';
import React from 'react';
import { userService } from '@services/api';

const FingerprintOff = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M12 2a10 10 0 0 1 7.34 17" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function ModalDeleteFingerprints({ data }) {
  const { successMsg, errorMsg } = useMessage();

  if (!data?.has_fingerprint) {
    return null;
  }

  const handleDelete = async () => {
    try {
      const response = await userService.clearFingerprints(data?.id);
      if (response.success) {
        successMsg(response.message || 'Huellas eliminadas correctamente');
        router.visit(window.location.href, { preserveState: true });
      } else {
        errorMsg(response.message);
      }
    } catch {
      errorMsg('Error al eliminar las huellas');
    }
  };

  const showConfirm = () => {
    const fullName = [data?.first_name, data?.first_last_name].filter(Boolean).join(' ') || data?.username;
    Modal.confirm({
      title: `¿Eliminar las huellas de ${fullName}?`,
      content: 'Se borrarán las huellas registradas y el usuario quedará habilitado para volver a enrolarse.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        handleDelete();
      },
    });
  };

  return (
    <Tooltip title="Eliminar huellas">
      <Button
        danger
        onClick={showConfirm}
        icon={<FingerprintOff />}
      />
    </Tooltip>
  );
}
