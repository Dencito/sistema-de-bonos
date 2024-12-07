import ModalCreateCategoryBono from '@/Components/CategoriesBonus/ModalCreateCategoryBono';
import ModalDeleteCategoryBono from '@/Components/CategoriesBonus/ModalDeleteCategoryBono';
import ModalEditCategoryBono from '@/Components/CategoriesBonus/ModalEditCategoryBono';
import ModalViewCategoryBono from '@/Components/CategoriesBonus/ModalViewCategoryBono';
import ModalViewUserCategories from '@/Components/CategoriesBonus/ModalViewUserCategories';
import { MobileButton } from '@/Components/MobileButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Table } from 'antd';
const { Column } = Table;

export default function CategoryBonusPage({ auth, categoriesBonus }) {
    const role = auth.role
    
    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
        >
            <Head title="Categorias de bonos" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className='text-4xl font-bold'>
                    Categoria de bonos
                </h1>
            </header>
            <div className='flex-1 overflow-auto p-4 z-10'>
                <div className="w-full">
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="text-gray-900 my-3 flex items-center justify-end">
                            {
                                (role === 'Dueño' ||
                                    role === 'Super Admin')
                                &&
                                <ModalCreateCategoryBono />
                            }
                        </div>
                        <Table className='overflow-auto' dataSource={categoriesBonus.map(categoryBonus => ({ ...categoryBonus, key: categoryBonus.id }))}>
                            <Column title="Nombre" dataIndex="name" key="id" />
                            <Column
                                title="Usuarios"
                                key="quantity"
                                render={(_, category) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <p>{category.users.length}</p>
                                    </div>
                                )}
                            />
                            <Column
                                title="Acciones"
                                key="actions"
                                render={(_, category) => (
                                    <div className='flex flex-wrap gap-3'>
                                        <ModalViewUserCategories data={category.users} category={category.name} />
                                        <ModalViewCategoryBono data={category} />
                                        <ModalEditCategoryBono data={category} />
                                        <ModalDeleteCategoryBono data={category} />
                                    </div>
                                )}
                            />
                        </Table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}