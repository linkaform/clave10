"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useShiftStore } from "@/store/useShiftStore";
import { dateToString, downloadCSV } from "@/lib/utils";
import { Tabs as TabsOuter, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, LayoutList, Sheet, FileX2, Plus } from "lucide-react";
import { TagSearchInput } from "@/components/tag-search-input";
import { Button } from "@/components/ui/button";
import CheckUbicacionesTable from "@/components/table/rondines/check-ubicaciones/table";
import { AddRondinModal } from "@/components/modals/add-rondin";
import IncidenciasRondinesTable, { incidenciasColumnsCSV } from "@/components/table/rondines/incidencias-rondines/table";
import RondinesTable from "@/components/table/rondines/rondines/table";
import { useBoothStore } from "@/store/useBoothStore";
import RecorridosTable from "@/components/table/rondines/recorridos/table";
import { useRecorridosFilters } from "@/hooks/Rondines/recorridos/useRecorridosFilters ";
import { useCheckAreasFilters } from "@/hooks/Rondines/checkAreas/useCheckAreasFilters ";
import { useIncidenciasFilters } from "@/hooks/bitacora/useIncidenciasFilters";
import { useRondinesFilters } from "@/hooks/Rondines/rondines/useRondinesFilters";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";

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
  const [viewMode, setViewMode] = useState<"table" | "photos" | "list">("table");
  const [titulo, setTitulo] = useState("");
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [recorridosSidebarOpen, setRecorridosSidebarOpen] = useState(false);
  const [rondinesSidebarOpen, setRondinesSidebarOpen] = useState(false);
  const [checkAreasSidebarOpen, setCheckAreasSidebarOpen] = useState(false);
  const [incidenciasSidebarOpen, setIncidenciasSidebarOpen] = useState(false);

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
      recorridos:          ["table"],
      rondines:            ["table", "list"],
      "check-ubicaciones": ["table", "photos"],
      incidencias:         ["table", "photos"],
    };
    const allowed = allowedViews[subTab] ?? ["table"];
    if (!allowed.includes(viewMode)) {
      setViewMode("table");
    }
  }, [subTab, viewMode]);

  useEffect(() => {
    if (subTab === "recorridos") setTitulo("Recorridos Programados");
    if (subTab === "rondines") setTitulo("Rondines");
    if (subTab === "check-ubicaciones") setTitulo("Áreas inspeccionadas");
    if (subTab === "incidencias") setTitulo("Incidencias");
  }, [subTab, viewMode]);

  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
  }, [location]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const map: Record<string, string> = {
      recorridos: "recorridos",
      rondines: "rondines",
      checkubicaciones: "check-ubicaciones",
      incidencias: "incidencias",
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
    <div className="">
      {/* FloatingFiltersDrawer por tab — solo en vista tabla */}
      {viewMode === "table" && subTab === "recorridos" && (
        <FloatingFiltersDrawer
          isOpen={recorridosSidebarOpen}
          onOpenChange={setRecorridosSidebarOpen}
          activeFiltersCount={recorridosFiltersCount}
          filters={recorridosFilters}
          onFiltersChange={onRecorridosFiltersChange}
          filtersConfig={recorridosFiltersConfig}
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
        />
      )}
      {viewMode === "table" && subTab === "check-ubicaciones" && (
        <FloatingFiltersDrawer
          isOpen={checkAreasSidebarOpen}
          onOpenChange={setCheckAreasSidebarOpen}
          activeFiltersCount={checkAreasFiltersCount}
          filters={checkAreasFilters}
          onFiltersChange={onCheckAreasFiltersChange}
          filtersConfig={checkAreasFiltersConfig}
        />
      )}
      {viewMode === "table" && subTab === "incidencias" && (
        <FloatingFiltersDrawer
          isOpen={incidenciasSidebarOpen}
          onOpenChange={setIncidenciasSidebarOpen}
          activeFiltersCount={incidenciasFiltersCount}
          filters={incidenciasFilters}
          onFiltersChange={onIncidenciasFiltersChange}
          filtersConfig={incidenciasFiltersConfig}
        />
      )}

      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
          <div className="flex items-center justify-between w-full gap-4 sticky top-[68px] z-40 bg-white backdrop-blur-sm py-2">
            <div className="flex items-baseline gap-2 min-w-fit">
              <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
                {titulo}
              </h1>
              <span className="text-sm font-light text-slate-500 whitespace-nowrap">
                {totalRegistros ?? 0} registros
              </span>
            </div>
            <div className="flex items-center gap-4 min-w-0 justify-end flex-shrink-0">
              
              {subTab === "incidencias" && (
                <Button
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  onClick={() => downloadCSV(selectedIncidencias, incidenciasColumnsCSV, "incidencias.csv")}>
                  <FileX2 />
                  Descargar
                </Button>
              )}

              <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[240px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
                <Search className="ml-2 mr-1 flex-shrink-0 text-slate-400" size={14} />
                <TagSearchInput
                  tags={searchQuery}
                  onTagsChange={setSearchQuery}
                  placeholder="Buscar..."
                  className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 h-8 text-sm min-w-0 px-1"
                />
              </div>
              {subTab === "recorridos" && (
                <AddRondinModal title="Crear recorrido" mode="create">
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Plus size={16} />
                    Crear recorrido
                  </Button>
                </AddRondinModal>
              )}

              <TabsOuter value={subTab} onValueChange={setSubTab} className="w-auto">
                <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
                  <TabsTrigger value="recorridos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Recorridos
                  </TabsTrigger>
                  <TabsTrigger value="rondines" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Rondines
                  </TabsTrigger>
                  <TabsTrigger value="check-ubicaciones" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Check de Áreas
                  </TabsTrigger>
                  <TabsTrigger value="incidencias" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Incidencias
                  </TabsTrigger>
                </TabsList>
              </TabsOuter>

              {(() => {
                const btnClass = (mode: string) =>
                  `h-full w-10 transition-all rounded-none border-x border-slate-300/50 ${
                    viewMode === mode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-500 hover:bg-slate-200/50"
                  }`;
                return (
                  <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
                    {(subTab === "incidencias" || subTab === "check-ubicaciones") && (
                      <Button variant="ghost" size="icon" className={btnClass("photos")} onClick={() => setViewMode("photos")}>
                        <LayoutGrid size={18} />
                      </Button>
                    )}
                    {subTab === "rondines" && (
                      <Button variant="ghost" size="icon" className={btnClass("list")} onClick={() => setViewMode("list")}>
                        <LayoutList size={18} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className={btnClass("table")} onClick={() => setViewMode("table")}>
                      <Sheet size={18} />
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>

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
                />
              </TabsContent>

              <TabsContent value="rondines">
                <RondinesTable
                  showTabs={true}
                  ubicacion={ubicacionSeleccionada}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={rondinesFilters}
                  onExternalFiltersChange={onRondinesFiltersChange}
                  filtersConfig={rondinesFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>

              <TabsContent value="check-ubicaciones">
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

              <TabsContent value="incidencias">
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