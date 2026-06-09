import { useState } from 'react';
import { Form, Input, Select, Switch, Radio } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import {
  getValidationEmailMessage,
  getValidationRequiredMessage,
} from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { ModalForm } from '@components-v2/ModalForm';
import { CustomButton } from '@components-v2/CustomButton';
import { validate } from 'rut.js';
import { differenceInYears } from 'date-fns';
import { roleNames } from '@utils/constants';
import { userService } from '@services/api';

import { countries } from '@/Utils/countries.json';

export default function ModalEditUser({
  data,
  roles,
  branches,
  statuses,
  userType,
  roleDisplayNames,
  categories,
  role,
  userAuth,
}) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const userCargo = userAuth?.cargo;
  const [selectedStatus, setSelectedStatus] = useState(
    data?.status_id ? String(data?.status_id) : null,
  );
  const [selectedCategory, setSelectedCategory] = useState(
    data?.category_bonus_id ? String(data?.category_bonus_id) : null,
  );

  const [errorRuts, setErrorRuts] = useState({
    user: false,
  });
  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const onUpdate = async (values) => {
    try {
      setLoading(true);

      const response = await userService.update(data.id, {
        ...values,
        role_id: values?.role_id === undefined ? data?.role_id : values?.role_id,
        status_id: selectedStatus || values?.status_id || data?.status_id,
        category_bonus_id: selectedCategory || values?.category_bonus_id || data?.category_bonus_id,
      });
      if (response.success) {
        successMsg(response.message);
        router.visit(window.location.href, {
          preserveState: true,
        });
        handleCloseModal();
      } else {
        errorMsg(response.message);
      }
    } catch {
      errorMsg('Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setLoading(false);
    setErrorRuts({ user: false });
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setSelectedStatus(data?.status_id ? String(data?.status_id) : null);
    setSelectedCategory(data?.category_bonus_id ? String(data?.category_bonus_id) : null);
    setShowModal(true);
  };

  const validateRutNumbers = (e) => {
    onlyNumberInput(e);
    const { rutNumbers, rutDv } = form.getFieldsValue(['rutNumbers', 'rutDv']);
    if (rutNumbers?.length > 0 && rutDv?.length > 0) {
      const fullRut = `${rutNumbers}-${rutDv}`;
      if (!validate(fullRut)) {
        return setErrorRuts({ ...errorRuts, user: true });
      }
      return setErrorRuts({ ...errorRuts, user: false });
    }
  };

  const onlyNumberInput = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    form.setFieldsValue({ [e.target.name]: cleanedValue });
  };

  const validateAge = (dateString) => {
    const selectedDate = new Date(dateString);
    const currentDate = new Date();
    const age = differenceInYears(currentDate, selectedDate);
    return age >= 16;
  };

  const renderStatusRadioGroup = () => {
    return (
      <div
        className="radio-button-container"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
      >
        <Radio.Group
          buttonStyle="solid"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            form.setFieldsValue({ status_id: e.target.value });
          }}
        >
          {statuses?.map((status) => (
            <Radio.Button key={status.id} value={String(status.id)}>
              {status.name}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    );
  };

  const renderCategoryRadioGroup = () => {
    return (
      <div
        className="radio-button-container"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
      >
        <Radio.Group
          buttonStyle="solid"
          disabled={role === 'trabajador'}
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            form.setFieldsValue({
              category_bonus_id: e.target.value,
            });
          }}
        >
          {categories?.map((category) => (
            <Radio.Button key={category?.id} value={String(category?.id)}>
              {category?.name}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    );
  };

  const prefixSelector = (
    <Form.Item
      name="prefix"
      rules={[{ required: true, message: getValidationRequiredMessage }]}
      noStyle
    >
      <Select showSearch placeholder="Prefijo">
        {countries.map((country) => (
          <Select.Option key={country.prefix} value={country.prefix}>
            {country.prefix} {country.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );

  const formFieldsByUserType = {
    'SUPER-ADMIN': (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item name="password" label="Contraseña">
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          {renderStatusRadioGroup()}
        </Form.Item>
        <Form.Item
          name="role_id"
          label="Rol"
          initialValue={data?.role?.name}
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map((role) => (
              <Select.Option key={role?.id} value={role?.id}>
                {roleDisplayNames[role?.name] || role?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    ADMIN: (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item name="password" label="Contraseña">
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: 'email', message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>
        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione la sucursal" optionLabelProp="label">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id} label={branch.name}>
                {branch.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          {renderStatusRadioGroup()}
        </Form.Item>
        <Form.Item
          name="role_id"
          label="Rol"
          initialValue={data?.role?.name}
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione el rol">
            {roles?.map((role) => (
              <Select.Option key={role?.id} value={role?.id}>
                {roleDisplayNames[role?.name] || role?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
    SUPERVISOR: (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item name="password" label="Contraseña">
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: 'email', message: getValidationEmailMessage }]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>
        <Form.Item
          name="entry_date"
          label="Fecha de Ingreso"
          rules={[
            {
              type: 'date',
              message: 'Por favor ingrese una fecha válida',
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
        {(userType === 'trabajador' || userType === 'jugador') && (
          <Form.Item
            name="has_fingerprint"
            label="Huella Digital Registrada"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
        <Form.Item name="phone" label="Número de teléfono">
          <Input
            name="phone"
            onChange={onlyNumberInput}
            showCount
            maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          name="branches"
          label="Sucursales"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select mode="multiple" placeholder="Seleccione las sucursales">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
                {branch?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          {renderStatusRadioGroup()}
        </Form.Item>
        <Form.Item
          name="role_id"
          label="Rol"
          initialValue={data?.role?.name}
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione el rol">
            {roles
              ?.filter((role) => role?.name !== roleNames.jugador)
              .map((role) => (
                <Select.Option key={role?.id} value={role?.id}>
                  {roleDisplayNames[role?.name] || role?.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
      </>
    ),
    TRABAJADOR: (
      <>
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={15} />
        </Form.Item>
        <Form.Item name="password" label="Contraseña">
          <Input.Password showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="first_name"
          label="Primer Nombre"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item name="second_name" label="Segundo Nombre">
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="first_last_name"
          label="Primer Apellido"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item name="second_last_name" label="Segundo Apellido">
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Número de teléfono"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input
            name="phone"
            onChange={onlyNumberInput}
            showCount
            maxLength={10}
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
              {
                required: true,
                message: getValidationRequiredMessage,
              },
            ]}
          >
            <Input
              name="rutNumbers"
              style={{
                borderColor: errorRuts?.user && '#ff4d4f',
              }}
              onChange={validateRutNumbers}
              showCount
              maxLength={10}
            />
          </Form.Item>
          <span className="my-auto font-bold">-</span>
          <Form.Item
            name="rutDv"
            label="Cod. Verificación"
            rules={[
              {
                required: true,
                message: 'El campo debe ser un código de verificación de un RUT',
              },
            ]}
          >
            <Input
              style={{ borderColor: errorRuts.user && '#ff4d4f' }}
              onChange={validateRutNumbers}
              showCount
              maxLength={1}
            />
          </Form.Item>
        </div>
        {errorRuts?.user && (
          <span
            style={{
              position: 'relative',
              top: form.getFieldValue('rutNumbers') === '' ? '0px' : '-15px',
              color: '#ff4d4f',
            }}
          >
            El RUT es invalido.
          </span>
        )}
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            {
              validator: (_, value) =>
                validateAge(value)
                  ? Promise.resolve()
                  : Promise.reject('Debe ser mayor de 16 años'),
            },
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" onChange={validateAge} />
        </Form.Item>

        <Form.Item
          name="entry_date"
          label="Fecha de Ingreso"
          rules={[
            {
              type: 'date',
              message: 'Por favor ingrese una fecha válida',
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
        {(userType === 'trabajador' || userType === 'jugador') && (
          <Form.Item
            name="has_fingerprint"
            label="Huella Digital Registrada"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
            { type: 'email', message: getValidationEmailMessage },
          ]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>

        <Form.Item
          name="nationality"
          label="Nacionalidad"
          initialValue="Chile"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select showSearch placeholder="Nacionalidad">
            {countries.map((country) => (
              <Select.Option key={country.name} value={country.name}>
                {country.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="address"
          label="Dirección"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input placeholder="Ciudad, calle, numero y ETC." showCount maxLength={100} />
        </Form.Item>
        <Form.Item
          name="marital_status"
          label="Estado civil"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione su estado civil">
            <Select.Option value="Soltero">Soltero</Select.Option>
            <Select.Option value="Casado">Casado</Select.Option>
            <Select.Option value="Viudo">Viudo</Select.Option>
            <Select.Option value="Prefiero no decirlo">Prefiero no decirlo</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="pension"
          label="Comuna"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="health"
          label="Salud"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="afp"
          label="AFP"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item
          name="childrens"
          label="Hijos / Cargas"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input name="childrens" onChange={onlyNumberInput} showCount maxLength={2} />
        </Form.Item>

        <Form.Item
          name="branch_id"
          label="Sucursal principal"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione la sucursal principal">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
                {branch?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="branches"
          label="Sucursales"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select mode="multiple" placeholder="Seleccione las sucursales">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
                {branch?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          {renderStatusRadioGroup()}
        </Form.Item>
        <Form.Item
          name="role_id"
          label="Rol"
          initialValue={data?.role?.id}
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione el rol">
            {roles
              ?.filter((role) => role?.name !== roleNames.jugador)
              .map((role) => (
                <Select.Option key={role?.id} value={role?.id}>
                  {roleDisplayNames[role?.name] || role?.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item initialValue={data?.cargo} name="cargo" label="Cargo">
          <Select mode="multiple" placeholder="Seleccione uno o más cargos">
            <Select.Option value="PASILLER@">PASILLER@</Select.Option>
            <Select.Option value="CAJER@">CAJER@</Select.Option>
            <Select.Option value="GUARDIA">GUARDIA</Select.Option>
            <Select.Option value="ANFITRION">ANFITRION</Select.Option>
            <Select.Option value="RECAUDADOR">RECAUDADOR</Select.Option>
            <Select.Option value="ASISTENTE">ASISTENTE</Select.Option>
            <Select.Option value="OTRO">OTRO</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item initialValue={data?.levels} name="levels" label="Niveles">
          <Select mode="multiple" placeholder="Seleccione los niveles" optionFilterProp="children">
            <Select.Option value="Nivel 1">Nivel 1</Select.Option>
            <Select.Option value="Nivel 2">Nivel 2</Select.Option>
            <Select.Option value="Nivel 3">Nivel 3</Select.Option>
            <Select.Option value="Nivel 4">Nivel 4</Select.Option>
            <Select.Option value="Nivel 5">Nivel 5</Select.Option>
          </Select>
        </Form.Item>
      </>
    ),
    JUGADOR: (
      <>
        <Form.Item
          name="first_name"
          label="Primer Nombre"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item name="second_name" label="Segundo Nombre">
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="first_last_name"
          label="Primer Apellido"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item name="second_last_name" label="Segundo Apellido">
          <Input showCount maxLength={20} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Número de teléfono"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input
            name="phone"
            onChange={onlyNumberInput}
            showCount
            maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>

        <div className="flex gap-3 relative">
          <Form.Item className="w-10/12" name="rutNumbers" label="Números del RUT">
            <Input
              name="rutNumbers"
              style={{
                borderColor: errorRuts?.user && '#ff4d4f',
              }}
              onChange={validateRutNumbers}
              showCount
              maxLength={10}
            />
          </Form.Item>
          <span className="my-auto font-bold">-</span>
          <Form.Item name="rutDv" label="Cod. Verificación">
            <Input
              style={{ borderColor: errorRuts.user && '#ff4d4f' }}
              onChange={validateRutNumbers}
              showCount
              maxLength={1}
            />
          </Form.Item>
        </div>
        {errorRuts?.user && (
          <span
            style={{
              position: 'relative',
              top: form.getFieldValue('rutNumbers') === '' ? '0px' : '-15px',
              color: '#ff4d4f',
            }}
          >
            El RUT es invalido.
          </span>
        )}
        <Form.Item name="code" label="Codigo de usuario">
          <Input name="code" onChange={onlyNumberInput} showCount maxLength={10} />
        </Form.Item>
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            {
              validator: (_, value) =>
                validateAge(value)
                  ? Promise.resolve()
                  : value === undefined
                    ? Promise.resolve()
                    : Promise.reject('Debe ser mayor de 16 años'),
            },
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" onChange={validateAge} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[
            {
              type: 'email',
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input showCount maxLength={60} />
        </Form.Item>

        <Form.Item initialValue="Chile" name="nationality" label="Nacionalidad">
          <Select showSearch placeholder="Nacionalidad">
            {countries.map((country) => (
              <Select.Option key={country.name} value={country.name}>
                {country.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="address" label="Dirección">
          <Input placeholder="Ciudad, calle, numero y ETC." showCount maxLength={100} />
        </Form.Item>
        <Form.Item
          name="branches"
          label="Sucursales"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select mode="multiple" placeholder="Seleccione las sucursales">
            {branches?.map((branch) => (
              <Select.Option key={branch?.id} value={branch?.id}>
                {branch?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Estado"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          {renderStatusRadioGroup()}
        </Form.Item>

        <Form.Item name="category_bonus_id" label="Categorias de bonos">
          {renderCategoryRadioGroup()}
        </Form.Item>
      </>
    ),
  };

  return (
    <>
      <CustomButton onClick={handleOpenModal} icon={<EditOutlined />} />
      <ModalForm
        title={`Editar Usuario ${data?.username || data?.first_name}`}
        showModal={showModal}
        loading={loading}
        form={form}
        onSubmit={onUpdate}
        onClose={handleCloseModal}
        initialValues={data}
      >
        <>{formFieldsByUserType[userType?.toUpperCase()]}</>
      </ModalForm>
    </>
  );
}
