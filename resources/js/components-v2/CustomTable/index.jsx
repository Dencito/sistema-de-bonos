import { Table } from "antd";

export function CustomTable({
    dataSource,
    columns,
    loading = false,
    pagination = true,
    rowKey = "id",
    onRowClick,
    scroll,
    ...rest
}) {
    return (
        <Table
            dataSource={dataSource}
            columns={columns}
            loading={loading}
            pagination={pagination}
            rowKey={rowKey}
            onRow={
                onRowClick
                    ? (record) => ({
                          onClick: () => onRowClick(record),
                      })
                    : undefined
            }
            scroll={scroll}
            {...rest}
        />
    );
}
