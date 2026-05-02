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
  getPaginationRowModel,
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
import { Bitacora_record, getBitacorasColumns } from "./bitacoras-columns";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { ListRecord, PhotoRecord, FilterConfig } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { InAndOutButtons } from "@/components/Bitacoras/InAndOut/InAndOutButtons";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";

interface ListProps {
  data: Bitacora_record[] | undefined;
  isLoading: boolean;
  total: number | undefined;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  viewMode?: "table" | "photos" | "list";
  printPase: (paseId: string) => void;
  handleSalida: (bitacora: Bitacora_record) => void;
  handleRegresarGafete: (bitacora: Bitacora_record) => void;
  handleAgregarBadge: (bitacora: Bitacora_record) => void;
  dateFilter?: string;
  setDateFilter?: (val: string) => void;
  date1?: Date | "";
  setDate1?: (val: Date | "") => void;
  date2?: Date | "";
  setDate2?: (val: Date | "") => void;
  externalDynamicFilters?: Record<string, any>;
  onExternalDynamicFiltersChange: (filters: Record<string, any>) => void;
  searchTags?: string[];
  setUbicacionSeleccionada?: (val: string) => void;
  filtersConfig?: FilterConfig[];
  stats?: {
    personas_dentro: number;
    salidas_registradas: number;
  };
}

const BitacorasTable: React.FC<ListProps> = ({
  data,
  isLoading,
  printPase,
  total,
  pagination,
  setPagination,
  viewMode = "photos",
  handleSalida,
  handleRegresarGafete,
  handleAgregarBadge,
  dateFilter,
  setDateFilter,
  date1,
  setDate1,
  date2,
  setDate2,
  externalDynamicFilters,
  onExternalDynamicFiltersChange,
  searchTags: externalSearchTags,
  filtersConfig = [],
  stats,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const printPaseFn = (id: string) => {
    printPase(id);
  };

  const [localSearchTags, setLocalSearchTags] = useState<string[]>([]);
  const searchTags = externalSearchTags || localSearchTags;
  const setSearchTags = setLocalSearchTags;

  const columns = useMemo(() => {
    if (isLoading) return [];
    return getBitacorasColumns(
      handleRegresarGafete,
      handleAgregarBadge,
      handleSalida,
      printPaseFn,
    );
  }, [isLoading]);
  const memoizedData = useMemo(() => data || [], [data]);

  const table = useReactTable({
    data: memoizedData,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setSearchTags,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true;
      const searchTags = filterValues.map((v) => v.toLowerCase());

      // Obtenemos todos los valores de la fila de forma dinámica
      const allValues = row
        .getAllCells()
        .map((cell) => String(cell.getValue() || "").toLowerCase())
        .join(" ");

      // Lógica OR: Si el registro coincide con AL MENOS UNO de los tags
      return searchTags.some((tag) => allValues.includes(tag));
    },

    manualPagination: true,
    rowCount: total || 0,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter: searchTags,
    },
  });

  const photoListRecords: ListRecord[] = useMemo(() => {
    return memoizedData.map((item) => formatListRecord(item, "bitacora"));
  }, [memoizedData]);

  const photoRecords: PhotoRecord[] = useMemo(() => {
    return memoizedData.map((item) => formatPhotoRecord(item, "bitacora"));
  }, [memoizedData]);

  const [localDynamicFilters, setLocalDynamicFilters] = useState<
    Record<string, any>
  >({});
  const dynamicFilters = externalDynamicFilters || localDynamicFilters;
  const setDynamicFilters =
    onExternalDynamicFiltersChange || setLocalDynamicFilters;

  // Sincronización de filtros con el servidor y locales
  const externalFilters = useMemo(
    () => ({
      dynamic: dynamicFilters,
      dateFilter,
      date1,
      date2,
    }),
    [dynamicFilters, dateFilter, date1, date2],
  );

  const onExternalFiltersChange = (newFilters: any) => {
    if (newFilters.dateFilter !== undefined)
      setDateFilter?.(newFilters.dateFilter);
    if (newFilters.date1 !== undefined) setDate1?.(newFilters.date1);
    if (newFilters.date2 !== undefined) setDate2?.(newFilters.date2);
    if (newFilters.dynamic !== undefined) {
      setDynamicFilters(newFilters.dynamic);
    }
  };

  const renderActions = (record: PhotoRecord | ListRecord) => {
    const bitacora = memoizedData.find((b) => b._id === record.id);
    if (!bitacora) return null;
    return (
      <InAndOutButtons
        bitacora={bitacora}
        handleSalida={handleSalida}
        printPaseFn={printPaseFn}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 items-start">
        {viewMode !== "table" && (
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            <FiltersPanel
              filters={externalFilters}
              onFiltersChange={onExternalFiltersChange}
              filtersConfig={filtersConfig}
              stats={stats}
            />
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {viewMode === "table" ? (
            <>
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
                <Table className="text-xs">
                  <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                    {table.getHeaderGroups().map((headerGroup: any) => (
                      <TableRow
                        key={headerGroup.id}
                        className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header: any) => {
                          return (
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
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row: any) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-slate-100 transition-colors border-slate-50">
                          {row.getVisibleCells().map((cell: any) => (
                            <TableCell
                              key={cell.id}
                              className={`py-2 px-3 border-r border-slate-100 last:border-r-0 ${cell.column.id === "options" ? "w-1" : ""} font-normal`}>
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
            </>
          ) : viewMode === "photos" ? (
            <>
              <PhotoGridView
                isLoading={isLoading}
                records={photoRecords}
                globalSearch={searchTags}
                selectionActions={(ids) => (
                  <OutSelectedItemsButton selectedItems={ids} />
                )}>
                {renderActions}
              </PhotoGridView>
            </>
          ) : (
            <>
              <PhotoListView
                isLoading={isLoading}
                records={photoListRecords}
                globalSearch={searchTags}
                selectionActions={(ids) => (
                  <OutSelectedItemsButton selectedItems={ids} />
                )}>
                {renderActions}
              </PhotoListView>
            </>
          )}
          <DataTablePagination table={table} total={total} />
        </div>
      </div>
    </div>
  );
};
export default BitacorasTable;
