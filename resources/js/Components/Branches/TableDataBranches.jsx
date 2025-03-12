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
        <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="text-gray-900 my-3"></div>
            <div className="text-gray-900 my-3 flex items-center justify-between">
                <FilterModal filters={filters} statuses={statuses} />
                {branches?.length < auth?.create_more_branches?.max_branches ? (
                    <ModalCreateBranch companies={companies} />
                ) : (
                    <ModalRequestMoreBranches />
                )}
            </div>
            <Table
                className="overflow-auto"
                dataSource={branches.map((branch) => ({
                    ...branch,
                    key: branch.id,
                }))}
            >
                <Column title="Nombre" dataIndex="name" key="id" />
                <Column
                    title="Empleados"
                    key="employs"
                    render={(_, branch) => <p>{branch.numberOfEmployees}</p>}
                />
                <Column
                    title="Fecha de creación"
                    key="creationDate"
                    render={(_, branch) => (
                        <p>{formatDate(branch.created_at)}</p>
                    )}
                />
                <Column
                    title="Bono por cumpleaños"
                    key="birthday_amount"
                    render={(_, branch) => <p>{branch.birthday_amount}</p>}
                />
                <Column
                    title="Estado"
                    key="status"
                    render={(_, branch) => (
                        <div
                            className={`${
                                (branch?.status?.name === 'Activo' &&
                                    'bg-green-300') ||
                                (branch?.status?.name === 'Inactivo' &&
                                    'bg-red-200') ||
                                (branch?.status?.name === 'En revisión' &&
                                    'bg-orange-300') ||
                                (branch?.status?.name === 'Borrado' &&
                                    'bg-red-400')
                            } font-bold rounded-full text-center p-1 w-6 h-6`}
                        ></div>
                    )}
                />
                <Column
                    title="Acciones"
                    key="actions"
                    render={(_, branch) => (
                        <div className="flex flex-wrap gap-3">
                            <ModalViewBranch
                                key={`view_${branch.id}`}
                                data={branch}
                                statuses={statuses}
                                companies={companies}
                            />
                            <ModalEditBranch
                                key={`edit_${branch.id}`}
                                data={branch}
                                statuses={statuses}
                                companies={companies}
                            />
                            <ModalDeleteBranch
                                key={`delete_${branch.id}`}
                                data={branch}
                            />
                        </div>
                    )}
                />
            </Table>
        </div>
    );
};
