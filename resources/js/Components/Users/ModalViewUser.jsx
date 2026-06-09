import { useState } from 'react';
import { Form, Input, Select, Modal, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import {
  getValidationEmailMessage,
  getValidationRequiredMessage,
} from '@utils/messagesValidationes';
import { CustomButton } from '@/components-v2/CustomButton';
import { roleDisplayNames } from '@/Utils/constants';

export default function ModalViewUser({ data, statuses, roles, branches, userType }) {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const prefixSelector = (
    <Form.Item
      name="prefix"
      rules={[{ required: true, message: getValidationRequiredMessage }]}
      noStyle
    >
      <Select placeholder="Prefijo">
        <Select.Option value={'+56'}>+56</Select.Option>
      </Select>
    </Form.Item>
  );

  const formFieldsByUserType = {
    'SUPER ADMIN': (
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
          <Select placeholder="Seleccione el estado">
            {statuses?.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
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
              <Select.Option key={role?.id} value={role?.name}>
                {roleDisplayNames[role?.name]}
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
          name="branch_id"
          label="Sucursal"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione la sucursal">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
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
          <Select placeholder="Seleccione el estado">
            {statuses?.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
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
              <Select.Option key={role?.id} value={role?.name}>
                {roleDisplayNames[role?.name]}
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
            showCount
            maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
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
          <Select placeholder="Seleccione la sucursal">
            {branches?.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
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
          <Select placeholder="Seleccione el estado">
            {statuses?.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="role"
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
              <Select.Option key={role?.id} value={role?.name}>
                {roleDisplayNames[role?.name]}
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
            showCount
            maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>

        <div className="flex relative gap-3">
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
            <Input name="rutNumbers" showCount maxLength={10} />
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
            <Input showCount maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" />
        </Form.Item>

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
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Select placeholder="Seleccione su nacionalidad">
            <Select.Option value="Chile">Chile</Select.Option>
            <Select.Option value="Argentina">Argentina</Select.Option>
            <Select.Option value="Peru">Peru</Select.Option>
            <Select.Option value="Prefiero no decirlo">Prefiero no decirlo</Select.Option>
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
        <Form.Item name="pension" label="Comuna">
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item name="health" label="Salud">
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item name="afp" label="AFP">
          <Input showCount maxLength={20} />
        </Form.Item>
        <Form.Item name="childrens" label="Hijos / Cargas">
          <Input name="childrens" showCount maxLength={2} />
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
          initialValue={data?.branch_id}
        >
          <p className="text-sm font-bold">- {data?.branch?.name}</p>
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
          initialValue={data?.branches}
        >
          {data?.branches?.map((branch) => (
            <p key={branch?.id} className="text-sm font-bold" value={Number(branch?.id)}>
              - {branch?.name}
            </p>
          ))}
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
          <Select placeholder="Seleccione el estado">
            {statuses?.map((status) => (
              <Select.Option key={status?.id} value={status?.id}>
                {status?.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="cargo" label="Cargo" initialValue={data?.cargo}>
          <div>
            {(() => {
              const cargo = data?.cargo;
              let cargoArray = [];

              if (Array.isArray(cargo)) {
                cargoArray = cargo;
              } else if (typeof cargo === 'string') {
                try {
                  const parsed = JSON.parse(cargo);
                  cargoArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                  cargoArray = [cargo];
                }
              } else if (cargo && typeof cargo === 'object') {
                cargoArray = Object.values(cargo);
              }

              return cargoArray.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cargoArray.map((c, idx) => (
                    <Tag key={idx} color="blue">{c}</Tag>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#999' }}>-</span>
              );
            })()}
          </div>
        </Form.Item>

        <Form.Item name="levels" label="Niveles" initialValue={data?.levels}>
          <Input showCount />
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
            showCount
            maxLength={10}
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>

        <div className="flex relative gap-3">
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
            <Input name="rutNumbers" showCount maxLength={10} />
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
            <Input showCount maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item name="code" label="Codigo de usuario">
          <Input name="code" showCount maxLength={10} />
        </Form.Item>
        <Form.Item
          name="birth_date"
          label="Fecha de Nacimiento"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <Input type="date" placeholder="dd/mm/aaaa" />
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

        <Form.Item name="nationality" label="Nacionalidad">
          <Select placeholder="Seleccione su nacionalidad">
            <Select.Option value="Chile">Chile</Select.Option>
            <Select.Option value="Argentina">Argentina</Select.Option>
            <Select.Option value="Peru">Peru</Select.Option>
            <Select.Option value="Prefiero no decirlo">Prefiero no decirlo</Select.Option>
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
          initialValue={data?.branches}
        >
          {data?.branches?.map((branch) => {
            return (
              <p key={branch?.id} className="text-sm font-bold">
                - {branch?.name}
              </p>
            );
          })}
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
          <p key={data?.status?.id} className="text-sm font-bold">
            - {data?.status?.name}
          </p>
        </Form.Item>
        <Form.Item
          name="category_bonus_id"
          label="Categoria"
          rules={[
            {
              required: true,
              message: getValidationRequiredMessage,
            },
          ]}
        >
          <p key={data?.category_bonus?.id} className="text-sm font-bold">
            - {data?.category_bonus?.name}
          </p>
        </Form.Item>
      </>
    ),
  };

  return (
    <>
      <CustomButton onClick={handleOpenModal} icon={<EyeOutlined />} />
      <Modal
        style={{ top: 20 }}
        title={`Ver Usuario ${data?.username || data?.first_name}`}
        open={showModal}
        cancelText="Cancelar"
        onCancel={() => handleCloseModal()}
        destroyOnClose={true}
        okButtonProps={{
          style: { display: 'none' },
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            disabled
            name="form_in_modal"
            initialValues={data}
            clearOnDestroy
          >
            {dom}
          </Form>
        )}
      >
        {formFieldsByUserType[userType?.toUpperCase()]}
      </Modal>
    </>
  );
}
