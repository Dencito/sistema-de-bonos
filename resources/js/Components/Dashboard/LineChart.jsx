import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Select } from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { filterByToday, filterByThisWeek, filterByThisMonth } from '@/Utils/filterDates'; 

const { Option } = Select;

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

export default function LineChart({ info }) {
    const [filter, setFilter] = useState('today');

    const handleFilterChange = (value) => {
        setFilter(value);
    };

    const filteredData = (filter) => {
        if (filter === 'today') return filterByToday(info);
        if (filter === 'thisWeek') return filterByThisWeek(info);
        if (filter === 'thisMonth') return filterByThisMonth(info);
        return info;
    };

    const data = {
        labels: filteredData(filter).map(row => row.username), // Nombres en el eje X
        datasets: [
            {
                label: 'Últimas Empresas Creadas',
                data: filteredData(filter).map(row => ({ x: row.username, y: new Date(row.created_at) })), // Fechas en el eje Y
                fill: 'start',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Gráfico de empresas creadas por fecha',
            },
        },
        scales: {
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'Nombre de la Empresa',
                },
                ticks: {
                    autoSkip: true,
                },
            },
            y: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'P',
                    displayFormats: {
                        day: 'MMM dd',
                    },
                },
                title: {
                    display: true,
                    text: 'Fecha de Creación',
                },
                beginAtZero: false,
                min: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                max: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
                ticks: {
                    callback: (value) => new Date(value).toLocaleDateString(),
                },
            },
        },
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Select
                    defaultValue="today"
                    style={{ width: 200 }}
                    onChange={handleFilterChange}
                >
                    <Option value="today">Hoy</Option>
                    <Option value="thisWeek">Esta Semana</Option>
                    <Option value="thisMonth">Este Mes</Option>
                </Select>
            </div>
            <Line data={data} options={options} />
        </div>
    );
};