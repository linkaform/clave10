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
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getCheckUbicacionesColumns, CheckUbicacion } from "./check-ubicaciones-columns";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FilterConfig, ListRecord, PhotoRecord } from "@/types/bitacoras";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { useGetListCheckUbicaciones } from "@/hooks/Rondines/useListCheckUbicaciones";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { applyCheckAreasFilters } from "@/hooks/Rondines/checkAreas/useCheckAreasFilters ";

interface CheckUbicacionesTableProps {
  searchTags?: string[];
  viewMode?: "table" | "photos" | "list";
  onExternalDynamicFiltersChange: (filters: Record<string, any>) => void;
  setUbicacionSeleccionada?: (val: string) => void;
  filtersConfig?: FilterConfig[];
  stats?: {
    personas_dentro: number;
    salidas_registradas: number;
  };
  total: number | undefined;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  setTotalRegistros: React.Dispatch<React.SetStateAction<number | 0>>;
}

const CheckUbicacionesTable: React.FC<CheckUbicacionesTableProps> = ({
  viewMode = "table",
  searchTags = [],
  filtersConfig = [],
  stats,
  total,
  externalFilters = { dynamic: {}, dateFilter: "", date1: "", date2: "" },
  onExternalFiltersChange = () => {},
  setTotalRegistros,
}) => {
  const { listCheckUbicaciones, isLoadingListCheckUbicaciones: isLoading } = useGetListCheckUbicaciones(true);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ options: false });
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Conectar searchTags al globalFilter
  React.useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join("|"));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);

  const handleEliminar = (check: CheckUbicacion) => {
    console.log("Eliminar:", check);
  };

  const handleVerCheck = React.useCallback((check: CheckUbicacion) => {
    console.log("Ver check:", check);
  }, []);

  const columns = useMemo(
    () => getCheckUbicacionesColumns(handleEliminar, handleVerCheck),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleVerCheck]
  );

  const memoizedData = useMemo(
    () => (Array.isArray(listCheckUbicaciones) ? listCheckUbicaciones : []) as CheckUbicacion[],
    [listCheckUbicaciones]
  );

  const filteredData = useMemo(
    () => applyCheckAreasFilters(memoizedData, externalFilters),
    [memoizedData, externalFilters]
  );

  useEffect(() => {
    setTotalRegistros(filteredData.length);
  }, [filteredData, setTotalRegistros]);

  const table = useReactTable({
    data: filteredData,
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
      const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const tags = filterValue.split("|").filter(Boolean).map(normalize);
      const allValues = row
        .getAllCells()
        .map((cell) => normalize(String(cell.getValue() || "")))
        .join(" ");
      return tags.some((tag) => allValues.includes(tag));
    },
    manualPagination: true,
    rowCount: total || 0,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  const photoListRecords: ListRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatListRecord({ ...item, _id: `check-${index}-${item.id || index}` }, "check_ubicacion")
    );
  }, [filteredData]);

  const photoRecords: PhotoRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatPhotoRecord({ ...item, _id: `check-${index}-${item.id || index}` }, "check_ubicacion")
    );
  }, [filteredData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderActions = (_record: PhotoRecord | ListRecord) => null;

  return (
    <div className="w-full">
      <div className="flex gap-4 items-start">
        {viewMode !== "table" && (
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
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
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                <Table className="text-xs">
                  <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}
                            className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === "options" ? "w-1" : ""}`}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-slate-100 transition-colors border-slate-50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}
                              className={`py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal ${cell.column.id === "options" ? "w-1" : ""}`}>
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
                              <span className="text-base text-slate-400">Cargando registros...</span>
                            </div>
                          ) : (
                            <span className="text-base text-slate-400 font-normal">No se encontraron registros</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
                </div>
              </div>
            </>
          ) : viewMode === "photos" ? (
            <PhotoGridView
              isLoading={isLoading}
              records={photoRecords}
              globalSearch={searchTags ?? []}
              modalType="rondines"
              getMapData={(record) => (record as any)?.rawData?.map_data ?? []}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
              {renderActions}
            </PhotoGridView>
          ) : (
            <PhotoListView
              isLoading={isLoading}
              records={photoListRecords}
              globalSearch={searchTags ?? []}
              modalType="rondines"
              getMapData={(record) => record?.rawData?.map_data ?? []}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
              {renderActions}
            </PhotoListView>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckUbicacionesTable;