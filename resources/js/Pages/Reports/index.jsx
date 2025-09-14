import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import { ChevronDown, Download, Filter, Printer } from 'lucide-react';

export default function Reports({ auth, branches, shifts, roles, filters }) {
    const [reportType, setReportType] = useState(filters.type || 'all');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [shiftId, setShiftId] = useState(filters.shift_id || '');
    const [startDate, setStartDate] = useState(filters.start_date ? new Date(filters.start_date) : null);
    const [endDate, setEndDate] = useState(filters.end_date ? new Date(filters.end_date) : null);
    const [userIdentifier, setUserIdentifier] = useState(filters.user_identifier || ''); // For RUT or code filtering
    const [roleId, setRoleId] = useState(filters.role_id || ''); // For role filtering (5=worker, 6=player)
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('players'); // players, shift, fingerprint

    // Function to generate player reports
    const generatePlayersReport = async () => {
        setLoading(true);
        try {
            const params = { 
                type: reportType
            };

            if (reportType === 'branch' && branchId) {
                params.branch_id = branchId;
            }

            if (reportType === 'shift' && shiftId) {
                params.shift_id = shiftId;
            }

            // Include date range parameters if available
            if (startDate && endDate) {
                params.start_date = format(startDate, 'yyyy-MM-dd');
                params.end_date = format(endDate, 'yyyy-MM-dd');
            }

            if (userIdentifier) {
                params.user_identifier = userIdentifier;
            }

            const response = await axios.get('/api/reports/players', { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error al generar el reporte. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Function to generate shift report
    const generateShiftReport = async (id) => {
        setLoading(true);
        try {
            const params = {};

            if (userIdentifier) {
                params.user_identifier = userIdentifier;
            }

            const response = await axios.get(`/api/reports/shift/${id}`, { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error generating shift report:', error);
            alert('Error al generar el reporte de turno. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };
    
    // Function to generate fingerprint logs report
    const generateFingerprintReport = async () => {
        setLoading(true);
        try {
            const params = {};
            
            // Add date filters if selected
            if (startDate && endDate) {
                params.start_date = format(startDate, 'yyyy-MM-dd');
                params.end_date = format(endDate, 'yyyy-MM-dd');
            }
            
            // Add role filter if selected (5 = worker, 6 = player)
            if (roleId) {
                params.role_id = roleId;
            }
            
            // Add branch filter if selected
            if (branchId) {
                params.branch_id = branchId;
            }
            
            // Add shift filter if selected
            if (shiftId) {
                params.shift_id = shiftId;
            }
            
            // Add user identifier if provided
            if (userIdentifier) {
                params.user_identifier = userIdentifier;
            }
            
            const response = await axios.get('/api/reports/fingerprint-logs', { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error generating fingerprint logs report:', error);
            alert('Error al generar el reporte de registros de huella. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Function to generate marcaciones report
    const generateMarcacionesReport = async () => {
        setLoading(true);
        try {
            const params = {};
            
            // Add date filters if selected and available
            if (!shiftId && startDate && endDate) {
                params.start_date = format(startDate, 'yyyy-MM-dd');
                params.end_date = format(endDate, 'yyyy-MM-dd');
            }
            
            // Add role filter if selected (5 = worker, 6 = player)
            if (roleId) {
                params.role_id = roleId;
            }
            
            // Add shift filter if selected
            if (shiftId) {
                params.shift_id = shiftId;
            }
            
            // Add user identifier if provided
            if (userIdentifier) {
                params.user_identifier = userIdentifier;
            }
            
            const response = await axios.get('/api/reports/fingerprint-logs', { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error generating marcaciones report:', error);
            alert('Error al generar el reporte de marcaciones. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (activeTab === 'players') {
            generatePlayersReport();
        } else if (activeTab === 'shift' && shiftId) {
            generateShiftReport(shiftId);
        } else if (activeTab === 'fingerprint') {
            generateFingerprintReport();
        } else if (activeTab === 'marcaciones') {
            generateMarcacionesReport();
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!reportData) return;

        let csvContent = '';
        let filename = '';

        if (activeTab === 'players') {
            // Headers
            csvContent = 'Jugador,Tipo,Sucursal,Fecha/Hora,Tipo Ticket,Valor\n';

            // Data rows - only include logs with tickets
            reportData.logs
                .filter(log => log.ticket)
                .forEach(log => {
                    const row = [
                        `${log.user.first_name || ''} ${log.user.second_name || ''} ${log.user.first_last_name || ''} ${log.user.second_last_name || ''}`,
                        log.is_player ? 'Jugador' : 'Trabajador',
                        log.totem?.branch?.name || 'N/A',
                        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
                        log.ticket.type,
                        Math.floor(log.ticket.total_amount)
                    ];
                    csvContent += row.join(',') + '\n';
                });

            filename = `reporte_tickets_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        } else if (activeTab === 'shift') {
            // Headers
            csvContent = 'Jugador,Tipo,Fecha/Hora,Ticket,Tipo Ticket,Valor\n';

            // Data rows
            reportData.logs.forEach(log => {
                const row = [
                    `${log.user.first_name || ''} ${log.user.second_name || ''} ${log.user.first_last_name || ''} ${log.user.second_last_name || ''}`,
                    log.is_player ? 'Jugador' : 'Trabajador',
                    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
                    log.ticket ? 'Sí' : 'No',
                    log.ticket ? log.ticket.type : 'N/A',
                    log.ticket ? Math.floor(log.ticket.total_amount) : '0'
                ];
                csvContent += row.join(',') + '\n';
            });

            // Add summary
            csvContent += '\nResumen\n';
            csvContent += `Total Marcaciones,${reportData.summary.total_marks}\n`;
            csvContent += `Marcaciones Jugadores,${reportData.summary.player_marks}\n`;
            csvContent += `Marcaciones Trabajadores,${reportData.summary.worker_marks}\n`;
            csvContent += `Tickets Generados,${reportData.summary.tickets_count}\n`;
            csvContent += `Total Monto,$${Math.floor(reportData.summary.total_amount)}\n`;

            // Add ticket types summary
            csvContent += '\nTipo de Ticket,Cantidad,Monto\n';
            Object.entries(reportData.summary.ticket_types).forEach(([type, data]) => {
                csvContent += `${type},${data.count},$${Math.floor(data.amount)}\n`;
            });

            filename = `reporte_turno_${reportData.shift.id}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        } else if (activeTab === 'fingerprint' || activeTab === 'marcaciones') {
            // Headers
            csvContent = 'Usuario,Tipo,Sucursal,Fecha/Hora\n';

            // Data rows
            reportData.logs.forEach(log => {
                const row = [
                    `${log.user?.first_name || ''} ${log.user?.second_name || ''} ${log.user?.first_last_name || ''} ${log.user?.second_last_name || ''}` || 'N/A',
                    log.is_worker ? 'Trabajador' : (log.is_player ? 'Jugador' : 'N/A'),
                    log.totem?.branch?.name || 'N/A',
                    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')
                ];
                csvContent += row.join(',') + '\n';
            });

            // Add summary
            csvContent += '\nResumen\n';
            csvContent += `Total Registros,${reportData.summary.total_logs}\n`;
            csvContent += `Registros Jugadores,${reportData.summary.player_logs}\n`;
            csvContent += `Registros Trabajadores,${reportData.summary.worker_logs}\n`;

            // Add branch summary
            csvContent += '\nResumen por Sucursal\n';
            csvContent += 'Sucursal,Total,Trabajadores,Jugadores\n';
            Object.entries(reportData.summary.by_branch).forEach(([branchName, data]) => {
                csvContent += `${branchName},${data.total},${data.workers},${data.players}\n`;
            });

            const reportType = activeTab === 'fingerprint' ? 'huellas' : 'marcaciones';
            filename = `reporte_${reportType}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        }

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print report
    const printReport = () => {
        window.print();
    };

    // Render filters for marcaciones report
    const renderMarcacionesFilters = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                        value={shiftId}
                        onChange={(e) => {
                            const selectedShiftId = e.target.value;
                            setShiftId(selectedShiftId);
                            
                            // Auto-populate dates when a shift is selected
                            if (selectedShiftId) {
                                const selectedShift = shifts.find(shift => shift.id.toString() === selectedShiftId);
                                if (selectedShift) {
                                    setStartDate(new Date(selectedShift.opening_time));
                                    setEndDate(selectedShift.closing_time ? new Date(selectedShift.closing_time) : new Date());
                                }
                            } else {
                                // Clear dates when no shift is selected
                                setStartDate(null);
                                setEndDate(null);
                            }
                        }}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Seleccione turno</option>
                        {shifts.map((shift) => (
                            <option key={shift.id} value={shift.id}>
                                Turno #{shift.id} - {shift.branch.name} - {format(new Date(shift.opening_time), 'dd/MM/yyyy HH:mm:ss')} - {shift.closing_time ? format(new Date(shift.closing_time), 'dd/MM/yyyy HH:mm:ss') : 'En curso'}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Al seleccionar un turno, se ignorarán los filtros de fecha</p>
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={shiftId !== ''}
                    />
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={shiftId !== ''}
                    />
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                    <select
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todos los usuarios</option>
                        <option value="5">Trabajadores</option>
                        <option value="6">Jugadores</option>
                    </select>
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT/Código</label>
                    <input
                        type="text"
                        value={userIdentifier}
                        onChange={(e) => setUserIdentifier(e.target.value)}
                        placeholder="Buscar por RUT o código"
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        );
    };
    
    // Render filters for fingerprint logs report
    const renderFingerprintFilters = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        disabled={shiftId !== ''}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        disabled={shiftId !== ''}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                    <select
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todos los usuarios</option>
                        <option value="5">Trabajadores</option>
                        <option value="6">Jugadores</option>
                    </select>
                </div>
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todas las sucursales</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                        value={shiftId}
                        onChange={(e) => {
                            const selectedShiftId = e.target.value;
                            setShiftId(selectedShiftId);
                            
                            // Auto-populate dates when a shift is selected
                            if (selectedShiftId) {
                                const selectedShift = shifts.find(shift => shift.id.toString() === selectedShiftId);
                                if (selectedShift) {
                                    setStartDate(new Date(selectedShift.opening_time));
                                    setEndDate(selectedShift.closing_time ? new Date(selectedShift.closing_time) : new Date());
                                }
                            } else {
                                // Clear dates when no shift is selected
                                setStartDate(null);
                                setEndDate(null);
                            }
                        }}
                        className="w-full pr-5 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todos los turnos</option>
                        {shifts.map((shift) => (
                            <option key={shift.id} value={shift.id}>
                                Turno #{shift.id} - {shift.branch.name} - {format(new Date(shift.opening_time), 'dd/MM/yyyy HH:mm:ss')} - {shift.closing_time ? format(new Date(shift.closing_time), 'dd/MM/yyyy HH:mm:ss') : 'En curso'}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT/Código</label>
                    <input
                        type="text"
                        value={userIdentifier}
                        onChange={(e) => setUserIdentifier(e.target.value)}
                        placeholder="Buscar por RUT o código"
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        );
    };
    
    // Render filters for players report
    const renderPlayersFilters = () => {
        return (
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reporte</label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">Todos los jugadores</option>
                        <option value="branch">Por sucursal</option>
                        <option value="shift">Por turno</option>
                        <option value="date">Por jornada</option>
                        <option value="top">Top jugadores con más marcaciones</option>
                    </select>
                </div>

                {reportType === 'branch' && (
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Seleccionar sucursal</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {reportType === 'shift' && (
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                        <select
                            value={shiftId}
                            onChange={(e) => setShiftId(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Seleccionar turno</option>
                            {shifts.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                    Turno #{shift.id} - {shift.branch.name} - {format(new Date(shift.opening_time), 'dd/MM/yyyy HH:mm:ss')} - {shift.closing_time ? format(new Date(shift.closing_time), 'dd/MM/yyyy HH:mm:ss') : 'En curso'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date range filter for all report types */}
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                        type="date"
                        value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input
                        type="date"
                        value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT/Código</label>
                    <input
                        type="text"
                        value={userIdentifier}
                        onChange={(e) => setUserIdentifier(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        );
    };

    // Render filters for shift report
    const renderShiftFilters = () => {
        return (
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                        className="w-full pr-5 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Seleccionar turno</option>
                        {shifts.map((shift) => (
                            <option key={shift.id} value={shift.id}>
                                Turno #{shift.id} - {shift.branch.name} - {format(new Date(shift.opening_time), 'dd/MM/yyyy HH:mm:ss')} - {shift.closing_time ? format(new Date(shift.closing_time), 'dd/MM/yyyy HH:mm:ss') : 'En curso'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT/Código</label>
                    <input
                        type="text"
                        value={userIdentifier}
                        onChange={(e) => setUserIdentifier(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Filtrar por RUT o código"
                    />
                </div>
            </div>
        );
    };

    // Render players report
    const renderPlayersReport = () => {
        if (!reportData) return null;

        return (
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-semibold">Reporte de Tickets Generados</h3>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            <Download size={16} className="mr-1" /> Exportar CSV
                        </button>
                        <button
                            onClick={printReport}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Printer size={16} className="mr-1" /> Imprimir
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Total tickets</p>
                                <p className="text-2xl font-bold">{reportData.summary.tickets_count}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Tickets jugadores</p>
                                <p className="text-2xl font-bold">
                                    {reportData.logs.filter(log => log.is_player && log.ticket).length}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Tickets trabajadores</p>
                                <p className="text-2xl font-bold">
                                    {reportData.logs.filter(log => !log.is_player && log.ticket).length}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Total en bonos</p>
                                <p className="text-2xl font-bold">${Math.floor(reportData.summary.total_amount)}</p>
                            </div>
                        </div>

                        {reportData.summary.ticket_types && Object.keys(reportData.summary.ticket_types).length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-md font-semibold mb-3">Desglose por tipo de ticket</h4>
                                <div className="space-y-2">
                                    {Object.entries(reportData.summary.ticket_types).map(([type, data]) => (
                                        <div key={type} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{type}</span>
                                            <span className="text-gray-600">{data.count} tickets - ${data.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {reportType === 'top' && reportData.top_players ? (
                        <div className="overflow-x-auto">
                            <h3 className="text-lg font-semibold mb-4">Top Jugadores</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jugador
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sucursal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Categoría
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Tickets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Bonos
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.top_players.map((player, index) => (
                                        <tr key={`${player.user.id}-${index}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {player.user.first_name + ' ' + player.user.second_name + ' ' + player.user.first_last_name + ' ' + player.user.second_last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {player.branch?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {player.user.categoryBonus?.name || 'Sin categoría'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {player.ticket_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                ${Math.floor(player.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <h3 className="text-lg font-semibold mb-4">Detalle de Tickets</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sucursal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha/Hora
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo Ticket
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Valor
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.logs
                                        .filter(log => log.ticket) // Only show logs with tickets
                                        .map((log) => (
                                            <tr
                                                key={log.id}
                                                className={log.is_player ? 'bg-green-50' : 'bg-purple-50'}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.user?.username ?? (log.user?.first_name + ' ' + log.user?.first_last_name)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.is_player ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Jugador
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Trabajador
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.totem?.branch?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium">{log.ticket.type}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium">${Math.floor(log.ticket.total_amount)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render marcaciones report
    const renderMarcacionesReport = () => {
        if (!reportData) return null;
        
        return (
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Reporte por Marcaciones</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={exportToCSV}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Exportar CSV
                            </button>
                            <button
                                onClick={printReport}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Resumen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Marcaciones</p>
                            <p className="text-2xl font-bold">{reportData.summary.total_logs}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Marcaciones Jugadores</p>
                            <p className="text-2xl font-bold">{reportData.summary.player_logs}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">Marcaciones Trabajadores</p>
                            <p className="text-2xl font-bold">{reportData.summary.worker_logs}</p>
                        </div>
                    </div>
                    
                    {/* Branch Summary */}
                    {Object.keys(reportData.summary.by_branch).length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">Resumen por Sucursal</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sucursal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trabajadores
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jugadores
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.entries(reportData.summary.by_branch).map(([branchName, data], index) => (
                                            <tr key={`branch-${index}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {branchName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.total}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.workers}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.players}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Detailed Logs */}
                <div className="p-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Detalle de Marcaciones</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sucursal
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha y Hora
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className={log.is_player ? 'bg-blue-50' : (log.is_worker ? 'bg-purple-50' : 'bg-gray-50')}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.user?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.is_worker ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Trabajador
                                                </span>
                                            ) : log.is_player ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Jugador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Desconocido
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.totem?.branch?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };
    
    // Render fingerprint logs report
    const renderFingerprintReport = () => {
        if (!reportData) return null;
        
        return (
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Reporte de Registros de Huella</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={exportToCSV}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Exportar CSV
                            </button>
                            <button
                                onClick={printReport}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Resumen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Registros</p>
                            <p className="text-2xl font-bold">{reportData.summary.total_logs}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Registros Jugadores</p>
                            <p className="text-2xl font-bold">{reportData.summary.player_logs}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">Registros Trabajadores</p>
                            <p className="text-2xl font-bold">{reportData.summary.worker_logs}</p>
                        </div>
                    </div>
                    
                    {/* Branch Summary */}
                    {Object.keys(reportData.summary.by_branch).length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">Resumen por Sucursal</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sucursal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trabajadores
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jugadores
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.entries(reportData.summary.by_branch).map(([branchName, data], index) => (
                                            <tr key={`branch-${index}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {branchName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.total}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.workers}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {data.players}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Detailed Logs */}
                <div className="p-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Registros Detallados</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sucursal
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha y Hora
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className={log.is_player ? 'bg-blue-50' : (log.is_worker ? 'bg-purple-50' : 'bg-gray-50')}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.user?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.is_worker ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Trabajador
                                                </span>
                                            ) : log.is_player ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Jugador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Desconocido
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.totem?.branch?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };
    
    // Render shift report
    const renderShiftReport = () => {
        if (!reportData) return null;

        const shift = reportData.shift;

        return (
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-semibold">Reporte de Turno #{shift?.id}</h3>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            <Download size={16} className="mr-1" /> Exportar CSV
                        </button>
                        <button
                            onClick={printReport}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Printer size={16} className="mr-1" /> Imprimir
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Información del Turno</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Sucursal</p>
                                <p className="text-lg font-medium">{shift?.branch?.name}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Abierto por</p>
                                <p className="text-lg font-medium">{shift?.openedBy?.username}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Fecha/Hora apertura</p>
                                <p className="text-lg font-medium">{format(new Date(shift?.opening_time), 'dd/MM/yyyy HH:mm:ss')}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Fecha/Hora cierre</p>
                                <p className="text-lg font-medium">
                                    {shift?.closing_time
                                        ? format(new Date(shift?.closing_time), 'dd/MM/yyyy HH:mm:ss')
                                        : 'Turno activo'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Resumen del Turno</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Total marcaciones</p>
                                <p className="text-2xl font-bold">{reportData.summary.total_marks}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Marcaciones jugadores</p>
                                <p className="text-2xl font-bold">{reportData.summary.player_marks}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Marcaciones trabajadores</p>
                                <p className="text-2xl font-bold">{reportData.summary.worker_marks}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Tickets generados</p>
                                <p className="text-2xl font-bold">{reportData.summary.tickets_count}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Total en bonos</p>
                                <p className="text-2xl font-bold">${Math.floor(reportData.summary.total_amount)}</p>
                            </div>
                        </div>

                        {reportData.summary.ticket_types && Object.keys(reportData.summary.ticket_types).length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-md font-semibold mb-3">Desglose por tipo de ticket</h4>
                                <div className="space-y-2">
                                    {Object.entries(reportData.summary.ticket_types).map(([type, data]) => (
                                        <div key={type} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{type}</span>
                                            <span className="text-gray-600">{data.count} tickets - ${data.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <h3 className="text-lg font-semibold mb-4">Detalle de Marcaciones</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha/Hora
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ticket
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo Ticket
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className={
                                            log.is_player
                                                ? (log.ticket ? 'bg-green-50' : 'bg-yellow-50')
                                                : 'bg-gray-50'
                                        }
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.user?.username ?? (log.user?.first_name + ' ' + log.user?.first_last_name)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.is_player ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Jugador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Trabajador
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.ticket ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Generado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    No generado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.ticket ? (
                                                <span className="font-medium">{log.ticket.type}</span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Tabs */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="flex border-b">
                            <button
                                className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'players'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveTab('players');
                                    setReportData(null); // Clear report data when changing tabs
                                }}
                            >
                                Reporte de Jugadores
                            </button>
                            <button
                                className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'shift'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveTab('shift');
                                    setReportData(null); // Clear report data when changing tabs
                                }}
                            >
                                Reporte de Turno
                            </button>
                            <button
                                className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'fingerprint'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveTab('fingerprint');
                                    setReportData(null); // Clear report data when changing tabs
                                }}
                            >
                                Registro de Huella
                            </button>
                            <button
                                className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'marcaciones'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveTab('marcaciones');
                                    setReportData(null); // Clear report data when changing tabs
                                }}
                            >
                                Reporte por Marcaciones
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                {activeTab === 'players' && renderPlayersFilters()}
                                {activeTab === 'shift' && renderShiftFilters()}
                                {activeTab === 'fingerprint' && renderFingerprintFilters()}
                                {activeTab === 'marcaciones' && renderMarcacionesFilters()}

                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`px-4 py-2 text-white rounded-lg ${loading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {loading ? 'Generando...' : 'Generar reporte'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Report Results */}
                    {reportData && (
                        <>
                            {activeTab === 'players' && renderPlayersReport()}
                            {activeTab === 'shift' && renderShiftReport()}
                            {activeTab === 'fingerprint' && renderFingerprintReport()}
                            {activeTab === 'marcaciones' && renderMarcacionesReport()}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
