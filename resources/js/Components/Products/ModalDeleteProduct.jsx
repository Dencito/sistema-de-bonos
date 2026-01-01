import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@contexts/MessageShow';
import { productService } from '@services/api';

export default function ModalDeleteProduct({ data }) {
  const { successMsg, errorMsg } = useMessage();

  const handleDelete = async () => {
    try {
      const response = await productService.delete(data.id);
      successMsg(response.message);
      router.reload();
    } catch (error) {
      errorMsg(error?.response?.data?.message || 'Error al eliminar el producto.');
    }
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: `¿Estás seguro de que quieres eliminar el producto ${data.name}?`,
      content: 'Esta acción no se puede deshacer.',
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
