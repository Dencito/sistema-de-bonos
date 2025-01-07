import { useState } from 'react';
import { Modal, Table } from 'antd';
//import { Eye } from 'lucide-react';
import { CustomButton } from '@components-v2/CustomButton';

export default function ModalViewUserStatuses({ data, status }) {
    const [showModal, setShowModal] = useState(false);

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'id',
        },
        {
            title: 'Empresa',
            key: 'company',
            render: (_, user) => <p>{user?.company?.name}</p>,
        },
        {
            title: 'Sucursal',
            key: 'branch',
            render: (_, user) => <p>{user?.branch?.name}</p>,
        },
    ];

    return (
        <>
            {/* <button
                onClick={() => setShowModal(true)}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            >
                <Eye className='w-5 h-5' />
            </button> */}
            <CustomButton
                onClick={() => setShowModal(true)}
                className="hover:border-green-300"
            >
                Ver usuarios
            </CustomButton>
            <Modal
                style={{ top: 20 }}
                title={
                    <p className="text-bold text-3xl">
                        Usuarios con estado {status}
                    </p>
                }
                open={showModal}
                cancelText="Cerrar"
                onCancel={() => handleCloseModal()}
                destroyOnClose={true}
                okButtonProps={{
                    style: {
                        display: 'none',
                    },
                }}
            >
                <Table
                    dataSource={data.map((user) => ({ ...user, key: user.id }))}
                    columns={columns}
                    scroll={{ x: true }}
                />
            </Modal>
        </>
    );
}
