/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Fallas_record, getFallasColumns } from "./fallas-columns";
import { EliminarFallaModal } from "@/components/modals/delete-falla-modal";
import { useEffect, useMemo, useState } from "react";
import { EditarFallaModal } from "@/components/modals/editar-falla";
import { ViewFalla } from "@/components/modals/view-falla";
import { SeguimientoFallaCerrarModal } from "@/components/modals/add-seguimiento-falla-cerrar";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { ViewMode } from "@/lib/utils";
import { applyFallasFilters } from "@/hooks/Fallas/useFallasFIlter";

interface ListProps {
  data: Fallas_record[];
  isLoading: boolean;
  openModal: () => void;
  resetTableFilters: () => void;
  setSelectedFallas: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFallas: string[];
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  viewMode: ViewMode;
  searchTags?: string[];
  setTotalRegistros?: React.Dispatch<React.SetStateAction<number>>;
  activeFiltersCount?: number;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
}

export const fallasColumnsCSV = [
  { label: "Folio", key: "folio" },
  { label: "Fecha y hora", key: "falla_fecha_hora" },
  { label: "Estado", key: "falla_estatus" },
  { label: "Ubicacion", key: "falla_ubicacion" },
  { label: "Lugar del Fallo", key: "falla_caseta" },
  { label: "Falla", key: "falla" },
  { label: "Comentarios", key: "falla_comentarios" },
  { label: "Reporta", key: "falla_reporta_nombre" },
  { label: "Responsable", key: "falla_responsable_solucionar_nombre" },
];

const FallasTable: React.FC<ListProps> = ({
  isLoading, data, setSelectedFallas, viewMode,
  searchTags, setTotalRegistros,  externalFilters,onExternalFiltersChange,filtersConfig
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalVerSeguimientoAbierto, setModalVerSeguimientoAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalEliminarMultiAbierto, setModalEliminarMultiAbierto] = useState(false);
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);
  const [fallaSeleccionada, setFallaSeleccionada] = useState<Fallas_record | null>(null);
  const [editarSeguimiento, setEditarSeguimiento] = useState<any>(false);
  const [setSeguimientos] = useState<any>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join("|"));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);

  const handleEliminar = (falla: Fallas_record) => {
    setFallaSeleccionada(falla);
    setModalEliminarAbierto(true);
  };

  const handleCerrar = (falla: Fallas_record) => {
    setFallaSeleccionada(falla);
    setModalCerrarAbierto(true);
  };

  const handleVer = (falla: Fallas_record) => {
    setFallaSeleccionada(falla);
    setModalVerSeguimientoAbierto(true);
  };

  const columns = useMemo(() => {
    if (isLoading) return [];
    return getFallasColumns(handleEliminar, handleCerrar, handleVer);
  }, [isLoading]);

  const memoizedData = useMemo(() => data || [], [data]);

  const filteredData = useMemo(() => {
    console.log("externalFilters:", JSON.stringify(externalFilters));
    return applyFallasFilters(memoizedData, externalFilters ?? { dynamic: {} });
  }, [memoizedData, externalFilters]);


  useEffect(() => {
    setTotalRegistros?.(filteredData.length);
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  React.useEffect(() => {
    if (table.getFilteredSelectedRowModel().rows.length > 0) {
      const folios: any[] = [];
      table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
      setSelectedFallas(folios);
    }
  }, [table.getFilteredSelectedRowModel().rows]);

  const fallaPhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatPhotoRecord(item, "falla"));
  }, [filteredData]);

  const fallaListRecords: ListRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatListRecord(item, "falla"));
  }, [filteredData]);

  return (
    <div className="w-full">
      <EliminarFallaModal
        title="Eliminar Falla"
        arrayFolios={[]}
        setModalEliminarAbierto={setModalEliminarMultiAbierto}
        modalEliminarAbierto={modalEliminarMultiAbierto}
      />
      {modalEditarAbierto && fallaSeleccionada && (
        <EditarFallaModal
          title="Editar Falla"
          data={fallaSeleccionada}
          modalEditarAbierto={modalEditarAbierto}
          setModalEditarAbierto={setModalEditarAbierto}
          onClose={() => setModalEditarAbierto(false)}
        />
      )}
      {modalVerSeguimientoAbierto && fallaSeleccionada && (
        <ViewFalla
          title="Información de la Falla"
          data={fallaSeleccionada}
          isSuccess={modalVerSeguimientoAbierto}
          setIsSuccess={setModalVerSeguimientoAbierto}
          setModalEditarAbierto={setModalEditarAbierto}>
          <div />
        </ViewFalla>
      )}
      {modalCerrarAbierto && fallaSeleccionada && (
        <SeguimientoFallaCerrarModal
          title="Seguimiento Falla"
          isSuccess={modalCerrarAbierto}
          setIsSuccess={setModalCerrarAbierto}
          setSeguimientos={setSeguimientos}
          indice={0}
          editarSeguimiento={editarSeguimiento}
          setEditarSeguimiento={setEditarSeguimiento}
          seguimientoSeleccionado={null}
          dateIncidencia={""}
          enviarSeguimiento={true}
          folioIncidencia={fallaSeleccionada.folio}>
          <div />
        </SeguimientoFallaCerrarModal>
      )}
      {modalEliminarAbierto && fallaSeleccionada && (
        <EliminarFallaModal
          title="Eliminar Falla"
          arrayFolios={[fallaSeleccionada.folio]}
          modalEliminarAbierto={modalEliminarAbierto}
          setModalEliminarAbierto={setModalEliminarAbierto}
        />
      )}

      {/* Vistas */}
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
            <div className="border border-slate-200 rounded-md bg-white shadow-sm">
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
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} de{" "}
                  {table.getFilteredRowModel().rows.length} registros seleccionados.
                </div>
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
              records={fallaPhotoRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            />
          )}

          {viewMode === "list" && (
            <PhotoListView
              isLoading={isLoading}
              records={fallaListRecords}
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

export default FallasTable;