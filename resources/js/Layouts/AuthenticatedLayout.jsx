import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { AppSidebar } from '@/Components/AppSideBar';

export default function Authenticated({ auth, user, role, children }) {
  const { roles } = auth;

  return (
    <SidebarProvider>
      <AppSidebar role={role} roles={roles} user={user} />
      <main className="flex flex-col flex-1 min-w-0 bg-slate-50">
        {/* Barra superior fija: el disparador del menú queda siempre a mano */}
        <header className="sticky top-0 z-20 flex items-center gap-2 h-14 px-3 bg-white/90 backdrop-blur border-b border-slate-200">
          <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
