import { roleDisplayNames } from '@/Utils/constants';
import { VITE_PRIMARY_SUBDOMAIN } from '@/Utils/env';
import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { AppSidebar } from '@/Components/AppSideBar';

export default function Authenticated({ auth, user, role, children }) {
    const { roles } = auth;
    
    return (
        <SidebarProvider>
            <AppSidebar role={role} roles={roles} user={user} />
            <main className='flex flex-1 px-3 flex-col overflow-auto'>
                <SidebarTrigger />
                {children}
            </main>
        </SidebarProvider>
    );
    {
        /* <div className="flex h-screen">
        <aside className="hidden h-screen w-64 bg-white p-4 shadow-md lg:block">
            <nav className="space-y-2">
                <div className="ps-5">
                    <div>
                        <span className="font-semibold">Empresa:</span>
                        <p className="mb-3 text-xl font-bold uppercase">
                            {VITE_PRIMARY_SUBDOMAIN}
                        </p>
                        <span className="font-semibold">Usuario:</span>
                        <p className="mb-3 text-lg font-bold uppercase">
                            {user.username}
                        </p>
                        <span className="font-semibold">Rol:</span>
                        <p className="mb-3 text-lg font-bold uppercase">
                            {roleDisplayNames[role]}
                        </p>
                    </div>
                    <hr />
                </div>
                <Links role={role} roles={roles} />
            </nav>
        </aside>
        <main className="flex flex-1 px-3 flex-col overflow-auto">
            {children}
        </main>
    </div> */
    }
}
