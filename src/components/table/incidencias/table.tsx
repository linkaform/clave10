/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getIncidenciasColumns, Incidencia_record } from "./incidencias-columns";
import { useEffect, useMemo, useState } from "react";
import { EliminarIncidenciaModal } from "@/components/modals/delete-incidencia-modal";
import { convertirDateToISO } from "@/lib/utils";
import { EditarIncidenciaModal } from "@/components/modals/editar-incidencia";
import { ViewIncidencia } from "@/components/modals/view-incidencia";
import { SeguimientoIncidenciaLista } from "@/components/modals/add-seguimientos";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { applyIncidenciasFilters } from "@/hooks/Incidencias/useIncidenciasFilters";

type ViewMode = "table" | "photos" | "list";

interface ListProps {
  data: Incidencia_record[];
  isLoading: boolean;
  openModal: () => void;
  resetTableFilters: () => void;
  setSelectedIncidencias: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIncidencias: string[];
  dateFilter: string;
  setDateFilter: (val: string) => void;
  Filter: () => void;
  setModalEliminarMultiAbierto: React.Dispatch<React.SetStateAction<boolean>>;
  modalEliminarMultiAbierto?:boolean
  viewMode: ViewMode
  setTotalRegistros?: React.Dispatch<React.SetStateAction<number>>;
  filtersConfig?: any[];
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (v: boolean) => void;
  searchTags?: string[];
  activeFiltersCount?: number;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
}

export const incidenciasColumnsCSV = [
  { label: "Folio", key: "folio" },
  { label: "Ubicacion", key: "ubicacion_incidencia" },
  { label: "Lugar del Incidente", key: "area_incidencia" },
  { label: "Fecha y hora", key: "fecha_hora_incidencia" },
  { label: "Comentarios", key: "comentario_incidencia" },
  { label: "Reporta", key: "reporta_incidencia" },
];

