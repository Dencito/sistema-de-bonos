import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd'
import axios from 'axios';
import React from 'react'

const ModalChangeCompany = ({ data }) => {
    const { successMsg, errorMsg } = useMessage();


    const handleDelete = async () => {
        try {
            const { data: dataDelete } = await axios.post(`/companies/change-db/${data?.id}`,);
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
            title: `¿Estás seguro de que deseas cambiar a la empresa ${data.name}?`,
            content: 'Todos los datos se cambiaran.',
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
                Cambiar
            </Button>
        </div>
    )
}

export default ModalChangeCompany