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
  CalendarDays, Eraser, LayoutGrid, LayoutList,
  Loader2, MoveLeft, Pause, Play, Plus, Search, Sheet, Trash,
  MapPin, Clock, RefreshCw, User, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getRondinesColumns, Recorrido } from "./rondines-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogoFechas } from "@/lib/utils";
import DateTime from "@/components/dateTime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddRondinModal } from "@/components/modals/add-rondin";
import { useMemo, useState } from "react";
import { EliminarRondinModal } from "@/components/modals/delete-rondin-modal";
import { useGetRondinById } from "@/hooks/Rondines/useGetRondinById";
// import { AreasModal } from "@/components/modals/add-area-rondin";
import dynamic from "next/dynamic";
import { usePlayOrPauseRondin } from "@/hooks/Rondines/usePlayOrPauseROndin";
import { AreasList } from "@/components/areas-list-draggable";
import { useEditAreasRondin } from "@/hooks/Rondines/useEditAreasRondin";
import { RondinesBitacoraTable } from "./bitacoras-table";
import ChecksImagesSection from "@/components/ChecksImagesSection";
import IncidenciasRondinesTable from "../incidencias-rondines/table";
import { useIncidenciaRondin } from "@/hooks/Rondines/useRondinIncidencia";
import { useBoothStore } from "@/store/useBoothStore";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { TagSearchInput } from "@/components/tag-search-input";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { useRondinesFilters, applyRondinesFilters } from "@/hooks/bitacora/useRondinesFilters";

const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

type ViewMode = "table" | "photos" | "list";

const DEMO_MAP_DATA = [
  { id: "689534634617f0951ac18af5", nombre_area: "Recursos eléctricos", geolocation_area: { latitude: 19.426763615482315, longitude: -99.13720130687581 } },
  { id: "698653701b7735a0a164b4e0", nombre_area: "Antenas", geolocation_area: { latitude: 23.73873250194037, longitude: -99.15336012840272 } },
  { id: "68a4f36488d1a1f78c011fcb", nombre_area: "Recursos de agua potable", geolocation_area: { latitude: 0, longitude: 0 } },
  { id: "53:67:37:47:42:00:02", nombre_area: "Ventiladores", geolocation_area: { latitude: 0, longitude: 0 } },
];

export interface GeoLocation { latitude: number; longitude: number; }
export interface GeoLocationSearch extends GeoLocation { search_txt: string; }
export interface ImageData { nombre_area: string; id: string; foto_area: string; }
export interface MapItem { nombre_area: string; id: string; geolocation_area?: GeoLocation; }
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
  data: any;
  isLoading: boolean;
  resetTableFilters: () => void;
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  activeTab: string;
}

