import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { useMessage } from '@contexts/MessageShow';
import { companyService } from '@services/api';

export default function ModalChangeCompany({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const response = await companyService.changeDb(data?.id);
            if (response.success) {
                successMsg(response.message);
                router.visit('/companies', {
                    preserveState: true,
                });
            } else {
                errorMsg(response.message);
            }
        } catch {
            errorMsg('Error al cambiar de empresa');
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
    );
}
