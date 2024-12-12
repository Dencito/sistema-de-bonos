import { useState } from "react";
import { Button, Form, List, Modal } from "antd";

export default function ModalViewUserCategories({ data, category }) {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  return (
    <>
      <Button onClick={handleOpenModal} className='hover:border-green-300'>
        Ver usuarios
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Usuarios: {category}</p>}
        open={showModal}
        cancelText="Cancelar"
        onCancel={() => handleCloseModal()}
        destroyOnClose={true}
        okButtonProps={{
          style: { display: 'none'}
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            disabled
            name="form_in_modal"
            initialValues={{
              modifier: 'public',
            }}
            clearOnDestroy
          >
            {dom}
          </Form>
        )}
      >
        <List
          size="small"
          bordered
          dataSource={data}
          renderItem={(item) => <List.Item>
            <div className="flex justify-between w-full">
              <p>
                {item.username}
              </p>
            </div>
          </List.Item>}
        />
      </Modal>
    </>
  );
};