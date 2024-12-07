import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd'
import axios from 'axios';
import React from 'react'
import { DeleteOutlined } from '@ant-design/icons';

export default function ModalDeleteUser ({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const { data: dataDelete } = await axios.delete(`/users/${data?.id}`,);
            dataDelete && successMsg(await dataDelete?.message)
            router.visit(window.location.href, {
                preserveState: true,
            });
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
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
            <Button danger onClick={() => showDeleteConfirm()} icon={<DeleteOutlined />} />
        </div>
    )
};