import { useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getValidationEmailMessage, getValidationRequiredMessage } from "@utils/messagesValidationes";
import { router } from "@inertiajs/react";
import { useMessage } from "@contexts/MessageShow";
import { validate } from "rut.js";
import { ModalForm } from "@components-v2/ModalForm";
import { CustomButton } from "@components-v2/CustomButton";
import { formatDate } from '@utils/date';  

export default function ModalCreateUser({ userType, branches }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();
  const [errorRuts, setErrorRuts] = useState({
    user: false,
  })


  const onCreate = async (values) => {
    const { rutNumbers, rutDv } = form.getFieldsValue(['rutNumbers', 'rutDv']);
    if (values.rutNumbers) {
      values.rut = `${rutNumbers}-${rutDv}`
    }
    values.role = userType
    try {
      setLoading(true)
      const { data } = await axios.post(`/users`, values);
      router.visit(window.location.href, {
        preserveState: true, // Mantener el estado actual
      });
      data && successMsg(data?.message)
      setLoading(false)
      form.resetFields();
      handleCloseModal()
    } catch (error) {
      const { response: { data: dataError } } = error
      setLoading(false)
      return errorMsg(dataError?.message)
    }
  };

  const handleCloseModal = () => {
    setLoading(false)
    setErrorRuts({ user: false })
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }


  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  }


  const validateRutNumbers = (e) => {
    onlyNumberInput(e)
    const { rutNumbers, rutDv } = form.getFieldsValue(['rutNumbers', 'rutDv']);
    if (rutNumbers?.length > 0 && rutDv?.length > 0) {
      const fullRut = `${rutNumbers}-${rutDv}`;
      if (!validate(fullRut)) {
        return setErrorRuts({ ...errorRuts, user: true })
      }
      return setErrorRuts({ ...errorRuts, user: false });
    }
  };

  const validateAge = (dateString) => {
    return true;
    const selectedDate = formatDate(dateString, "YYYY-MM-DD");
    const currentDate = formatDate(new Date(), "YYYY-MM-DD");
    const age = currentDate.diff(selectedDate, 'years');
    //return age >= 16;
  };

  const prefixSelector = (
    <Form.Item initialValue={'+56'} name="prefix" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
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
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input.Password showCount maxLength={20} />
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
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: "email", message: getValidationEmailMessage }]}
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
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: "email", message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Número de teléfono"
        >
          <Input
            name="phone"
            onChange={onlyNumberInput}
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
          rules={[{ required: true, message: getValidationRequiredMessage }]}
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
            onChange={onlyNumberInput}
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
            <Input name="rutNumbers" style={{ borderColor: errorRuts?.user && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={10} />
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
            <Input style={{ borderColor: errorRuts.user && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={1} />
          </Form.Item>
        </div>
        {errorRuts?.user &&
          <span style={
            { position: "relative", top: form.getFieldValue('rutNumbers') === "" ? '0px' : '-15px', color: "#ff4d4f" }}>
            El RUT es invalido.
          </span>
        }
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            { required: true, message: "Por favor ingresa la fecha de nacimiento." },
            {
              validator: (_, value) =>
                validateAge(value) ? Promise.resolve() : Promise.reject("Debe ser mayor de 16 años")
            }
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" onChange={validateAge} />
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
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
          initialValue={'Chile'}
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
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
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
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="health"
          label="Salud"
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="afp"
          label="AFP"
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="childrens"
          label="Hijos / Cargas"
          rules={[
            { required: true, message: getValidationRequiredMessage },
          ]}
        >
          <Input name='childrens' onChange={onlyNumberInput} showCount maxLength={2} />
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
            onChange={onlyNumberInput}
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
          >
            <Input name="rutNumbers" style={{ borderColor: errorRuts?.user && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={10} />
          </Form.Item>
          <span className="my-auto font-bold">
            -
          </span>
          <Form.Item
            name="rutDv"
            label="Cod. Verificación"
          >
            <Input style={{ borderColor: errorRuts.user && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={1} />
          </Form.Item>
        </div>
        {errorRuts?.user &&
          <span style={
            { position: "relative", top: form.getFieldValue('rutNumbers') === "" ? '0px' : '-15px', color: "#ff4d4f" }}>
            El RUT es invalido.
          </span>
        }
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            {
              validator: (_, value) =>
                validateAge(value) ? Promise.resolve() : value === undefined ? Promise.resolve() : Promise.reject("Debe ser mayor de 16 años")
            }
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" onChange={validateAge} />
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
          initialValue={'Chile'}
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
          name="branches"
          label="Sucursales"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Select mode="multiple" placeholder="Seleccione las sucursales">
            {branches?.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    )
  };

  return (
    <>
      <CustomButton onClick={handleOpenModal} className="my-5" type="primary" shape="circle" icon={<PlusOutlined />} size={50} />
      <ModalForm
        title={`Crear ${userType}`}
        showModal={showModal}
        loading={loading}
        form={form}
        onClose={handleCloseModal}
        onSubmit={onCreate}
        initialValues={{}}
      >
        <>
          {formFieldsByUserType[userType?.toUpperCase()]}
        </>
      </ModalForm>
    </>
  );
};