"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
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
import { Pencil } from "lucide-react";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { formatPhotoRecord, formatListRecord } from "@/utils/formatRecords";
import { FilterConfig, ListRecord, PhotoRecord } from "@/types/bitacoras";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { UbicacionesExternalFilters } from "@/hooks/Ubicaciones/useUbicacionesFilters";
import { ViewMode } from "@/lib/utils";
import { UbicacionRow, NormalizedUbicacion, normalizeUbicacion } from "@/lib/ubicaciones";
import { getUbicacionesColumns } from "./columns";
import { UbicacionDetallePanel } from "@/components/Ubicaciones/UbicacionDetallePanel";
import type { UbicacionTab } from "@/components/Ubicaciones/UbicacionDetalle";

interface UbicacionesExplorerTableProps {
  ubicaciones: UbicacionRow[];
  isLoading?: boolean;
  viewMode: ViewMode;
  filtersConfig: FilterConfig[];
  externalFilters: UbicacionesExternalFilters;
  onExternalFiltersChange: (filters: UbicacionesExternalFilters) => void;
  selectedUbicacionId: string | null;
  onSelectedUbicacionIdChange: (id: string | null) => void;
}

export const UbicacionesExplorerTable: React.FC<UbicacionesExplorerTableProps> = ({
  ubicaciones,
  isLoading,
  viewMode,
  filtersConfig,
  externalFilters,
  onExternalFiltersChange,
  selectedUbicacionId,
  onSelectedUbicacionIdChange,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const normalizedUbicaciones = useMemo(
    () => ubicaciones.map((ubicacion, index) => normalizeUbicacion(ubicacion, index)),
    [ubicaciones],
  );

  // Tab con el que abre el panel lateral: el lápiz abre directo en
  // "configuracion", igual que en Áreas.
  const [panelTab, setPanelTab] = useState<UbicacionTab>("generales");

  const abrirPanel = React.useCallback(
    (recordId: string, tab: UbicacionTab = "generales") => {
      if (!recordId) return;
      setPanelTab(tab);
      onSelectedUbicacionIdChange(recordId);
    },
    [onSelectedUbicacionIdChange],
  );

  const handleVerUbicacion = React.useCallback(
    (ubicacion: NormalizedUbicacion) => abrirPanel(ubicacion.recordId),
    [abrirPanel],
  );

  const onEditarUbicacion = React.useCallback(
    (ubicacion: NormalizedUbicacion) => abrirPanel(ubicacion.recordId, "configuracion"),
    [abrirPanel],
  );

  const columns = useMemo(
    () => getUbicacionesColumns(handleVerUbicacion, onEditarUbicacion),
    [handleVerUbicacion, onEditarUbicacion],
  );

  const table = useReactTable({
    data: normalizedUbicaciones,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  // Grid y lista salen de las mismas filas de la tabla (la página que regresó
  // el back), así las tres vistas muestran lo mismo.
  const rowModel = table.getRowModel();

  const photoRecords: PhotoRecord[] = useMemo(
    () => rowModel.rows.map((row) => formatPhotoRecord(row.original, "ubicacion")),
    [rowModel],
  );

  const listRecords: ListRecord[] = useMemo(
    () => rowModel.rows.map((row) => formatListRecord(row.original, "ubicacion")),
    [rowModel],
  );

  const ubicacionPorRecordId = useMemo(
    () => new Map(normalizedUbicaciones.map((u) => [u.recordId, u])),
    [normalizedUbicaciones],
  );

  const handleRecordClick = React.useCallback(
    (record: PhotoRecord | ListRecord) => {
      const recordId = (record as any)?.rawData?.record_id || "";
      abrirPanel(recordId);
    },
    [abrirPanel],
  );

  const iconButtonClass =
    "p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95";

  const renderUbicacionActions = React.useCallback(
    (record: PhotoRecord | ListRecord) => {
      const ubicacion = ubicacionPorRecordId.get((record as any)?.rawData?.record_id || "");
      if (!ubicacion) return null;
      return (
        <PhotoGridActionButtons
          actions={[
            <div
              key="editar"
              className={iconButtonClass}
              title="Editar ubicación"
              onClick={() => onEditarUbicacion(ubicacion)}
            >
              <Pencil className="w-4 h-4" />
            </div>,
          ]}
        />
      );
    },
    [ubicacionPorRecordId, onEditarUbicacion],
  );

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

        <div className="flex-1 min-w-0">
          {viewMode === "photos" ? (
            <PhotoGridView
              isLoading={isLoading}
              records={photoRecords}
              onRecordClick={handleRecordClick}
            >
              {renderUbicacionActions}
            </PhotoGridView>
          ) : viewMode === "list" ? (
            <PhotoListView
              isLoading={isLoading}
              records={listRecords}
              onRecordClick={handleRecordClick}
            >
              {renderUbicacionActions}
            </PhotoListView>
          ) : (
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
                            <span className="text-base text-slate-400">Cargando ubicaciones...</span>
                          </div>
                        ) : (
                          <span className="text-base text-slate-400 font-normal">
                            No se encontraron ubicaciones. Selecciona una ubicación en el menú superior.
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <UbicacionDetallePanel
        recordId={selectedUbicacionId}
        initialTab={panelTab}
        onOpenChange={(open) => {
          if (open) return;
          onSelectedUbicacionIdChange(null);
          setPanelTab("generales");
        }}
      />
    </div>
  );
};

export default UbicacionesExplorerTable;
