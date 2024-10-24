import { useState } from "react";
import { Button, Form, List, Modal } from "antd";

export default function ModalViewBranchesCompany({ data, company }) {
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
        Ver Sucursales
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Sucursales: {company}</p>}
        open={showModal}
        okText="Ok"
        cancelText="Salir"
        onCancel={() => handleCloseModal()}
        destroyOnClose={() => handleCloseModal()}
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
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
            onFinish={() => handleCloseModal()}
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
                {item.name}
              </p>
            </div>
          </List.Item>}
        />
        {/* <Form.Item noStyle shouldUpdate>
          {() => (
            <Typography>
              <pre>{JSON.stringify(data.users, null, 2)}</pre>
            </Typography>
          )}
        </Form.Item> */}
      </Modal>
    </>
  );
}