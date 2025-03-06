import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalCreateUser from '@/Components/Users/ModalCreateUser';
import ModalDeleteUser from '@/Components/Users/ModalDeleteUser';
import ModalEditUser from '@/Components/Users/ModalEditUser';
import ModalViewUser from '@/Components/Users/ModalViewUser';
import ModalCreateBonus from '@/Components/Bonus/ModalCreateBonus';
import FilterModal from '@/Components/Users/FilterModal';
import MobileButton from '@/Components/MobileButton';
import { CustomTable } from '@components-v2/CustomTable';
import { SelectAssignCategories } from '@/Components/CategoriesBonus/SelectAssignCategories';
import { SelectAssignBonuses } from '@/Components/Bonus/SelectAssignBonuses';
import { roleDisplayNames } from '@/Utils/constants';
import { DataTable } from '@/Components/Tables/DataTable';
import { Badge } from '@/Components/ui/badge';
import { Circle, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { getBgStatus } from '@/Utils/getBgStatus';

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
    userWorkers,
    roles,
    branches,
    companies,
    statuses,
    categories,
    bonuses,
    filters,
}) {
    console.log(users);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const InitForm = {
        username: filters.username || '',
        status: filters.status || '',
        role: filters.role || '',
    };
    const { data } = useForm(InitForm);
    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

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
                        className={`${
                            branch?.status?.name === 'Activo'
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
                        className={`${
                            branch?.status?.name === 'Activo'
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
                        className={`${
                            branch?.status?.name === 'Activo'
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
                            userType={data?.role}
                            roleDisplayNames={roleDisplayNames}
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
                title: 'Correo',
                dataIndex: 'email',
                key: 'email',
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
                        className={`${
                            branch?.status?.name === 'Activo'
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
                        />
                        <ModalDeleteUser data={user} />
                        <ModalCreateBonus data={user} />
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
                    {user?.bonuses?.map((bonus) => {
                        const status = getBonusStatus(bonus);
                        return (
                            <div
                                key={bonus?.id}
                                className="flex-none mr-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[250px]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg text-green-600">
                                        ${bonus.amount.toLocaleString('es-CL')}
                                    </span>
                                    <div
                                        className={`px-2 py-1 rounded-full text-xs ${status.class}`}
                                    >
                                        {status.text}
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
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

    const columns2 = {
        'super-admin': [
            {
                accessorKey: 'username',
                header: () => <div>Nombre de usuario</div>,
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue('username')}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'email',
                header: () => <div>Correo electrónico</div>,
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue('email')}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'branch',
                header: () => <div>Sucursal</div>,
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue('branch')?.name}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: () => <div>Estado</div>,
                cell: ({ row }) => {
                    return (
                        <Circle
                            fill={getBgStatus(row?.getValue('status')?.name)}
                            color={getBgStatus(row?.getValue('status')?.name)}
                        />
                    );
                },
            },
            {
                accessorKey: 'role',
                header: () => <div>Rol</div>,
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue('role')?.name}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'actions',
                header: () => <div>Acciones</div>,
                cell: ({ row }) => {
                    return (
                        <DropdownMenu hover={true}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick="">
                                    Editar jugador
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    Eliminar jugador
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        jugador: [
            {
                accessorKey: 'first_name',
                header: 'Nombres',
                cell: ({ row: { original: user } }) => {
                    return (
                        <p className="rounded-lg p-1">
                            {user?.first_name} {user?.second_name}
                        </p>
                    );
                },
            },
            {
                accessorKey: 'last_names',
                header: 'Apellidos',
                cell: ({ row: { original: user } }) => (
                    <p className="rounded-lg p-1">
                        {user?.first_last_name} {user?.second_last_name}
                    </p>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Correo electrónico',
                cell: ({ row }) => (
                    <p className="rounded-lg p-1">{row?.getValue('email')}</p>
                ),
            },
            {
                accessorKey: 'rut',
                header: 'Rut/Código',
                cell: ({ row: { original: user } }) => (
                    <p className="rounded-lg p-1">
                        {user?.rutNumbers && user?.rutDv ? (
                            <>
                                {user?.rutNumbers}-{user?.rutDv}
                            </>
                        ) : (
                            <>{user?.code}</>
                        )}
                    </p>
                ),
            },
            {
                accessorKey: 'phone',
                header: 'Numero de teléfono',
                cell: ({ row: { original: user } }) => (
                    <p className="rounded-lg p-1">
                        {user?.prefix} {user?.phone}
                    </p>
                ),
            },
            {
                header: 'Sucursales',
                accessorKey: 'branches',
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            Ver sucursales
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>
                                Mis sucursales
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {row?.getValue('branches')?.map((branch) => (
                                <DropdownMenuItem key={branch?.id}>
                                    {branch?.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
            {
                header: 'Estado',
                accessorKey: 'status',
                cell: ({ row: { original: user } }) => (
                    <Circle
                        fill={getBgStatus(user?.status?.name)}
                        color={getBgStatus(user?.status?.name)}
                    />
                ),
            },
            {
                header: 'Rol',
                accessorKey: 'role',
                cell: ({ row }) => (
                    <p className="font-bold rounded-lg p-1">
                        {roleDisplayNames[row?.getValue('role')?.name] ||
                            row?.getValue('role')?.name}
                    </p>
                ),
            },
            {
                header: 'Acciones',
                accessorKey: 'actions',
                cell: ({ cell }) => <></>,
            },
            {
                header: 'Huella Digital',
                accessorKey: 'has_fingerprint',
                cell: ({ row }) => (
                    <span
                        style={{
                            color: row?.getValue('has_fingerprint')
                                ? '#52c41a'
                                : '#ff4d4f',
                        }}
                    >
                        <FingerprintIcon />
                    </span>
                ),
            },
            {
                accessorKey: 'actions',
                header: () => <div>Acciones</div>,
                cell: ({ row: { original: user } }) => {
                    return (
                        <DropdownMenu hover={true}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick="">
                                    Editar jugador
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    Eliminar jugador
                                </DropdownMenuItem>
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
                                />
                                <ModalDeleteUser data={user} />
                                <ModalCreateBonus data={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
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
                            <FilterModal
                                filters={filters}
                                statuses={statuses}
                                roles={roles}
                            />
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
                                    />
                                )}
                            </div>
                        </div>

                        {data.role &&
                        data.role === roleDisplayNames.jugador.toLowerCase() ? (
                            <CustomTable
                                rowSelection={rowSelection}
                                dataSource={users?.map((user) => ({
                                    ...user,
                                    key: user?.id,
                                }))}
                                columns={columns?.[data.role]}
                                expandable={{
                                    expandedRowRender,
                                    rowExpandable: () => true,
                                }}
                            />
                        ) : (
                            <CustomTable
                                rowSelection={rowSelection}
                                dataSource={users?.map((user) => ({
                                    ...user,
                                    key: user?.id,
                                }))}
                                columns={columns?.[data.role]}
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
