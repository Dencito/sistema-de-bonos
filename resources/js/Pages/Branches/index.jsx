import { TableDataBranches } from '@/Components/Branches/TableDataBranches';
import MobileButton from '@/Components/MobileButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function BranchPage({ auth, branches, statuses, companies, filters }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Panel</h2>}
    >
      <Head title="Sucursales" />
      <header className="flex items-center justify-between gap-3 p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl lg:text-4xl">Sucursales</h1>
      </header>
      <div className="flex-1 overflow-auto p-4 z-10">
        <div className="w-full">
          <TableDataBranches
            filters={filters}
            auth={auth}
            branches={branches}
            statuses={statuses}
            companies={companies}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
