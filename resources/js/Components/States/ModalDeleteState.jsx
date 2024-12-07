import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd'
import axios from 'axios';
import React from 'react'

export default function ModalDeleteState ({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const { data: dataDelete } = await axios.delete(`/companies/${data?.id}`,);
            router.visit('/companies', {
                preserveState: true,
            });
            dataDelete && successMsg(await dataDelete?.message)
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
        }
    };
    
    const showDeleteConfirm = () => {
        Modal.confirm({
            title: `¿Estás seguro de que quieres eliminar la empresa ${data.name}?`,
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
    )
};