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
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FilterConfig, ListRecord, PhotoRecord } from "@/types/bitacoras";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { useGetListCheckUbicaciones } from "@/hooks/Rondines/useListCheckUbicaciones";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { TableRowSkeletons } from "@/components/common/RecordSkeletons";
import { CheckAreasSearch } from "@/lib/get-all-checks";
import { CheckArea, getCheckAreasColumns } from "./check-areas-columns";
import { mapCheckUbicacionGrid } from "@/mappers/check-ubicaciones.grid.mapper";
import { PhotoGridCardModal } from "@/components/Bitacoras/PhotoGrid/PhotoGridCardModal";

interface CheckUbicacionesTableProps {
  searchTags?: string[];
  /** Buscador avanzado: filtros, fecha y ubicaciones que se resuelven en el back. */
  search?: Omit<CheckAreasSearch, "limit" | "skip">;
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

const CHECKS_POR_PAGINA = 25;

const CheckUbicacionesTable: React.FC<CheckUbicacionesTableProps> = ({
  viewMode = "table",
  search,
  filtersConfig :filtersConfigProp,
  stats,
  externalFilters :externalFiltersProp,
  onExternalFiltersChange:onExternalFiltersChangeProp,
  setTotalRegistros,
}) => {
  // Paginación en servidor.
  const [paginaServidor, setPaginaServidor] = React.useState(0);
  const searchKey = JSON.stringify(search ?? null);
  useEffect(() => { setPaginaServidor(0); }, [searchKey]);
  const pageSearch = useMemo(
    () => (search ? { ...search, limit: CHECKS_POR_PAGINA, skip: paginaServidor * CHECKS_POR_PAGINA } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey, paginaServidor],
  );
  const { listCheckUbicaciones, totalCheckUbicaciones, isLoadingListCheckUbicaciones: isLoading } =
    useGetListCheckUbicaciones(true, undefined, undefined, pageSearch);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ options: true });
  const [rowSelection, setRowSelection] = React.useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const externalFilters = useMemo(
    () => externalFiltersProp ?? { dynamic: {}, dateFilter: "" },
    [externalFiltersProp]
  );
  const onExternalFiltersChange = onExternalFiltersChangeProp ?? (() => {});
  const filtersConfig = useMemo(() => filtersConfigProp ?? [], [filtersConfigProp]);

  const handleVerCheck = React.useCallback((check: CheckArea) => {
    const base = { id: check.id, folio: check.folio };
    const formatted = mapCheckUbicacionGrid(check, base);
    setSelectedRecord(formatted);
    setIsModalOpen(true);
  }, []);
  

  const handleEliminar = (check: CheckArea) => {
    console.log("Eliminar:", check);
  };

  const columns = useMemo(
    () => getCheckAreasColumns(handleEliminar, handleVerCheck),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleVerCheck]
  );

  const memoizedData = useMemo(
    () => (Array.isArray(listCheckUbicaciones) ? listCheckUbicaciones : []) as CheckArea[],
    [listCheckUbicaciones]
  );

  // Búsqueda, filtros y paginación ya vienen resueltos del back.
  const filteredData = memoizedData;

  useEffect(() => {
    setTotalRegistros(totalCheckUbicaciones);
  }, [totalCheckUbicaciones, setTotalRegistros]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
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

  const renderActions = () => null;

  return (
    <div className="w-full">
       {selectedRecord && (
      <PhotoGridCardModal
        badges={[
          ...(selectedRecord?.status
            ? [{
                label: "",
                value: selectedRecord.status,
                customClass: "bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200",
              }]
            : []),
          {
            label: "",
            value: selectedRecord?.visit_type || "",
            customClass: "bg-[#F3E8FF] text-[#9159F4] text-xs",
          },
          {
            label: "",
            value: `#${selectedRecord?.folio || ""}`,
            customClass: "bg-[#DBEAFE] text-[#2987F7] text-xs",
          },
        ]}
        record={selectedRecord}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}>
        {null}
      </PhotoGridCardModal>
    )}
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
                    {isLoading ? (
                      <TableRowSkeletons columns={columns.length} />
                    ) : table.getRowModel().rows?.length ? (
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
                          <span className="text-base text-slate-400 font-normal">No se encontraron registros</span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPaginaServidor((p) => Math.max(0, p - 1))} disabled={paginaServidor === 0 || isLoading}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setPaginaServidor((p) => p + 1)} disabled={(paginaServidor + 1) * CHECKS_POR_PAGINA >= totalCheckUbicaciones || isLoading}>Siguiente</Button>
                </div>
              </div>
            </>
          ) : viewMode === "photos" ? (
            <PhotoGridView
              isLoading={isLoading}
              skeleton
              records={photoRecords}
              modalType="rondines_v2"
              getMapData={(record) => (record as any)?.rawData?.map_data ?? []}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
              {renderActions}
            </PhotoGridView>
          ) : (
            <PhotoListView
              isLoading={isLoading}
              skeleton
              records={photoListRecords}
              modalType="normal"
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