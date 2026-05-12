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
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { EliminarIncidenciaModal } from "@/components/modals/delete-incidencia-modal";
import { convertirDateToISO } from "@/lib/utils";
import { EditarIncidenciaModal } from "@/components/modals/editar-incidencia";
import { SeguimientoIncidenciaLista } from "@/components/modals/add-seguimientos";
import { Incidencia_record, getIncidenciasRondinesColumns } from "./incidencias-rondines-columns";
import { ViewIncidenciaRondin } from "@/components/modals/view-incidencia-rondin";
import { AddIncidenciaRondinesModal } from "@/components/modals/add-incidencia-rondines";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { useIncidenciaRondin } from "@/hooks/Rondines/useRondinIncidencia";
import { applyIncidenciasFilters } from "@/hooks/Rondines/incidencias/useIncidenciasFilters ";

interface ListProps {
  showTabs: boolean;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  resetTableFilters: () => void;
  setSelectedIncidencias: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIncidencias: string[];
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  viewMode?: "table" | "photos" | "list";
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros: React.Dispatch<React.SetStateAction<number | 0>>;
  searchTags?: string[];
}

export const incidenciasColumnsCSV = [
  { label: 'Folio', key: 'folio' },
  { label: 'Ubicacion', key: 'ubicacion_incidencia' },
  { label: 'Lugar del Incidente', key: 'area_incidencia' },
  { label: 'Fecha y hora', key: 'fecha_hora_incidencia' },
  { label: 'Comentarios', key: 'comentario_incidencia' },
  { label: 'Reporta', key: 'reporta_incidencia' },
];

