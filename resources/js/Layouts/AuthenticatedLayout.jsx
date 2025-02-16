import { Links } from '@components/Links';
import { roleDisplayNames } from '@/Utils/constants';
import { VITE_PRIMARY_SUBDOMAIN } from '@/Utils/env';

export default function Authenticated({ auth, user, role, children }) {
    const { roles } = auth;

    let getCompany = window.location.hostname.split('.')[0];
    


    if(getCompany === "127") {
        getCompany = "Local pruebas";
    } else {
        if(getCompany === "tickets") {
            getCompany = "Rentamania";
        } else {
            getCompany = getCompany.toUpperCase();
        }
    }

    return (
        <div className="flex h-screen bg-[#f5f6fa]">
            <aside className="hidden h-screen w-[280px] bg-white p-6 shadow-lg lg:block transition-all duration-300 border-r border-gray-100">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Bonos</h1>
                    <div className="h-[2px] w-12 bg-cyan-500"></div>
                </div>
                
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-gray-500 font-medium">Empresa</span>
                            <p className="text-base font-semibold text-gray-800">
                                {getCompany}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 font-medium">Usuario</span>
                            <p className="text-base font-semibold text-gray-800">
                                {user.username}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 font-medium">Rol</span>
                            <p className="text-base font-semibold text-gray-800">
                                {roleDisplayNames[role]}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="space-y-1">
                    <Links role={role} roles={roles} />
                </nav>
            </aside>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-auto ">
                    {children}
                </div>
            </main>
            <style jsx global>{`
                .ant-dropdown-menu {
                    border-radius: 12px !important;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
                    border: 1px solid #e5e7eb !important;
                }
                .ant-select-item {
                    padding: 8px 16px !important;
                    border-radius: 8px !important;
                    margin: 4px !important;
                }
                .ant-select-item:hover {
                    background-color: #f0fdfa !important;
                }
                .ant-select-item-option-selected {
                    background-color: #e0f2fe !important;
                }
            `}</style>
        </div>
    );
}
