import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Select, Card, Statistic, Table } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  MinusCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import MobileButton from '@/Components/MobileButton';

export default function SalesTotalPage({ auth, salesData, branches, userHasBranch }) {
  const [selectedBranch, setSelectedBranch] = useState('');

  const handleBranchChange = (value) => {
    setSelectedBranch(value);
    router.get(route('sales-total.index'), value ? { branch_id: value } : {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const withdrawalColumns = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleString('es-CL'),
    },
    {
      title: 'Usuario',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${new Intl.NumberFormat('en-US').format(Math.trunc(amount))}`,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '-',
    },
  ];

  return (
    <AuthenticatedLayout
      user={auth.user}
      role={auth.role}
      auth={auth}
      header={
        <h2 className="z-10 text-xl font-semibold leading-tight text-gray-800">Total de Ventas</h2>
      }
    >
      <Head title="Total de Ventas" />

      <header className="flex items-center justify-between gap-3 p-4 bg-white shadow-sm">
        <MobileButton role={auth.role} roles={auth.roles} />
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl lg:text-4xl">Total de Ventas</h1>
        <div className="w-16"></div>
      </header>

      <div className="overflow-auto z-10 flex-1 p-4">
        <div className="w-full">
          {!userHasBranch && branches && branches.length > 0 && (
            <div className="mb-4">
              <Select
                className="w-64"
                placeholder="Seleccionar sucursal"
                value={selectedBranch || undefined}
                onChange={handleBranchChange}
                allowClear
              >
                {branches.map((branch) => (
                  <Select.Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          {salesData ? (
            <>
              <div className="mb-6">
                <h2 className="mb-4 text-2xl font-bold">{salesData.branch_name}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <Statistic
                      title="Total de Ventas"
                      value={salesData.total_sales}
                      prefix={<ShoppingOutlined />}
                      suffix="$"
                      valueStyle={{ color: '#3f8600' }}
                      formatter={(value) =>
                        new Intl.NumberFormat('en-US').format(Math.trunc(value))
                      }
                    />
                  </Card>

                  <Card>
                    <Statistic
                      title="Acumulador Actual"
                      value={salesData.sales_accumulator}
                      prefix={<WalletOutlined />}
                      suffix="$"
                      valueStyle={{ color: '#1890ff' }}
                      formatter={(value) =>
                        new Intl.NumberFormat('en-US').format(Math.trunc(value))
                      }
                    />
                  </Card>

                  <Card>
                    <Statistic
                      title="Total Retiros"
                      value={salesData.total_withdrawals}
                      prefix={<MinusCircleOutlined />}
                      suffix="$"
                      valueStyle={{ color: '#cf1322' }}
                      formatter={(value) =>
                        new Intl.NumberFormat('en-US').format(Math.trunc(value))
                      }
                    />
                  </Card>

                  <Card>
                    <Statistic
                      title="Neto (Ventas - Retiros)"
                      value={salesData.net_total}
                      prefix={<DollarOutlined />}
                      suffix="$"
                      valueStyle={{ color: salesData.net_total >= 0 ? '#3f8600' : '#cf1322' }}
                      formatter={(value) =>
                        new Intl.NumberFormat('en-US').format(Math.trunc(value))
                      }
                    />
                  </Card>
                </div>
              </div>

              {salesData.withdrawals && salesData.withdrawals.length > 0 && (
                <div className="p-4 bg-white shadow-sm sm:rounded-lg">
                  <h3 className="mb-4 text-xl font-bold">Historial de Retiros</h3>
                  <Table
                    dataSource={salesData.withdrawals.map((withdrawal, index) => ({
                      ...withdrawal,
                      key: index,
                    }))}
                    columns={withdrawalColumns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: true }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center bg-white shadow-sm sm:rounded-lg">
              <p className="text-lg text-gray-500">
                {userHasBranch
                  ? 'No se encontraron datos para tu sucursal'
                  : 'Selecciona una sucursal para ver los datos de ventas'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
