import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@contexts/MessageShow';
import { orderService } from '@services/api';

export default function ModalDeleteOrder({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const response = await orderService.delete(data.id);
            successMsg(response.message);
            router.reload();
        } catch (error) {
            errorMsg(error?.response?.data?.message || 'Error al eliminar la orden.');
        }
    };

    const showDeleteConfirm = () => {
        Modal.confirm({
            title: `¿Estás seguro de que quieres eliminar la orden ${data.order_number}?`,
            content: 'Esta acción no se puede deshacer.',
            okText: 'Sí',
            okType: 'danger',
            cancelText: 'No',
            onOk: handleDelete,
        });
    };

    return (
        <Button onClick={showDeleteConfirm} icon={<DeleteOutlined />} danger />
    );
}
