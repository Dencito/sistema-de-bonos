import { Link } from '@inertiajs/react';
import {
    Building2,
    ChartBarStacked,
    Home,
    LogOut,
    MapPinHouse,
    SquareStack,
    Users,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { roleDisplayNames, allowedRoles, roleNames } from '@/Utils/constants';

export const Links = ({ role, roles }) => {
    const formattedRoles = roles.map((role) => ({
        ...role,
        displayName: roleDisplayNames[role.name] || role.name,
    }));

    function getSubdomain() {
        var url = document.location.href;
        var host = document.location.host;
        var partes = host.split('.');
        var subdominio = partes[0];
        
        if (subdominio === 'www') {
            subdominio = '';
        }
        
        return subdominio;
    }
    
    const isTickets = (getSubdomain() === "tickets");

    const path = window.location.pathname;
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            {[
                {
                    key: '0',
                    icon: <Home />,
                    label: 'Inicio',
                    link: '/',
                    autorized: true,
                },
                {
                    key: '1',
                    icon: <Building2 />,
                    label: 'Empresas',
                    link: '/companies',
                    autorized: allowedRoles.companies.includes(role),
                },
                {
                    key: '2',
                    icon: <MapPinHouse />,
                    label: 'Sucursales',
                    link: '/branches',
                    autorized: allowedRoles.branches.includes(role) && !isTickets,
                },
                {
                    key: '3',
                    icon: <Users />,
                    label: 'Usuarios',
                    link: '/users',
                    children: formattedRoles,
                    autorized: !isTickets,
                },
                {
                    key: '4',
                    icon: <ChartBarStacked />,
                    label: 'Categorias bonos',
                    link: '/categories-bonus',
                    autorized: !isTickets,
                },
                {
                    key: '5',
                    icon: <SquareStack />,
                    label: 'Roles',
                    link: '/roles',
                    autorized: allowedRoles.roles.includes(role) && !isTickets,
                },
                {
                    key: '6',
                    icon: <SquareStack />,
                    label: 'Estados',
                    link: '/statuses',
                    autorized: allowedRoles.status.includes(role) && !isTickets,
                },
                {
                    key: '7',
                    icon: <SquareStack />,
                    label: 'Obtener monto totales',
                    link: '/total-amounts',
                    autorized: false,
                },
            ].map((item) => (
                <div key={item.key}>
                    {item.autorized && item?.link !== '/users' && (
                        <Link
                            className={`transition-all duration-300 my-2 ${path === item?.link ? 'bg-cyan-300' : 'hover:bg-cyan-300'} flex gap-2 rounded-lg py-3 ps-3 text-lg items-center space-x-2`}
                            href={item?.link}
                            selected
                        >
                            {item.icon}{' '}
                            <span
                                className={`text-base ${path === item?.link && 'font-bold'}`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )}
                    {item?.link === '/users' && !isTickets  && (
                        <div className="border-none">
                            {/* Etiqueta que despliega el colapso */}
                            <div
                                onClick={() => setIsOpen(!isOpen)} // Alterna el colapso al hacer clic
                                className={`transition-all duration-300 ${
                                    path === item?.link
                                        ? 'bg-cyan-300'
                                        : 'hover:bg-cyan-300'
                                } flex gap-2 rounded-lg py-3 ps-3 text-lg items-center space-x-2 cursor-pointer`}
                            >
                                {/* Contenido principal del menú */}
                                <span
                                    className={`text-base flex gap-2 rounded-lg  ${
                                        path === item?.link ? 'font-bold' : ''
                                    }`}
                                >
                                    {item.icon} {item.label}{' '}
                                    {isOpen ? (
                                        <ChevronRight />
                                    ) : (
                                        <ChevronDown />
                                    )}
                                </span>
                            </div>

                            {/* Submenú colapsable con animación */}
                            <div
                                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
                                    isOpen
                                        ? 'max-h-40 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                {item?.children &&
                                    item?.children.map((subItem) => (
                                        <Link
                                            key={subItem?.name}
                                            className="transition-all duration-300 hover:bg-cyan-300 flex gap-2 rounded-lg py-1 ps-12 text-base items-center space-x-2"
                                            href={`${item.link}?role=${subItem?.name}`}
                                        >
                                            <span className="text-sm font-normal">
                                                {subItem?.displayName}{' '}
                                                {/* Usa displayName en lugar de name */}
                                            </span>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <Link
                className="border-red-300 border hover:bg-red-400 hover:text-white transition-all w-full py-3 ps-3 rounded-lg duration-300 flex gap-2 text-base font-light items-center space-x-2"
                as="button"
                href={route('logout')}
                method="post"
            >
                <LogOut /> <span className="text-base">Salir</span>
            </Link>
        </div>
    );
};
