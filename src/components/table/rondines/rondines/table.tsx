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
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { PhotoRondinCardModal } from "@/components/Bitacoras/PhotoList/PhotoRondinCardModal";
import { getBitacorasRondinesColumns } from "./rondines-columnas";
import { useGetListRondines } from "@/hooks/Rondines/useGetListBitacoraRondines";

export interface BitacoraRondin {
  id: string;
  folio: string;
  created_at: string;
  updated_at: string;
  ubicacion: string;
  nombre_recorrido: string;
  asignado_a: string;
  tipo_rondin: string;
  fecha_hora_programada_inicio: string;
  fecha_hora_inicio: string;
  estatus_recorrido: string;
  duracion_rondin: string | number;
  motivo_cancelacion: string;
  comentario_general: string;
  comentarios_generales: any[];
  porcentaje_avance: string | number;
  cantidad_areas_inspeccionadas: string | number;
  total_checks: number;
  areas: {
    area: string;
    detalle: {
      area: string;
      checks_mes: any[];
      fotos: { file_name: string; file_url: string }[];
      hora_de_check: string;
      ubicacion: string;
      tiempo_traslado: string | number;
      comentarios: string;
      incidencias: any[];
    };
  }[];
  incidencias: any[];
}

interface RondinesTableProps {
  viewMode?: "table" | "photos" | "list";
  searchTags?: string[];
  ubicacion?: string;
  showTabs?: boolean;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
}

const RondinesTable: React.FC<RondinesTableProps> = ({
  viewMode = "table",
  searchTags,
  externalFilters,
  onExternalFiltersChange,
  filtersConfig,
}) => {
  const { listRondines, isLoadingListRondines: isLoading } = useGetListRondines(true, "", "", 100, 0);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rondinSeleccionado, setRondinSeleccionado] = useState<BitacoraRondin | null>(null);
  const [modalVerAbierto, setModalVerAbierto] = useState(false);

  React.useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join(" "));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);

  const handleVer = (rondin: BitacoraRondin) => {
    setRondinSeleccionado(rondin);
    setModalVerAbierto(true);
  };

  const memoizedData = useMemo(
    () => (Array.isArray(listRondines) ? listRondines : []) as BitacoraRondin[],
    [listRondines]
  );

  const columns = useMemo(
    () => getBitacorasRondinesColumns(handleVer),
    [handleVer]
  );

  const table = useReactTable({
    data: memoizedData,
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
      const tags = filterValue.toLowerCase().split(" ").filter(Boolean);
      const allValues = row
        .getAllCells()
        .map((cell) => String(cell.getValue() || "").toLowerCase())
        .join(" ");
      return tags.some((tag) => allValues.includes(tag));
    },
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  const photoListRecords: ListRecord[] = useMemo(() => {
    return memoizedData.map((item: any, index: number) =>
      formatListRecord({
        ...item,
        _id: `rondin-bitacora-${index}-${item.id || index}`,
      }, "check_ubicacion")
    );
  }, [memoizedData]);

  const photoRecords: PhotoRecord[] = useMemo(() => {
    return memoizedData.map((item: any, index: number) =>
      formatPhotoRecord({
        ...item,
        _id: `rondin-bitacora-${index}-${item.id || index}`,
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
              filters={externalFilters ?? { dynamic: {}, dateFilter: "", date1: "", date2: "" }}
              onFiltersChange={onExternalFiltersChange ?? (() => {})}
              filtersConfig={filtersConfig ?? []}
            />
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {viewMode === "table" ? (
            <>
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
                <Table className="text-xs">
                  <TableHeader style={{ backgroundColor: '#DBEAFE' }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            style={{ color: '#475569', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px' }}>
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
                          className="hover:bg-slate-100 transition-colors border-slate-50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{ padding: '8px 12px', fontSize: '12px', borderRight: '1px solid #f1f5f9' }}
                              className="last:border-r-0 font-normal">
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
                            <span className="text-xs text-slate-300 font-normal">No se encontraron registros</span>
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

      <PhotoRondinCardModal
        record={rondinSeleccionado as any}
        open={modalVerAbierto}
        onOpenChange={setModalVerAbierto}
        mapData={rondinSeleccionado?.areas?.flatMap((a) =>
          a.detalle?.fotos?.length > 0
            ? [{ id: a.area, nombre_area: a.area, geolocation_area: { latitude: 0, longitude: 0 } }]
            : []
        )}
      />
    </div>
  );
};

export default RondinesTable;