const RondinesTable: React.FC<ListProps> = ({
  data, isLoading,
  setDate1, setDate2, date1, date2,
  dateFilter, setDateFilter, Filter, resetTableFilters,
  setActiveTab, activeTab,
}) => {
  const { playOrPauseRondinMutation, isLoading: isLoadingPlayOrPause } = usePlayOrPauseRondin();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { editAreasRodindMutation, isLoading: isLoadingEditAreas } = useEditAreasRondin();
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [rondinSeleccionado, setRondinSeleccionado] = useState<Recorrido | null>(null);
  const [verRondin, setVerRondin] = useState(false);
  // const [ setNuevasAreasSeleccionadas] = useState<any[]>([]);
  const { location } = useBoothStore();
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  const { listIncidenciasRondin } = useIncidenciaRondin("", "");
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [areaSearch, setAreaSearch] = useState("");
  const [tipoAsignado, setTipoAsignado] = useState<"guardia" | "persona">("persona");
  const [ubicacionesLS, setUbicacionesLS] = useState<string[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("ubicaciones_soter");
      setUbicacionesLS(stored ? JSON.parse(stored) : []);
    } catch {
      setUbicacionesLS([]);
    }
  }, []);

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useRondinesFilters();

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

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = useMemo(() => getRondinesColumns(handleEliminar, handleVerRondin), [handleVerRondin]);
  const memoizedData = useMemo(() => data || [], [data]);

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

  const estatusColor = (estatus: string) => {
    if (estatus === "Corriendo") return "text-green-600";
    if (estatus === "Cancelado") return "text-red-500";
    if (estatus === "Cerrado") return "text-gray-400";
    if (estatus === "Programado") return "text-purple-500";
    return "text-gray-500";
  };

  return (
    <div className="w-full">

      {viewMode === "table" && !verRondin && activeTab === "Rondines" && (
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
        <div className="flex w-full justify-start gap-4">
          <div className="flex justify-center items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-blue-500 text-white p-1 rounded-md">
                <TabsTrigger value="Bitacora">Ejecuciones</TabsTrigger>
                <TabsTrigger value="Rondines">Rondines</TabsTrigger>
                <TabsTrigger value="Incidencias">Incidencias</TabsTrigger>
                <TabsTrigger value="Fotos">Fotos</TabsTrigger>
                <TabsTrigger value="Calendario">Calendario</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab !== "Bitacora" && (
            viewMode === "table" ? (
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
            )
          )}
        </div>

        {activeTab === "Bitacora" && (
          <div className="text-2xl font-bold">Octubre</div>
        )}

        <div className="flex w-full justify-end gap-3 items-center">
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
                <CalendarDays />
              </SelectTrigger>
              <SelectContent>
                {catalogoFechas().map((option: any) => (
                  <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {activeTab === "Rondines" && !verRondin && (
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
            )}

            {activeTab !== "Bitacora" && (
              <>
                <AddRondinModal title="Crear Rondín" mode="create" folio={rondinSeleccionado?.folio}>
                  <Button className="w-full md:w-auto bg-blue-500 hover:bg-blue-600">
                    <Plus /> Crear Rondín
                  </Button>
                </AddRondinModal>
                {rondinSeleccionado && (
                  <AddRondinModal title="Editar Rondín" mode="edit"
                    rondinData={rondinSeleccionado}
                    rondinId={rondinSeleccionado._id}
                    folio={rondinSeleccionado?.folio}>
                    <div />
                  </AddRondinModal>
                )}
              </>
            )}

            {modalEliminarAbierto && rondinSeleccionado && (
              <EliminarRondinModal
                title="Eliminar Rondin"
                folio={rondinSeleccionado.folio}
                modalEliminarAbierto={modalEliminarAbierto}
                setModalEliminarAbierto={setModalEliminarAbierto}
              />
            )}
          </div>
        </div>
      </div>

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
                        onClick={() => { setRondinSeleccionado(null); setVerRondin(false); setActiveTab("Rondines"); }}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
                        <MoveLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{rondin.nombre_del_rondin}</h2>
                        <AddRondinModal title="Editar Rondín" mode="edit"
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
                      <span className={`text-sm font-bold ${estatusColor(rondin?.estatus_rondin)}`}>
                        {rondin?.estatus_rondin}
                      </span>
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

            {/* ── Áreas + Mapa ── */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">

              {/* Áreas del Rondín */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full md:w-[380px] shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Puntos del rondín</h3>
                    <p className="text-xs text-gray-400">{rondin.cantidad_de_puntos} puntos</p>
                  </div>
                  <div className="flex gap-2">
                    {/* <AreasModal
                      title="Agregar Área" points={areas}
                      setAreas={setAreas} areas={areas}
                      setNuevasAreasSeleccionadas={setNuevasAreasSeleccionadas}
                      rondin={rondinSeleccionado}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Agregar Área
                      </button>
                    </AreasModal> */}
                    <Button
                      size="sm"
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs"
                      onClick={handleGuardar}
                      disabled={isLoadingEditAreas}>
                      {isLoadingEditAreas ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : "Guardar"}
                    </Button>
                  </div>
                </div>

                {/* Buscador de áreas */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar punto..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400 w-full"
                  />
                </div>

                {/* Lista de áreas — funcionalidad intacta */}
                <div className="flex-1 overflow-y-auto">
                  <AreasList rondin={rondin} setAreas={setAreas} areas={filteredAreas} />
                </div>

                {/* Áreas sin geolocalización */}
                {areas?.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length > 0 && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-xs text-red-500">
                      {areas.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length} áreas sin geolocalización
                    </p>
                  </div>
                )}
              </div>

              {/* Mapa — sin cambios */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: "420px", zIndex: 0 }}>
                <MapView map_data={rondin.map_data} />
              </div>
            </div>

            {/* ── Tabs: Rondines / Incidentes / Fotos ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <Tabs defaultValue="rondiness" className="w-full">
                <TabsList className="w-auto justify-start bg-transparent border-b border-gray-200 rounded-none p-0 mb-4 gap-0">
                  {["rondiness", "incidentes", "fotos"].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="bg-transparent rounded-none px-4 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 shadow-none capitalize">
                      {tab === "rondiness" ? "Rondines" : tab === "incidentes" ? "Incidentes" : "Fotos"}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="rondiness">
                  <RondinesBitacoraTable showTabs={false} ubicacion={rondin?.ubicacion} nombre_rondin={rondin?.nombre_del_rondin} />
                </TabsContent>

                <TabsContent value="incidentes">
                  <IncidenciasRondinesTable
                    showTabs={false} data={listIncidenciasRondin}
                    isLoading={false} setSelectedIncidencias={setSelectedIncidencias}
                    selectedIncidencias={selectedIncidencias}
                    date1={date1} date2={date2} setDate1={setDate1} setDate2={setDate2}
                    dateFilter={dateFilter} setDateFilter={setDateFilter}
                    Filter={Filter} resetTableFilters={resetTableFilters}
                    openModal={openModal} setOpenModal={setOpenModal}
                  />
                </TabsContent>

                <TabsContent value="fotos">
                  <ChecksImagesSection location={location ?? ""} showTabs={false} />
                </TabsContent>
              </Tabs>
            </div>

          </div>

        ) : (
          <>
            {isLoadingRondin && verRondin ? (
              <div className="flex justify-center items-center h-screen">
                <div className="w-24 h-24 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {viewMode === "table" && (
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
                )}

                {viewMode === "photos" && (
                  <div className="flex gap-4">
                    <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
                      <FiltersPanel filters={externalFilters} onFiltersChange={onExternalFiltersChange} filtersConfig={filtersConfig} />
                    </aside>
                    <div className="flex-1 min-w-0">
                      <PhotoGridView
                        isLoading={isLoading}
                        records={rondinPhotoRecords}
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
                      <FiltersPanel filters={externalFilters} onFiltersChange={onExternalFiltersChange} filtersConfig={filtersConfig} />
                    </aside>
                    <div className="flex-1 min-w-0">
                      <PhotoListView
                        isLoading={isLoading}
                        records={rondinListRecords}
                        globalSearch={searchTags}
                        modalType="rondines"
                        externalFilters={externalFilters}
                        onExternalFiltersChange={onExternalFiltersChange}
                        getMapData={(record) => {
                          const original = filteredData.find(
                            (item: any) => item._id === record.id || item.folio === record.folio
                          );
                          return original?.map_data?.length ? original.map_data : DEMO_MAP_DATA;
                        }}
                      />
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

export default RondinesTable;