import { useState } from "react";
import { useGetListRondines } from "./useGetListRondines";
import { useGetListCheckUbicaciones } from "./useListCheckUbicaciones";
import { useIncidenciaRondin } from "./useRondinIncidencia";
import { useRondinesFilters } from "@/hooks/bitacora/useRondinesFilters";
import { useIncidenciasFilters } from "@/hooks/bitacora/useIncidenciasFilters";

export const useRondinesPage = () => {
  const [viewMode, setViewMode] = useState<"table" | "photos" | "list">("table");
  const [subTab, setSubTab] = useState("recorridos");

  // Resetear viewMode a tabla cuando subTab es recorridos o rondines
  const handleSubTabChange = (tab: string) => {
    setSubTab(tab);
    if (tab === "recorridos" || tab === "rondines") {
      setViewMode("table");
    }
  };
  
  // Search tags 
  const [searchQuery, setSearchQuery] = useState<string[]>([]);

  // Paginación
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  // Fechas
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("");

  const Filter = () => {
    const f1 = date1 ? new Date(date1).toISOString().split("T")[0] : "";
    const f2 = date2 ? new Date(date2).toISOString().split("T")[0] : "";
    setDates([f1, f2]);
  };

  const resetTableFilters = () => {
    setDate1("");
    setDate2("");
    setDateFilter("");
    setDates([]);
  };

  // Data: Recorridos 
  const { listRondines, isLoadingListRondines } = useGetListRondines(
    true,
    dates[0],
    dates[1],
    100,
    0
  );

  // Data: Check Ubicaciones
  const { listCheckUbicaciones, isLoadingListCheckUbicaciones } = useGetListCheckUbicaciones(true);

  // Data: Incidencias 
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const { listIncidenciasRondin, isLoading:isLoadingIncidenciasRondin } = useIncidenciaRondin("", "");

  // Filtros: Recorridos
  const {
    externalFilters: recorridosExternalFilters,
    onExternalFiltersChange: recorridosOnExternalFiltersChange,
    activeFiltersCount: recorridosActiveFiltersCount,
    filtersConfig: recorridosFiltersConfig,
    isSidebarOpen: recorridosIsSidebarOpen,
    setIsSidebarOpen: recorridosSetIsSidebarOpen,
  } = useRondinesFilters();

  // Filtros: Incidencias
  const {
    externalFilters: incidenciasExternalFilters,
    onExternalFiltersChange: incidenciasOnExternalFiltersChange,
    activeFiltersCount: incidenciasActiveFiltersCount,
    filtersConfig: incidenciasFiltersConfig,
    searchTags: incidenciasSearchTags,
    setSearchTags: incidenciasSetSearchTags,
    isSidebarOpen: incidenciasIsSidebarOpen,
    setIsSidebarOpen: incidenciasSetIsSidebarOpen,
  } = useIncidenciasFilters();

  return {
    // ── Vista y tab
    viewMode,
    setViewMode,
    subTab,
    setSubTab: handleSubTabChange,
    setSubTabRaw: setSubTab,
    // ── Search
    searchQuery,
    setSearchQuery,

    // ── Paginación
    pagination,
    setPagination,

    // ── Fechas
    date1, setDate1,
    date2, setDate2,
    dateFilter, setDateFilter,
    Filter,
    resetTableFilters,

    // ── Data: Recorridos
    listRondines,
    isLoadingListRondines,

    // ── Data: Check Ubicaciones
    listCheckUbicaciones,
    isLoadingListCheckUbicaciones,

    // ── Data: Incidencias
    listIncidenciasRondin,
    isLoadingIncidenciasRondin,
    selectedIncidencias,
    setSelectedIncidencias,
    openModal,
    setOpenModal,

    // ── Filtros: Recorridos
    recorridosExternalFilters,
    recorridosOnExternalFiltersChange,
    recorridosActiveFiltersCount,
    recorridosFiltersConfig,
    recorridosIsSidebarOpen,
    recorridosSetIsSidebarOpen,

    // ── Filtros: Incidencias
    incidenciasExternalFilters,
    incidenciasOnExternalFiltersChange,
    incidenciasActiveFiltersCount,
    incidenciasFiltersConfig,
    incidenciasSearchTags,
    incidenciasSetSearchTags,
    incidenciasIsSidebarOpen,
    incidenciasSetIsSidebarOpen,
  };
};