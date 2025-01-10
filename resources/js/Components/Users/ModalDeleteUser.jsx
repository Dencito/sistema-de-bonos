import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { userService } from '@services/api';

export default function ModalDeleteUser({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const response = await userService.delete(data?.id);
            if (response.success) {
                successMsg(response.message);
                router.visit(window.location.href, {
                    preserveState: true,
                });
            } else {
                errorMsg(response.message);
            }
        } catch {
            errorMsg('Error al eliminar el usuario');
        }
    };

    const showDeleteConfirm = () => {
        Modal.confirm({
            title: `¿Estás seguro de que quieres eliminar el usuario ${data.username}?`,
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
            <Button
                danger
                onClick={() => showDeleteConfirm()}
                icon={<DeleteOutlined />}
            />
        </div>
    );
}
