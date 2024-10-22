import { useEffect, useState } from "react";
import { Button, Divider, Dropdown, Form, Input, List, message, Modal, Select, Space, Typography } from "antd";
import { EditFilled, EyeFilled, PlusOutlined, DownOutlined } from "@ant-design/icons";
import { validate, format } from 'rut.js';
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";

export default function ModalViewBranchStates({ data, state }) {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleChangeState = (content) => {
    alert(`esto es una prueba,\nEl estado de la sucursal: ${content} se cambio exitosamente`)
  }

    const states = {
      Activo: '🟢',
      Inactivo: '⭕',
      Borrado: '🔴',
    }
  return (
    <>
      <Button onClick={handleOpenModal} className='hover:border-green-300'>
        Ver Sucursales
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Sucursales: {state}</p>}
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
              <Dropdown dropdownRender={(e) =>
                <div className="flex gap-2 rounded-lg flex-col bg-white"> 
                {Object.entries(states).map(([stateItem, icon]) => (
                <>
                {state !== stateItem && <button key={stateItem} onClick={() => handleChangeState(item.name)}>
                  {stateItem} {icon}
                </button>}
                </>
              ))}
                </div>
              }>
                <a onClick={(e) => e.preventDefault()}>
                  <Space>
                    Cambiar estado {states[state]}
                  </Space>
                </a>
              </Dropdown>
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