import { Button, Typography } from 'antd';
import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Importamos sheetjs

const ExcelManager = ({ users: data }) => {
    const [users, setUsers] = useState(data);
    const [newUsers, setNewUsers] = useState([])

    // Función para manejar la carga de archivo Excel
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Guardamos los datos leídos del archivo Excel en el estado
            setNewUsers(jsonData);
        };

        reader.readAsArrayBuffer(file);
    };

    // Función para exportar los datos a un nuevo archivo Excel
    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(users); // Convertimos los datos a hoja de cálculo
        const wb = XLSX.utils.book_new(); // Creamos un nuevo libro
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios'); // Agregamos la hoja al libro

        // Generamos y descargamos el archivo Excel
        XLSX.writeFile(wb, 'usuarios_exportados.xlsx');
    };

    return (
        <>
        <div className='flex gap-5 items-baseline'>
            {/* Input para subir archivo Excel */}
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

            {/* Botón para exportar los datos a un nuevo archivo Excel */}
            <Button onClick={handleExport}>Exportar usuarios</Button>
        </div>
        <Typography>
                <pre>{JSON.stringify(newUsers, null, 2)}</pre>
            </Typography>
        </>
    );
};

export default ExcelManager;
