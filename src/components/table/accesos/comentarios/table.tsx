/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AccesosComentarioColumns,
} from "./accesos-comentarios-columns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentPassModal } from "@/components/modals/comment-pass-modal";

interface TableProps {
  allComments?: any[] | undefined
}

export const ComentariosAccesosTable: React.FC<TableProps> = ({ allComments }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: allComments || [],
    columns: AccesosComentarioColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Encabezado del Widget */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-md shadow-sm border border-gray-100">
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-700 tracking-tight">Comentarios</h2>
        </div>

        <CommentPassModal title="Comentario al pase">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-100/50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Añadir
          </Button>
        </CommentPassModal>
      </div>

      {/* Contenedor de la Tabla Scrollable */}
      <div className="flex-1 min-h-[200px] overflow-hidden bg-white">
        <ScrollArea className="h-full w-full max-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-gray-100">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="h-8 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
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
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group transition-colors hover:bg-gray-50/50 border-b border-gray-50 last:border-none"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5 px-4 text-sm text-gray-700 font-medium">
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
                    colSpan={AccesosComentarioColumns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <p className="text-xs">Aún no hay comentarios</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}