import { useEffect } from "react";
import { Head } from "@inertiajs/react";
import { MobileButton } from "@components/MobileButton";
import PdfGenerator from "@components/PdfGenerator";
import AuthenticatedLayout from "@layouts/AuthenticatedLayout";

export default function Dashboard({ auth }) {
    const getSelectedCompany = async () => {
        try {
            const response = await axios.get("/companies/selected");
            window.localStorage.setItem(
                "companySelect",
                await response.data.company
            );
            return response.data.company;
        } catch (error) {
            console.error("Error al obtener la empresa seleccionada:", error);
            return null;
        }
    };

    useEffect(() => {
        getSelectedCompany();
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Panel
                </h2>
            }
        >
            <Head title="Panel" />
            <header className="flex items-center justify-between bg-white p-4 shadow-sm">
                <MobileButton role={auth.role} roles={auth.roles} />
                <h1 className="text-4xl font-bold">Inicio</h1>
            </header>
            <div className="flex-1 overflow-auto p-4 z-10">
                <div className="w-full">
                    <div className="p-6 text-gray-900">
                        <h1 className="text-3xl font-bold">
                            Bienvenido usuario: {auth.user.username}
                        </h1>
                        <h2 className="text-2xl font-bold">Rol: {auth.role}</h2>
                    </div>
                    <PdfGenerator user={auth?.user} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-2">
                                <h3 className="whitespace-nowrap tracking-tight text-sm font-medium">
                                    Sucursales
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="text-2xl font-bold">000</div>
                                <p className="text-xs text-muted-foreground">
                                    Total sucursales
                                </p>
                            </div>
                        </div>
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-2">
                                <h3 className="whitespace-nowrap tracking-tight text-sm font-medium">
                                    Usuarios
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="text-2xl font-bold">000</div>
                                <p className="text-xs text-muted-foreground">
                                    Total registros
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="sm:px-6 lg:px-8"></div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
