"use client";

import * as React from "react";
import {
  OnChangeFn,
  PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { TableRowSkeletons } from "@/components/common/RecordSkeletons";
import { UserRow } from "@/hooks/Users/useUsers";
import { getUsersColumns } from "./users-columns";

interface Props {
  rows: UserRow[];
  isLoading?: boolean;
  total: number;
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
  selectedId: string | null;
  /** Abre el panel; con edit=true ya en modo edición. */
  onSelect: (id: string, edit?: boolean) => void;
}

// Mismo patrón que components/table/bitacoras/table.tsx: TanStack Table con la
// paginación en el servidor (manualPagination) y DataTablePagination debajo.
export const UsersTable: React.FC<Props> = ({
  rows,
  isLoading,
  total,
  pagination,
  setPagination,
  selectedId,
  onSelect,
}) => {
  const columns = React.useMemo(
    () => getUsersColumns({ onSelect }),
    [onSelect],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: total,
    state: { pagination },
  });

  return (
    <div className="w-full">
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
        <Table className="text-xs">
          <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-none"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === "options" ? "w-1" : ""}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRowSkeletons columns={columns.length} />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    selectedId === row.original.id ? "selected" : undefined
                  }
                  className="hover:bg-slate-100 transition-colors border-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`py-2 px-3 border-r border-slate-100 last:border-r-0 ${cell.column.id === "options" ? "w-1" : ""} font-normal`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <span className="text-xs text-slate-300 font-normal">
                    No se encontraron registros
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} total={total} />
    </div>
  );
};
