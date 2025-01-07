import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { roleService } from '@/Services/api';
import React from 'react';

export default function ModalDeleteRole({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const response = await roleService.delete(data?.id);
            if (response.success) {
                successMsg(response.message);
                router.visit('/roles', {
                    preserveState: true,
                });
            } else {
                errorMsg(response.message);
            }
        } catch (error) {
            errorMsg('Error al eliminar el rol');
        }
    };

    const showDeleteConfirm = () => {
        Modal.confirm({
            title: `¿Estás seguro de que quieres eliminar el rol ${data.name}?`,
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
            <Button danger onClick={() => showDeleteConfirm()}>
                Eliminar
            </Button>
        </div>
    );
}
