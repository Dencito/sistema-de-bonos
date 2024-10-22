import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, List, message, Modal, Select, Space, Typography } from "antd";
import { EditFilled, EyeFilled, PlusOutlined } from "@ant-design/icons";
import { validate, format } from 'rut.js';
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";

export default function ModalViewRole({ data }) {
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
        ver usuarios
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Usuarios que son rol {data?.name}</p>}
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
          dataSource={data.users}
          renderItem={(item) => <List.Item>{item.username}</List.Item>}
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