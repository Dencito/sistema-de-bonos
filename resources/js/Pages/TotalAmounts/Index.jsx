import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@layouts/AuthenticatedLayout';
import { Table } from 'antd';

import { parse, isAfter, isBefore, isValid } from 'date-fns';
import { formatDateTime, getCurrentDateTime } from '@utils/date';

const { Column } = Table;

export default function TotalAmountPage({ auth, bonuses, categoryBonus }) {
    const [validBonuses, setValidBonuses] = useState([]);
    const [invalidBonuses, setInvalidBonuses] = useState([]);

    const now = new Date();
    const isValidDate = (start_datetime, end_datetime) => {
        const start = parse(start_datetime, 'yyyy-MM-dd HH:mm:ss', new Date()); // Parsea la fecha de inicio
        const end = end_datetime ? parse(end_datetime, 'yyyy-MM-dd HH:mm:ss', new Date()) : null; // Parsea la fecha de fin si existe

        // Verifica si las fechas son válidas
        if (isValid(start) && (end === null || isValid(end))) {
            if (end) {
                // Verifica si la fecha actual está entre "start" y "end"
                return isAfter(now, start) && isBefore(now, end);
            }
            return isAfter(now, start); // Si no hay fecha de fin, solo verifica si es posterior a la de inicio
        }

        return false; // Si las fechas no son válidas, retorna falso
    };

    // Función para separar bonos válidos e inválidos
    const categorizeBonuses = (bonuses) => {
        let valid = [];
        let invalid = [];

        bonuses?.forEach(bonus => {
            if (isValidDate(bonus?.start_datetime, bonus?.end_datetime)) {
                valid?.push(bonus); // Agregar a válidos
            } else {
                invalid?.push(bonus); // Agregar a inválidos
            }
        });

        setValidBonuses(valid);
        setInvalidBonuses(invalid);
    };

    useEffect(() => {
        categorizeBonuses(bonuses); // Clasificar los bonos cuando se cargue el componente
    }, [bonuses]);

    // Sumar montos válidos
    const sumValidAmounts = (bonuses) => {
        return bonuses?.reduce((total, bonus) => total + Math?.floor(bonus?.amount), 0);
    };

    // Suma de los montos de bonos válidos
    const totalValidBonusesAmount = sumValidAmounts(validBonuses);

    // Suma de base_amount y additional_amount de categoryBonus
    let totalAdditionalAmount = Math?.floor(categoryBonus?.base_amount || 0);
    if (categoryBonus?.additional_amount) {
        totalAdditionalAmount += Math?.floor(categoryBonus?.additional_amount);
    }

    // Si categoryBonus tiene bonuses, los sumamos también
    if (categoryBonus?.bonuses?.length > 0) {
        totalAdditionalAmount += sumValidAmounts(categoryBonus?.bonuses);
    }

    // Suma final de todo
    const totalAmount = totalValidBonusesAmount + totalAdditionalAmount;

    return (
        <AuthenticatedLayout
            user={auth.user}
            role={auth.role}
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
        >
            <Head title="Montos totales" />
            <h1 className='text-3xl font-bold'>Fecha y hora actual: {getCurrentDateTime()}</h1>
            <div>
                <h3 className='text-2xl font-bold text-green-500'>Bonos Válidos</h3>
                <Table dataSource={validBonuses} rowKey="id">
                    <Column title="Nombre" dataIndex="name" key="name" />
                    <Column title="Monto" dataIndex="amount" key="amount" />
                    <Column title="Fecha de Inicio"
                        render={(_, bono) => (
                            <div className='flex flex-wrap gap-3'>
                                <p>{formatDateTime(bono.start_datetime)}</p>
                            </div>
                        )} key="start_datetime" />
                    <Column title="Fecha de Fin" render={(_, bono) => (
                        <div className='flex flex-wrap gap-3'>
                            <p>{bono?.end_datetime ? formatDateTime(bono?.end_datetime): ''}</p>
                        </div>
                    )} key="end_datetime" />
                </Table>
            </div>
            <div className="mb-20">
                <h2>Total bonos válidos: ${totalValidBonusesAmount} +</h2>
                <h2>Total categoría: ${totalAdditionalAmount} +</h2>
                <h2>Total total: {totalAmount}</h2>
            </div>
            <div>
                <h3 className='text-2xl font-bold text-red-500'>Bonos Inválidos</h3>
                <Table dataSource={invalidBonuses} rowKey="id">
                    <Column title="Nombre" dataIndex="name" key="name" />
                    <Column title="Monto" dataIndex="amount" key="amount" />
                    <Column title="Fecha de Inicio"
                        render={(_, bono) => (
                            <div className='flex flex-wrap gap-3'>
                                <p>{formatDateTime(bono?.start_datetime)}</p>
                            </div>
                        )} key="start_datetime" />
                    <Column title="Fecha de Fin" render={(_, bono) => (
                        <div className='flex flex-wrap gap-3'>
                            <p>{bono?.end_datetime ? formatDateTime(bono?.end_datetime): ''}</p>
                        </div>
                    )} key="end_datetime" />
                </Table>
            </div>
        </AuthenticatedLayout>
    );
};
