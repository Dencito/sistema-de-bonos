import React, { useEffect, useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalCreateUser from '@/Components/Users/ModalCreateUser';
import ModalDeleteUser from '@/Components/Users/ModalDeleteUser';
import ModalEditUser from '@/Components/Users/ModalEditUser';
import ModalViewUser from '@/Components/Users/ModalViewUser';
import { Table, Input, Select, Button, Spin, Typography, Dropdown, Tag, Flex } from 'antd';
import useCompanySelection from '@/Hooks/useCompanySelection';
import ModalCreateCompany from '@/Components/Companies/ModalCreateCompany';
import { DownOutlined, SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { SelectAssignCategories } from '@/Components/CategoriesBonus/SelectAssignCategories';
import { set } from 'date-fns';
import ModalCreateBonus from '@/Components/Bonus/ModalCreateBonus';
import { SelectAssignBonuses } from '@/Components/Bonus/SelectAssignBonuses';
import useBranchValidateSchedules from '@/Hooks/useBranchValidateSchedules';
import FilterModal from '@/Components/Users/FilterModal';
import { MobileButton } from '@/Components/MobileButton';
import ExcelManager from '@/Components/Users/ExcelManager';

const { Column } = Table;
const { Option } = Select;


const Index = ({ auth, users, roles, branches, companies, states, categories, bonuses, filters }) => {
    const { companySelect, loading, changeCompany } = useCompanySelection();
    const canLogin = useBranchValidateSchedules(auth?.branch?.shifts);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const InitForm = {
        username: filters.username || '',
        state: filters.state || '',
        role: filters.role || ''
      };
      const { data, setData, get } = useForm(InitForm);

    const onSelectChange = (newSelectedRowKeys) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };
    console.log(data)


    /* if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Head title="Usuarios" />
                <Spin size="large" />
            </div>
        );
    } */

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
                <h1 className='text-4xl font-bold'>
                    {data.role || 'Todos los usuarios' }
                </h1>
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
                        <Table className='overflow-auto' rowSelection={rowSelection} dataSource={users.map(user => ({ ...user, key: user.id }))}>

                            <Column title="Nombre de usuario" dataIndex="username" key="username" />
                            <Column title="Correo" dataIndex="email" key="id" />
                            <Column title="Estado" key="state" render={(_, branch) => (
                                    <div className={`${branch?.state?.name === 'Activo' && 'bg-green-300' ||
                                        branch?.state?.name === 'Inactivo' && 'bg-red-200' ||
                                        branch?.state?.name === 'En revisión' && 'bg-orange-300' ||
                                        branch?.state?.name === 'Borrado' && 'bg-red-400'
                                        } font-bold rounded-full text-center p-1 w-6 h-6`}></div>
                                )} />
                            <Column title="Rol" key="role" render={(_, user) => (
                                    <p className='font-bold rounded-lg p-1'>{user?.roles[0]?.name}</p>
                                )} />
                            <Column title="Categoria" key="category" render={(_, user) => (
                                    <p className='font-bold rounded-lg p-1'>{user?.category_bonus?.name}</p>
                                )} />
                            <Column title="Sucursales" key="branches" render={(_, user) => (
                                <>
                                    {/* <div className='flex flex-wrap gap-2 max-w-32'>
                                    {user?.branches?.map((branch) =>
                                        <Tag color="purple">
                                            {branch?.name}
                                        </Tag>)}
                                </div> */}
                                    <Dropdown menu={{
                                        items: user?.branches?.map(branch => {
                                            return {
                                                key: branch?.id,
                                                label: (
                                                    <p>
                                                        {branch?.name}
                                                    </p>
                                                ),
                                            }
                                        }
                                        )
                                    }} placement="bottomLeft" arrow>
                                        <p className='font-bold rounded-lg p-1'>Sucursales <DownOutlined /></p>
                                    </Dropdown>
                                </>
                            )} />
                            <Column title="Bonos" key="bonuses" render={(_, user) => (
                                <Dropdown menu={{
                                    items: user.bonuses.map(bonus => {
                                        return {
                                            key: bonus.id,
                                            label: (
                                                <p>
                                                    {bonus?.name}
                                                </p>
                                            ),
                                        }
                                    }
                                    )
                                }} placement="bottomLeft" arrow>
                                    <p className='font-bold rounded-lg p-1'>bonos <DownOutlined /></p>
                                </Dropdown>
                            )} />
                            <Column
                                title="Acciones"
                                key="actions"
                                render={(_, user) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewUser states={states} companies={companies} branches={branches} roles={roles} data={user} />
                                        <ModalEditUser states={states} companies={companies} branches={branches} roles={roles} data={user} />
                                        <ModalDeleteUser data={user} />
                                    </div>
                                )}
                            />
                        </Table>
                        {console.log(users)}
                        <div className='flex flex-col xl:flex-row gap-5 justify-between mt-5 mb-20'>
                            <SelectAssignCategories setSelectedRowKeys={onSelectChange} categories={categories} selectedRowKeys={selectedRowKeys} />
                            <SelectAssignBonuses setSelectedRowKeys={onSelectChange} bonuses={bonuses} selectedRowKeys={selectedRowKeys} />
                        </div>
                    </div>

                    <ExcelManager users={users}/>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}

export default Index;
