import { useMessage } from '@contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { categoryBonusService } from '@services/api';
import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';

export default function ModalDeleteCategoryBono({ data }) {
  const { successMsg, errorMsg } = useMessage();

  const handleDelete = async () => {
    try {
      const response = await categoryBonusService.delete(data?.id);
      if (response.success) {
        successMsg(response.message);
        router.visit('/categories-bonus', {
          preserveState: true,
        });
      } else {
        errorMsg(response.message);
      }
    } catch {
      errorMsg('Error al eliminar la categoría');
    }
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: `¿Estás seguro de que quieres eliminar la categoria ${data.name}?`,
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
