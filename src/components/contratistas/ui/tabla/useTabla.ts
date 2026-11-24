"use client";
// F0-05 · Estado de un listado: orden, página y selección. Lo comparten los tres modos
// (cards compactas, lista de cards y tabla), así que cambiar de modo no pierde la
// selección ni la página. El motor es @tanstack/react-table, el mismo de bitácoras.
import { useState } from "react";
import {
  getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type PaginationState, type RowData, type RowSelectionState, type SortingState,
} from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Columna principal (nombre): queda fija junto a ACCIONES si la tabla lo pide y su ancho se arrastra. */
    principal?: boolean;
    /** Ancho mínimo en px. */
    minimo?: number;
    /** Cifras: alineadas a la derecha. */
    derecha?: boolean;
  }
}

export const POR_PAGINA = [10, 25, 50] as const;

export function useTabla<T>({
  datos, columnas, getId, porPagina = 10,
}: {
  /** Memorizado (useMemo): si cambia, la tabla regresa a la página 1. */
  datos: T[];
  columnas: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  getId: (fila: T) => string;
  porPagina?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: porPagina });
  return useReactTable({
    data: datos,
    columns: columnas,
    getRowId: (f) => getId(f),
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    // Primer clic ordena A→Z también en columnas de números
    sortDescFirst: false,
  });
}
