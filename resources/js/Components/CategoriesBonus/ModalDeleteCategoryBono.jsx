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
            const { data: dataDelete } = await categoryBonusService.delete(
                data?.id
            );
            dataDelete && successMsg(await dataDelete?.message);
            router.visit('/categories-bonus', {
                preserveState: true,
            });
        } catch (error) {
            const {
                response: { data: dataError },
            } = error;
            return errorMsg(dataError?.message);
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
            <Button
                danger
                onClick={() => showDeleteConfirm()}
                icon={<DeleteOutlined />}
            />
        </div>
    );
}
