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
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { useState } from 'react';
import { roleDisplayNames, allowedRoles } from '@/Utils/constants';
import ChangePasswordModal from '@/Components/ChangePasswordModal';

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
  SidebarHeader,
  SidebarFooter,
} from '@/Components/ui/sidebar';

export function AppSidebar({ role, roles, user }) {
  const formattedRoles =
    roles?.map((role) => ({
      ...role,
      displayName: roleDisplayNames[role.name] || role.name,
    })) || [];

  function getSubdomain() {
    var host = document.location.host;
    var partes = host.split('.');
    var subdominio = partes[0];

    if (subdominio === 'www') {
      subdominio = '';
    }

    return subdominio;
  }

  const isTickets = getSubdomain() === 'tickets';
  const path = window.location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Menú de navegación agrupado por categorías
  const menuGroups = [
    {
      title: 'Principal',
      items: [
        {
          key: '0',
          icon: Home,
          label: 'Inicio',
          link: '/',
          autorized: true,
        },
      ],
    },
    {
      title: 'Gestión',
      items: [
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
          label: 'Categorías Bonos',
          link: '/categories-bonus',
          autorized: !isTickets,
        },
        {
          key: '5',
          icon: Settings,
          label: 'Configuración',
          link: '/roles',
          autorized: allowedRoles.roles.includes(role) && !isTickets,
        },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        {
          key: '8',
          icon: SquareStack,
          label: 'Tickets',
          link: '/tickets',
          autorized: allowedRoles.tickets.includes(role),
        },
        {
          key: '9',
          icon: Fingerprint,
          label: 'Registros Huella',
          link: '/fingerprint-logs',
          autorized: allowedRoles.fingerprintLogs.includes(role),
        },
        {
          key: '10',
          icon: Clock,
          label: 'Turnos',
          link: '/shifts',
          autorized: allowedRoles.shifts.includes(role),
        },
        {
          key: '11',
          icon: Package,
          label: 'Productos',
          link: '/products',
          autorized: allowedRoles.shifts.includes(role),
        },
        {
          key: '12',
          icon: ShoppingCart,
          label: 'Ventas Cigarros',
          link: '/orders',
          autorized: allowedRoles.shifts.includes(role),
        },
        {
          key: '13',
          icon: ShoppingBasket,
          label: 'Ventas Totales',
          link: '/sales-total',
          autorized: allowedRoles.shifts.includes(role),
        },
        {
          key: '14',
          icon: Banknote,
          label: 'Sistema Caja',
          link: '/cash-management',
          autorized: allowedRoles.systemBank.includes(role),
        },
        {
          key: '15',
          icon: LayoutGrid,
          label: 'Historial Cajas',
          link: '/cash-shift-history',
          autorized: allowedRoles.systemBank.includes(role) || role === 1,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Empresa</p>
              <p className="text-sm font-bold text-gray-900 uppercase">{getSubdomain()}</p>
            </div>
          </div>
          {user && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Usuario</p>
                  <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                </div>
              </div>
              <div className="pl-10">
                <p className="text-xs text-gray-500">Rol: <span className="font-semibold text-gray-900">{roleDisplayNames[role]}</span></p>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </p>
                </div>
                {group.items.map(
                  (item) =>
                    item.autorized && (
                      <SidebarMenuItem key={item.key}>
                        {item.link !== '/users' ? (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                              asChild
                              className={`${path === item.link ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <Link href={item.link}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ) : (
                          <div className="w-full">
                            <SidebarMenuButton
                              onClick={() => setIsOpen(!isOpen)}
                              className={`${path === item.link ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                              {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </SidebarMenuButton>

                            <SidebarMenuSub
                              className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                              {item.children &&
                                item.children.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.name}>
                                    <SidebarMenuButton
                                      asChild
                                      className="pl-8 text-gray-600 hover:bg-gray-50"
                                    >
                                      <Link href={`${item.link}?role=${subItem.name}`}>
                                        <span className="text-sm">{subItem.displayName}</span>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 bg-gray-50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowPasswordModal(true)}
              className="text-gray-700 hover:bg-gray-100"
            >
              <Lock className="w-4 h-4" />
              <span>Cambiar Contraseña</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-red-600 hover:bg-red-50"
            >
              <Link as="button" href={route('logout')} method="post">
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </Sidebar>
  );
}
