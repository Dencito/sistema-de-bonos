import { useEffect, useState } from "react";
import { Button, Divider, Form, Input, Modal, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { validate } from 'rut.js';
import { getValidationEmailMessage, getValidationRequiredMessage } from "../../Utils/messagesValidationes";
import { router } from '@inertiajs/react'
import { useMessage } from "@/Contexts/MessageShow";

export default function ModalCreateCompany() {
    const [showModal, setShowModal] = useState(false);
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [countries, setCountries] = useState()
    const [regions, setRegions] = useState()
    const [errorRuts, setErrorRuts] = useState({
        company: false,
        legalRepresentative: false,
        contact: false,
    })

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

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

    const checkErrors = (errors) => {
        for (const key in errors) {
            if (errors[key] === true) {
                return true;
            }
        }
    };

    const onCreate = async (values) => {
        try {
            if (checkErrors(errorRuts)) {
                return errorMsg(`Uno de los ruts es invalido`)
            }
            const { data } = await axios.post(`/companies`, values);
            router.visit('/companies', {
                preserveState: true,
            });
            data && successMsg(data?.message)
            handleCloseModal()
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
        }
    };


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
                return setErrorRuts({ ...errorRuts, company: true })
            }
            return setErrorRuts({ ...errorRuts, company: false });
        }
    };

    const validateRutNumbersLegalRepresentative = (e) => {
        onlyNumberInput(e)
        const { rutNumbersLegalRepresentative, rutDvLegalRepresentative } = form.getFieldsValue(['rutNumbersLegalRepresentative', 'rutDvLegalRepresentative']);
        if (rutNumbersLegalRepresentative?.length > 0 && rutDvLegalRepresentative?.length > 0) {
            const fullRut = `${rutNumbersLegalRepresentative}-${rutDvLegalRepresentative}`;
            if (!validate(fullRut)) {
                return setErrorRuts({ ...errorRuts, legalRepresentative: true })
            }
            return setErrorRuts({ ...errorRuts, legalRepresentative: false });
        }
    };

    const validateRutNumbersContact = (e) => {
        onlyNumberInput(e)
        const { rutNumbersContact, rutDvContact } = form.getFieldsValue(['rutNumbersContact', 'rutDvContact']);
        if (rutNumbersContact?.length > 0 && rutDvContact?.length > 0) {
            const fullRut = `${rutNumbersContact}-${rutDvContact}`;
            if (!validate(fullRut)) {
                return setErrorRuts({ ...errorRuts, contact: true })
            }
            return setErrorRuts({ ...errorRuts, contact: false });
        }
    };

    const handleCloseModal = () => {
        setCountry('')
        setRegion('')
        setErrorRuts({
            company: false,
            legalRepresentative: false,
            contact: false,
        })
        setShowModal(false)
    }

    const handleOpenModal = () => {
        setShowModal(true)
    }

    const prefixSelector = (
        <Form.Item name="prefix" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
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
        <Form.Item name="prefixContact" rules={[{ required: true, message: getValidationRequiredMessage }]} noStyle>
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
            
            <Button onClick={handleOpenModal} className="my-5" type="primary" shape="circle" icon={<PlusOutlined />} size={50} />
            <Modal
                style={{ top: 20 }}
                title={<p className="text-bold text-3xl">Crear empresa</p>}
                open={showModal}
                onCancel={() => Modal.confirm({
                    title: '¿Estás seguro de que quieres salir?',
                    content: 'Se borrarán todos los datos no guardados.',
                    okText: 'Sí',
                    okType: 'danger',
                    cancelText: 'No',
                    onOk() {
                        handleCloseModal();
                    },
                })}
                okText="Crear"
                cancelText="Cancelar"
                okButtonProps={{
                    autoFocus: true,
                    htmlType: 'submit',
                }}
                destroyOnClose={() => Modal.confirm({
                    title: '¿Estás seguro de que quieres salir?',
                    content: 'Se borrarán todos los datos no guardados.',
                    okText: 'Sí',
                    okType: 'danger',
                    cancelText: 'No',
                    onOk() {
                        handleCloseModal();
                    },
                })}
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        initialValues={{
                            modifier: 'public',
                        }}
                        clearOnDestroy
                        onFinish={(values) => onCreate(values)}
                        onFinishFailed={(values)=> errorMsg("Verifica todos los campos") }
                    >
                        {dom}
                    </Form>
                )}
            >

                {/* <Form.Item noStyle shouldUpdate>
                    {() => (
                        <Typography>
                            <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
                        </Typography>
                    )}
                </Form.Item> */}
                <Form.Item
                    name="creationDate"
                    label="Fecha de creacion"
                    initialValue={new Date().toJSON().slice(0, 10)}
                >
                    <Input disabled />
                </Form.Item>
                <Form.Item
                    name="name"
                    label="Nombre de la empresa"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
                </Form.Item>
                <Form.Item
                    name="max_branches"
                    label="Cantidad maxima de sucursales"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input name="max_branches" onChange={onlyNumberInput} showCount maxLength={2} />
                </Form.Item>
                <div className="flex gap-3 relative">
                    <Form.Item
                        className="w-10/12"
                        name="rutNumbers"
                        label="Números del RUT"
                        rules={[
                            { required: true, message: 'Este campo es obligatorio' },
                        ]}
                    >
                        <Input name="rutNumbers" style={{ borderColor: errorRuts.company && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={10} />
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
                        <Input style={{ borderColor: errorRuts.company && "#ff4d4f" }} onChange={validateRutNumbers} showCount maxLength={1} />
                    </Form.Item>
                </div>
                {errorRuts.company &&
                    <span style={
                        { position: "relative", top: form.getFieldValue('rutNumbers') === "" ? '0px' : '-15px', color: "#ff4d4f" }}>
                        El RUT es invalido.
                    </span>
                }

                <Form.Item
                    name="business"
                    label="Giro"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
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
                <Form.Item
                    className="mb-10"
                    name="email"
                    label="Correo electrónico"
                    rules={[
                        {
                            type: 'email',
                            message: getValidationEmailMessage,
                        },
                        { required: true, message: getValidationRequiredMessage }]}
                >
                    <Input type="email" showCount maxLength={60} />
                </Form.Item>

                <Divider className="font-bold text-3xl">Representante legal</Divider>
                <Form.Item
                    name="legalRepresentativeNames"
                    label="Nombres"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
                </Form.Item>
                <Form.Item
                    name="legalRepresentativeLastNames"
                    label="Apellidos"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
                </Form.Item>
                <div className="flex gap-3">
                    <Form.Item
                        className="w-10/12"
                        name="rutNumbersLegalRepresentative"
                        label="Números del RUT"
                        rules={[
                            { required: true, message: getValidationRequiredMessage },
                        ]}
                    >
                        <Input name="rutNumbersLegalRepresentative" style={{ borderColor: errorRuts.legalRepresentative && "#ff4d4f" }} onChange={validateRutNumbersLegalRepresentative} showCount maxLength={10} />
                    </Form.Item>
                    <span className="my-auto font-bold">
                        -
                    </span>
                    <Form.Item
                        name="rutDvLegalRepresentative"
                        label="Cod. Verificación"
                        rules={[
                            { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
                        ]}
                    >
                        <Input style={{ borderColor: errorRuts.legalRepresentative && "#ff4d4f" }} onChange={validateRutNumbersLegalRepresentative} showCount maxLength={1} />
                    </Form.Item>
                </div>
                {errorRuts.legalRepresentative &&
                    <span style={
                        { position: "relative", top: form.getFieldValue('rutNumbersLegalRepresentative') === "" ? '0px' : '-15px', color: "#ff4d4f" }}>
                        El RUT es invalido.
                    </span>
                }

                <Divider className="font-bold text-3xl">Contacto</Divider>

                <Form.Item
                    name="contactNames"
                    label="Nombres"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
                </Form.Item>
                <Form.Item
                    name="contactLastNames"
                    label="Apellidos"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={50} />
                </Form.Item>
                <div className="flex gap-3">
                    <Form.Item
                        className="w-10/12"
                        name="rutNumbersContact"
                        label="Números del RUT"
                        rules={[
                            { required: true, message: getValidationRequiredMessage },
                        ]}
                    >
                        <Input name="rutNumbersContact" style={{ borderColor: errorRuts.contact && "#ff4d4f" }} onChange={validateRutNumbersContact} showCount maxLength={10} />
                    </Form.Item>
                    <span className="my-auto font-bold">
                        -
                    </span>
                    <Form.Item
                        name="rutDvContact"
                        label="Cod. Verificación"
                        rules={[
                            { required: true, message: 'El campo debe ser un código de verificación de un RUT' },
                        ]}
                    >
                        <Input style={{ borderColor: errorRuts.contact && "#ff4d4f" }} onChange={validateRutNumbersContact} showCount maxLength={1} />
                    </Form.Item>
                </div>
                {errorRuts.contact &&
                    <span style={
                        { position: "relative", top: form.getFieldValue('rutNumbersContact') === "" ? '0px' : '-15px', color: "#ff4d4f" }}>
                        El RUT es invalido.
                    </span>
                }
                <Form.Item
                    name="contactPhone"
                    label="Número de teléfono"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input
                        name="contactPhone"
                        onChange={onlyNumberInput}
                        showCount maxLength={10}
                        addonBefore={prefixSelectorContact}
                        style={{
                            width: '100%',
                        }}
                    />
                </Form.Item>
                <Form.Item
                    className="mb-10"
                    name="contactEmail"
                    label="Correo electrónico"
                    rules={[
                        {
                            type: 'email',
                            message: getValidationEmailMessage,
                        },
                        { required: true, message: getValidationRequiredMessage }]}
                >
                    <Input type="email" showCount maxLength={60} />
                </Form.Item>

                <Divider className="font-bold text-3xl">Dirección</Divider>

                <div className="flex gap-5">
                    <Form.Item
                        className="w-6/12"
                        name="companyAddressCountry"
                        label="País"
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
                        name="companyAddressRegion"
                        label="Región"
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
                    name="companyAddressProvince"
                    label="Provincia"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={30} />
                </Form.Item>
                <Form.Item
                    name="companyAddressCommune"
                    label="Comuna"
                    rules={[{ required: true, message: getValidationRequiredMessage }]}
                >
                    <Input showCount maxLength={30} />
                </Form.Item>
                <div className="flex gap-3">
                    <Form.Item
                        className="w-9/12"
                        name="companyAddressStreet"
                        label="Calle"
                        rules={[{ required: true, message: getValidationRequiredMessage }]}
                    >
                        <Input showCount maxLength={30} />
                    </Form.Item>
                    <Form.Item
                        className="w-3/12"
                        name="companyAddressNumber"
                        label="Numero"
                        rules={[{ required: true, message: getValidationRequiredMessage }]}
                    >
                        <Input name="companyAddressNumber" onChange={onlyNumberInput} showCount maxLength={6} />
                    </Form.Item>
                </div>
            </Modal>
        </>
    );
}