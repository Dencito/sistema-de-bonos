import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@contexts/MessageShow';
import { branchService } from '@services/api';

export default function ModalDeleteBranch({ data }) {
  const { successMsg, errorMsg } = useMessage();

  const handleDelete = async () => {
    try {
      const response = await branchService.delete(data?.id);
      if (response.success) {
        successMsg(response.message);
        router.visit('/branches', { preserveState: true });
      } else {
        errorMsg(response.message);
      }
    } catch {
      errorMsg('Error al eliminar la sucursal');
    }
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: `¿Estás seguro de que quieres eliminar la sucursal ${data.name}?`,
      content: 'Se borrarán todos los datos.',
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDelete();
      },
    });
  };
  return (
    <div>
      <Button danger onClick={() => showDeleteConfirm()} icon={<DeleteOutlined />} />
    </div>
  );
}
