import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Modal, Select } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { validate } from 'rut.js';
import { getValidationEmailMessage, getValidationNumbersMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";

export default function ModalViewCompany({ data }) {
  const [showModal, setShowModal] = useState(false);
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState()
  const [regions, setRegions] = useState()
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState();
  const [messageApi, contextHolder] = message.useMessage();
  const successMsg = () => {
    messageApi.open({
      type: 'success',
      content: 'Empresa editada exitosamente.',
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };

  const errorMsg = (content) => {
    messageApi.open({
      type: 'error',
      content,
      style: {
        fontSize: '18px',
        marginLeft: 'auto'
      },
    });
  };

  useEffect(() => {
    const getCountries = async () => {
      if (showModal) {
        const response = await fetch("https://restfulcountries.com/api/v1/countries", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS}`,
          },
        });
        const data = await response.json()
        setCountries(data?.data)
      }
    }
    const getRegion = async () => {
      if (country !== '' && showModal) {
        const response = await fetch(`https://restfulcountries.com/api/v1/countries/${country}/states`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY_COUNTRYS}`,
          },
        });
        const data = await response.json()
        setRegions(data?.data)
      }
    }
    getCountries()
    getRegion()
  }, [showModal, country])

  const validateRutNumbers = (_, value) => {
    if (form.getFieldsValue().rutNumbers !== "" && form.getFieldsValue().rutDv !== "") {
      if (!value) {
        return Promise.reject(new Error('El campo debe tener un valor de RUT valido'));
      }

      const { rutNumbers, rutDv } = form.getFieldsValue(['rutNumbers', 'rutDv']);
      const fullRut = `${rutNumbers}-${rutDv}`;

      if (validate(fullRut)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('RUT Invalido'));
    }
  };

  const validateRutNumbersLegalRepresentative = (_, value) => {
    if (form.getFieldsValue().rutNumbersLegalRepresentative !== "" && form.getFieldsValue().rutDvLegalRepresentative !== "") {
      if (!value) {
        return Promise.reject(new Error('El campo debe tener un valor de RUT valido'));
      }

      const { rutNumbersLegalRepresentative, rutDvLegalRepresentative } = form.getFieldsValue(['rutNumbersLegalRepresentative', 'rutDvLegalRepresentative']);
      const fullRut = `${rutNumbersLegalRepresentative}-${rutDvLegalRepresentative}`;

      if (validate(fullRut)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('RUT Invalido'));
    }
  };

  const validateRutNumbersContact = (_, value) => {
    if (form.getFieldsValue().rutNumbersContact !== "" && form.getFieldsValue().rutDvContact !== "") {
      if (!value) {
        return Promise.reject(new Error('El campo debe tener un valor de RUT valido'));
      }

      const { rutNumbersContact, rutDvContact } = form.getFieldsValue(['rutNumbersContact', 'rutDvContact']);
      const fullRut = `${rutNumbersContact}-${rutDvContact}`;
      if (validate(fullRut)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('RUT Invalido'));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const prefixSelector = (
    <Form.Item initialValue={data?.prefix} name="prefix" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
      <Select
        showSearch
        style={{
          width: 100,
        }}
      >
        {countries?.map((country) => (
          <Select.Option key={country?.phone_code} value={country?.phone_code}>{!country?.phone_code.includes("+") && '+'}{country?.phone_code}</Select.Option>
        ))}
      </Select>
    </Form.Item>
  );

  const prefixSelectorContact = (
    <Form.Item

      initialValue={data?.prefixContact} name="prefixContact" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
      <Select
        showSearch
        style={{
          width: 100,
        }}
      >
        {countries?.map((country) => (
          <Select.Option key={country?.phone_code} value={country?.phone_code}>{!country?.phone_code.includes("+") && '+'}{country?.phone_code}</Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
  return (
    <>
      {contextHolder}
      <Button onClick={handleOpenModal} icon={<EyeOutlined/>}/>
      <Modal
        style={{ top: 20 }}
        title={<p className="text-bold text-3xl">Datos de {data?.name}</p>}
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
        <Form.Item
          initialValue={data?.creationDate}
          name="creationDate"
          label="Fecha de creacion"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          initialValue={data?.name}
          name="name"
          label="Nombre de la empresa"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-10/12"
            initialValue={data?.rutNumbers}
            name="rutNumbers"
            label="Números del RUT"
            rules={[
              { required: true, message: getValidationRequiredMessage },
              { pattern: /^[0-9]+$/, message: getValidationNumbersMessage },
              { validator: validateRutNumbers },
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <span className="my-auto font-bold">-</span>
          <Form.Item
            initialValue={data?.rutDv}
            name="rutDv"
            label="Cod. Verificación"
            rules={[
              { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
              { pattern: /^[0-9kK]{1}$/, message: 'El campo solo tiene permitido, Números y K' },
              { validator: validateRutNumbers },
            ]}
          >
            <Input maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item
          initialValue={data?.business}
          name="business"
          label="Giro"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={data?.phone}
          name="phone"
          label="Número de teléfono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input
            type="number"
            addonBefore={prefixSelector}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          className="mb-10"
          initialValue={data?.email}
          name="email"
          label="Correo electrónico"
          rules={[
            {
              type: 'email',
              message: getValidationEmailMessage,
            },
            { required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>

        <Divider className="font-bold text-3xl">Representante legal</Divider>
        <Form.Item
          initialValue={data?.legalRepresentativeNames}
          name="legalRepresentativeNames"
          label="Nombres"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={data?.legalRepresentativeLastNames}
          name="legalRepresentativeLastNames"
          label="Apellidos"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-10/12"
            initialValue={data?.rutNumbersLegalRepresentative}
            name="rutNumbersLegalRepresentative"
            label="Números del RUT"
            rules={[
              { required: true, message: getValidationRequiredMessage },
              { pattern: /^[0-9]+$/, message: getValidationNumbersMessage },
              { validator: validateRutNumbersLegalRepresentative },
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <span className="my-auto font-bold">-</span>
          <Form.Item
            initialValue={data?.rutDvLegalRepresentative}
            name="rutDvLegalRepresentative"
            label="Cod. Verificación"
            rules={[
              { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
              { pattern: /^[0-9kK]{1}$/, message: 'El campo solo tiene permitido, Números y K' },
              { validator: validateRutNumbersLegalRepresentative },
            ]}
          >
            <Input maxLength={1} />
          </Form.Item>
        </div>
        <Divider className="font-bold text-3xl">Contacto</Divider>
        <Form.Item
          initialValue={data?.contactNames}
          name="contactNames"
          label="Nombres"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={data?.contactLastNames}
          name="contactLastNames"
          label="Apellidos"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-10/12"
            initialValue={data?.rutNumbersContact}
            name="rutNumbersContact"
            label="Números del RUT"
            rules={[
              { required: true, message: getValidationRequiredMessage },
              { pattern: /^[0-9]+$/, message: getValidationNumbersMessage },
              { validator: validateRutNumbersContact },
            ]}
          >
            <Input />
          </Form.Item>
          <span className="my-auto font-bold">-</span>
          <Form.Item
            initialValue={data?.rutDvContact}
            name="rutDvContact"
            label="Cod. Verificación"
            rules={[
              { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
              { pattern: /^[0-9kK]{1}$/, message: 'El campo solo tiene permitido, Números y K' },
              { validator: validateRutNumbersContact },
            ]}
          >
            <Input maxLength={1} />
          </Form.Item>
        </div>
        <Form.Item
          initialValue={data?.contactPhone}
          name="contactPhone"
          label="Número de teléfono"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input
            type="number"
            addonBefore={prefixSelectorContact}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          className="mb-10"
          initialValue={data?.contactEmail}
          name="contactEmail"
          label="Correo electrónico"
          rules={[
            {
              type: 'email',
              message: getValidationEmailMessage,
            },
            { required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>

        <Divider className="font-bold text-3xl">Dirección</Divider>

        <div className="flex gap-5">
          <Form.Item
            className="w-6/12"
            initialValue={data?.companyAddressCountry}
            name="companyAddressCountry"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Select onChange={() => setCountry(form?.getFieldsValue()?.companyAddressCountry)} showSearch placeholder="Seleccionar pais">
              {
                countries?.map(country => (
                  <Select.Option key={country?.name} value={country?.name}>{country?.name}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            className="w-6/12"
            initialValue={data?.companyAddressRegion}
            name="companyAddressRegion"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Select showSearch placeholder="Seleccionar region">
              {
                regions?.map(region => (
                  <Select.Option key={region?.name} value={region?.name}>{region?.name}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          initialValue={data?.companyAddressProvince}
          name="companyAddressProvince"
          label="Provincia"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={data?.companyAddressCommune}
          name="companyAddressCommune"
          label="Comuna"
          rules={[{ required: true, message: getValidationRequiredMessage }]}
        >
          <Input />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item
            className="w-9/12"
            initialValue={data?.companyAddressStreet}
            name="companyAddressStreet"
            label="Calle"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            disabled
            className="w-3/12"
            initialValue={data?.companyAddressNumber}
            name="companyAddressNumber"
            label="Número"
            rules={[{ required: true, message: getValidationRequiredMessage }]}
          >
            <Input type="number" />
          </Form.Item>
        </div>
      </Modal>
    </>
  );
}