const IncidenciasRondinesTable: React.FC<ListProps> = ({
  openModal,
  setOpenModal,
  setSelectedIncidencias,
  selectedIncidencias,
  viewMode,
  externalFilters,
  onExternalFiltersChange,
  filtersConfig,
  setTotalRegistros,searchTags,
}) => {
  const { listIncidenciasRondin, isLoading } = useIncidenciaRondin("", "");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [tabSelected, setTabSelected] = useState("datos");
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalEliminarMultiAbierto, setModalEliminarMultiAbierto] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia_record | null>(null);
  const [setSeguimientos] = useState<any>([]);
  const [editarSeguimiento, setEditarSeguimiento] = useState(false);
  const [seguimientoSeleccionado] = useState(null);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  useEffect(() => {
    if (Array.isArray(listIncidenciasRondin)) {
      setTotalRegistros(listIncidenciasRondin.length);
    }
  }, [listIncidenciasRondin, setTotalRegistros]);

  // const handleEditar = (incidencia: Incidencia_record) => {
  //   setIncidenciaSeleccionada(incidencia);
  //   setModalEditarAbierto(true);
  // };

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

  const columns = useMemo(
    () => getIncidenciasRondinesColumns(handleEliminar, handleSeguimiento, handleVer),
    []
  );

  useEffect(() => {
    if (searchTags && searchTags.length > 0) {
      setGlobalFilter(searchTags.join("|"));
    } else {
      setGlobalFilter("");
    }
  }, [searchTags]);

  const memoizedData = useMemo(() => listIncidenciasRondin || [], [listIncidenciasRondin]);

  const filteredData = useMemo(() => {
    return applyIncidenciasFilters(memoizedData, externalFilters);
  }, [memoizedData, externalFilters]);
  
  const table = useReactTable({
    data: filteredData??[],
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
    
      console.log("filterValue raw:", filterValue); // ← temporal
    
      const tags = filterValue.split("|").filter(Boolean).map(normalize);
    
      console.log("tags normalizados:", tags); // ← temporal
    
      const raw = row.original as any;
      const allValues = normalize([
        raw?.folio || "",
        raw?.incidente || "",
        raw?.categoria || "",
        raw?.subcategoria || "",
        raw?.area_incidente || "",
        raw?.ubicacion_incidente || "",
        raw?.comentarios || "",
        raw?.nombre_del_recorrido || "",
        raw?.accion_tomada || "",
      ].join(" "));
    
      console.log("allValues sample:", allValues.substring(0, 100)); // ← temporal
    
      return tags.some((tag) => allValues.includes(tag));
    },
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  React.useEffect(() => {
    if (table.getFilteredSelectedRowModel().rows.length > 0) {
      const folios: any[] = [];
      table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
      setSelectedIncidencias(folios);
    }
  }, [table.getFilteredSelectedRowModel().rows]);

  useEffect(() => {
    setTotalRegistros(filteredData.length);
  }, [filteredData, setTotalRegistros]);

  const photoListRecords: ListRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatListRecord({
        ...item,
        _id: `incidencia-${index}-${item._id || item.id || item.folio || index}`,
      }, "rondin_incidencia")
    );
  }, [filteredData]);

  const photoRecords: PhotoRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatPhotoRecord({
        ...item,
        _id: `incidencia-${index}-${item._id || item.id || item.folio || index}`,
      }, "rondin_incidencia")
    );
  }, [filteredData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderActions = (_record: PhotoRecord | ListRecord) => null;

  return (
    <div className="w-full">

      <div className="flex w-full justify-end">
        <EliminarIncidenciaModal
          title="Eliminar Incidencias"
          arrayFolios={selectedIncidencias}
          modalEliminarAbierto={modalEliminarMultiAbierto}
          setModalEliminarAbierto={setModalEliminarMultiAbierto}
        />

        {modalVerAbierto && incidenciaSeleccionada && (
          <ViewIncidenciaRondin
            title="Información de la Incidencia"
            data={incidenciaSeleccionada}
            isSuccess={modalVerAbierto}
            tab={tabSelected}
            setTab={setTabSelected}
            setIsSuccess={setModalVerAbierto}>
            <div className="cursor-pointer" title="Ver Incidencia">
              <Eye />
            </div>
          </ViewIncidenciaRondin>
        )}

        {modalEditarAbierto && incidenciaSeleccionada && (
          <EditarIncidenciaModal
            title="Editar Incidencia"
            selectedIncidencia={incidenciaSeleccionada.incidencia}
            data={incidenciaSeleccionada}
            modalEditarAbierto={modalEditarAbierto}
            setModalEditarAbierto={setModalEditarAbierto}
            onClose={() => setModalEditarAbierto(false)}
            tab={tabSelected}
            setTab={setTabSelected}
          />
        )}

        {modalEliminarAbierto && incidenciaSeleccionada && (
          <EliminarIncidenciaModal
            title="Eliminar Incidencias"
            arrayFolios={[incidenciaSeleccionada.folio]}
            modalEliminarAbierto={modalEliminarAbierto}
            setModalEliminarAbierto={(state) => {
              setModalEliminarMultiAbierto(state);
              if (!state) {
                setSelectedIncidencias([]);
                setRowSelection({});
                setModalEliminarAbierto(state);
              }
            }}
          />
        )}

        <AddIncidenciaRondinesModal title="Crear incidencia" isSuccess={openModal} setIsSuccess={setOpenModal} />

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
            dateIncidencia={incidenciaSeleccionada.fecha_hora_incidencia
              ? convertirDateToISO(new Date(incidenciaSeleccionada.fecha_hora_incidencia))
              : ""}
            enviarSeguimiento={true}
            folioIncidencia={incidenciaSeleccionada.folio}
            estatusIncidencia={incidenciaSeleccionada.estatus}>
            <div />
          </SeguimientoIncidenciaLista>
        )}
      </div>

      {/* Vistas */}
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
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                <Table className="text-xs">
                  <TableHeader style={{ backgroundColor: '#DBEAFE' }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
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
              globalSearch={[globalFilter]}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
              {renderActions}
            </PhotoGridView>
          ) : (
            <PhotoListView
              isLoading={isLoading}
              records={photoListRecords}
              globalSearch={[globalFilter]}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
              {renderActions}
            </PhotoListView>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidenciasRondinesTable;