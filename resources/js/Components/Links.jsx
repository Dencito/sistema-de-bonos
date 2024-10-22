import { Link, useForm } from '@inertiajs/react';
import { Collapse } from 'antd';
import { Building2, ChartBarStacked, Home, LogOut, MapPinHouse, SquareStack, Users, ChevronDown, ChevronRight  } from 'lucide-react';
import { useState } from 'react';

export const Links = ({ role, roles }) => {
    const path = window.location.pathname
    const [select, setSelect] = useState(path)
    const [isOpen, setIsOpen] = useState(false);

    const { data, setData, get } = useForm({
        role: ''
    });

    return (
        <>
            {[
                {
                    key: '0',
                    icon: <Home />,
                    label: 'Inicio',
                    link: '/',
                    autorized: true

                },
                {
                    key: '1',
                    icon: <Building2 />,
                    label: 'Empresas',
                    link: '/companies',
                    autorized: role === "Dueño"

                },
                {
                    key: '2',
                    icon: <MapPinHouse />,
                    label: 'Sucursales',
                    link: `/branches`,
                    autorized: role === "Dueño" || role === "Super Admin" || role === "Admin"
                },
                {
                    key: '3',
                    icon: <Users />,
                    label: 'Usuarios',
                    link: '/users',
                    children: roles,
                    autorized: role === "Usuario" ? false : true
                },
                {
                    key: '4',
                    icon: <ChartBarStacked />,
                    label: 'Categorias bonos',
                    link: '/categories-bonus',
                    autorized: true
                },
                {
                    key: '5',
                    icon: <SquareStack />,
                    label: 'Roles',
                    link: '/roles',
                    autorized: role === "Dueño" || role === "Super Admin"
                },
                {
                    key: '6',
                    icon: <SquareStack />,
                    label: 'Estados',
                    link: '/states',
                    autorized: role === "Dueño" || role === "Super Admin"
                },
                {
                    key: '7',
                    icon: <SquareStack />,
                    label: 'Obtener monto totales',
                    link: '/total-amounts',
                    autorized: false
                },
            ].map(item => (
                <>
                    {item.autorized && item?.link !== '/users' &&
                        <Link className={`transition-all duration-300 ${select === item?.link ? 'bg-cyan-300' : 'hover:bg-cyan-300'} flex gap-2 rounded-lg py-3 ps-3 text-lg items-center space-x-2`} href={item?.link} selected>
                            {item.icon} <span className={`text-base ${select === item?.link && 'font-bold'}`}>{item.label}</span>
                        </Link>
                    }
                    {
                        item?.link === '/users' &&
                        <div className="border-none">
                            {/* Etiqueta que despliega el colapso */}
                            <div
                                onClick={() => setIsOpen(!isOpen)} // Alterna el colapso al hacer clic
                                className={`transition-all duration-300 ${select === item?.link
                                    ? 'bg-cyan-300'
                                    : 'hover:bg-cyan-300'
                                    } flex gap-2 rounded-lg py-3 ps-3 text-lg items-center space-x-2 cursor-pointer`}
                            >
                                {/* Contenido principal del menú */}
                                <span
                                    className={`text-base flex gap-2 rounded-lg  ${select === item?.link ? 'font-bold' : ''
                                        }`}
                                >
                                    {item.icon}  {item.label}  {isOpen ? <ChevronRight /> : <ChevronDown />}
                                </span>
                            </div>

                            {/* Submenú colapsable con animación */}
                            <div
                                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
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
                                                {subItem?.name}
                                            </span>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    }



                </>
            ))}
            <Link className='border-red-300 border hover:bg-red-400 hover:text-white transition-all w-full py-3 ps-3 rounded-lg duration-300 flex gap-2 text-base font-light items-center space-x-2' as="button" href={route('logout')} method="post">
                <LogOut /> <span className='text-base'>Salir</span>
            </Link>
        </>
    )
}
