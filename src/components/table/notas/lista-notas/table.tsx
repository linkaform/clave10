"use client";
import * as React from "react";
import {
  ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listaNotasColumns } from "./lista-notas-columns";
import { useNotes } from "@/hooks/useNotes";
import { useState, useEffect, useMemo } from "react";
import Pagination from "@/components/pages/notas/Pagination";
import { ViewMode } from "@/lib/utils";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { CustomSpinner } from "@/components/custom-spinner";
import { applyNotasFilters } from "@/hooks/Notas/useNotasFIlters";
import { useBoothStore } from "@/store/useBoothStore";
import { NotasActionButtons } from "@/components/Bitacoras/Notas/customActions";

interface ListaNotasTableProps {
  statusFilter: string;
  ubicacionSeleccionada: string;
  areaSeleccionada: string;
  viewMode?: ViewMode;
  searchTags?: string[];
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros?: React.Dispatch<React.SetStateAction<number>>;
  setUbicacionSeleccionada:React.Dispatch<React.SetStateAction<string>>;
}

export const ListaNotasTable = ({
  statusFilter,
  ubicacionSeleccionada,
  setUbicacionSeleccionada,
  areaSeleccionada,
  viewMode = "table",
  searchTags: searchTagsProp,
  filtersConfig: filtersConfigProp,
  externalFilters: externalFiltersProp,
  onExternalFiltersChange: onExternalFiltersChangeProp,
  setTotalRegistros,
}: ListaNotasTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [registersPage, setRegistersPage] = useState(10);
  const [dateFromValue ] = useState("");
  const [dateToValue] = useState("");
  const [dateFiter, setDateFilter] = useState<string>("this_month");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 23 });
  const { location } = useBoothStore();
  console.log(dateFiter)
  
  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (statusFilter === "") statusFilter = "abierto";

  const externalFilters = useMemo(
    () => externalFiltersProp ?? { dynamic: {}, dateFilter: "" },
    [externalFiltersProp]
  );
  const onExternalFiltersChange = onExternalFiltersChangeProp ?? (() => {});
  const filtersConfig = useMemo(() => filtersConfigProp ?? [], [filtersConfigProp]);
  const searchTags = useMemo(() => searchTagsProp ?? [], [searchTagsProp]);

  useEffect(() => {
    if (statusFilter === "dia") setDateFilter("today");
    else setDateFilter("this_month");
  }, [statusFilter]);

  const {
    data: notes,
    isLoadingListNotes,
    isFetching,
  } = useNotes(
    true,
    areaSeleccionada || "todas",
    ubicacionSeleccionada,
    currentPage,
    registersPage,
    dateFromValue,
    dateToValue,
    statusFilter,
  );
  console.log("not", notes)
  const actual_page = notes?.actual_page ?? 1;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const records = notes?.records ?? [];
  const total_pages = notes?.total_pages ?? 1;
  const total_records = notes?.total_records ?? 0;

  const handleRegistersPageChange = (newQuantity: number) => {
    setRegistersPage(newQuantity);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => setCurrentPage(newPage - 1);

  const memoizedData = useMemo(() => (Array.isArray(records) ? records : []), [records]);
  const filteredData = useMemo(() => applyNotasFilters(memoizedData, externalFilters), [memoizedData, externalFilters]);

  const isLoading = isLoadingListNotes || isFetching;

  React.useEffect(() => {
    if (searchTags && searchTags.length > 0) setGlobalFilter(searchTags.join("|"));
    else setGlobalFilter("");
  }, [searchTags]);

  useEffect(() => {
    setTotalRegistros?.(total_records);
  }, [total_records, setTotalRegistros]);

  // useEffect(() => {
  //   selectedDate(dateFilter);
  //   if (dateFilter !== "range") { setDate1(""); setDate2(""); }
  // }, [dateFilter]);

  // const selectedDate = (df: string) => {
  //   const now = new Date();
  //   let dateFrom = "", dateTo = "";
  //   switch (df) {
  //     case "today": dateFrom = dateTo = format(now, "yyyy-MM-dd"); break;
  //     case "yesterday":
  //       const y = new Date(now); y.setDate(now.getDate() - 1);
  //       dateFrom = dateTo = format(y, "yyyy-MM-dd"); break;
  //     case "this_week":
  //       const fw = new Date(now); fw.setDate(now.getDate() - now.getDay());
  //       const lw = new Date(now); lw.setDate(fw.getDate() + 6);
  //       dateFrom = format(fw, "yyyy-MM-dd"); dateTo = format(lw, "yyyy-MM-dd"); break;
  //     case "last_week":
  //       const lws = new Date(now); lws.setDate(now.getDate() - now.getDay() - 7);
  //       const lwe = new Date(lws); lwe.setDate(lws.getDate() + 6);
  //       dateFrom = format(lws, "yyyy-MM-dd"); dateTo = format(lwe, "yyyy-MM-dd"); break;
  //     case "last_fifteen_days":
  //       const fd = new Date(now); fd.setDate(now.getDate() - 14);
  //       dateFrom = format(fd, "yyyy-MM-dd"); dateTo = format(now, "yyyy-MM-dd"); break;
  //     case "this_month":
  //       dateFrom = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  //       dateTo = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"); break;
  //     case "last_month":
  //       dateFrom = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "yyyy-MM-dd");
  //       dateTo = format(new Date(now.getFullYear(), now.getMonth(), 0), "yyyy-MM-dd"); break;
  //     case "this_year":
  //       dateFrom = format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd");
  //       dateTo = format(new Date(now.getFullYear(), 11, 31), "yyyy-MM-dd"); break;
  //   }
  //   setDateFromValue(dateFrom);
  //   setDateToValue(dateTo);
  // };
  const renderActions = (record: PhotoRecord | ListRecord) => {
    const nota = memoizedData.find((n: any) => n._id === record.id || n.folio === record.folio);
    if (!nota) return null;
    return <NotasActionButtons nota={nota} />;
  };
  // const Filter = () => {
  //   if (date1 && date2) {
  //     setDateFromValue(format(date1, "yyyy-MM-dd HH:mm:ss"));
  //     setDateToValue(format(date2, "yyyy-MM-dd HH:mm:ss"));
  //   } else {
  //     toast.error("Escoge un rango de fechas.");
  //   }
  // };

  const table = useReactTable({
    data: memoizedData,
    columns: listaNotasColumns,
    pageCount: Math.ceil(total_records / pagination.pageSize),
    manualPagination: true,
    state: { pagination, sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const notaPhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatPhotoRecord(item, "notas"));
  }, [filteredData]);

  const notaListRecords: ListRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatListRecord(item, "notas"));
  }, [filteredData]);

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
              {/* <div className="flex justify-end mb-4">
                <DateFilter
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  Filter={Filter}
                  setDate1={setDate1}
                  setDate2={setDate2}
                  date1={date1}
                  date2={date2}
                />
              </div> */}
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                <Table className="text-xs">
                  <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                    {table.getHeaderGroups().map((headerGroup: any) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header: any) => (
                          <TableHead key={header.id}
                            className="text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={listaNotasColumns.length} className="h-32 text-center">
                          <CustomSpinner />
                        </TableCell>
                      </TableRow>
                    ) : records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={listaNotasColumns.length} className="h-32 text-center">
                          <span className="text-xs text-slate-300 font-normal">No hay registros disponibles...</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-100 transition-colors border-slate-50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}
                              className="py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                paginaActualProp={actual_page}
                totalRegistrosProp={total_records}
                totalPaginasProp={total_pages}
                cantidadXPagina={registersPage}
                registrosXPagina={[10, 20, 30]}
                onPageChange={handlePageChange}
                handleRegistersPageChange={handleRegistersPageChange}
              />
            </>
          )}

          {viewMode === "photos" && (
            <PhotoGridView
              isLoading={isLoading}
              records={notaPhotoRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
              modalActions={(record) => {
                if (!record) return null;
                const nota = memoizedData.find((n: any) => n._id === record.id || n.folio === record.folio);
                if (!nota) return null;
                return <NotasActionButtons nota={nota} />;
              }}
            >
              {renderActions}
            </PhotoGridView>
          )}

          {viewMode === "list" && (
            <PhotoListView
              isLoading={isLoading}
              records={notaListRecords}
              globalSearch={searchTags}
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