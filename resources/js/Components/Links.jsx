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
import { roleDisplayNames, allowedRoles } from '@/Utils/constants';

export const Links = ({ role, roles }) => {
    const formattedRoles = roles.map((role) => ({
        ...role,
        displayName: roleDisplayNames[role.name] || role.name,
    }));

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

    const menuItems = [
        {
            key: '0',
            icon: <Home size={20} />,
            label: 'Inicio',
            link: '/',
            autorized: true,
        },
        {
            key: '1',
            icon: <Building2 size={20} />,
            label: 'Empresas',
            link: '/companies',
            autorized: allowedRoles.companies.includes(role),
        },
        {
            key: '2',
            icon: <MapPinHouse size={20} />,
            label: 'Sucursales',
            link: '/branches',
            autorized: allowedRoles.branches.includes(role) && !isTickets,
        },
        {
            key: '3',
            icon: <Users size={20} />,
            label: 'Usuarios',
            link: '/users',
            children: formattedRoles,
            autorized: !isTickets,
        },
        {
            key: '4',
            icon: <ChartBarStacked size={20} />,
            label: 'Categorias bonos',
            link: '/categories-bonus',
            autorized: !isTickets,
        },
        {
            key: '5',
            icon: <SquareStack size={20} />,
            label: 'Roles',
            link: '/roles',
            autorized: allowedRoles.roles.includes(role) && !isTickets,
        },
        {
            key: '6',
            icon: <SquareStack size={20} />,
            label: 'Estados',
            link: '/statuses',
            autorized: allowedRoles.status.includes(role) && !isTickets,
        },
        {
            key: '7',
            icon: <SquareStack size={20} />,
            label: 'Obtener monto totales',
            link: '/total-amounts',
            autorized: false,
        },
    ];

    return (
        <div className="space-y-1">
            {menuItems.map((item) => (
                <div key={item.key}>
                    {item.autorized && item?.link !== '/users' && (
                        <Link
                            className={`group flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                                ${path === item?.link 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'
                                }`}
                            href={item?.link}
                        >
                            <span className={`${path === item?.link ? 'text-white' : 'text-gray-400 group-hover:text-cyan-500'}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    )}
                    
                    {item?.link === '/users' && !isTickets && (
                        <div className="border-none">
                            <div
                                onClick={() => setIsOpen(!isOpen)}
                                className={`group flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer
                                    ${path.startsWith('/users') 
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className={`${path.startsWith('/users') ? 'text-white' : 'text-gray-400 group-hover:text-cyan-500'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>
                                <span className={`${path.startsWith('/users') ? 'text-white' : 'text-gray-400 group-hover:text-cyan-500'}`}>
                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </span>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out
                                ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                            >
                                {item?.children?.map((subItem) => (
                                    <Link
                                        key={subItem?.name}
                                        className={`flex items-center space-x-3 rounded-lg px-4 py-2 text-sm transition-all duration-200 ms-6
                                            ${path === `${item.link}?role=${subItem?.name}`
                                                ? 'bg-cyan-50 text-cyan-600 font-medium'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600'
                                            }`}
                                        href={`${item.link}?role=${subItem?.name}`}
                                    >
                                        <span>{subItem?.displayName}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            <Link
                className="mt-6 flex items-center space-x-3 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                as="button"
                href={route('logout')}
                method="post"
            >
                <LogOut size={20} className="text-red-500" />
                <span>Cerrar sesión</span>
            </Link>
        </div>
    );
};
