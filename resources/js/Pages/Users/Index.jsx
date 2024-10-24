import React, { useEffect, useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalCreateUser from '@/Components/Users/ModalCreateUser';
import ModalDeleteUser from '@/Components/Users/ModalDeleteUser';
import ModalEditUser from '@/Components/Users/ModalEditUser';
import ModalViewUser from '@/Components/Users/ModalViewUser';
import { Button, Spin, Dropdown } from 'antd';
import { DownOutlined } from "@ant-design/icons";
import useCompanySelection from '@/Hooks/useCompanySelection';
import ModalCreateBonus from '@/Components/Bonus/ModalCreateBonus';
import FilterModal from '@/Components/Users/FilterModal';
import { MobileButton } from '@/Components/MobileButton';
import ExcelManager from '@/Components/Users/ExcelManager';
import { CustomTable } from '@components-v2/CustomTable';
import { SelectAssignCategories } from '@/Components/CategoriesBonus/SelectAssignCategories';
import { SelectAssignBonuses } from '@/Components/Bonus/SelectAssignBonuses';

const Index = ({ auth, users, roles, branches, companies, states, categories, bonuses, filters }) => {
    const { companySelect, loading, changeCompany } = useCompanySelection();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const InitForm = {
        username: filters.username || '',
        state: filters.state || '',
        role: filters.role || ''
    };
    const { data } = useForm(InitForm);

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

    const columns = [
        {
            title: "Nombre de usuario",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "Correo",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Estado",
            key: "state",
            render: (_, branch) => (
                <div className={`${branch?.state?.name === 'Activo' ? 'bg-green-300' : 
                                branch?.state?.name === 'Inactivo' ? 'bg-red-200' : 
                                branch?.state?.name === 'En revisión' ? 'bg-orange-300' : 
                                branch?.state?.name === 'Borrado' ? 'bg-red-400' : ''} 
                                font-bold rounded-full text-center p-1 w-6 h-6`}></div>
            ),
        },
        {
            title: "Rol",
            key: "role",
            render: (_, user) => <p className='font-bold rounded-lg p-1'>{user?.roles[0]?.name}</p>,
        },
        {
            title: "Categoria",
            key: "category",
            render: (_, user) => <p className='font-bold rounded-lg p-1'>{user?.category_bonus?.name}</p>,
        },
        {
            title: "Sucursales",
            key: "branches",
            render: (_, user) => (
                <Dropdown 
                    overlay={{ 
                        items: user?.branches?.map(branch => ({
                            key: branch?.id,
                            label: <p>{branch?.name}</p>,
                        })) 
                    }} 
                    placement="bottomLeft" 
                    arrow>
                    <p className='font-bold rounded-lg p-1'>Sucursales <DownOutlined /></p>
                </Dropdown>
            ),
        },
        {
            title: "Bonos",
            key: "bonuses",
            render: (_, user) => (
                <Dropdown 
                    overlay={{ 
                        items: user.bonuses.map(bonus => ({
                            key: bonus.id,
                            label: <p>{bonus?.name}</p>,
                        })) 
                    }} 
                    placement="bottomLeft" 
                    arrow>
                    <p className='font-bold rounded-lg p-1'>Bonos <DownOutlined /></p>
                </Dropdown>
            ),
        },
        {
            title: "Acciones",
            key: "actions",
            render: (_, user) => (
                <div className='flex flex-wrap gap-3'>
                    <ModalViewUser states={states} companies={companies} branches={branches} roles={roles} data={user} />
                    <ModalEditUser states={states} companies={companies} branches={branches} roles={roles} data={user} />
                    <ModalDeleteUser data={user} />
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
        >
            <Head title={`Usuarios ${data.role || 'todos'}`} />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className='text-4xl font-bold'>{data.role || 'Todos los usuarios'}</h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-between">
                            <FilterModal filters={filters} states={states} roles={roles} />
                            <div className='flex gap-5'>
                                <ModalCreateBonus />
                                {data?.role && <ModalCreateUser states={states} companies={companies} roles={roles?.filter(item => item?.name === data?.role)} branches={branches} />}
                            </div>
                        </div>

                        <CustomTable 
                            rowSelection={rowSelection} 
                            dataSource={users.map(user => ({ ...user, key: user.id }))} 
                            columns={columns} 
                            loading={loading}
                        />
                        <div className='flex flex-col xl:flex-row gap-5 justify-between mt-5 mb-20'>
                            <SelectAssignCategories setSelectedRowKeys={setSelectedRowKeys} categories={categories} selectedRowKeys={selectedRowKeys} />
                            <SelectAssignBonuses setSelectedRowKeys={setSelectedRowKeys} bonuses={bonuses} selectedRowKeys={selectedRowKeys} />
                        </div>
                    </div>

                    <ExcelManager users={users} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default Index;
