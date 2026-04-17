import { Link } from '@inertiajs/react';
import {
  Building2,
  ChartBarStacked,
  Clock,
  Home,
  LogOut,
  Lock,
  MapPinHouse,
  SquareStack,
  Users,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  ShoppingCart,
  Package,
  Banknote,
  ShoppingBasket,
} from 'lucide-react';
import { useState } from 'react';
import { roleDisplayNames, allowedRoles } from '@/Utils/constants';
import ChangePasswordModal from '@/Components/ChangePasswordModal';
import { getCurrentCompany } from '@/Utils/tenant';

/* global route */

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/Components/ui/sidebar';

export function AppSidebar({ role, roles, user }) {
  const formattedRoles =
    roles?.map((role) => ({
      ...role,
      displayName: roleDisplayNames[role.name] || role.name,
    })) || [];

  const currentCompany = getCurrentCompany();
  const isTickets = currentCompany === 'tickets';
  const path = window.location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Menú de navegación
  const menuItems = [
    {
      key: '0',
      icon: Home,
      label: 'Inicio',
      link: '/',
      autorized: true,
    },
    {
      key: '1',
      icon: Building2,
      label: 'Empresas',
      link: '/companies',
      autorized: allowedRoles.companies.includes(role),
    },
    {
      key: '2',
      icon: MapPinHouse,
      label: 'Sucursales',
      link: '/branches',
      autorized: allowedRoles.branches.includes(role) && !isTickets,
    },
    {
      key: '3',
      icon: Users,
      label: 'Usuarios',
      link: '/users',
      children: formattedRoles,
      autorized: !isTickets,
    },
    {
      key: '4',
      icon: ChartBarStacked,
      label: 'Reportes',
      link: '/reports',
      autorized: allowedRoles.branches.includes(role) && !isTickets,
    },
    {
      key: '5',
      icon: ChartBarStacked,
      label: 'Categorias bonos',
      link: '/categories-bonus',
      autorized: !isTickets,
    },
    {
      key: '6',
      icon: SquareStack,
      label: 'Roles',
      link: '/roles',
      autorized: allowedRoles.roles.includes(role) && !isTickets,
    },
    {
      key: '7',
      icon: SquareStack,
      label: 'Estados',
      link: '/statuses',
      autorized: allowedRoles.status.includes(role) && !isTickets,
    },
    {
      key: '8',
      icon: SquareStack,
      label: 'Obtener monto totales',
      link: '/total-amounts',
      autorized: false,
    },
    /* {
      key: '8',
      icon: SquareStack,
      label: 'Tótems',
      link: '/totems',
      autorized: allowedRoles.totems.includes(role),
    } */,
    {
      key: '10',
      icon: SquareStack,
      label: 'Tickets',
      link: '/tickets',
      autorized: allowedRoles.tickets.includes(role),
    },
    {
      key: '11',
      icon: Fingerprint,
      label: 'Registros de Huella',
      link: '/fingerprint-logs',
      autorized: allowedRoles.fingerprintLogs.includes(role),
    },
    {
      key: '12',
      icon: Clock,
      label: 'Registro de Turnos',
      link: '/shifts',
      autorized: allowedRoles.shifts.includes(role),
    },
    {
      key: '13',
      icon: Package,
      label: 'Productos',
      link: '/products',
      autorized: allowedRoles.shifts.includes(role),
    },
    {
      key: '14',
      icon: ShoppingCart,
      label: 'Ventas Cigarros',
      link: '/orders',
      autorized: allowedRoles.shifts.includes(role),
    },
    {
      key: '15',
      icon: ShoppingBasket,
      label: 'Ventas Totales',
      link: '/sales-total',
      autorized: allowedRoles.shifts.includes(role),
    },
    {
      key: '16',
      icon: Banknote,
      label: 'Sistema de Caja',
      link: '/cash-management',
      autorized: allowedRoles.systemBank.includes(role),
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="ps-5">
                  <div>
                    <span className="font-semibold">Empresa:</span>
                    <p className="mb-3 text-lg font-bold uppercase">{currentCompany}</p>
                    {user && (
                      <>
                        <span className="font-semibold">Usuario:</span>
                        <p className="mb-3 text-sm font-bold uppercase">{user.username}</p>
                        <span className="font-semibold">Rol:</span>
                        <p className="mb-3 text-sm font-bold uppercase">{roleDisplayNames[role]}</p>
                      </>
                    )}

                    {/* <DarkModeToggle /> */}
                    <hr className="my-3" />
                  </div>
                </div>
              </SidebarMenuItem>
              {menuItems.map(
                (item) =>
                  item.autorized && (
                    <SidebarMenuItem key={item.key}>
                      {item.link !== '/users' ? (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton asChild>
                            <Link href={item.link}>
                              <item.icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : (
                        <div className="w-full">
                          <SidebarMenuButton
                            onClick={() => setIsOpen(!isOpen)}
                            className={`${path === item.link ? 'bg-cyan-300 font-bold' : ''}`}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                            {isOpen ? <ChevronRight /> : <ChevronDown />}
                          </SidebarMenuButton>

                          <SidebarMenuSub
                            className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
                              isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            {item.children &&
                              item.children.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.name}>
                                  <SidebarMenuButton asChild className="pl-8">
                                    <Link href={`${item.link}?role=${subItem.name}`}>
                                      <span className="text-sm font-normal">
                                        {subItem.displayName}
                                      </span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </div>
                      )}
                    </SidebarMenuItem>
                  ),
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowPasswordModal(true)}
                  className="border border-blue-300 hover:bg-blue-500 hover:text-white cursor-pointer"
                >
                  <Lock />
                  <span>Cambiar Contraseña</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="border border-red-300 hover:bg-red-400 hover:text-white"
                >
                  <Link as="button" href={route('logout')} method="post">
                    <LogOut />
                    <span>Salir</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <ChangePasswordModal 
        open={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </Sidebar>
  );
}
