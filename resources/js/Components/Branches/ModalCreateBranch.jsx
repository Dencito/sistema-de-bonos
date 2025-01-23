import { useEffect, useState } from 'react';
import {
    Button,
    Divider,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Card,
    Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getValidationRequiredMessage } from '@utils/messagesValidationes';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import ScheduleModal from './ScheduleModal';
import { countriesService, branchService } from '@services/api';

export default function ModalCreateBranch({ companies }) {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [country, setCountry] = useState('');
    const [countries, setCountries] = useState();
    const [regions, setRegions] = useState();
    const [availableScheduleModalVisible, setAvailableScheduleModalVisible] =
        useState(false);
    const [bonusScheduleModalVisible, setBonusScheduleModalVisible] =
        useState(false);
    const [availableSchedules, setAvailableSchedules] = useState([]);
    const [bonusSchedules, setBonusSchedules] = useState([]);

    const [form] = Form.useForm();
    const { successMsg, errorMsg } = useMessage();

    useEffect(() => {
        const getCountries = async () => {
            if (showModal) {
                const data = await countriesService.getAll();
                setCountries(data?.data);
            }
        };
        const getRegion = async () => {
            if (country && showModal) {
                const data = await countriesService.getStates(country);
                setRegions(data?.data);
            }
        };
        getCountries();
        getRegion();
    }, [showModal, country]);

    const handleAvailableScheduleSave = (schedules) => {
        setAvailableSchedules(schedules);
        form.setFieldsValue({ available_schedules: JSON.stringify(schedules) });
    };

    const handleBonusScheduleSave = (schedules) => {
        setBonusSchedules(schedules);
        form.setFieldsValue({ bonus_schedules: JSON.stringify(schedules) });
    };

    const onCreate = async (values) => {
        try {
            setLoading(true);

            // Asegurarse de que company_id esté establecido
            if (!values.company_id && companies?.length > 0) {
                values.company_id = companies[0].id;
            }

            const { success, message } = await branchService.create(values);
            if (!success) {
                errorMsg(message);
                return;
            }
            successMsg(message);
            router.visit(window.location.href, {
                preserveState: false,
            });
            handleCloseModal();
        } catch (error) {
            const message =
                error.response?.data?.message || 'Error al crear la sucursal';
            errorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setCountry('');
        setLoading(false);
        setShowModal(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const onlyNumberInput = (e) => {
        const cleanedValue = e.target.value.replace(/\D/g, '');
        form.setFieldsValue({ [e.target.name]: cleanedValue });
    };

    return (
        <>
            <Button
                type="primary"
                onClick={handleOpenModal}
                icon={<PlusOutlined />}
            >
                Nueva Sucursal
            </Button>
            <Modal
                style={{ top: 20 }}
                title="Crear Nueva Sucursal"
                open={showModal}
                onCancel={handleCloseModal}
                footer={null}
                width={800}
            >
                <Form form={form} onFinish={onCreate} layout="vertical">
                    <Form.Item
                        name="creationDate"
                        label="Fecha de creación"
                        initialValue={new Date().toJSON().slice(0, 10)}
                    >
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Nombre de la sucursal"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input showCount maxLength={30} />
                    </Form.Item>
                    <Form.Item
                        name="numberOfEmployees"
                        label="Cantidad de trabajadores"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input
                            name="numberOfEmployees"
                            onChange={onlyNumberInput}
                            showCount
                            maxLength={4}
                        />
                    </Form.Item>

                    <Divider className="font-bold text-3xl">Dirección</Divider>

                    <div className="flex gap-5">
                        <Form.Item
                            className="w-6/12"
                            name="branchAddressCountry"
                            label="país"
                            rules={[
                                {
                                    required: true,
                                    message: getValidationRequiredMessage,
                                },
                            ]}
                        >
                            <Select
                                onChange={() =>
                                    setCountry(
                                        form?.getFieldsValue()
                                            ?.branchAddressCountry
                                    )
                                }
                                showSearch
                                placeholder="Seleccionar país"
                            >
                                {countries?.map((country) => (
                                    <Select.Option
                                        key={country?.name}
                                        value={country?.name}
                                    >
                                        {country?.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            className="w-6/12"
                            name="branchAddressRegion"
                            label="Región"
                            rules={[
                                {
                                    required: true,
                                    message: getValidationRequiredMessage,
                                },
                            ]}
                        >
                            <Select showSearch placeholder="Seleccionar region">
                                {regions?.map((region) => (
                                    <Select.Option
                                        key={region?.name}
                                        value={region?.name}
                                    >
                                        {region?.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="branchAddressProvince"
                        label="Provincia"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input showCount maxLength={30} />
                    </Form.Item>
                    <Form.Item
                        name="branchAddressCommune"
                        label="Comuna"
                        rules={[
                            {
                                required: true,
                                message: getValidationRequiredMessage,
                            },
                        ]}
                    >
                        <Input showCount maxLength={30} />
                    </Form.Item>
                    <div className="flex gap-3">
                        <Form.Item
                            className="w-9/12"
                            name="branchAddressStreet"
                            label="Calle"
                            rules={[
                                {
                                    required: true,
                                    message: getValidationRequiredMessage,
                                },
                            ]}
                        >
                            <Input showCount maxLength={30} />
                        </Form.Item>
                        <Form.Item
                            className="w-3/12"
                            name="branchAddressNumber"
                            label="Numero"
                            rules={[
                                {
                                    required: true,
                                    message: getValidationRequiredMessage,
                                },
                            ]}
                        >
                            <Input
                                name="branchAddressNumber"
                                onChange={onlyNumberInput}
                                showCount
                                maxLength={6}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex gap-3">
                        <Form.Item
                            className="w-6/12"
                            name="branchAddressLocal"
                            label="Local"
                        >
                            <Input showCount maxLength={10} />
                        </Form.Item>
                        <Form.Item
                            className="w-6/12"
                            name="branchAddressDeptOrHouse"
                            label="Departamento / Casa"
                        >
                            <Input showCount maxLength={10} />
                        </Form.Item>
                    </div>

                    <Divider orientation="left">Horarios</Divider>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Card title="Horarios Disponibles" size="small">
                            <Space>
                                <Button
                                    onClick={() =>
                                        setAvailableScheduleModalVisible(true)
                                    }
                                    type="primary"
                                >
                                    Agregar turno
                                </Button>
                                {/* TODO: check it */}
                                {availableSchedules.length > 0 && (
                                    <Tag color="green">
                                        {availableSchedules?.length}{' '}
                                        {availableSchedules?.length === 1
                                            ? 'turno'
                                            : 'turnos'}{' '}
                                        turno
                                    </Tag>
                                )}
                            </Space>
                        </Card>

                        <Card title="Horarios de Bonos" size="small">
                            <Space>
                                <Button
                                    onClick={() =>
                                        setBonusScheduleModalVisible(true)
                                    }
                                    type="primary"
                                >
                                    Configurar Horarios de Bonos
                                </Button>
                                {bonusSchedules.length > 0 && (
                                    <Tag color="blue">
                                        {bonusSchedules.length} horarios
                                        configurados
                                    </Tag>
                                )}
                            </Space>
                        </Card>
                    </Space>

                    <Form.Item hidden name="available_schedules">
                        <Input />
                    </Form.Item>

                    <Form.Item hidden name="bonus_schedules">
                        <Input />
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ marginTop: 16 }}>
                            <Button onClick={handleCloseModal}>Cancelar</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                Crear
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <ScheduleModal
                open={availableScheduleModalVisible}
                onClose={() => setAvailableScheduleModalVisible(false)}
                onSave={handleAvailableScheduleSave}
                initialValue={availableSchedules}
            />

            <ScheduleModal
                open={bonusScheduleModalVisible}
                onClose={() => setBonusScheduleModalVisible(false)}
                onSave={handleBonusScheduleSave}
                initialValue={bonusSchedules}
            />
        </>
    );
}
