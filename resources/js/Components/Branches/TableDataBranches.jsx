import React from 'react'
import ModalCreateBranch from './ModalCreateBranch';
import { Table } from 'antd';
import ModalViewBranch from './ModalViewBranch';
import ModalEditBranch from './ModalEditBranch';
import ModalDeleteBranch from './ModalDeleteBranch';
import moment from 'moment';
import FilterModal from './FilterModal';
import ModalRequestMoreBranches from './ModalRequestMoreBranches';

const { Column, ColumnGroup, } = Table;

export const TableDataBranches = ({ auth, branches, states, companies, filters }) => {
    console.log(auth?.create_more_branches?.max_branches)
    return (
        <div className="bg-white shadow-sm sm:rounded-lg">
            <div className="text-gray-900 my-3">
            </div>
            <div className="text-gray-900 my-3 flex items-center justify-between">
                <FilterModal filters={filters} states={states} />
                {branches?.length < auth?.create_more_branches?.max_branches ? <ModalCreateBranch companies={companies} /> : <ModalRequestMoreBranches />}
            </div>
            <Table className='overflow-auto' dataSource={branches.map(branch => ({ ...branch, key: branch.id }))}>
                <Column title="Nombre" dataIndex="name" key="id" />
                <Column title="Empleados" key="employs" render={(_, branch) => (
                    <p>{branch.numberOfEmployees}</p>
                )} />
                <Column title="Fecha de creación" key="creationDate" render={(_, branch) => (
                    <p>{moment(branch.created_at).format('DD-MM-YYYY')}</p>
                )} />
                <Column title="Estado" key="state" render={(_, branch) => (
                    <div className={`${branch?.state?.name === 'Activo' && 'bg-green-300' ||
                        branch?.state?.name === 'Inactivo' && 'bg-red-200' ||
                        branch?.state?.name === 'En revisión' && 'bg-orange-300' ||
                        branch?.state?.name === 'Borrado' && 'bg-red-400'
                        } font-bold rounded-full text-center p-1 w-6 h-6`}></div>
                )} />
                <Column
                    title="Acciones"
                    key="actions"
                    render={(_, branch) => (
                        <div className='flex flex-wrap gap-3'>
                            <ModalViewBranch data={branch} states={states} companies={companies} />
                            <ModalEditBranch data={branch} states={states} companies={companies} />
                            <ModalDeleteBranch data={branch} />
                        </div>
                    )}
                />
            </Table>
        </div>
    )
}
