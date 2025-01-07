import { router } from '@inertiajs/react';
import { Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@contexts/MessageShow';
import { companyService } from '@services/api';

export default function ModalDeleteCompany({ data }) {
    const { successMsg, errorMsg } = useMessage();

    const handleDelete = async () => {
        try {
            const response = await companyService.delete(data?.id);
            if (response.success) {
                successMsg(response.message);
                router.visit('/companies', {
                    preserveState: true,
                });
            } else {
                errorMsg(response.message);
            }
        } catch (error) {
            errorMsg('Error al eliminar la empresa');
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
            <Button
                danger
                onClick={() => showDeleteConfirm()}
                icon={<DeleteOutlined />}
            />
        </div>
    );
}
