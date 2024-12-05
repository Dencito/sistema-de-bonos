import { useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { CustomButton } from "@/components-v2/CustomButton";
import { ModalForm } from "@/components-v2/ModalForm";

export default function ModalViewUser({data, states, roles, branches, userType}) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm();

  const handleCloseModal = () => {
    setLoading(false)
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  
  const prefixSelector = (
    <Form.Item name="prefix" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
      <Select placeholder="Prefijo">
        <Select.Option value={'+56'}>+56</Select.Option>
      </Select>
    </Form.Item>
  );

  const formFieldsByUserType = {
    "SUPER ADMIN": (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el estado">
            {states?.map(state => (
              <Select.Option key={state.id} value={state.id}>{state.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
          label="Rol"
          initialValue={data?.roles[0]?.name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map(role => (
              <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    "ADMIN": (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ required: true, message: getValidationRequiredMessage }, { type: "email", message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>
        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione la sucursal">
            {branches?.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el estado">
            {states?.map(state => (
              <Select.Option key={state.id} value={state.id}>{state.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
          label="Rol"
          initialValue={data?.roles[0]?.name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map(role => (
              <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    "SUPERVISOR": (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ required: true, message: getValidationRequiredMessage }, { type: "email", message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Número de teléfono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input
            name="phone"
            showCount maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione la sucursal">
            {branches?.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el estado">
            {states?.map(state => (
              <Select.Option key={state.id} value={state.id}>{state.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
          label="Rol"
          initialValue={data?.roles[0]?.name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map(role => (
              <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    "TRABAJADOR": (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="first_name"
          label="Primer Nombre"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="second_name"
          label="Segundo Nombre"
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="first_last_name"
          label="Primer Apellido"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="second_last_name"
          label="Segundo Apellido"
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Número de teléfono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input
            name="phone"
            showCount maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>

        <div className="flex gap-3 relative">
          <Form.Item
            className="w-10/12"
            name="rutNumbers"
            label="Números del RUT"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input name="rutNumbers" showCount maxLength={10} />
          </Form.Item>
          <span className="my-auto font-bold">
            -
          </span>
          <Form.Item
            name="rutDv"
            label="Cod. Verificación"
            rules={[
              { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
            ]}
          >
            <Input showCount maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ required: true, message: getValidationRequiredMessage }, { type: "email", message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>

        <Form.Item
          name="nationality"
          label="Nacionalidad"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione su nacionalidad">
            <Select.Option value='Chile'>Chile</Select.Option>
            <Select.Option value='Argentina'>Argentina</Select.Option>
            <Select.Option value='Peru'>Peru</Select.Option>
            <Select.Option value='Prefiero no decirlo'>Prefiero no decirlo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="address"
          label="Dirección"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input placeholder="Ciudad, calle, numero y ETC." showCount maxLength={100} />
        </Form.Item>
        <Form.Item
          name="marital_status"
          label="Estado civil"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione su estado civil">
            <Select.Option value='Soltero'>Soltero</Select.Option>
            <Select.Option value='Casado'>Casado</Select.Option>
            <Select.Option value='Viudo'>Viudo</Select.Option>
            <Select.Option value='Prefiero no decirlo'>Prefiero no decirlo</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="pension"
          label="Previción"
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="health"
          label="Salud"
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="afp"
          label="AFP"
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="childrens"
          label="Hijos / Cargas"
        >
          <Input name='childrens' showCount maxLength={2} />
        </Form.Item>
        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione la sucursal">
            {branches?.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el estado">
            {states?.map(state => (
              <Select.Option key={state.id} value={state.id}>{state.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
          label="Rol"
          initialValue={data?.roles[0]?.name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map(role => (
              <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    "JUGADOR": (
      <>
        <Form.Item
          name="first_name"
          label="Primer Nombre"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="second_name"
          label="Segundo Nombre"
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="first_last_name"
          label="Primer Apellido"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="second_last_name"
          label="Segundo Apellido"
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Número de teléfono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input
            name="phone"
            showCount maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>

        <div className="flex gap-3 relative">
          <Form.Item
            className="w-10/12"
            name="rutNumbers"
            label="Números del RUT"
            rules={[
              { required: true, message: getValidationRequiredMessage },
            ]}
          >
            <Input name="rutNumbers" showCount maxLength={10} />
          </Form.Item>
          <span className="my-auto font-bold">
            -
          </span>
          <Form.Item
            name="rutDv"
            label="Cod. Verificación"
            rules={[
              { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
            ]}
          >
            <Input showCount maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item
          name="code"
          label="Codigo de usuario"
        >
          <Input
            name="code"
            showCount maxLength={10}
          />
        </Form.Item>
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: "email", message: getValidationRequiredMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>

        <Form.Item
          name="nationality"
          label="Nacionalidad"
        >
          <Select placeholder="Seleccione su nacionalidad">
            <Select.Option value='Chile'>Chile</Select.Option>
            <Select.Option value='Argentina'>Argentina</Select.Option>
            <Select.Option value='Peru'>Peru</Select.Option>
            <Select.Option value='Prefiero no decirlo'>Prefiero no decirlo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="address"
          label="Dirección"
        >
          <Input placeholder="Ciudad, calle, numero y ETC." showCount maxLength={100} />
        </Form.Item>
        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione la sucursal">
            {branches?.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="state_id"
          label="Estado"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el estado">
            {states?.map(state => (
              <Select.Option key={state.id} value={state.id}>{state.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
          label="Rol"
          initialValue={data?.roles[0]?.name}
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map(role => (
              <Select.Option key={role?.id} value={role?.name}>{role?.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    )
  };

  return (
    <>
      <CustomButton onClick={handleOpenModal} icon={<EyeOutlined />} />
      <ModalForm
        title={`Ver Usuario ${data?.username || data?.firt_name}`}
        showModal={showModal}
        loading={loading}
        form={form}
        onSubmit={handleCloseModal}
        onClose={handleCloseModal}
        initialValues={data}
        disabled
      >
        <>
          {formFieldsByUserType[userType?.toUpperCase()]}
        </>
      </ModalForm>
    </>
  );
}