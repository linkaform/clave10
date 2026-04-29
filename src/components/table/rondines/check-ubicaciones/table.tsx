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
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FilterConfig, ListRecord, PhotoRecord } from "@/types/bitacoras";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { useGetListCheckUbicaciones } from "@/hooks/Rondines/useListCheckUbicaciones";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";

interface CheckUbicacionesTableProps {
  searchTags?: string[];
  viewMode?: "table" | "photos" | "list";
  externalDynamicFilters?: Record<string, any>;
  onExternalDynamicFiltersChange: (filters: Record<string, any>) => void;
  setUbicacionSeleccionada?: (val: string) => void;
  filtersConfig?: FilterConfig[];
  stats?: {
    personas_dentro: number;
    salidas_registradas: number;
  };
  total: number | undefined;
  dateFilter?: string;
  setDateFilter?: (val: string) => void;
  date1?: Date | "";
  setDate1?: (val: Date | "") => void;
  date2?: Date | "";
  setDate2?: (val: Date | "") => void;

}

const CheckUbicacionesTable: React.FC<CheckUbicacionesTableProps> = ({
  viewMode = "table",
  externalDynamicFilters,
  onExternalDynamicFiltersChange,
  searchTags: externalSearchTags,
  filtersConfig = [],
  total,
  stats,
  dateFilter,
  setDateFilter,
  date1,
  setDate1,
  date2,
  setDate2,
  
}) => {
  const { listCheckUbicaciones, isLoadingListCheckUbicaciones: isLoading } = useGetListCheckUbicaciones(true);

  const [checkSeleccionado, setCheckSeleccionado] = useState<CheckUbicacion | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    options: false, 
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  // const [globalFilter, setGlobalFilter] = React.useState("");


  const [localSearchTags, setLocalSearchTags] = useState<string[]>([]);
  const searchTags = externalSearchTags || localSearchTags;
  const setSearchTags = setLocalSearchTags;

  
  // React.useEffect(() => {
  //   if (searchTags && searchTags.length > 0) {
  //     setGlobalFilter(searchTags.join(" "));
  //   } else {
  //     setGlobalFilter("");
  //   }
  // }, [searchTags]);

  const handleEliminar = (check: CheckUbicacion) => {
    setCheckSeleccionado(check);
    setModalEliminarAbierto(true);
    console.log("Eliminar:", check, modalEliminarAbierto, checkSeleccionado);
  };

  const handleVerCheck = React.useCallback((check: CheckUbicacion) => {
    setCheckSeleccionado(check);
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

  const table = useReactTable({
    data: memoizedData,
    columns,
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

  const photoListRecords: ListRecord[] = useMemo(() => {
    return memoizedData.map((item: any, index: number) =>
      formatListRecord({
        ...item,
        _id: `check-${index}-${item.id || index}`,
      }, "check_ubicacion")
    );
  }, [memoizedData]);

  const photoRecords: PhotoRecord[] = useMemo(() => {
    return memoizedData.map((item: any, index: number) =>
      formatPhotoRecord({
        ...item,
        _id: `check-${index}-${item.id || index}`,
      }, "check_ubicacion")
    );
  }, [memoizedData]);

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
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
            <Table className="text-xs">
              <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === "options" ? "w-1" : ""}`}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                          className={`py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal ${cell.column.id === "options" ? "w-1" : ""}`}
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
  )
}
export default CheckUbicacionesTable;