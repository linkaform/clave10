/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState, Row, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  Table as TanstackTable
} from "@tanstack/react-table";
import { CalendarDays, Eraser, FileX2, LayoutGrid, LayoutList, Plus, Search, Sheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Incidencia_record, OptionsCell } from "./incidencias-columns";
import { useMemo, useState } from "react";
import { EliminarIncidenciaModal } from "@/components/modals/delete-incidencia-modal";
import { catalogoFechas, convertirDateToISO, downloadCSV } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateTime from "@/components/dateTime";
import { EditarIncidenciaModal } from "@/components/modals/editar-incidencia";
import ViewImage from "@/components/modals/view-image";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewIncidencia } from "@/components/modals/view-incidencia";
import { SeguimientoIncidenciaLista } from "@/components/modals/add-seguimientos";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { TagSearchInput } from "@/components/tag-search-input";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { applyIncidenciasFilters, useIncidenciasFilters } from "@/hooks/bitacora/useIncidenciasFilters";

type ViewMode = "table" | "photos" | "list";

interface ListProps {
  data: Incidencia_record[];
  isLoading: boolean;
  openModal: () => void;
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
}

const incidenciasColumnsCSV = [
  { label: "Folio", key: "folio" },
  { label: "Ubicacion", key: "ubicacion_incidencia" },
  { label: "Lugar del Incidente", key: "area_incidencia" },
  { label: "Fecha y hora", key: "fecha_hora_incidencia" },
  { label: "Comentarios", key: "comentario_incidencia" },
  { label: "Reporta", key: "reporta_incidencia" },
];

