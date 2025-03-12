import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { AppSidebar } from '@/Components/AppSideBar';

export default function Authenticated({ auth, user, role, children }) {
    const { roles } = auth;

    return (
        <SidebarProvider>
            <AppSidebar role={role} roles={roles} user={user} />
            <main className="flex flex-1 px-3 flex-col overflow-auto">
                <SidebarTrigger />
                {children}
            </main>
        </SidebarProvider>
    );
}
