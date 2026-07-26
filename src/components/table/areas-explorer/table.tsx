"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Power, Printer } from "lucide-react";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { formatPhotoRecord, formatListRecord } from "@/utils/formatRecords";
import { FilterConfig, ListRecord, PhotoRecord } from "@/types/bitacoras";
import { AreaRow, NormalizedArea, normalizeArea } from "@/lib/areas";
import { AreasExternalFilters } from "@/hooks/Areas/useAreasFilters";
import { useAreaActions } from "@/hooks/Areas/useAreaActions";
import { ViewMode } from "@/lib/utils";
import { getAreasColumns } from "./columns";
import { AreaDisponibilidadMenu } from "./AreaDisponibilidadMenu";
import { AreaDetallePanel } from "@/components/Areas/AreaDetallePanel";

interface AreasExplorerTableProps {
  areas: AreaRow[];
  isLoading?: boolean;
  viewMode: ViewMode;
  searchTags: string[];
  filtersConfig: FilterConfig[];
  externalFilters: AreasExternalFilters;
  onExternalFiltersChange: (filters: AreasExternalFilters) => void;
  selectedAreaId: string | null;
  onSelectedAreaIdChange: (id: string | null) => void;
}

export const AreasExplorerTable: React.FC<AreasExplorerTableProps> = ({
  areas,
  isLoading,
  viewMode,
  searchTags,
  filtersConfig,
  externalFilters,
  onExternalFiltersChange,
  selectedAreaId,
  onSelectedAreaIdChange,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    setGlobalFilter(searchTags && searchTags.length > 0 ? searchTags.join("|") : "");
  }, [searchTags]);

  const normalizedAreas = useMemo(
    () => areas.map((area, index) => normalizeArea(area, index)),
    [areas],
  );

  const { handlePrintAreaQR, handleToggleAreaEstado } = useAreaActions();

  const handleVerArea = React.useCallback(
    (area: NormalizedArea) => onSelectedAreaIdChange(area.recordId),
    [onSelectedAreaIdChange],
  );

  const handleRecordClick = React.useCallback(
    (record: PhotoRecord | ListRecord) => {
      const recordId = (record as any)?.rawData?.record_id;
      if (recordId) onSelectedAreaIdChange(recordId);
    },
    [onSelectedAreaIdChange],
  );

  const handlePrintArea = React.useCallback(
    (area: NormalizedArea) => handlePrintAreaQR(area.recordId),
    [handlePrintAreaQR],
  );

  const handleToggleArea = React.useCallback(
    (area: NormalizedArea) => handleToggleAreaEstado(area.recordId, area.estado),
    [handleToggleAreaEstado],
  );

  const iconButtonClass =
    "p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95";

  const renderAreaActions = React.useCallback(
    (record: PhotoRecord | ListRecord) => {
      const rawData = (record as any)?.rawData || {};
      const recordId = rawData.record_id || "";
      const estadoActual = Array.isArray(rawData.area_state) ? rawData.area_state[0] : rawData.area_state;
      const esActiva = (estadoActual || "").toLowerCase() === "activa";
      return (
        <PhotoGridActionButtons
          actions={[
            <div
              key="print"
              className={iconButtonClass}
              title="Imprimir QR"
              onClick={() => handlePrintAreaQR(recordId)}
            >
              <Printer className="w-4 h-4" />
            </div>,
            <div
              key="toggle-estado"
              className={`${iconButtonClass} ${esActiva ? "text-green-600" : "text-slate-400"}`}
              title={esActiva ? "Desactivar área" : "Activar área"}
              onClick={() => handleToggleAreaEstado(recordId, estadoActual)}
            >
              <Power className="w-4 h-4" />
            </div>,
            <div key="disponibilidad" className={iconButtonClass}>
              <AreaDisponibilidadMenu recordId={recordId} iconClassName="w-4 h-4" />
            </div>,
          ]}
        />
      );
    },
    [handlePrintAreaQR, handleToggleAreaEstado],
  );

  const columns = useMemo(
    () => getAreasColumns(handleVerArea, handlePrintArea, handleToggleArea),
    [handleVerArea, handlePrintArea, handleToggleArea],
  );

  const table = useReactTable({
    data: normalizedAreas,
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  const photoRecords: PhotoRecord[] = useMemo(
    () => normalizedAreas.map((area) => formatPhotoRecord(area, "area")),
    [normalizedAreas],
  );

  const listRecords: ListRecord[] = useMemo(
    () => normalizedAreas.map((area) => formatListRecord(area, "area")),
    [normalizedAreas],
  );

  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="w-full">
      <div className="flex gap-4 items-start">
        {viewMode !== "table" && (
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
            <FiltersPanel
              filters={externalFilters}
              onFiltersChange={onExternalFiltersChange}
              filtersConfig={filtersConfig}
              hideFecha
            />
          </aside>
        )}

        <div ref={gridContainerRef} className="flex-1 min-w-0">
          {viewMode === "photos" ? (
            <PhotoGridView
              isLoading={isLoading}
              records={photoRecords}
              globalSearch={searchTags}
              onRecordClick={handleRecordClick}
            >
              {renderAreaActions}
            </PhotoGridView>
          ) : viewMode === "list" ? (
            <PhotoListView
              isLoading={isLoading}
              records={listRecords}
              globalSearch={searchTags}
              onRecordClick={handleRecordClick}
            >
              {renderAreaActions}
            </PhotoListView>
          ) : (
            <>
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
                              <span className="text-base text-slate-400">Cargando áreas...</span>
                            </div>
                          ) : (
                            <span className="text-base text-slate-400 font-normal">No se encontraron áreas</span>
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
            </>
          )}
        </div>
      </div>

      <AreaDetallePanel
        recordId={selectedAreaId}
        onOpenChange={(open) => !open && onSelectedAreaIdChange(null)}
        allowOutsideRef={gridContainerRef}
      />
    </div>
  );
};

export default AreasExplorerTable;
