"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UbicacionRow, NormalizedUbicacion, normalizeUbicacion } from "@/lib/ubicaciones";
import { getUbicacionesColumns } from "./columns";
import { UbicacionDetallePanel } from "@/components/Ubicaciones/UbicacionDetallePanel";

interface UbicacionesExplorerTableProps {
  ubicaciones: UbicacionRow[];
  isLoading?: boolean;
  searchTags: string[];
  selectedUbicacionId: string | null;
  onSelectedUbicacionIdChange: (id: string | null) => void;
  onEditarUbicacion: (ubicacion: NormalizedUbicacion) => void;
}

export const UbicacionesExplorerTable: React.FC<UbicacionesExplorerTableProps> = ({
  ubicaciones,
  isLoading,
  searchTags,
  selectedUbicacionId,
  onSelectedUbicacionIdChange,
  onEditarUbicacion,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    setGlobalFilter(searchTags && searchTags.length > 0 ? searchTags.join("|") : "");
  }, [searchTags]);

  const normalizedUbicaciones = useMemo(
    () => ubicaciones.map((ubicacion, index) => normalizeUbicacion(ubicacion, index)),
    [ubicaciones],
  );

  const handleVerUbicacion = React.useCallback(
    (ubicacion: NormalizedUbicacion) => onSelectedUbicacionIdChange(ubicacion.recordId),
    [onSelectedUbicacionIdChange],
  );

  const columns = useMemo(
    () => getUbicacionesColumns(handleVerUbicacion, onEditarUbicacion),
    [handleVerUbicacion, onEditarUbicacion],
  );

  const table = useReactTable({
    data: normalizedUbicaciones,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const tags = filterValue.split("|").filter(Boolean).map(normalize);
      const allValues = row
        .getAllCells()
        .map((cell) => normalize(String(cell.getValue() || "")))
        .join(" ");
      return tags.some((tag) => allValues.includes(tag));
    },
    state: { sorting, columnVisibility, rowSelection, pagination, globalFilter },
  });

  return (
    <div className="w-full">
      <div className="flex-1 min-w-0">
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
          <Table className="text-xs">
            <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${
                        header.id === "options" ? "w-1" : ""
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-slate-100 transition-colors border-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal ${
                          cell.column.id === "options" ? "w-1" : ""
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-3 h-32 justify-center">
                        <div className="relative h-8 w-8">
                          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        </div>
                        <span className="text-base text-slate-400">Cargando ubicaciones...</span>
                      </div>
                    ) : (
                      <span className="text-base text-slate-400 font-normal">
                        No se encontraron ubicaciones. Selecciona una ubicación en el menú superior.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <UbicacionDetallePanel
        recordId={selectedUbicacionId}
        onOpenChange={(open) => !open && onSelectedUbicacionIdChange(null)}
      />
    </div>
  );
};

export default UbicacionesExplorerTable;
