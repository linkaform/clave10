"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getCheckUbicacionesColumns, CheckUbicacion } from "./check-ubicaciones-columns";

interface CheckUbicacionesTableProps {
  searchTags?: string[];
}
const CheckUbicacionesTable: React.FC<CheckUbicacionesTableProps> = ({
  searchTags,
}) => {
  // const { listCheckUbicaciones, isLoading } = useGetListCheckUbicaciones();

  const isLoading = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const listCheckUbicaciones: CheckUbicacion[] = []; // reemplazar por listCheckUbicaciones del hook

  const [checkSeleccionado, setCheckSeleccionado] = useState<CheckUbicacion | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Sincronizar searchTags con globalFilter
  React.useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join(" "));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);

  const handleEliminar = (check: CheckUbicacion) => {
    setCheckSeleccionado(check);
    setModalEliminarAbierto(true);
    console.log("Eliminar:", check, modalEliminarAbierto, checkSeleccionado);
  };

  const handleVerCheck = React.useCallback((check: CheckUbicacion) => {
    setCheckSeleccionado(check);
    // TODO: abrir modal o navegar al detalle
    console.log("Ver check:", check);
  }, []);

  const columns = useMemo(
    () => getCheckUbicacionesColumns(handleEliminar, handleVerCheck),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleVerCheck]
  );
  const memoizedData = useMemo(() => listCheckUbicaciones || [], [listCheckUbicaciones]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const tags = filterValue.toLowerCase().split(" ").filter(Boolean);
      const allValues = row
        .getAllCells()
        .map((cell) => String(cell.getValue() || "").toLowerCase())
        .join(" ");
      return tags.some((tag) => allValues.includes(tag));
    },
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  return (
    <div className="w-full">

      {/* Modal eliminar */}
      {/* {modalEliminarAbierto && checkSeleccionado && (
        <EliminarCheckModal
          modalEliminarAbierto={modalEliminarAbierto}
          setModalEliminarAbierto={setModalEliminarAbierto}
          folio={checkSeleccionado.folio}
        />
      )} */}

      <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
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
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
                      <span className="text-xs font-normal">Cargando registros...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 font-normal">
                      No se encontraron registros
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckUbicacionesTable;