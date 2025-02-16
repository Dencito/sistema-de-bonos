import React from 'react';
import ModalCreateBranch from './ModalCreateBranch';
import { Table } from 'antd';
import ModalViewBranch from './ModalViewBranch';
import ModalEditBranch from './ModalEditBranch';
import ModalDeleteBranch from './ModalDeleteBranch';
import { formatDate } from '@utils/date';
import FilterModal from './FilterModal';
import ModalRequestMoreBranches from './ModalRequestMoreBranches';

const { Column } = Table;

export const TableDataBranches = ({
    auth,
    branches,
    statuses,
    companies,
    filters,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Sucursales</h2>
                    <div className="flex items-center space-x-4">
                        <FilterModal filters={filters} statuses={statuses} />
                        {branches?.length < auth?.create_more_branches?.max_branches ? (
                            <ModalCreateBranch companies={companies} />
                        ) : (
                            <ModalRequestMoreBranches />
                        )}
                    </div>
                </div>
            </div>
            
            <Table
                dataSource={branches.map((branch) => ({
                    ...branch,
                    key: branch.id,
                }))}
                className="custom-table"
                pagination={{
                    className: "px-6 py-4",
                    showTotal: (total) => `Total ${total} items`,
                }}
            >
                <Column 
                    title={<span className="text-gray-600 font-medium">Nombre</span>} 
                    dataIndex="name" 
                    key="id"
                    render={(text) => (
                        <span className="text-gray-800 font-medium">{text}</span>
                    )}
                />
                <Column
                    title={<span className="text-gray-600 font-medium">Empleados</span>}
                    key="employs"
                    render={(_, branch) => (
                        <div className="flex items-center">
                            <span className="text-gray-800">{branch.numberOfEmployees}</span>
                        </div>
                    )}
                />
                <Column
                    title={<span className="text-gray-600 font-medium">Fecha de creación</span>}
                    key="creationDate"
                    render={(_, branch) => (
                        <span className="text-gray-800">{formatDate(branch.created_at)}</span>
                    )}
                />
                <Column
                    title={<span className="text-gray-600 font-medium">Estado</span>}
                    key="status"
                    render={(_, branch) => {
                        const statusColors = {
                            'Activo': 'bg-emerald-100 text-emerald-700',
                            'Inactivo': 'bg-red-100 text-red-700',
                            'En revisión': 'bg-amber-100 text-amber-700',
                            'Borrado': 'bg-red-100 text-red-700'
                        };
                        
                        return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[branch?.status?.name]}`}>
                                {branch?.status?.name}
                            </span>
                        );
                    }}
                />
                <Column
                    title={<span className="text-gray-600 font-medium">Acciones</span>}
                    key="actions"
                    render={(_, branch) => (
                        <div className="flex items-center space-x-3">
                            <ModalViewBranch
                                data={branch}
                                statuses={statuses}
                                companies={companies}
                                className="text-cyan-600 hover:text-cyan-700"
                            />
                            <ModalEditBranch
                                data={branch}
                                statuses={statuses}
                                companies={companies}
                                className="text-blue-600 hover:text-blue-700"
                            />
                            <ModalDeleteBranch 
                                data={branch} 
                                className="text-red-600 hover:text-red-700"
                            />
                        </div>
                    )}
                />
            </Table>
            
            <style jsx global>{`
                .custom-table .ant-table {
                    background: transparent;
                }
                .custom-table .ant-table-thead > tr > th {
                    background: transparent;
                    border-bottom: 2px solid #E5E7EB;
                    padding: 12px 24px;
                }
                .custom-table .ant-table-tbody > tr > td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #E5E7EB;
                }
                .custom-table .ant-table-tbody > tr:hover > td {
                    background: #F9FAFB;
                }
                .custom-table .ant-pagination-item {
                    border-radius: 6px;
                }
                .custom-table .ant-pagination-item-active {
                    border-color: #06B6D4;
                }
                .custom-table .ant-pagination-item-active a {
                    color: #06B6D4;
                }
            `}</style>
        </div>
    );
};
