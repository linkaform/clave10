/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Articulo_perdido_record, pendientesColumns } from "./pendientes-columns";
import { useEffect, useMemo } from "react";
import { ViewMode } from "@/lib/utils";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { TableRowSkeletons } from "@/components/common/RecordSkeletons";
import { PerdidosActionButtons } from "@/components/Bitacoras/Perdidos/customActions";
import { SortableTableHead } from "@/components/table/SortableTableHead";

interface ListProps {
  data: Articulo_perdido_record[];
  isLoadingListArticulosPerdidos: boolean;
  openModal: () => void;
  resetTableFilters: () => void;
  setSelectedArticulos: React.Dispatch<React.SetStateAction<string[]>>;
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  viewMode: ViewMode;
  searchTags?: string[];
  activeFiltersCount?: number;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros?: React.Dispatch<React.SetStateAction<number>>;
}

const ArticulosPerdidosTable: React.FC<ListProps> = ({
  data,
  isLoadingListArticulosPerdidos,
  setSelectedArticulos,
  viewMode,
  filtersConfig: filtersConfigProp,
  externalFilters: externalFiltersProp,
  onExternalFiltersChange: onExternalFiltersChangeProp,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const externalFilters = useMemo(
    () => externalFiltersProp ?? { dynamic: {}, dateFilter: "" },
    [externalFiltersProp]
  );
  const onExternalFiltersChange = onExternalFiltersChangeProp ?? (() => {});
  const filtersConfig = useMemo(() => filtersConfigProp ?? [], [filtersConfigProp]);

  const memoizedData = useMemo(() => data || [], [data]);

  // Búsqueda, filtros y paginación ya vienen resueltos del back (getListArticulosPerdidos).
  const filteredData = memoizedData;

  const columns = useMemo(() => (isLoadingListArticulosPerdidos ? [] : pendientesColumns), [isLoadingListArticulosPerdidos]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  });

  useEffect(() => {
    if (table.getFilteredSelectedRowModel().rows.length > 0) {
      const folios: any[] = [];
      table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
      setSelectedArticulos(folios);
    }
  }, [table.getFilteredSelectedRowModel().rows]);

  const perdidoPhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatPhotoRecord(item, "perdidos"));
  }, [filteredData]);

  const perdidoListRecords: ListRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatListRecord(item, "perdidos"));
  }, [filteredData]);

  const renderActions = (record: PhotoRecord | ListRecord) => {
    const articulo = memoizedData.find((a) => a._id === record.id || a.folio === record.folio);
    if (!articulo) return null;
    return <PerdidosActionButtons articulo={articulo} />;
  };
  return (
    <div className="w-full">
      <div className="flex gap-4 items-start">
        {viewMode !== "table" && (
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            <FiltersPanel
              filters={externalFilters ?? { dynamic: {}, dateFilter: "" }}
              onFiltersChange={onExternalFiltersChange ?? (() => {})}
              filtersConfig={filtersConfig ?? []}
            />
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {viewMode === "table" && (
            <>
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
              <Table className="text-xs">
              <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => (
                      <SortableTableHead
                        key={header.id}
                        header={header}
                        className="text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none" />
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingListArticulosPerdidos ? (
                  <TableRowSkeletons columns={pendientesColumns.length} />
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-slate-100 transition-colors border-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                      <TableRow>
                        <TableCell colSpan={pendientesColumns.length} className="h-24 text-center">
                          <span className="text-xs text-slate-300 font-normal">No hay registros disponibles...</span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                {!isLoadingListArticulosPerdidos && (
                  <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} items seleccionados.
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "photos" && (
            <PhotoGridView
              isLoading={isLoadingListArticulosPerdidos}
              skeleton
              records={perdidoPhotoRecords}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
              modalActions={(record) => {
                if (!record) return null;
                const articulo = memoizedData.find((a) => a._id === record.id || a.folio === record.folio);
                if (!articulo) return null;
                return <PerdidosActionButtons articulo={articulo} />;
              }}
            >
              {renderActions}
            </PhotoGridView>
          )}

          {viewMode === "list" && (
            <PhotoListView
              isLoading={isLoadingListArticulosPerdidos}
              skeleton
              records={perdidoListRecords}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            >
              {renderActions}
            </PhotoListView>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticulosPerdidosTable;