import { useState } from 'react';
import { Modal, Table } from 'antd';
import { Eye } from 'lucide-react';
import { CustomButton } from '@components-v2/CustomButton';

export default function ModalViewBranchStatuses({ data, status }) {
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
      render: (_, branch) => <p>{branch?.company?.name}</p>,
    },
  ];

  return (
    <>
      <CustomButton
        onClick={() => setShowModal(true)}
        className="hover:border-green-300"
        icon={<Eye className="w-5 h-5" />}
      >
        Ver sucursales
      </CustomButton>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Sucursales con estado {status}</p>}
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
          dataSource={data.map((branch) => ({
            ...branch,
            key: branch.id,
          }))}
          columns={columns}
          scroll={{ x: true }}
        />
      </Modal>
    </>
  );
}
