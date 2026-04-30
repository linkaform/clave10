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
import {
  Loader2, MoveLeft, Pause, Play, Search, Trash,
  MapPin, Clock, RefreshCw, User, AlertCircle,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getRecorridosColumns, Recorrido } from "./recorridos-columns";
import { AddRondinModal } from "@/components/modals/add-rondin";
import { useEffect, useMemo, useState } from "react";
import { EliminarRondinModal } from "@/components/modals/delete-rondin-modal";
import { useGetRondinById } from "@/hooks/Rondines/useGetRondinById";
import dynamic from "next/dynamic";
import { usePlayOrPauseRondin } from "@/hooks/Rondines/usePlayOrPauseROndin";
import { AreasList } from "@/components/areas-list-draggable";
import { useEditAreasRondin } from "@/hooks/Rondines/useEditAreasRondin";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { useRondinesFilters, applyRondinesFilters } from "@/hooks/bitacora/useRondinesFilters";
import { useGetListRecorridos } from "@/hooks/Rondines/useGetListRecorridos";

const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

type ViewMode = "table" | "photos" | "list";


export interface GeoLocation { latitude: number; longitude: number; }
export interface GeoLocationSearch extends GeoLocation { search_txt: string; }
export interface ImageData { nombre_area: string; id: string; foto_area: string; }

export interface MapItem {
  nombre_area: string;
  geolocation_area?: { latitude: number; longitude: number };
  id: string;
  foto_area?: { file_name: string; file_url: string }[];
}

export interface FotoArea { file_name: string; file_url: string; name: string; }
export interface Area {
  rondin_area: string;
  geolocalizacion_area_ubicacion: GeoLocation[];
  area_tag_id: string[];
  foto_area: FotoArea[];
}
export interface RondinResponse {
  fecha_inicio_rondin: string;
  cantidad_de_puntos: number;
  recurrencia: string;
  asignado_a: string;
  duracion_promedio: number;
  images_data: ImageData[];
  nombre_del_rondin: string;
  ubicacion: string;
  map_data: MapItem[];
  estatus_rondin: string;
  ubicacion_geolocation: GeoLocationSearch;
  duracion_esperada_rondin: string;
  areas: Area[];
}

interface ListProps {
  resetTableFilters: () => void;
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  viewMode?: "table" | "photos" | "list";
  searchTags?: string[];
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros: React.Dispatch<React.SetStateAction<number | 0>>;
}

const RecorridosTable: React.FC<ListProps> = ({
  
  // setDate1, setDate2, date1, date2,
  // dateFilter, setDateFilter, Filter, resetTableFilters,
  setActiveTab,
  viewMode: viewModeProp,
  searchTags: searchTagsProp,
  externalFilters: externalFiltersProp,
  onExternalFiltersChange: onExternalFiltersChangeProp,
  filtersConfig: filtersConfigProp,
  setTotalRegistros
}) => {

  const { listRecorridos, isLoadingListRecorridos: isLoading } = useGetListRecorridos(true, "", "", 100, 0);
  const { playOrPauseRondinMutation, isLoading: isLoadingPlayOrPause } = usePlayOrPauseRondin();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { editAreasRodindMutation, isLoading: isLoadingEditAreas } = useEditAreasRondin();
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [rondinSeleccionado, setRondinSeleccionado] = useState<Recorrido | null>(null);
  const [verRondin, setVerRondin] = useState(false);

  // const { location } = useBoothStore();
  // const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  // const { listIncidenciasRondin } = useIncidenciaRondin("", "");
  // const [openModal, setOpenModal] = useState(false);
  const [viewModeLocal] = useState<ViewMode>("table");
  const viewMode = viewModeProp ?? viewModeLocal;
  // const setViewMode = (v: ViewMode) => setViewModeLocal(v);
  const [areaSearch, setAreaSearch] = useState("");
  const [tipoAsignado, setTipoAsignado] = useState<"guardia" | "persona">("persona");
  const [ubicacionesLS, setUbicacionesLS] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ubicaciones_soter");
      setUbicacionesLS(stored ? JSON.parse(stored) : []);
    } catch {
      setUbicacionesLS([]);
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(listRecorridos)) {
      setTotalRegistros(listRecorridos.length);
    }
  }, [listRecorridos, setTotalRegistros]);

  const {
    externalFilters: externalFiltersLocal,
    onExternalFiltersChange: onExternalFiltersChangeLocal,
    activeFiltersCount,
    filtersConfig: filtersConfigLocal,
    searchTags: searchTagsLocal,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useRondinesFilters();

  const externalFilters = externalFiltersProp ?? externalFiltersLocal;
  const onExternalFiltersChange = onExternalFiltersChangeProp ?? onExternalFiltersChangeLocal;
  const filtersConfig = filtersConfigProp ?? filtersConfigLocal;
  const searchTags = searchTagsProp ?? searchTagsLocal;

  const { data: rondin, isLoadingRondin } = useGetRondinById(
    rondinSeleccionado ? rondinSeleccionado._id : ""
  );

  const handleEliminar = (rondin: Recorrido) => {
    setRondinSeleccionado(rondin);
    setModalEliminarAbierto(true);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleVerRondin = (rondin: Recorrido) => {
    setRondinSeleccionado(rondin);
    setVerRondin(true);
  };
  const [mapKey, setMapKey] = useState(0);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  // React.useEffect(() => {
  //   if (searchTags && searchTags.length > 0) {
  //     setGlobalFilter(searchTags.join(" "));
  //   } else {
  //     setGlobalFilter("");
  //   }
  // }, [searchTags]);

  const columns = useMemo(() => getRecorridosColumns(handleEliminar, handleVerRondin), [handleVerRondin]);
  const memoizedData = useMemo(
    () => (Array.isArray(listRecorridos) ? listRecorridos : []),
    [listRecorridos]
  );

  const table = useReactTable({
    data: memoizedData ?? [],
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

  const handlePlay = () => {
    playOrPauseRondinMutation.mutate({
      record_id: rondinSeleccionado ? rondinSeleccionado._id : "",
      paused: false,
    });
  };

  const handlePause = () => {
    playOrPauseRondinMutation.mutate({
      record_id: rondinSeleccionado ? rondinSeleccionado._id : "",
      paused: true,
    });
  };

  const [areas, setAreas] = useState(rondin?.areas || []);

  const handleGuardar = () => {
    editAreasRodindMutation.mutate({
      areas,
      record_id: rondinSeleccionado ? rondinSeleccionado._id : "",
      folio: rondinSeleccionado ? rondinSeleccionado.folio : "",
    });
  };

  const filteredData = useMemo(
    () => applyRondinesFilters(memoizedData, externalFilters),
    [memoizedData, externalFilters]
  );

  const rondinPhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatPhotoRecord(item, "rondin"));
  }, [filteredData]);

  const rondinListRecords: ListRecord[] = useMemo(() => {
    if (!filteredData?.length) return [];
    return filteredData.map((item: any) => formatListRecord(item, "rondin"));
  }, [filteredData]);
  const filteredAreas = (areas || []).filter((a: any) =>
    (a.rondin_area || "").toLowerCase().includes(areaSearch.toLowerCase())
  );

  // const estatusColor = (estatus: string) => {
  //   if (estatus === "Corriendo") return "text-green-600";
  //   if (estatus === "Cancelado") return "text-red-500";
  //   if (estatus === "Cerrado") return "text-gray-400";
  //   if (estatus === "Programado") return "text-purple-500";
  //   return "text-gray-500";
  // };

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, []); 

  return (
    <div className="w-full">

      {viewMode === "table" && !verRondin && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={externalFilters}
          onFiltersChange={onExternalFiltersChange}
          filtersConfig={filtersConfig}
        />
      )}

      {modalEliminarAbierto && rondinSeleccionado && (
        <EliminarRondinModal
          title="Eliminar Rondin"
          folio={rondinSeleccionado.folio}
          modalEliminarAbierto={modalEliminarAbierto}
          setModalEliminarAbierto={setModalEliminarAbierto}
        />
      )}

            <>
        {rondin && verRondin ? (
          <div className="flex flex-col h-full bg-gray-50 min-h-screen -mx-4 px-4 pt-2">

            {(() => {
              const isPaused = rondin?.estatus_rondin !== "Corriendo";
              const DEMO_PERSONAS = [
                { id: "1", nombre: "Carlos Méndez" },
                { id: "2", nombre: "Laura García" },
                { id: "3", nombre: "Roberto Solis" },
                { id: "4", nombre: "Ana Torres" },
              ];
              const inputClass = (enabled: boolean) =>
                `w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  enabled
                    ? "border-blue-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                }`;
              const selectClass = (enabled: boolean, full = true) =>
                `${full ? "w-full" : ""} px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors appearance-none ${
                  enabled
                    ? "border-blue-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                }`;

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4">
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setRondinSeleccionado(null); setVerRondin(false); setActiveTab("recorridos"); }}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
                        <MoveLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{rondin.nombre_del_rondin}</h2>
                        <AddRondinModal
                          title="Editar Rondín"
                          mode="edit"
                          rondinData={rondinSeleccionado}
                          rondinId={rondinSeleccionado ? rondinSeleccionado._id : ""}
                          folio={rondinSeleccionado ? rondinSeleccionado.folio : ""}>
                            <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                        </AddRondinModal>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {rondin?.folio && (
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide border border-blue-100">
                          {rondin.folio}
                        </span>
                      )}
                  {(() => {
                    const statusMap: Record<string, string> = {
                      Corriendo: "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-300/50",
                      Pausado:   "bg-yellow-50 text-yellow-700 border border-yellow-200 ring-1 ring-yellow-300/50",
                      Cancelado: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-300/50",
                      Cerrado:   "bg-slate-50 text-slate-500 border border-slate-200 ring-1 ring-slate-300/50",
                      Programado:"bg-purple-50 text-purple-700 border border-purple-200 ring-1 ring-purple-300/50",
                    };
                    const estatus = rondin?.estatus_rondin ?? "";
                    const style = statusMap[estatus] ?? "bg-slate-50 text-slate-500 border border-slate-200";
                    return (
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-base font-bold ${style}`}>
                        {estatus}
                      </span>
                    );
                  })()}
                      <div className="flex items-center gap-2">
                        <Button onClick={handlePause} size="icon"
                          className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-none border-0"
                          title="Pausar Rondín"
                          disabled={rondin?.estatus_rondin !== "Corriendo" || isLoadingPlayOrPause}>
                          {isLoadingPlayOrPause && rondin?.estatus_rondin === "Corriendo"
                            ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
                        </Button>
                        <Button onClick={handlePlay} size="icon"
                          className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-none border-0"
                          title="Iniciar Rondín"
                          disabled={rondin?.estatus_rondin === "Corriendo" || isLoadingPlayOrPause}>
                          {isLoadingPlayOrPause && rondin?.estatus_rondin !== "Corriendo"
                            ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        </Button>
                      </div>
                      <button title="Eliminar Rondín" onClick={() => handleEliminar(rondin)}
                        className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Ubicación
                      </label>
                      {ubicacionesLS.length > 0 ? (
                        <select disabled={!isPaused} defaultValue={rondin?.ubicacion || ""} className={selectClass(isPaused)}>
                          {ubicacionesLS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      ) : (
                        <input disabled={!isPaused} defaultValue={rondin?.ubicacion || ""} className={inputClass(isPaused)} />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" /> Fecha inicial
                      </label>
                      <input type="text" disabled={!isPaused} defaultValue={rondin?.fecha_inicio_rondin || ""} className={inputClass(isPaused)} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Duración estimada
                      </label>
                      <input type="text" disabled={!isPaused} defaultValue={rondin?.duracion_esperada_rondin || ""} className={inputClass(isPaused)} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Recurrencia
                      </label>
                      <input type="text" disabled={!isPaused} defaultValue={rondin?.recurrencia || ""} className={inputClass(isPaused)} />
                    </div>

                    <div className="flex flex-col gap-1.5 lg:col-span-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Asignado a
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" disabled={!isPaused}
                          onClick={() => setTipoAsignado("guardia")}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${
                            tipoAsignado === "guardia" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          } ${!isPaused ? "opacity-50 cursor-not-allowed" : ""}`}>
                          Guardia en turno
                        </button>
                        <button type="button" disabled={!isPaused}
                          onClick={() => setTipoAsignado("persona")}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${
                            tipoAsignado === "persona" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          } ${!isPaused ? "opacity-50 cursor-not-allowed" : ""}`}>
                          Persona específica
                        </button>
                        {tipoAsignado === "persona" && (
                          <select disabled={!isPaused} defaultValue={rondin?.asignado_a || ""} className={`${selectClass(isPaused, false)} flex-1 min-w-[180px]`}>
                            <option value="">Selecciona una persona</option>
                            {DEMO_PERSONAS.map((p) => (
                              <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {rondin?.descripcion && (
                      <div className="flex flex-col gap-1.5 lg:col-span-3">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descripción</label>
                        <input type="text" disabled={!isPaused} defaultValue={rondin.descripcion} className={inputClass(isPaused)} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full md:w-[380px] shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Puntos del rondín</h3>
                    <p className="text-xs text-gray-400">{rondin.cantidad_de_puntos} puntos</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs"
                      onClick={handleGuardar} disabled={isLoadingEditAreas}>
                      {isLoadingEditAreas ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : "Guardar"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input type="text" placeholder="Buscar punto..." value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400 w-full" />
                </div>

                <div className="flex-1 overflow-y-auto">
                  <AreasList rondin={rondin} setAreas={setAreas} areas={filteredAreas} />
                </div>

                {areas?.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length > 0 && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-xs text-red-500">
                      {areas.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length} áreas sin geolocalización
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: "420px", zIndex: 0 }}>
                <MapView key={mapKey} map_data={rondin.map_data} />
              </div>
            </div>

          </div>

        ) : (
          <>
          {isLoadingRondin && verRondin ? (
            <div className="flex flex-col items-center gap-3 h-32 justify-center">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <span className="text-base text-slate-500">
                Cargando registro...
              </span>
            </div>
          ) : (
              <>
                {viewMode === "table" && (
                  <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
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
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}
                              className="hover:bg-slate-100 transition-colors border-slate-50">
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}
                                  className={`py-2 px-3 border-r border-slate-100 last:border-r-0 ${cell.column.id === "options" ? "w-1" : ""} font-normal`}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-32 text-center">
                              {isLoading ? (
                                <div className="flex flex-col items-center gap-3 h-32 justify-center">
                                  <div className="relative h-8 w-8">
                                    <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                  </div>
                                  <span className="text-base text-slate-400">
                                    Cargando registros...
                                  </span>
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
                )}

                {viewMode === "photos" && (
                  <div className="flex gap-4">
                    <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
                      <FiltersPanel filters={externalFilters} onFiltersChange={onExternalFiltersChange} filtersConfig={filtersConfig} />
                    </aside>
                    <div className="flex-1 min-w-0">
                      <PhotoGridView isLoading={isLoading} records={rondinPhotoRecords}
                        globalSearch={searchTags} externalFilters={externalFilters}
                        onExternalFiltersChange={onExternalFiltersChange} />
                    </div>
                  </div>
                )}

                {viewMode === "list" && (
                  <div className="flex gap-4">
                    <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
                      <FiltersPanel filters={externalFilters} onFiltersChange={onExternalFiltersChange} filtersConfig={filtersConfig} />
                    </aside>
                    <div className="flex-1 min-w-0">
                      <PhotoListView isLoading={isLoading} records={rondinListRecords}
                        globalSearch={searchTags} modalType="rondines"
                        externalFilters={externalFilters} onExternalFiltersChange={onExternalFiltersChange}
                        getMapData={(record) => {
                          const original = filteredData.find(
                            (item: any) => item._id === record.id || item.folio === record.folio
                          );
                          return original?.map_data?.length ? original.map_data : [];
                        }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </>

      {viewMode === "table" && !verRondin && (
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
      )}
    </div>
  );
};

export default RecorridosTable;