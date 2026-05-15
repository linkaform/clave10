"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useShiftStore } from "@/store/useShiftStore";
import { dateToString, ViewMode } from "@/lib/utils";
import { Tabs as TabsOuter, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, LayoutList, Sheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckUbicacionesTable from "@/components/table/rondines/check-areas/table";
import { AddRondinModal } from "@/components/modals/add-rondin";
import IncidenciasRondinesTable from "@/components/table/rondines/incidencias-rondines/table";
import RondinesTable from "@/components/table/rondines/rondines/table";
import { useBoothStore } from "@/store/useBoothStore";
import RecorridosTable from "@/components/table/rondines/recorridos/table";
import { useRecorridosFilters } from "@/hooks/Rondines/recorridos/useRecorridosFilters ";
import { useCheckAreasFilters } from "@/hooks/Rondines/checkAreas/useCheckAreasFilters ";
import { useIncidenciasFilters } from "@/hooks/Incidencias/useIncidenciasFilters";
import { useRondinesFilters } from "@/hooks/Rondines/rondines/useRondinesFilters";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { PageHeader } from "@/components/common/PageHeader";
import { useRouter } from "next/navigation";

const RondinesContent = () => {

  const searchParams = useSearchParams();
  const { location } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string>("");
  const { filter } = useShiftStore();
  const [dateFilter, setDateFilter] = useState<string>(filter);
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dates, setDates] = useState<string[]>([]);
  console.log(dates);
  const [searchQuery, setSearchQuery] = useState<string[]>([]);
  const [subTab, setSubTab] = useState("recorridos");
  const [viewMode, setViewMode] = useState<ViewMode>("photos");
  const [titulo, setTitulo] = useState("");
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [recorridosSidebarOpen, setRecorridosSidebarOpen] = useState(false);
  const [rondinesSidebarOpen, setRondinesSidebarOpen] = useState(false);
  const [checkAreasSidebarOpen, setCheckAreasSidebarOpen] = useState(false);
  const [incidenciasSidebarOpen, setIncidenciasSidebarOpen] = useState(false);
  const [verRondin, setVerRondin] = useState(false);
  const [openRecorridoId, setOpenRecorridoId] = useState<string | null>(null);
  const [openCrearRecorrido, setOpenCrearRecorrido] = useState(false);

  const router = useRouter();
  
  useEffect(() => {
    const actionParam = searchParams.get("action");
    if (actionParam === "programar-recorrido") {
      setOpenCrearRecorrido(true);
      router.replace("/dashboard/rondines?tab=recorridos");
    }
  }, [router, searchParams]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const idParam = searchParams.get("id");
    const map: Record<string, string> = {
      recorridos: "recorridos",
      rondines: "rondines",
      "check-areas": "check-areas",
      "incidencias-rondines": "incidencias-rondines",
    };
    const matched = tabParam ? map[tabParam.toLowerCase()] : undefined;
    setSubTab(matched ?? "recorridos");
    if (idParam) setOpenRecorridoId(idParam);
  }, [searchParams]);

  const {
    externalFilters: recorridosFilters,
    onExternalFiltersChange: onRecorridosFiltersChange,
    filtersConfig: recorridosFiltersConfig,
    activeFiltersCount: recorridosFiltersCount,
  } = useRecorridosFilters();

  const {
    externalFilters: rondinesFilters,
    onExternalFiltersChange: onRondinesFiltersChange,
    filtersConfig: rondinesFiltersConfig,
    activeFiltersCount: rondinesFiltersCount,
  } = useRondinesFilters();

  const {
    externalFilters: checkAreasFilters,
    onExternalFiltersChange: onCheckAreasFiltersChange,
    filtersConfig: checkAreasFiltersConfig,
    activeFiltersCount: checkAreasFiltersCount,
  } = useCheckAreasFilters();

  const {
    externalFilters: incidenciasFilters,
    onExternalFiltersChange: onIncidenciasFiltersChange,
    filtersConfig: incidenciasFiltersConfig,
    activeFiltersCount: incidenciasFiltersCount,
  } = useIncidenciasFilters();

  const [openModal, setOpenModal] = useState(false);
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  
  useEffect(() => {
    const allowedViews: Record<string, ("table" | "photos" | "list")[]> = {
      recorridos: ["table"],
      rondines: ["list", "table"],
      "check-areas": ["photos", "table"],
      "incidencias-rondines": ["photos", "table"],
    };
  
    const allowed = allowedViews[subTab] ?? ["table"];
  
    setViewMode(allowed[0]);
  }, [subTab]);

  useEffect(() => {
    if (subTab === "recorridos") setTitulo("Recorridos Programados");
    if (subTab === "rondines") setTitulo("Rondines");
    if (subTab === "check-areas") setTitulo("Áreas inspeccionadas");
    if (subTab === "incidencias-rondines") setTitulo("Incidencias");
  }, [subTab, viewMode]);

  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
  }, [location]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const map: Record<string, string> = {
      recorridos: "recorridos",
      rondines: "rondines",
      "check-areas": "check-areas",
      "incidencias-rondines": "incidencias-rondines",
    };
    const matched = tabParam ? map[tabParam.toLowerCase()] : undefined;
    setSubTab(matched ?? "recorridos");
  }, [searchParams]);

  useEffect(() => {
    setTotalRegistros(0);
  }, [subTab]);

  const Filter = () => {
    setDates([dateToString(new Date(date1)), dateToString(new Date(date2))]);
  };

  const resetTableFilters = () => {
    setDate1("");
    setDate2("");
    setDateFilter("");
  };

  return (
    <div className="w-full relative">
      {viewMode === "table" && subTab === "recorridos" && verRondin===false &&(
        <FloatingFiltersDrawer
          isOpen={recorridosSidebarOpen}
          onOpenChange={setRecorridosSidebarOpen}
          activeFiltersCount={recorridosFiltersCount}
          filters={recorridosFilters}
          onFiltersChange={onRecorridosFiltersChange}
          filtersConfig={recorridosFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && subTab === "rondines" && (
        <FloatingFiltersDrawer
          isOpen={rondinesSidebarOpen}
          onOpenChange={setRondinesSidebarOpen}
          activeFiltersCount={rondinesFiltersCount}
          filters={rondinesFilters}
          onFiltersChange={onRondinesFiltersChange}
          filtersConfig={rondinesFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && subTab === "check-areas" && (
        <FloatingFiltersDrawer
          isOpen={checkAreasSidebarOpen}
          onOpenChange={setCheckAreasSidebarOpen}
          activeFiltersCount={checkAreasFiltersCount}
          filters={checkAreasFilters}
          onFiltersChange={onCheckAreasFiltersChange}
          filtersConfig={checkAreasFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && subTab === "incidencias-rondines" && (
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

      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
        <PageHeader
          title={titulo}
          totalRecords={totalRegistros}
          onSearch={(val) => setSearchQuery(val ? [val] : [])}
          searchPlaceholder="Buscar...">

          {subTab === "recorridos" && (
            <AddRondinModal title="Crear recorrido" mode="create" externalOpen={openCrearRecorrido}
              onExternalOpenChange={setOpenCrearRecorrido}>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus size={16} />
                Crear Recorrido
              </Button>
            </AddRondinModal>
          )}

          <TabsOuter value={subTab}   
              onValueChange={(val) => { 
                setSubTab(val); 
                setOpenRecorridoId(null);
                router.replace(`/dashboard/rondines?tab=${val}`);
              }} 
            className="w-auto">
            <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
              <TabsTrigger value="recorridos"className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">Recorridos</TabsTrigger>
              <TabsTrigger value="rondines" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">Rondines</TabsTrigger>
              <TabsTrigger value="check-areas"  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">Check de Áreas</TabsTrigger>
              <TabsTrigger value="incidencias-rondines"  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">Incidencias</TabsTrigger>
            </TabsList>
          </TabsOuter>

          {(() => {
            const btnClass = (mode: string) =>
              `h-full w-10 transition-all rounded-none border-x border-slate-300/50 ${
                viewMode === mode ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500 hover:bg-slate-200/50"
              }`;
            return (
              <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
                {(subTab === "incidencias-rondines" || subTab === "check-areas") && (
                  <Button variant="ghost" size="icon" className={btnClass("photos")} onClick={() => {setViewMode("photos");setTitulo("Rondines");}}>
                    <LayoutGrid size={18} />
                  </Button>
                )}
                {subTab === "rondines" && (
                  <Button variant="ghost" size="icon" className={btnClass("list")} onClick={() => {setViewMode("list"); setTitulo("Rondines");}}>
                    <LayoutList size={18} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className={btnClass("table")} onClick={() => {setViewMode("table");setTitulo("Rondines");}}>
                  <Sheet size={18} />
                </Button>
              </div>
            );
          })()}
        </PageHeader>

          <div>
            <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
              <TabsContent value="recorridos">
                <RecorridosTable
                  setDate1={setDate1} setDate2={setDate2}
                  date1={date1} date2={date2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  setActiveTab={setSubTab} activeTab={subTab}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={recorridosFilters}
                  onExternalFiltersChange={onRecorridosFiltersChange}
                  filtersConfig={recorridosFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                  verRondin={verRondin}
                  setVerRondin={setVerRondin}
                />
              </TabsContent>

              <TabsContent value="rondines">
                <RondinesTable
                  openRecorridoId={openRecorridoId}
                resetTableFilters={resetTableFilters}
                  setDate1={setDate1} setDate2={setDate2}
                  date1={date1} date2={date2}
                  showTabs={true}
                  ubicacion={ubicacionSeleccionada}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={rondinesFilters}
                  onExternalFiltersChange={onRondinesFiltersChange}
                  filtersConfig={rondinesFiltersConfig}
                  setTotalRegistros={setTotalRegistros} dateFilter={""}/>
              </TabsContent>

              <TabsContent value="check-areas">
                <CheckUbicacionesTable
                  viewMode={viewMode}
                  onExternalDynamicFiltersChange={() => []}
                  total={undefined}
                  searchTags={searchQuery}
                  externalFilters={checkAreasFilters}
                  onExternalFiltersChange={onCheckAreasFiltersChange}
                  filtersConfig={checkAreasFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>

              <TabsContent value="incidencias-rondines">
                <IncidenciasRondinesTable
                  showTabs={true}
                  setSelectedIncidencias={setSelectedIncidencias}
                  selectedIncidencias={selectedIncidencias}
                  date1={date1} date2={date2}
                  setDate1={setDate1} setDate2={setDate2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  openModal={openModal} setOpenModal={setOpenModal}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={incidenciasFilters}
                  onExternalFiltersChange={onIncidenciasFiltersChange}
                  filtersConfig={incidenciasFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

const RondinesPage = () => (
  <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Cargando...</div>}>
    <RondinesContent />
  </Suspense>
);

export default RondinesPage;