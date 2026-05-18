"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tabs as TabsOuter, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IncidenciasTable from "@/components/table/incidencias/table";
import FallasTable, { fallasColumnsCSV } from "@/components/table/incidencias/fallas/table";
import { useGetFallas } from "@/hooks/useGetFallas";
import { AddFallaModal } from "@/components/modals/add-falla";
import { AddIncidenciaModal } from "@/components/modals/add-incidencia";
import { useInciencias } from "@/hooks/Incidencias/useIncidencias";
import { dateToString, downloadCSV, ViewMode } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { useBoothStore } from "@/store/useBoothStore";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { FileX2, LayoutGrid, LayoutList, Plus, Sheet, Trash2 } from "lucide-react";
import { incidenciasColumnsCSV } from "@/components/table/rondines/incidencias-rondines/table";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { useIncidenciasFilters } from "@/hooks/Incidencias/useIncidenciasFilters";
import { useFallasFilters } from "@/hooks/Fallas/useFallasFIlter";

const IncidenciasPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSuccess, setIsSuccess] = useState(false);
  const { filter, from, setFrom, tab } = useShiftStore();
  const { location } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
  const [areaSeleccionada] = useState("todas");
  const [isSuccessIncidencia, setIsSuccessIncidencia] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string[]>([]);

  const {
    externalFilters: incidenciasFilters,
    onExternalFiltersChange: onIncidenciasFiltersChange,
    filtersConfig: incidenciasFiltersConfig,
    activeFiltersCount: incidenciasFiltersCount,
    isSidebarOpen: incidenciasSidebarOpen,
    setIsSidebarOpen: setIncidenciasSidebarOpen,
  } = useIncidenciasFilters();

  const {
    externalFilters: fallasFilters,
    onExternalFiltersChange: onFallasFiltersChange,
    filtersConfig: fallasFiltersConfig,
    activeFiltersCount: fallasFiltersCount,
    isSidebarOpen: fallasSidebarOpen,
    setIsSidebarOpen: setFallasSidebarOpen,
  } = useFallasFilters();

  const [selectedTab, setSelectedTab] = useState<string>(tab || "Incidencias");
  const [incidenciasEstatus, setIncidenciasEstatus] = useState<string>("");
  const [fallasStatus, setFallasStatus] = useState<string>(filter || "");
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [datePrimera, setDatePrimera] = useState<string>("");
  const [dateSegunda, setDateSegunda] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modalEliminarMultiAbierto, setModalEliminarMultiAbierto] = useState(false);
  const [modalData] = useState<any>(null);
  const [selectedFallas, setSelectedFallas] = useState<string[]>([]);
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);

  useEffect(() => {
    const action = searchParams.get("action");
    const tabParam = searchParams.get("tab");
    const statusParam = searchParams.get("status");

    if (action === "nueva_incidencia") setIsSuccessIncidencia(true);
    if (action === "nueva_falla") setIsSuccess(true);

    if (tabParam) {
      if (tabParam.toLowerCase() === "incidencia") setSelectedTab("Incidencias");
      else if (tabParam.toLowerCase() === "falla") setSelectedTab("Fallas");
    }

    if (statusParam) {
      setIncidenciasEstatus(statusParam);
      setFallasStatus(statusParam);
    } else {
      setIncidenciasEstatus("");
      setFallasStatus("");
    }
  }, [searchParams]);

  const handleOpenIncidenciaChange = (open: boolean) => {
    if (!open) {
      setIsSuccessIncidencia(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`?${params.toString()}`);
    } else {
      setIsSuccessIncidencia(true);
    }
  };

  const handleOpenFallaChange = (open: boolean) => {
    if (!open) {
      setIsSuccess(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`?${params.toString()}`);
    } else {
      setIsSuccess(true);
    }
  };

  const { data: dataFallas, isLoading: isLoadingFallas } = useGetFallas(
    ubicacionSeleccionada,
    areaSeleccionada == "todas" ? "" : areaSeleccionada,
    fallasStatus,
    datePrimera,
    dateSegunda,
    dateFilter,
  );

  const { listIncidencias, isLoadingListIncidencias } = useInciencias(
    ubicacionSeleccionada,
    areaSeleccionada == "todas" ? "" : areaSeleccionada,
    [],
    datePrimera,
    dateSegunda,
    dateFilter,
    incidenciasEstatus,
  );

  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
  }, [location]);

  useEffect(() => {
    if (Array.isArray(dataFallas) && dataFallas.length > 0 && from === "turnos") {
      setFallasStatus(filter);
      setSelectedTab(tab);
      setFrom("");
    }
  }, [dataFallas, fallasStatus, filter, from, selectedTab, setFrom, tab]);

  useEffect(() => {
    if (selectedTab === "Incidencias") {
      setTotalRegistros(Array.isArray(listIncidencias) ? listIncidencias.length : 0);
    } else {
      setTotalRegistros(Array.isArray(dataFallas) ? dataFallas.length : 0);
    }
  }, [selectedTab, listIncidencias, dataFallas]);

  const Filter = () => {
    setDatePrimera(dateToString(new Date(date1)));
    setDateSegunda(dateToString(new Date(date2)));
  };

  const resetTableFilters = () => {
    setDatePrimera("");
    setDateSegunda("");
    setDate1("");
    setDate2("");
    setDateFilter("");
    setFallasStatus("");
  };

  const titulo = selectedTab === "Incidencias" ? "Incidencias" : "Fallas";

  return (
    <div className="w-full relative">
      {/* FloatingFiltersDrawer solo en tabla e incidencias */}
      {viewMode === "table" && selectedTab === "Incidencias" && (
        <FloatingFiltersDrawer
          isOpen={incidenciasSidebarOpen}
          onOpenChange={setIncidenciasSidebarOpen}
          activeFiltersCount={incidenciasFiltersCount}
          filters={incidenciasFilters}
          onFiltersChange={onIncidenciasFiltersChange}
          filtersConfig={incidenciasFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && selectedTab === "Fallas" && (
        <FloatingFiltersDrawer
          isOpen={fallasSidebarOpen}
          onOpenChange={setFallasSidebarOpen}
          activeFiltersCount={fallasFiltersCount}
          filters={fallasFilters}
          onFiltersChange={onFallasFiltersChange}
          filtersConfig={fallasFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
          <PageHeader
            title={titulo}
            totalRecords={totalRegistros}
            onSearch={(val) => setSearchQuery(val ? [val] : [])}
            searchPlaceholder="Buscar...">

            {selectedTab === "Incidencias" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setIsSuccessIncidencia(true)}>
                <Plus size={16} />
                Nueva Incidencia
              </Button>
            )}

            {selectedTab === "Fallas" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setIsSuccess(true)}>
                <Plus size={16} />
                Nueva Falla
              </Button>
            )}

            {selectedTab === "Incidencias" && (
              <>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                  onClick={() => downloadCSV(selectedIncidencias, incidenciasColumnsCSV, "incidencias.csv")}>
                  <FileX2 size={16} /> Descargar
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setModalEliminarMultiAbierto(true)}
                  disabled={selectedIncidencias.length === 0}>
                  <Trash2 size={16} /> Eliminar
                </Button>
              </>
            )}

            {selectedTab === "Fallas" && (
              <>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                  onClick={() => downloadCSV(selectedFallas, fallasColumnsCSV, "fallas.csv")}>
                  <FileX2 size={16} /> Descargar
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setModalEliminarMultiAbierto(true)}
                  disabled={selectedFallas.length === 0}>
                  <Trash2 size={16} /> Eliminar
                </Button>
              </>
            )}

            <TabsOuter
              value={selectedTab}
              onValueChange={(val) => {
                setSelectedTab(val);
                router.replace(`/dashboard/incidencias?tab=${val.toLowerCase()}`);
              }}
              className="w-auto">
              <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
                <TabsTrigger
                  value="Incidencias"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                  Incidencias
                </TabsTrigger>
                <TabsTrigger
                  value="Fallas"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                  Fallas
                </TabsTrigger>
              </TabsList>
            </TabsOuter>

            <div className="flex items-center bg-slate-100/50 h-9 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
              <Button variant="ghost" size="icon"
                className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode("list")}>
                <LayoutList size={16} />
              </Button>
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
            </div>
          </PageHeader>

          <div>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsContent value="Incidencias">
                <IncidenciasTable
                  setModalEliminarMultiAbierto={setModalEliminarMultiAbierto}
                  modalEliminarMultiAbierto={modalEliminarMultiAbierto}
                  viewMode={viewMode}
                  data={listIncidencias}
                  isLoading={isLoadingListIncidencias}
                  openModal={() => setIsSuccessIncidencia(true)}
                  setSelectedIncidencias={setSelectedIncidencias}
                  selectedIncidencias={selectedIncidencias}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  Filter={Filter}
                  resetTableFilters={resetTableFilters}
                  searchTags={searchQuery}
                  externalFilters={incidenciasFilters}
                  onExternalFiltersChange={onIncidenciasFiltersChange}
                  filtersConfig={incidenciasFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>
              <TabsContent value="Fallas">
                <FallasTable
                  viewMode={viewMode}
                  data={dataFallas}
                  isLoading={isLoadingFallas}
                  openModal={() => setIsSuccess(true)}
                  setSelectedFallas={setSelectedFallas}
                  selectedFallas={selectedFallas}
                  date1={date1}
                  date2={date2}
                  setDate1={setDate1}
                  setDate2={setDate2}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  Filter={Filter}
                  resetTableFilters={resetTableFilters}
                  searchTags={searchQuery}
                  externalFilters={fallasFilters}
                  onExternalFiltersChange={onFallasFiltersChange}
                  filtersConfig={fallasFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>
            </Tabs>
          </div>

          <AddFallaModal
            title="Crear falla"
            data={modalData}
            isSuccess={isSuccess}
            setIsSuccess={setIsSuccess}
            externalOpen={isSuccess}
            onExternalOpenChange={handleOpenFallaChange}
            onClose={() => setIsSuccess(false)}
          />
          <AddIncidenciaModal
            title="Crear Incidencia"
            isSuccess={isSuccessIncidencia}
            setIsSuccess={setIsSuccessIncidencia}
            externalOpen={isSuccessIncidencia}
            onExternalOpenChange={handleOpenIncidenciaChange}
            onClose={() => setIsSuccessIncidencia(false)}
          />
        </div>
      </div>
    </div>
  );
};

const IncidenciasPageWrapper = () => (
  <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Cargando...</div>}>
    <IncidenciasPage />
  </Suspense>
);

export default IncidenciasPageWrapper;