const IncidenciasTable: React.FC<ListProps> = ({
  data, 
  isLoading, 
  setSelectedIncidencias, 
  selectedIncidencias,
  setModalEliminarMultiAbierto,
  modalEliminarMultiAbierto=false,
  viewMode, 
  setTotalRegistros,
  searchTags,
  filtersConfig,
  externalFilters,
  onExternalFiltersChange,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [tabSelected, setTabSelected] = useState("datos");
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia_record | null>(null);
  const [setSeguimientos] = useState<any>([]);
  const [editarSeguimiento, setEditarSeguimiento] = useState(false);
  const [seguimientoSeleccionado] = useState(null);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 23 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleEditar = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalEditarAbierto(true);
  };

  const handleEliminar = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalEliminarAbierto(true);
  };

  const handleSeguimiento = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalSeguimientoAbierto(true);
  };

  const handleVer = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalVerAbierto(true);
  };

  const columns = useMemo(() => {
    if (isLoading) return [];
    return getIncidenciasColumns(handleEditar, handleEliminar, handleSeguimiento, handleVer);
  }, [isLoading]);

  const memoizedData = useMemo(() => data || [], [data]);

  const filteredData = useMemo(() => {
    console.log("externalFilters:", JSON.stringify(externalFilters));
    return applyIncidenciasFilters(memoizedData, externalFilters ?? { dynamic: {} });
  }, [memoizedData, externalFilters]);

  React.useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join("|"));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);
  
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
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
  });

    useEffect(() => {
      setTotalRegistros?.(filteredData.length);
    }, [filteredData, setTotalRegistros]);

    useEffect(() => {
      if (table.getFilteredSelectedRowModel().rows.length > 0) {
        const folios: any[] = [];
        table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
        setSelectedIncidencias(folios);
      }
    }, [table.getFilteredSelectedRowModel().rows]);

  // const onExternalFiltersChange = (newFilters: any) => {
  //   if (newFilters.dateFilter !== undefined)
  //     setDateFilter?.(newFilters.dateFilter);
  //   if (newFilters.date1 !== undefined) setDate1?.(newFilters.date1);
  //   if (newFilters.date2 !== undefined) setDate2?.(newFilters.date2);
  //   if (newFilters.dynamic !== undefined) {
  //     setDynamicFilters(newFilters.dynamic);
  //   }
  // };

  const incidenciaPhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatPhotoRecord(item, "incidencia"));
  }, [filteredData]);

  const incidenciaListRecords: ListRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatListRecord(item, "incidencia"));
  }, [filteredData]);

  
  return (
    <div className="w-full">
      {/* Modales fuera del layout */}
      <EliminarIncidenciaModal title="Eliminar Incidencias" arrayFolios={selectedIncidencias}
        modalEliminarAbierto={modalEliminarMultiAbierto}
        setModalEliminarAbierto={setModalEliminarMultiAbierto}/>
  
      {modalVerAbierto && incidenciaSeleccionada && (
        <ViewIncidencia
          title="Información de la Incidencia"
          data={incidenciaSeleccionada} isSuccess={modalVerAbierto}
          tab={tabSelected} setTab={setTabSelected}
          setIsSuccess={setModalVerAbierto} setModalEditarAbierto={setModalEditarAbierto}>
          <div />
        </ViewIncidencia>
      )}
  
      {modalEditarAbierto && incidenciaSeleccionada && (
        <EditarIncidenciaModal
          title="Editar Incidencia"
          selectedIncidencia={incidenciaSeleccionada.incidencia}
          data={incidenciaSeleccionada}
          modalEditarAbierto={modalEditarAbierto}
          setModalEditarAbierto={setModalEditarAbierto}
          onClose={() => setModalEditarAbierto(false)}
          tab={tabSelected} setTab={setTabSelected}
        />
      )}
  
      {modalEliminarAbierto && incidenciaSeleccionada && (
        <EliminarIncidenciaModal title="Eliminar Incidencias" arrayFolios={[incidenciaSeleccionada.folio]}
          modalEliminarAbierto={modalEliminarAbierto}
          setModalEliminarAbierto={(state) => {
            setModalEliminarMultiAbierto(state);
            if (!state) { setSelectedIncidencias([]); setRowSelection({}); setModalEliminarAbierto(state); }
          }} />
      )}
  
      {modalSeguimientoAbierto && incidenciaSeleccionada && (
        <SeguimientoIncidenciaLista
          title="Seguimiento Incidencia"
          isSuccess={modalSeguimientoAbierto}
          setIsSuccess={setModalSeguimientoAbierto}
          seguimientoSeleccionado={seguimientoSeleccionado}
          setSeguimientos={setSeguimientos}
          setEditarSeguimiento={setEditarSeguimiento}
          editarSeguimiento={editarSeguimiento}
          indice={0}
          dateIncidencia={incidenciaSeleccionada.fecha_hora_incidencia ? convertirDateToISO(new Date(incidenciaSeleccionada.fecha_hora_incidencia)) : ""}
          enviarSeguimiento={true}
          folioIncidencia={incidenciaSeleccionada.folio}
          estatusIncidencia={incidenciaSeleccionada.estatus}>
          <div />
        </SeguimientoIncidenciaLista>
      )}
  
      {/* Layout principal */}
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
                          <TableHead key={header.id}
                            className="text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none">
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
                              className="py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-32 text-center">
                          {isLoading ? (
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
                              <span className="text-xs font-normal">Cargando registros...</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 font-normal">No hay registros disponibles...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                {!isLoading && (
                  <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} items seleccionados.
                  </div>
                )}
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
                </div>
              </div>
            </>
          )}
  
          {viewMode === "photos" && (
            <PhotoGridView
              isLoading={isLoading}
              records={incidenciaPhotoRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            />
          )}
  
          {viewMode === "list" && (
            <PhotoListView
              isLoading={isLoading}
              records={incidenciaListRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidenciasTable;