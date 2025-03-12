'use client';

import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import cn from 'classnames';

export function DataTable({
    columns,
    data,
    className,
    rowKeyField = 'id',
    ...props
}) {
    const table = useReactTable({
        data,
        columns,
        getPaginationRowModel: getPaginationRowModel(),
        getCoreRowModel: getCoreRowModel(),
    });

    const getRowKey = (row) => {
        const id = row.original[rowKeyField];
        return id ? `row_${id}` : `row_${row.index}_${Date.now()}`;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={`header_${headerGroup.id}`}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={`head_${header.id}`}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={getRowKey(row)}
                                data-state={row.getIsSelected() && 'selected'}
                                className={cn(
                                    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                                    className
                                )}
                                {...props}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={`cell_${cell.id}`}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
