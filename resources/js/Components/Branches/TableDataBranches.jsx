import React, { useState } from 'react';
import ModalCreateBranch from './ModalCreateBranch';
import { Table, Switch, message } from 'antd';
import ModalViewBranch from './ModalViewBranch';
import ModalEditBranch from './ModalEditBranch';
import ModalDeleteBranch from './ModalDeleteBranch';
import ModalSetInitialCash from './ModalSetInitialCash';
import { formatDate } from '@utils/date';
import FilterModal from './FilterModal';
import ModalRequestMoreBranches from './ModalRequestMoreBranches';
import { CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { branchService } from '@services/api';

const { Column } = Table;

const getStatusBadge = (statusName) => {
  const statusConfig = {
    Activo: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    Inactivo: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    'En revisión': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
    Borrado: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Trash2 },
  };

  const config = statusConfig[statusName] || statusConfig['Inactivo'];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {statusName}
    </span>
  );
};

export const TableDataBranches = ({ auth, branches, statuses, companies, filters }) => {
  const [loadingToggle, setLoadingToggle] = useState({});

  const handleToggleTickets = async (branchId, checked) => {
    setLoadingToggle((prev) => ({ ...prev, [branchId]: true }));
    try {
      const response = await branchService.toggleTicketsEnabled(branchId, checked);
      if (response.success) {
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    } catch {
      message.error('Error al actualizar la configuracion de tickets');
    } finally {
      setLoadingToggle((prev) => ({ ...prev, [branchId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <FilterModal filters={filters} statuses={statuses} />
          {branches?.length < auth?.create_more_branches?.max_branches ? (
            <ModalCreateBranch companies={companies} />
          ) : (
            <ModalRequestMoreBranches />
          )}
        </div>
      </div>
      <Table
        className="overflow-auto"
        dataSource={branches.map((branch) => ({
          ...branch,
          key: branch.id,
        }))}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} registros`,
        }}
        rowClassName="hover:bg-gray-50 transition-colors"
      >
        <Column title="Nombre" dataIndex="name" key="id" className="font-medium text-gray-900" />
        <Column
          title="Empleados"
          key="employs"
          render={(_, branch) => (
            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
              {branch.numberOfEmployees}
            </span>
          )}
        />
        <Column
          title="Fecha de creación"
          key="creationDate"
          render={(_, branch) => (
            <span className="text-gray-600 text-sm">{formatDate(branch.created_at)}</span>
          )}
        />
        <Column
          title="Bono cumpleaños"
          key="birthday_amount"
          render={(_, branch) => (
            <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-sm font-medium">
              ${branch.birthday_amount || 0}
            </span>
          )}
        />
        <Column
          title="Estado"
          key="status"
          render={(_, branch) => getStatusBadge(branch?.status?.name)}
        />
        <Column
          title="Tickets"
          key="tickets_enabled"
          render={(_, branch) => (
            <Switch
              checkedChildren="Si"
              unCheckedChildren="No"
              checked={branch.tickets_enabled !== false}
              loading={loadingToggle[branch.id]}
              onChange={(checked) => handleToggleTickets(branch.id, checked)}
            />
          )}
        />
        <Column
          title="Acciones"
          key="actions"
          render={(_, branch) => (
            <div className="flex items-center gap-2">
              <ModalSetInitialCash key={`cash_${branch.id}`} branch={branch} />
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
              <ModalDeleteBranch key={`delete_${branch.id}`} data={branch} />
            </div>
          )}
        />
      </Table>
    </div>
  );
};
