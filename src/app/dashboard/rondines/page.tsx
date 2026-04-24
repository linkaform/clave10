"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import RondinesTable from "@/components/table/rondines/table";
import { useRondinesFilters } from "@/hooks/bitacora/useRondinesFilters";
import { useShiftStore } from "@/store/useShiftStore";
import { dateToString } from "@/lib/utils";
import { useGetListRondines } from "@/hooks/Rondines/useGetListRondines";
import IncidenciasRondinesTable from "@/components/table/incidencias-rondines/table";
import { useIncidenciaRondin } from "@/hooks/Rondines/useRondinIncidencia";
import { RondinesBitacoraTable } from "@/components/table/rondines/bitacoras-table";
import { useBoothStore } from "@/store/useBoothStore";
import { Tabs as TabsOuter, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, LayoutList, Sheet } from "lucide-react";
import { TagSearchInput } from "@/components/tag-search-input";
import { Button } from "@/components/ui/button";
import CheckUbicacionesTable from "@/components/table/rondines/check-ubicaciones/table";

const RondinesContent = () => {
  const searchParams = useSearchParams();
  const { location } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string>("");
  const { filter } = useShiftStore();
  const [dateFilter, setDateFilter] = useState<string>(filter);
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dates, setDates] = useState<string[]>([]);
  const { listRondines } = useGetListRondines(true, dates[0], dates[1], 100, 0);
  const [subTab, setSubTab] = useState("rondines");
  const [searchQuery, setSearchQuery] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "photos" | "list">("table");

  React.useEffect(() => {
    if (subTab === "recorridos" && (viewMode === "photos" || viewMode === "list")) {
      setViewMode("table");
    }
    if ((subTab === "rondines" || subTab === "check-ubicaciones") && viewMode === "photos") {
      setViewMode("list");
    }
  }, [subTab, viewMode]);

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useRondinesFilters();
  const [openModal, setOpenModal] = useState(false);
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  const { listIncidenciasRondin } = useIncidenciaRondin("", "");
  console.log(isSidebarOpen, setIsSidebarOpen, activeFiltersCount);

  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
  }, [location]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const map: Record<string, string> = {
        rondines: "rondines",
        recorridos: "recorridos",
        checkubicaciones: "check-ubicaciones",
        incidencias: "incidencias",
      };
      const matched = map[tabParam.toLowerCase()];
      if (matched) setSubTab(matched);
    }
  }, [searchParams]);

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
      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
          <div className="flex items-center justify-between w-full gap-4 sticky top-[68px] z-40 bg-white backdrop-blur-sm py-2 mb-4">
            <div className="flex items-baseline gap-2 min-w-fit">
              <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
                Registro y Seguimiento de Rondines
              </h1>
              <span className="text-sm font-light text-slate-500 whitespace-nowrap">
                {(listRondines as any)?.length || (listRondines as any)?.total_records || 0} registros
              </span>
            </div>

            <div className="flex items-center gap-4 min-w-0 justify-end flex-shrink-0">
              <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[240px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
                <Search className="ml-2 mr-1 flex-shrink-0 text-slate-400" size={14} />
                <TagSearchInput
                  tags={searchQuery}
                  onTagsChange={setSearchQuery}
                  placeholder="Buscar..."
                  className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 h-8 text-sm min-w-0 px-1"
                />
              </div>

              <TabsOuter value={subTab} onValueChange={setSubTab} className="w-auto">
                <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
                  <TabsTrigger
                    value="rondines"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Rondines
                  </TabsTrigger>
                  <TabsTrigger
                    value="check-ubicaciones"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Check Ubicaciones
                  </TabsTrigger>
                  <TabsTrigger
                    value="recorridos"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                    Recorridos
                  </TabsTrigger>
                </TabsList>
              </TabsOuter>

              {(() => {
                const photosDisabled = ["rondines", "check-ubicaciones", "recorridos"].includes(subTab);
                const listDisabled = subTab === "recorridos";

                const btnClass = (mode: string, disabled: boolean) =>
                  `h-full w-10 transition-all rounded-none border-x border-slate-300/50 ${
                    disabled
                      ? "opacity-30 cursor-not-allowed text-slate-400"
                      : viewMode === mode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-slate-500 hover:bg-slate-200/50"
                  }`;

                return (
                  <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
                    <Button variant="ghost" size="icon"
                      className={btnClass("photos", photosDisabled)}
                      disabled={photosDisabled}
                      onClick={() => setViewMode("photos")}>
                      <LayoutGrid size={18} />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className={btnClass("list", listDisabled)}
                      disabled={listDisabled}
                      onClick={() => setViewMode("list")}>
                      <LayoutList size={18} />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className={btnClass("table", false)}
                      onClick={() => setViewMode("table")}>
                      <Sheet size={18} />
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div>
            <Tabs value={subTab} onValueChange={setSubTab} className="w-full">

              <TabsContent value="rondines">
                <RondinesTable
                  data={listRondines}
                  isLoading={false}
                  setDate1={setDate1} setDate2={setDate2}
                  date1={date1} date2={date2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  setActiveTab={setSubTab} activeTab={subTab}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={externalFilters}
                  onExternalFiltersChange={onExternalFiltersChange}
                  filtersConfig={filtersConfig}
                />
              </TabsContent>

              <TabsContent value="check-ubicaciones">
                  <CheckUbicacionesTable
                  // showTabs={true}
                  // data={listIncidenciasRondin}
                  // isLoading={false}
                  // setSelectedIncidencias={setSelectedIncidencias}
                  // selectedIncidencias={selectedIncidencias}
                  // date1={date1} date2={date2}
                  // setDate1={setDate1} setDate2={setDate2}
                  // dateFilter={dateFilter} setDateFilter={setDateFilter}
                  // Filter={Filter} resetTableFilters={resetTableFilters}
                  // openModal={openModal} setOpenModal={setOpenModal}
                />
              </TabsContent>

              <TabsContent value="recorridos">
                <div className="p-2">
                  <RondinesBitacoraTable showTabs={true} ubicacion={ubicacionSeleccionada} />
                </div>
              </TabsContent>

              <TabsContent value="incidencias">
                <IncidenciasRondinesTable
                  showTabs={true}
                  data={listIncidenciasRondin}
                  isLoading={false}
                  setSelectedIncidencias={setSelectedIncidencias}
                  selectedIncidencias={selectedIncidencias}
                  date1={date1} date2={date2}
                  setDate1={setDate1} setDate2={setDate2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  openModal={openModal} setOpenModal={setOpenModal}
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