import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Reports({ auth, dataReport, filters }) {
    const InitForm = {
        type: filters.type || '',
    }
    const { data } = useForm(InitForm)

    console.log(dataReport)

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Reportes
                </h2>
            }
        >
            <Head title="Reportes" />
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Reportes
                    </h3>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 z-10">
                <div className="w-full">

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
