import { Link, router } from '@inertiajs/react';
import { LaptopOutlined, NotificationOutlined, UserOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Layout, Menu, theme } from 'antd';
import { Links } from '@/Components/Links';
const { Header, Content, Footer, Sider } = Layout;

export default function Authenticated({ auth, user, role, notShow, header, children }) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { roles } = auth

    console.log(roles)


    const nameCompanySelect = window.localStorage.getItem('companySelect');


    return (
        <div className='flex h-screen'>
            <aside className="hidden h-screen w-64 bg-white p-4 shadow-md lg:block">
                <nav className="space-y-2">
                    <div className="ps-5">
                        <span className='font-semibold'>Empresa:</span>
                        <p className='mb-3 text-xl font-bold uppercase'>{nameCompanySelect}</p>
                        {/*                                 {(role === "Dueño" || role === "Super Admin" || role === "Admin") && <Button onClick={clearSelectedCompany}>
                                    Cambiar de empresa
                                </Button>} */}
                        <span className='font-semibold'>Usuario:</span>
                        <p className='mb-3 text-lg font-bold uppercase'>{user.username}</p>
                        <span className='font-semibold'>Rol:</span>
                        <p className='mb-3 text-lg font-bold uppercase'>{role}</p>
                        <hr />
                    </div>
                    <Links role={role} roles={roles} />
                </nav>
            </aside>
            <main
                className="flex flex-1 px-3 flex-col overflow-auto"
            >
                {children}
            </main>

        </div>
    );
}