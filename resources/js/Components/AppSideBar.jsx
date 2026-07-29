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
  UserRound,
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

  // Marca activo también las subrutas, p. ej. /users/3 dentro de /users
  const isActive = (link) => (link === '/' ? path === '/' : path.startsWith(link));

  const initials = (user?.username || '?')
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

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
          autorized: allowedRoles.systemBank.includes(role),
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-slate-200 bg-white">
        <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 shrink-0">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
              Empresa
            </p>
            <p className="text-sm font-bold uppercase truncate text-slate-900">{getSubdomain()}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group, groupIndex) => {
          const visibleItems = group.items.filter((item) => item.autorized);
          if (!visibleItems.length) return null;

          return (
            <SidebarGroup key={groupIndex}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                      {group.title}
                    </p>
                  </div>
                  {visibleItems.map((item) => {
                    const active = isActive(item.link);
                    const itemClass = active
                      ? 'bg-slate-900 text-white font-medium hover:bg-slate-900 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100';

                    if (item.link !== '/users') {
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton asChild tooltip={item.label} className={itemClass}>
                            <Link href={item.link}>
                              <item.icon className="w-4 h-4 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          onClick={() => setIsOpen(!isOpen)}
                          tooltip={item.label}
                          className={itemClass}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          )}
                        </SidebarMenuButton>

                        {isOpen && item.children?.length > 0 && (
                          <SidebarMenuSub>
                            {item.children.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.name}>
                                <SidebarMenuButton
                                  asChild
                                  className="text-slate-600 hover:bg-slate-100"
                                >
                                  <Link href={`${item.link}?role=${subItem.name}`}>
                                    <span className="text-sm">{subItem.displayName}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 bg-slate-50">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center justify-center w-9 h-9 text-xs font-bold text-white rounded-full bg-slate-700 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900">{user.username}</p>
              <p className="text-xs truncate text-slate-500">{roleDisplayNames[role] || role}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Mi Perfil"
              className="text-slate-700 hover:bg-slate-200"
            >
              <Link href={route('profile.edit')}>
                <UserRound className="w-4 h-4 shrink-0" />
                <span>Mi Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowPasswordModal(true)}
              tooltip="Cambiar Contraseña"
              className="text-slate-700 hover:bg-slate-200"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Cambiar Contraseña</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Salir" className="text-red-600 hover:bg-red-50">
              <Link as="button" href={route('logout')} method="post">
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Salir</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </Sidebar>
  );
}
