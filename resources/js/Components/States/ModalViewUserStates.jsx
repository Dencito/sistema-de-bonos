import { useState } from "react";
import { Button, Dropdown, Form, List, Modal ,Space } from "antd";

export default function ModalViewUserStates({ data, state }) {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleChangeState = (content) => {
    alert(`esto es una prueba,\nEl estado del usuario: ${content} se cambio exitosamente`)
  }

  const states = {
    Activo: '🟢',
    Inactivo: '⭕',
    Borrado: '🔴',
  }
  return (
    <>
      <Button onClick={handleOpenModal} className='hover:border-green-300'>
        Ver usuarios
      </Button>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Usuarios: {state}</p>}
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
                {item.username}
              </p>
              <Dropdown dropdownRender={() =>
                <div className="flex gap-2 rounded-lg flex-col bg-white"> 
                {Object.entries(states).map(([stateItem, icon]) => (
                <>
                {state !== stateItem && <button key={stateItem} onClick={() => handleChangeState(item.username)}>
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
      </Modal>
    </>
  );
}