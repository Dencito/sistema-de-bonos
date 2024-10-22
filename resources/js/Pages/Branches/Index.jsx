import FilterModal from '@/Components/Branches/FilterModal';
import ModalCreateBranch from '@/Components/Branches/ModalCreateBranch';
import ModalDeleteBranch from '@/Components/Branches/ModalDeleteBranch';
import ModalEditBranch from '@/Components/Branches/ModalEditBranch';
import ModalViewBranch from '@/Components/Branches/ModalViewBranch';
import { TableDataBranches } from '@/Components/Branches/TableDataBranches';
import ModalCreateCompany from '@/Components/Companies/ModalCreateCompany';
import { MobileButton } from '@/Components/MobileButton';
import useBranchValidateSchedules from '@/Hooks/useBranchValidateSchedules';
import useCompanySelection from '@/Hooks/useCompanySelection';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Breadcrumb, Button, Input, Select, Spin, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
const { Column, ColumnGroup, } = Table;

const index = ({ auth, branches, states, companies, filters, alert }) => {
  const { companySelect, loading, changeCompany } = useCompanySelection();
  const canLogin = useBranchValidateSchedules(auth?.branch?.shifts);
  /* if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Head title="Sucursales" />
        <Spin size="large" />
      </div>
    );
  } */

  /* if (!canLogin && (auth?.role !== "Dueño" && auth?.role !== "Super Admin" && auth?.role !== "Admin")) {
    return <div className="flex justify-center items-center min-h-screen">
      <Head title="Sucursales" />
      <h1 className='text-3xl font-bold'>Usted esta fuera de su horario laboral</h1>
    </div>
  } */

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
    >
      <Head title="Sucursales" />
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className='text-4xl font-bold'>
          Sucursales
        </h1>
      </header>
      <div className='flex-1 overflow-auto p-4 z-10'>
        <div className="w-full">
            <TableDataBranches filters={filters} auth={auth} branches={branches} states={states} companies={companies} />
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

export default index