const IncidenciasTable: React.FC<ListProps> = ({
  data, isLoading, openModal, setSelectedIncidencias, selectedIncidencias,
  setDate1, setDate2, date1, date2, dateFilter, setDateFilter, Filter, resetTableFilters,
}) => {
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
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 23 });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useIncidenciasFilters();

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
    return [
      {
        id: "select",
        cell: ({ row }: { row: Row<Incidencia_record> }) => (
          <div className="flex space-x-3 items-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
            <OptionsCell row={row} onEditarClick={handleEditar} onEliminarClick={handleEliminar} onSeguimientoClick={handleSeguimiento} onView={() => { handleVer(row.original); }} />
          </div>
        ),
        header: ({ table }: { table: TanstackTable<Incidencia_record> }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }: { row: Row<Incidencia_record> }) => <div className="capitalize">{row.getValue("folio")}</div>,
        enableSorting: true,
      },
      {
        accessorKey: "estatus",
        header: "Estatus",
        cell: ({ row }: { row: Row<Incidencia_record> }) => {
          const estatus = row.getValue("estatus") as string;
          const colorClass = estatus?.toLowerCase() === "abierto" ? "text-green-600"
            : estatus?.toLowerCase() === "cerrado" ? "text-red-600" : "text-gray-600";
          return <div className={`capitalize font-bold ${colorClass}`}>{estatus}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "area_incidencia",
        header: "Lugar del incidente",
        cell: ({ row }: { row: Row<Incidencia_record> }) => <div className="capitalize">{row.getValue("area_incidencia")}</div>,
        enableSorting: true,
      },
      {
        id: "incidencia",
        header: "Incidencia",
        accessorFn: (row: Incidencia_record) => `${row.categoria} / ${row.sub_categoria} / ${row.incidencia}`,
        cell: ({ row }: { row: Row<Incidencia_record> }) => {
          const { categoria, sub_categoria, incidencia } = row.original;
          return <div className="capitalize">{`${categoria} / ${sub_categoria} / ${incidencia}`}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "comentario_incidencia",
        header: "Descripción",
        cell: ({ row }: { row: Row<Incidencia_record> }) => (
          <span className="px-4 py-2 block max-w-xs truncate" title={row.getValue("comentario_incidencia") || "-"}>
            {row.getValue("comentario_incidencia")}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "evidencia_incidencia",
        header: "Evidencia",
        cell: ({ row }: { row: Row<Incidencia_record> }) => {
          const foto = row.original.evidencia_incidencia;
          return <ViewImage imageUrl={foto ?? []} />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "fecha_hora_incidencia",
        header: "Fecha",
        cell: ({ row }: { row: Row<Incidencia_record> }) => <div className="capitalize">{row.getValue("fecha_hora_incidencia")}</div>,
        enableSorting: true,
      },
      {
        id: "tags",
        header: "Tags",
        accessorFn: (row: { tags: any[] }) => Array.isArray(row.tags) ? row.tags.join(", ") : "",
        cell: ({ getValue }: { getValue: () => string }) => {
          const value = getValue();
          const tagsArray = value ? value.split(",").map(tag => tag.trim()) : [];
          return (
            <div className="flex flex-wrap gap-1">
              {tagsArray.map((tag, idx) => (
                <span key={idx} className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded capitalize">{tag}</span>
              ))}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "reporta_incidencia",
        header: "Reporta",
        cell: ({ row }: { row: Row<Incidencia_record> }) => <div>{row.getValue("reporta_incidencia")}</div>,
        enableSorting: true,
      },
    ];
  }, [isLoading, handleEditar]);

  const memoizedData = useMemo(() => data || [], [data]);

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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  React.useEffect(() => {
    if (table.getFilteredSelectedRowModel().rows.length > 0) {
      const folios: any[] = [];
      table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
      setSelectedIncidencias(folios);
    }
  }, [table.getFilteredSelectedRowModel().rows]);

  const filteredData = useMemo(
    () => applyIncidenciasFilters(memoizedData, externalFilters),
    [memoizedData, externalFilters]
  );

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
      {viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={externalFilters}
          onFiltersChange={onExternalFiltersChange}
          filtersConfig={filtersConfig}
        />
      )}

      <div className="flex justify-between items-center my-2">
        <div className="flex w-1/2 justify-start gap-4">
          <div className="flex">
            <TabsList className="bg-blue-500 text-white">
              <TabsTrigger value="Incidencias">Incidencias</TabsTrigger>
              <TabsTrigger value="Fallas">Fallas</TabsTrigger>
            </TabsList>
          </div>

          {viewMode === "table" ? (
            <div className="flex w-full max-w-sm items-center space-x-2">
              <input
                type="text"
                placeholder="Buscar"
                value={globalFilter || ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="border border-gray-300 rounded-md p-2 placeholder-gray-600 w-full"
              />
              <Search />
            </div>
          ) : (
            <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[240px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
              <Search className="ml-2 mr-1 flex-shrink-0 text-slate-400" size={14} />
              <TagSearchInput
                tags={searchTags}
                onTagsChange={setSearchTags}
                placeholder="Buscar..."
                className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 h-8 text-sm min-w-0 px-1"
              />
            </div>
          )}
        </div>

        <div className="flex w-full justify-end gap-3">
          {dateFilter === "range" && (
            <div className="flex items-center gap-2 mr-14">
              <DateTime date={date1} setDate={setDate1} disablePastDates={false} />
              <DateTime date={date2} setDate={setDate2} disablePastDates={false} />
              <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={Filter}>Filtrar</Button>
              <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={resetTableFilters}><Eraser /></Button>
            </div>
          )}

          <div className="flex items-center w-48 gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un filtro de fecha" />
              </SelectTrigger>
              <SelectContent>
                {catalogoFechas().map((option: any) => (
                  <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CalendarDays />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center bg-slate-100/50 h-9 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
              <Button variant="ghost" size="icon"
                className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "photos" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode("photos")}>
                <LayoutGrid size={16} />
              </Button>
              <Button variant="ghost" size="icon"
                className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "table" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode("table")}>
                <Sheet size={16} />
              </Button>
              <Button variant="ghost" size="icon"
                className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode("list")}>
                <LayoutList size={16} />
              </Button>
            </div>

            <Button className="w-full md:w-auto bg-green-500 hover:bg-green-600" onClick={openModal}>
              <Plus /> Nuevo Incidente
            </Button>

            <Button className="w-full md:w-auto bg-blue-500 hover:bg-blue-600" onClick={() => downloadCSV(selectedIncidencias, incidenciasColumnsCSV, "incidencias.csv")}>
              <FileX2 /> Descargar
            </Button>

            <Button variant="destructive" onClick={() => setModalEliminarMultiAbierto(true)} disabled={selectedIncidencias.length === 0}>
              <Trash2 /> Eliminar
            </Button>

            <EliminarIncidenciaModal title="Eliminar Incidencias" arrayFolios={selectedIncidencias}
              modalEliminarAbierto={modalEliminarMultiAbierto}
              setModalEliminarAbierto={setModalEliminarMultiAbierto} />

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
          </div>
        </div>
      </div>

      {viewMode === "table" && (
        <div>
          <Table>
            <TableHeader className="bg-blue-100 hover:bg-blue-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-1 pl-1">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-24 text-center">
                    {isLoading
                      ? <div className="text-xl font-semibold">Cargando registros...</div>
                      : <div className="text-xl font-semibold">No hay registros disponibles...</div>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            {!isLoading && (
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} items seleccionados.
              </div>
            )}
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "photos" && (
        <div className="flex gap-4">
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
            <FiltersPanel
              filters={externalFilters}
              onFiltersChange={onExternalFiltersChange}
              filtersConfig={filtersConfig}
            />
          </aside>
          <div className="flex-1 min-w-0">
            <PhotoGridView
              isLoading={isLoading}
              records={incidenciaPhotoRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            />
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex gap-4">
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
            <FiltersPanel
              filters={externalFilters}
              onFiltersChange={onExternalFiltersChange}
              filtersConfig={filtersConfig}
            />
          </aside>
          <div className="flex-1 min-w-0">
            <PhotoListView
              isLoading={isLoading}
              records={incidenciaListRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidenciasTable;