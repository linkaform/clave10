"use client";
/* eslint-disable react-hooks/exhaustive-deps */

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdateFullPassModal from "@/components/modals/update-full-pass";
import { useMemo, useState } from "react";
import { getPasesEntradaColumns } from "./pases-entrada-columns";

interface ListProps {
  isLoading: boolean;
  pases: any[];
}

const PasesEntradaTable: React.FC<ListProps> = ({ isLoading, pases }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [paseSeleccionado, setPaseSeleccionado] = useState<any | null>(null);

  const handleEditar = (pase: any) => {
    const telefonoLimpio = (() => {
      if (!pase.telefono) return "";

      const original = pase.telefono.trim();
      // Si ya viene con +, se respeta tal cual — puede ser cualquier país
      if (original.startsWith("+")) return original;

      const soloNumeros = original.replace(/\D/g, "");
      if (!soloNumeros) return "";

      // Si ya trae 11+ dígitos, asumimos que ya incluye código de país (no forzar +52)
      if (soloNumeros.length >= 11) {
        return `+${soloNumeros}`;
      }

      // Solo si parece número nacional (10 dígitos, típico de México) se asume +52
      if (soloNumeros.length === 10) {
        return `+52${soloNumeros}`;
      }

      return `+${soloNumeros}`;
    })();

    const visitaALimpia = Array.isArray(pase.visita_a)
      ? pase.visita_a
          .filter((v: any) => {
            if (!v) return false;
            if (typeof v === "string") return true;
            if (typeof v === "object" && v.nombre) return true;
            return false;
          })
          .map((v: any) => {
            const nombre = typeof v === "string" ? v : v.nombre;
            return {
              id: nombre,
              name: nombre,
            };
          })
      : [];

    const ubicacionLimpia = Array.isArray(pase.ubicacion)
      ? pase.ubicacion.filter(Boolean)
      : [];

    const paseLimpio = {
      ...pase,
      telefono: telefonoLimpio,
      visita_a: visitaALimpia,
      ubicacion: ubicacionLimpia,
      url_padre: pase.url_padre,
    };

    setPaseSeleccionado(paseLimpio);
    setModalEditarAbierto(true);
  };

  const columns = useMemo(() => {
    if (isLoading) return [];
    return getPasesEntradaColumns(handleEditar);
  }, [isLoading, handleEditar]);

  const memoizedData = useMemo(() => pases || [], [pases]);

  const table = useReactTable({
    data: memoizedData || [],
    columns: columns,
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
    <div className="w-full">
      {modalEditarAbierto && paseSeleccionado && (
        <UpdateFullPassModal
          dataPass={paseSeleccionado}
          modalEditarAbierto={modalEditarAbierto}
          setModalEditarAbierto={setModalEditarAbierto}
        />
      )}

      <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
        <Table className="text-xs">
          <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === "options" ? "w-1" : ""}`}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-100 transition-colors border-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal ${cell.column.id === "options" ? "w-1" : ""}`}>
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
                  className="h-32 text-center">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
                      <span className="text-xs font-normal">
                        Cargando registros...
                      </span>
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
    </div>
  );
};
export default PasesEntradaTable;