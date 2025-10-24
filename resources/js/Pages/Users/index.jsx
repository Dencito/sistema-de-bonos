import React, { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalCreateUser from '@/Components/Users/ModalCreateUser';
import ModalDeleteUser from '@/Components/Users/ModalDeleteUser';
import ModalEditUser from '@/Components/Users/ModalEditUser';
import ModalViewUser from '@/Components/Users/ModalViewUser';
import ModalCreateBonus from '@/Components/Bonus/ModalCreateBonus';
import ModalCreateCustomBonus from '@/Components/Bonus/ModalCreateCustomBonus';
// import FilterModal from '@/Components/Users/FilterModal';
import MobileButton from '@/Components/MobileButton';
import { CustomTable } from '@components-v2/CustomTable';
import { SelectAssignCategories } from '@/Components/CategoriesBonus/SelectAssignCategories';
import { SelectAssignBonuses } from '@/Components/Bonus/SelectAssignBonuses';
import { allowedRoles, roleDisplayNames } from '@/Utils/constants';
import { getBgStatus } from '@/Utils/getBgStatus';
import { formatDateTime } from '@/Utils/date';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import * as XLSX from 'xlsx';
import { bonusService } from '@/Services/api';
import axios from 'axios';

const FingerprintIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2C7.6 2 4 5.6 4 10v4c0 3.3 2.7 6 6 6h4c4.4 0 8-3.6 8-8V10c0-4.4-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6v2c0 3.3-2.7 6-6 6s-6-2.7-6-6v-2c0-3.3 2.7-6 6-6z" />
        <path d="M12 6c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4s4-1.8 4-4v-2c0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2v-2c0-1.1.9-2 2-2z" />
    </svg>
);

export default function UserPage({
    auth,
    users,
    allUsers,
    userWorkers,
    roles,
    branches,
    companies,
    statuses,
    categories,
    bonuses,
    filters,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [pagination, setPagination] = useState({
        current: users?.current_page || 1,
        pageSize: users?.per_page || 10,
        total: users?.total || 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
    });

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const InitForm = {
        search: filters.search || '',
        status: filters.status || '',
        role: filters.role || '',
        branch_id: filters.branch_id || '',
        per_page: filters.per_page || 10,
        page: filters.page || 1,
    };
    const { data } = useForm(InitForm);
    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };
    // Función para exportar usuarios a Excel
    const exportToExcel = async () => {
        try {
            // Preparar parámetros de filtro (solo los que tienen valor)
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (data.role) params.role = data.role;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedBranch) params.branch_id = selectedBranch;
            
            // Llamar al endpoint de exportación
            const response = await axios.get(route('users.export'), { params });
            // Usar los usuarios del endpoint de exportación
            const usersToExport = response.data.users || [];
            const dataToExport = usersToExport.map(user => {
                // Datos básicos que todos los usuarios tienen
                const baseData = {
                    'Nombre de usuario': user.username || '',
                    'Nombres': `${user.first_name || ''} ${user.second_name || ''}`.trim(),
                    'Apellidos': `${user.first_last_name || ''} ${user.second_last_name || ''}`.trim(),
                    'Correo': user.email || '',
                    'Teléfono': `${user.prefix || ''} ${user.phone || ''}`.trim(),
                    'Estado': user.status?.name || '',
                    'Rol': roleDisplayNames[user.role?.name] || user.role?.name || '',
                    'Fecha de creación': user.created_at ? new Date(user.created_at).toLocaleDateString('es-CL') : '',
                    'Fecha de ingreso': user.entry_date ? new Date(user.entry_date).toLocaleDateString('es-CL') : '',
                };

                // Datos específicos según el rol
                if (user.role?.name === 'jugador') {
                    // Para jugadores, mostrar código o RUT y sucursales
                    return {
                        ...baseData,
                        'Código/RUT': user.rutNumbers && user.rutDv ? `${user.rutNumbers}-${user.rutDv}` : user.code || '',
                        'Sucursales': user.branches?.map(b => b.name).join(', ') || '',
                        'Categoria de bonos': user.category_bonus?.name || '',
                        'Monto Categoria': user.category_bonus?.base_amount || '',
                        'Última marca': user.fingerprint_logs?.[0]?.created_at ? new Date(user.fingerprint_logs[0].created_at).toLocaleDateString('es-CL') : '',
                        'Huella registrada': user.has_fingerprint ? 'Sí' : 'No',
                    };
                } else if (user.role?.name === 'trabajador') {
                    // Para trabajadores
                    return {
                        ...baseData,
                        'RUT': user.rutNumbers && user.rutDv ? `${user.rutNumbers}-${user.rutDv}` : '',
                        'Sucursal': user.branch?.name || '',
                        'Huella registrada': user.has_fingerprint ? 'Sí' : 'No',
                    };
                } else {
                    // Para otros roles (admin, supervisor, etc)
                    return {
                        ...baseData,
                        'Sucursal': user.branch?.name || '',
                        'Sucursales': user.branches?.map(b => b.name).join(', ') || '',
                    };
                }
            });

            // Crear libro de Excel
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

            // Generar archivo y descargar
            const date = new Date().toISOString().split('T')[0];
            const fileName = `usuarios_${data.role || 'todos'}_${date}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            message.success('Archivo exportado correctamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            message.error('Error al exportar los datos');
        }
    };

    // Función para manejar la búsqueda y filtros del lado del servidor
    const handleSearch = () => {
        router.get(route('users.index'), 
            { 
                ...data,
                search: searchTerm,
                status: selectedStatus,
                branch_id: selectedBranch,
                page: 1 // Resetear a la primera página al buscar
            }, 
            {
                preserveState: true,
                replace: true
            }
        );
    };
    
    // Función para manejar el cambio de página
    const handlePageChange = (page, pageSize) => {
        router.get(route('users.index'), 
            { 
                ...data,
                search: searchTerm,
                status: selectedStatus,
                branch_id: selectedBranch,
                page: page,
                per_page: pageSize
            }, 
            {
                preserveState: true,
                replace: true
            }
        );
    };
    
    // Usamos los datos paginados del servidor directamente
    const filteredUsers = users?.data || [];

    const columns = {
        'super-admin': [
            {
                title: 'Nombre de usuario',
                dataIndex: 'username',
                key: 'username',
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_, branch) => (
                    <div
                        className={`${getBgStatus(
                            branch?.status?.name
                        )} font-bold rounded-full text-center p-1 w-6 h-6`}
                    ></div>
                ),
            },
            {
                title: 'Rol',
                key: 'role',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {roleDisplayNames[user?.role?.name] || user?.role?.name}
                    </p>
                ),
            },
            {
                title: 'Acciones',
                key: 'actions',
                render: (_, user) => (
                    <div className="flex flex-wrap gap-3">
                        <ModalViewUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={user}
                            userType={data?.role}
                            categories={categories}
                            roleDisplayNames={roleDisplayNames}
                        />
                        <ModalEditUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={{
                                ...user,
                                branches: user?.branches?.map(
                                    (branch) => branch?.id
                                ),
                            }}
                            categories={categories}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                            role={auth?.role}
                        />
                        <ModalDeleteUser data={user} />
                    </div>
                ),
            },
        ],
        admin: [
            {
                title: 'Nombre de usuario',
                dataIndex: 'username',
                key: 'username',
            },
            {
                title: 'Correo',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Sucursal',
                key: 'branch',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {user?.branch?.name}
                    </p>
                ),
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_, branch) => (
                    <div
                        className={`${branch?.status?.name === 'Activo'
                            ? 'bg-green-300'
                            : branch?.status?.name === 'Inactivo'
                                ? 'bg-red-200'
                                : branch?.status?.name === 'En revisión'
                                    ? 'bg-orange-300'
                                    : branch?.status?.name === 'Borrado'
                                        ? 'bg-red-400'
                                        : ''
                            } 
                                font-bold rounded-full text-center p-1 w-6 h-6`}
                    ></div>
                ),
            },
            {
                title: 'Rol',
                key: 'role',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {roleDisplayNames[user?.role?.name] || user?.role?.name}
                    </p>
                ),
            },
            {
                title: 'Acciones',
                key: 'actions',
                render: (_, user) => (
                    <div className="flex flex-wrap gap-3">
                        <ModalViewUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={user}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                        />
                        <ModalEditUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={{
                                ...user,
                                branches: user?.branches?.map(
                                    (branch) => branch?.id
                                ),
                            }}
                            categories={categories}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                            role={auth?.role}
                        />
                        <ModalDeleteUser data={user} />
                    </div>
                ),
            },
        ],
        supervisor: [
            {
                title: 'Nombre de usuario',
                dataIndex: 'username',
                key: 'username',
            },
            {
                title: 'Fecha de Ingreso',
                key: 'entry_date',
                render: (_, user) => (
                    <span>
                        {user.entry_date
                            ? format(new Date(user.entry_date), 'dd/MM/yyyy')
                            : '-'}
                    </span>
                ),
            },
            {
                title: 'Correo',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Numero de teléfono',
                key: 'phone',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.prefix} {user?.phone}
                    </p>
                ),
            },
            {
                title: 'Sucursales',
                key: 'branches',
                render: (_, user) => (
                    <div className="relative group">
                        <span className="cursor-pointer hover:text-blue-500">
                            Ver Sucursales
                        </span>
                        <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2">
                            {user?.branches?.map((branch) => (
                                <p
                                    key={branch?.id}
                                    className="whitespace-nowrap"
                                >
                                    {branch?.name}
                                </p>
                            ))}
                        </div>
                    </div>
                ),
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_, branch) => (
                    <div
                        className={`${branch?.status?.name === 'Activo'
                            ? 'bg-green-300'
                            : branch?.status?.name === 'Inactivo'
                                ? 'bg-red-200'
                                : branch?.status?.name === 'En revisión'
                                    ? 'bg-orange-300'
                                    : branch?.status?.name === 'Borrado'
                                        ? 'bg-red-400'
                                        : ''
                            } 
                                font-bold rounded-full text-center p-1 w-6 h-6`}
                    ></div>
                ),
            },
            {
                title: 'Rol',
                key: 'role',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {roleDisplayNames[user?.role?.name] || user?.role?.name}
                    </p>
                ),
            },
            {
                title: 'Acciones',
                key: 'actions',
                render: (_, user) => (
                    <div className="flex flex-wrap gap-3">
                        <ModalViewUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={user}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                        />
                        <ModalEditUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={{
                                ...user,
                                branches: user?.branches?.map(
                                    (branch) => branch?.id
                                ),
                            }}
                            userWorkers={userWorkers}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                            role={auth?.role}
                        />
                        <ModalDeleteUser data={user} />
                    </div>
                ),
            },
        ],
        trabajador: [
            {
                title: 'Nombre de usuario',
                dataIndex: 'username',
                key: 'username',
            },
            {
                title: 'Fecha de Ingreso',
                key: 'entry_date',
                render: (_, user) => (
                    <span>
                        {user.entry_date
                            ? format(new Date(user.entry_date), 'dd/MM/yyyy')
                            : '-'}
                    </span>
                ),
            },
            {
                title: 'Correo',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Rut',
                key: 'rut',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.rutNumbers}-{user?.rutDv}
                    </p>
                ),
            },
            {
                title: 'Numero de teléfono',
                key: 'phone',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.prefix} {user?.phone}
                    </p>
                ),
            },
            {
                title: 'Sucursal',
                key: 'branche',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {user?.branch?.name}
                    </p>
                ),
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_, branch) => (
                    <div
                        className={`${branch?.status?.name === 'Activo'
                            ? 'bg-green-300'
                            : branch?.status?.name === 'Inactivo'
                                ? 'bg-red-200'
                                : branch?.status?.name === 'En revisión'
                                    ? 'bg-orange-300'
                                    : branch?.status?.name === 'Borrado'
                                        ? 'bg-red-400'
                                        : ''
                            } 
                                font-bold rounded-full text-center p-1 w-6 h-6`}
                    ></div>
                ),
            },
            {
                title: 'Cant. Huellas',
                key: 'quantityFingerprint',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {user?.fingerprints?.length || 0}
                    </p>
                ),
            },
            {
                title: 'Acciones',
                key: 'actions',
                render: (_, user) => (
                    <div className="flex flex-wrap gap-3">
                        <ModalViewUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={user}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                        />
                        <ModalEditUser
                            statuses={statuses}
                            companies={companies}
                            branches={branches}
                            roles={roles}
                            data={{
                                ...user,
                                branches: user?.branches?.map(
                                    (branch) => branch?.id
                                ),
                            }}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                            role={auth?.role}
                        />
                        <ModalDeleteUser data={user} />
                    </div>
                ),
            },
            ...(data.role === 'trabajador'
                ? [
                    {
                        title: 'Huella Digital',
                        key: 'has_fingerprint',
                        render: (_, user) => (
                            <span
                                style={{
                                    color: user.has_fingerprint
                                        ? '#52c41a'
                                        : '#ff4d4f',
                                }}
                            >
                                <FingerprintIcon />
                            </span>
                        ),
                    },
                ]
                : []),
        ],
        jugador: [
            {
                title: 'Nombres',
                key: 'names',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.first_name} {user?.second_name}
                    </p>
                ),
            },
            {
                title: 'Apellidos',
                key: 'last_names',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.first_last_name} {user?.second_last_name}
                    </p>
                ),
            },
            {
                title: 'Última marca',
                key: 'fingerprintLogs',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {formatDateTime(user?.fingerprint_logs?.[0]?.created_at, 'dd/MM/yyyy')}
                    </p>
                ),
            },
            {
                title: 'Rut/Código',
                key: 'rut',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.rutNumbers && user?.rutDv ? (
                            <>
                                {user.rutNumbers}-{user.rutDv}
                            </>
                        ) : (
                            <>{user?.code}</>
                        )}
                    </p>
                ),
            },
            {
                title: 'Numero de teléfono',
                key: 'phone',
                render: (_, user) => (
                    <p className="rounded-lg p-1">
                        {user?.prefix} {user?.phone}
                    </p>
                ),
            },
            {
                title: 'Sucursales',
                key: 'branches',
                render: (_, user) => (
                    <div className="relative group">
                        <span className="cursor-pointer hover:text-blue-500">
                            Ver Sucursales
                        </span>
                        <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2">
                            {user?.branches?.map((branch) => (
                                <p
                                    key={branch?.id}
                                    className="whitespace-nowrap"
                                >
                                    {branch?.name}
                                </p>
                            ))}
                        </div>
                    </div>
                ),
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_, branch) => (
                    <div
                        className={`${branch?.status?.name === 'Activo'
                            ? 'bg-green-300'
                            : branch?.status?.name === 'Inactivo'
                                ? 'bg-red-200'
                                : branch?.status?.name === 'En revisión'
                                    ? 'bg-orange-300'
                                    : branch?.status?.name === 'Borrado'
                                        ? 'bg-red-400'
                                        : ''
                            } 
                                font-bold rounded-full text-center p-1 w-6 h-6`}
                    ></div>
                ),
            },
            {
                title: 'Cant. Huellas',
                key: 'quantityFingerprint',
                render: (_, user) => (
                    <p className="font-bold rounded-lg p-1">
                        {user?.fingerprints?.length || 0}
                    </p>
                ),
            },
            {
                title: 'Acciones',
                key: 'actions',
                render: (_, user) => (
                    <div className="flex flex-wrap gap-3">
                        <ModalViewUser
                            statuses={statuses}
                            companies={companies}
                            categories={categories}
                            branches={branches}
                            roles={roles}
                            data={user}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                        />
                        <ModalEditUser
                            statuses={statuses}
                            companies={companies}
                            categories={categories}
                            branches={branches}
                            roles={roles}
                            data={{
                                ...user,
                                branches: user?.branches?.map(
                                    (branch) => branch?.id
                                ),
                            }}
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
                            role={auth?.role}
                        />
                        <ModalDeleteUser data={user} />
                        {allowedRoles.createBonus.includes(auth?.role) && <ModalCreateBonus data={user} />}
                    </div>
                ),
            },
            ...(data.role === 'jugador'
                ? [
                    {
                        title: 'Huella Digital',
                        key: 'has_fingerprint',
                        render: (_, user) => (
                            <span
                                style={{
                                    color: user.has_fingerprint
                                        ? '#52c41a'
                                        : '#ff4d4f',
                                }}
                            >
                                <FingerprintIcon />
                            </span>
                        ),
                    },
                ]
                : []),
        ],
    };

    const handleDeleteBonus = async (bonusId) => {
        try {
            const response = await bonusService.delete(bonusId);
            if (response.success) {
                message.success('Bono eliminado correctamente');
                router.visit(window.location.href, {
                    preserveState: true,
                });
            } else {
                message.error(response.message || 'Error al eliminar el bono');
            }
        } catch (error) {
            message.error('Error al eliminar el bono');
            console.error('Error deleting bonus:', error);
        }
    };

    const expandedRowRender = (user) => {
        const getBonusStatus = (bonus) => {

            const now = new Date();
            const startDate = bonus.start_datetime
                ? new Date(bonus.start_datetime)
                : null;
            const endDate = bonus.end_datetime
                ? new Date(bonus.end_datetime)
                : null;

            // Sin fechas de inicio ni fin
            if (!startDate && !endDate) {
                return {
                    text: 'Sin vencimiento',
                    class: 'bg-blue-100 text-blue-800',
                };
            }

            // Solo tiene fecha de inicio
            if (startDate && !endDate) {
                return now < startDate
                    ? {
                        text: 'Pendiente de activación',
                        class: 'bg-yellow-100 text-yellow-800',
                    }
                    : {
                        text: 'Activo sin vencimiento',
                        class: 'bg-blue-100 text-blue-800',
                    };
            }

            // Solo tiene fecha de fin
            if (!startDate && endDate) {
                return now > endDate
                    ? {
                        text: 'Vencido',
                        class: 'bg-red-100 text-red-800',
                    }
                    : {
                        text: 'Activo',
                        class: 'bg-green-100 text-green-800',
                    };
            }

            // Tiene ambas fechas
            if (now < startDate) {
                return {
                    text: 'Pendiente de activación',
                    class: 'bg-yellow-100 text-yellow-800',
                };
            }
            if (now > endDate) {
                return {
                    text: 'Vencido',
                    class: 'bg-red-100 text-red-800',
                };
            }
            return {
                text: 'Activo',
                class: 'bg-green-100 text-green-800',
            };
        };

        return (
            <div className="py-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Bonos asignados</h3>
                </div>
                <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                    {user?.bonuses
                        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        ?.map((bonus) => {
                            const status = getBonusStatus(bonus);
                            return (
                                <div
                                    key={bonus?.id}
                                    className={' flex-none mr-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[250px]'}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-lg">
                                            ${bonus.amount.toLocaleString('es-CL')}
                                        </span>
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className={`px-2 py-1 rounded-full font-bold text-xs ${status.class}`}
                                            >
                                                {status.text}
                                            </div>
                                            <div
                                                className={`px-2 py-1 rounded-full font-bold text-xs ${bonus.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            >
                                                {bonus.active ? 'NO RECIBIDO' : 'RECIBIDO'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <span className="w-16 font-medium">
                                                Creado:
                                            </span>
                                            <span>
                                                {new Date(
                                                    bonus.created_at
                                                ).toLocaleDateString('es-CL', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        {bonus.start_datetime ? (
                                            <div className="flex items-center text-gray-600">
                                                <span className="w-16 font-medium">
                                                    Inicio:
                                                </span>
                                                <span>
                                                    {new Date(
                                                        bonus.start_datetime
                                                    ).toLocaleDateString('es-CL', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-600">
                                                <span className="w-16 font-medium">
                                                    Inicio:
                                                </span>
                                                <span className="italic">
                                                    No definido
                                                </span>
                                            </div>
                                        )}
                                        {bonus.end_datetime ? (
                                            <div className="flex items-center text-gray-600">
                                                <span className="w-16 font-medium">
                                                    Fin:
                                                </span>
                                                <span>
                                                    {new Date(
                                                        bonus.end_datetime
                                                    ).toLocaleDateString('es-CL', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-600">
                                                <span className="w-16 font-medium">
                                                    Fin:
                                                </span>
                                                <span className="italic">
                                                    Sin vencimiento
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-gray-600">
                                            <button
                                                onClick={() =>
                                                    handleDeleteBonus(
                                                        bonus.id
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
                {(!user?.bonuses || user?.bonuses.length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                        No hay bonos asignados
                    </p>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Panel
                </h2>
            }
        >
            <Head title={`Usuarios ${data.role || 'todos'}`} />
            <header className="flex items-center justify-betwee p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">
                    {roleDisplayNames[data?.role] || 'Todos los usuarios'}
                </h1>
            </header>
            <div className="flex-1 overflow-auto p-4 z-10">
                {/* <DataTable columns={columns2[data?.role]} data={users} /> */}
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Buscar por usuario, nombre, apellido o rut"
                                    className="border rounded px-2 py-1 w-full sm:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <select
                                    className="border rounded px-2 py-1 w-full sm:w-40"
                                    value={selectedStatus}
                                    onChange={e => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    {statuses.map(status => (
                                        <option key={status.id} value={status.name}>{status.name}</option>
                                    ))}
                                </select>
                                <select
                                    className="border rounded px-2 py-1 w-full sm:w-40"
                                    value={selectedBranch}
                                    onChange={e => setSelectedBranch(e.target.value)}
                                >
                                    <option value="">Todas las sucursales</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                                <Button
                                    type="primary"
                                    onClick={handleSearch}
                                    className="bg-blue-500 text-white"
                                >
                                    Buscar
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={exportToExcel}
                                    className="bg-blue-500 text-white"
                                >
                                    Exportar
                                </Button>
                            </div>
                            <div className="flex gap-5">
                                {data?.role && (
                                    <ModalCreateUser
                                        userType={data?.role}
                                        statuses={statuses}
                                        companies={companies}
                                        roles={roles?.filter(
                                            (item) => item?.name === data?.role
                                        )}
                                        userWorkers={userWorkers}
                                        categories={categories}
                                        branches={branches}
                                        role={auth?.role}
                                    />
                                )}
                                {allowedRoles.createBonus.includes(auth?.role) && data?.role === 'jugador' && (
                                    <ModalCreateCustomBonus />
                                )}
                            </div>
                        </div>

                        {data.role &&
                            data.role === roleDisplayNames.jugador.toLowerCase() ? (
                            <CustomTable
                                rowSelection={rowSelection}
                                dataSource={filteredUsers?.map((user) => ({
                                    ...user,
                                    key: user?.id,
                                }))}
                                columns={columns?.[data.role]}
                                expandable={{
                                    expandedRowRender,
                                    rowExpandable: () => true,
                                }}
                                pagination={{
                                    current: users?.current_page || 1,
                                    pageSize: users?.per_page || 10,
                                    total: users?.total || 0,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '20', '50', '100'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} usuarios`,
                                    onChange: handlePageChange,
                                }}
                            />
                        ) : (
                            <CustomTable
                                rowSelection={rowSelection}
                                dataSource={filteredUsers?.map((user) => ({
                                    ...user,
                                    key: user?.id,
                                }))}
                                columns={columns?.[data.role]}
                                pagination={{
                                    current: users?.current_page || 1,
                                    pageSize: users?.per_page || 10,
                                    total: users?.total || 0,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '20', '50', '100'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} usuarios`,
                                    onChange: handlePageChange,
                                }}
                            />
                        )}
                        <div className="flex flex-col xl:flex-row gap-5 justify-between mt-5 mb-20">
                            <SelectAssignCategories
                                setSelectedRowKeys={setSelectedRowKeys}
                                categories={categories}
                                selectedRowKeys={selectedRowKeys}
                            />
                            {data?.role ===
                                roleDisplayNames.trabajador.toLowerCase() && (
                                    <SelectAssignBonuses
                                        setSelectedRowKeys={setSelectedRowKeys}
                                        bonuses={bonuses}
                                        selectedRowKeys={selectedRowKeys}
                                    />
                                )}
                        </div>
                    </div>

                    {/* <ExcelManager users={users} /> */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
