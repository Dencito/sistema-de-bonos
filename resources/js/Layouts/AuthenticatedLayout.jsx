import { theme } from 'antd';
import { Links } from '@components/Links';

export default function Authenticated({ auth, user, role, children }) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { roles } = auth
    const nameCompanySelect = window.localStorage.getItem('companySelect');

    return (
        <div className='flex h-screen'>
            <aside className="hidden h-screen w-64 bg-white p-4 shadow-md lg:block">
                <nav className="space-y-2">
                    <div className="ps-5">
                        <span className='font-semibold'>Empresa:</span>
                        <p className='mb-3 text-xl font-bold uppercase'>{nameCompanySelect}</p>
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