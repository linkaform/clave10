"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tabs as TabsOuter, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, LayoutList, Plus, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import ArticulosPerdidosTable from "@/components/table/articulos/pendientes/table";
import { AddArticuloModal } from "@/components/modals/add-article-lost";
import ArticulosConTable from "@/components/table/articulos/concecionados/table";
import { useArticulosConcesionados } from "@/hooks/useArticulosConcesionados";
import PaqueteriaTable from "@/components/table/articulos/paqueteria/table";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import { useShiftStore } from "@/store/useShiftStore";
import { AddPaqueteriaModal } from "@/components/modals/add-paqueteria";
import { dateToString, ViewMode } from "@/lib/utils";
import { useBoothStore } from "@/store/useBoothStore";
import { AddArticuloConModal } from "@/components/modals/add-article.con";
import { PageHeader } from "@/components/common/PageHeader";
import { usePaqueteriaFilters } from "@/hooks/Paqueteria/usePaqueteriaFilters";
import { useArticulosConcesionadosFilters } from "@/hooks/Concesionados/useConcesionadosFilters";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { usePerdidosFilters } from "@/hooks/Perdidos/usePerdidosFilters";

const TAB_MAP: Record<string, string> = {
  paqueteria: "Paqueteria",
  articulos_concesionados: "Concecionados",
  articulos_perdidos: "Perdidos",
};

const TAB_TITLES: Record<string, string> = {
  Paqueteria: "Paquetería",
  Concecionados: "Artículos Concesionados",
  Perdidos: "Artículos Perdidos",
};

const ArticulosPage = () => (
  <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Cargando...</div>}>
    <ArticulosContent />
  </Suspense>
);

const ArticulosContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const statusParam = searchParams.get("status");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { location } = useBoothStore();
  const [ubicacionSeleccionada] = useState(location || "Planta Monterrey");
  const [areaSeleccionada] = useState("todas");

  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusPaqueteria, setStatusPaqueteria] = useState<string>("");
  const [statusPerdidos, setStatusPerdidos] = useState<string>("");
  const [datePrimera, setDatePrimera] = useState<string>("");
  const [dateSegunda, setDateSegunda] = useState<string>(""); 
  const [statusConcesionados, setStatusConcesionados] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string[]>([]);
  // const [ setSearchQuery] = useState<string[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const { listArticulosPerdidos, isLoadingListArticulosPerdidos } = useArticulosPerdidos(
    ubicacionSeleccionada,
    areaSeleccionada === "todas" ? "" : areaSeleccionada,
    statusPerdidos, true, datePrimera,dateSegunda, dateFilter,
  );

  const { listArticulosCon, isLoadingListArticulosCon } = useArticulosConcesionados(
    ubicacionSeleccionada,
    areaSeleccionada === "todas" ? "" : areaSeleccionada,
    statusConcesionados, true,datePrimera,dateSegunda, dateFilter,
  );

  const { listPaqueteria, isLoadingListPaqueteria } = usePaqueteria(
    ubicacionSeleccionada,
    areaSeleccionada === "todas" ? "" : areaSeleccionada,
    statusPaqueteria, true,datePrimera,dateSegunda, dateFilter,
  );

  const {
    externalFilters: paqueteriaFilters,
    onExternalFiltersChange: onPaqueteriaFiltersChange,
    filtersConfig: paqueteriaFiltersConfig,
    activeFiltersCount: paqueteriaFiltersCount,
    isSidebarOpen: paqueteriaSidebarOpen,
    setIsSidebarOpen: setPaqueteriaSidebarOpen,
  } = usePaqueteriaFilters();

  const {
    externalFilters: concesionadosFilters,
    onExternalFiltersChange: onConcesionadosFiltersChange,
    filtersConfig: concesionadosFiltersConfig,
    activeFiltersCount: concesionadosFiltersCount,
    isSidebarOpen: concesionadosSidebarOpen,
    setIsSidebarOpen: setConcesionadosSidebarOpen,
  } = useArticulosConcesionadosFilters();

  const {
    externalFilters: perdidosFilters,
    onExternalFiltersChange: onPerdidosFiltersChange,
    filtersConfig: perdidosFiltersConfig,
    activeFiltersCount: perdidosFiltersCount,
    isSidebarOpen: perdidosSidebarOpen,
    setIsSidebarOpen: setPerdidosSidebarOpen,
  } = usePerdidosFilters();


  const { tab, setTab } = useShiftStore();

  const getInitialTab = () => {
    if (tabParam) {
      const mappedTab = TAB_MAP[tabParam.toLowerCase()];
      if (mappedTab) return mappedTab;
      const normalized = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (["Paqueteria", "Concecionados", "Perdidos"].includes(normalized)) return normalized;
    }
    return tab ? tab : "Paqueteria";
  };

  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSuccessCon, setIsSuccessCon] = useState(false);
  const [isSuccessPaq, setIsSuccessPaq] = useState(false);
  const [modalData] = useState<any>(null);
  const [selectedArticulos, setSelectedArticulos] = useState<string[]>([]);

  console.log(selectedArticulos)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab) setTab(""); }, []);

  useEffect(() => {
    if (tabParam) {
      const mappedTab = TAB_MAP[tabParam.toLowerCase()];
      if (mappedTab) {
        setSelectedTab(mappedTab);
      } else {
        const normalized = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
        if (["Paqueteria", "Concecionados", "Perdidos"].includes(normalized)) setSelectedTab(normalized);
      }
    }
  }, [tabParam]);

  useEffect(() => {
    if (actionParam === "nuevo_paquete") setIsSuccessPaq(true);
    if (actionParam === "nuevo_articulo_perdido") setIsSuccess(true);
    if (actionParam === "nuevo_articulo_concesionado") setIsSuccessCon(true);
  }, [actionParam]);

  useEffect(() => {
    const currentStatus = statusParam || "";
    if (selectedTab === "Paqueteria") setStatusPaqueteria(currentStatus);
    if (selectedTab === "Perdidos") setStatusPerdidos(currentStatus);
    if (selectedTab === "Concecionados") setStatusConcesionados(currentStatus);
  }, [statusParam, selectedTab]);

  useEffect(() => { setTotalRegistros(0); }, [selectedTab]);

  const handleOpenChange = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccess) : value;
    setIsSuccess(open);
    if (!open && actionParam === "nuevo_articulo_perdido") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleOpenChangePaq = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccessPaq) : value;
    setIsSuccessPaq(open);
    if (!open && actionParam === "nuevo_paquete") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleOpenChangeCon = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccessCon) : value;
    setIsSuccessCon(open);
    if (!open && actionParam === "nuevo_articulo_concesionado") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

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
  };

  return (
    <div className="w-full relative">
      {viewMode === "table" && selectedTab === "Paqueteria" && (
        <FloatingFiltersDrawer
          isOpen={paqueteriaSidebarOpen}
          onOpenChange={setPaqueteriaSidebarOpen}
          activeFiltersCount={paqueteriaFiltersCount}
          filters={paqueteriaFilters}
          onFiltersChange={onPaqueteriaFiltersChange}
          filtersConfig={paqueteriaFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && selectedTab === "Concecionados" && (
        <FloatingFiltersDrawer
          isOpen={concesionadosSidebarOpen}
          onOpenChange={setConcesionadosSidebarOpen}
          activeFiltersCount={concesionadosFiltersCount}
          filters={concesionadosFilters}
          onFiltersChange={onConcesionadosFiltersChange}
          filtersConfig={concesionadosFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      {viewMode === "table" && selectedTab === "Perdidos" && (
        <FloatingFiltersDrawer
          isOpen={perdidosSidebarOpen}
          onOpenChange={setPerdidosSidebarOpen}
          activeFiltersCount={perdidosFiltersCount}
          filters={perdidosFilters}
          onFiltersChange={onPerdidosFiltersChange}
          filtersConfig={perdidosFiltersConfig}
          filtroUbicacion={false}
        />
      )}
      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
          <PageHeader
            title={TAB_TITLES[selectedTab] || "Artículos"}
            totalRecords={totalRegistros}
            onSearch={(val) => setSearchQuery(val ? [val] : [])}
            searchPlaceholder="Buscar...">

            {selectedTab === "Paqueteria" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setIsSuccessPaq(true)}>
                <Plus size={16} />
                Nuevo Paquete
              </Button>
            )}
            {selectedTab === "Concecionados" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setIsSuccessCon(true)}>
                <Plus size={16} />
                Nuevo Artículo
              </Button>
            )}
            {selectedTab === "Perdidos" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setIsSuccess(true)}>
                <Plus size={16} />
                Nuevo Artículo Perdido
              </Button>
            )}

            <TabsOuter
              value={selectedTab}
              onValueChange={(val) => {
                setSelectedTab(val);
                router.replace(`${pathname}?tab=${val.toLowerCase()}`);
              }}
              className="w-auto">
              <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
                <TabsTrigger value="Paqueteria"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                  Paquetería
                </TabsTrigger>
                <TabsTrigger value="Concecionados"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                  Concesionados
                </TabsTrigger>
                <TabsTrigger value="Perdidos"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none shadow-none text-slate-600 hover:bg-slate-200/50">
                  Perdidos
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
              <TabsContent value="Paqueteria">
                <PaqueteriaTable
                  data={listPaqueteria}
                  isLoadingListPaqueteria={isLoadingListPaqueteria}
                  openModal={() => setIsSuccessPaq(true)}
                  setSelectedArticulos={setSelectedArticulos}
                  date1={date1} date2={date2}
                  setDate1={setDate1} 
                  setDate2={setDate2}
                  dateFilter={dateFilter} 
                  setDateFilter={setDateFilter}
                  Filter={Filter} 
                  resetTableFilters={resetTableFilters}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={paqueteriaFilters}
                  onExternalFiltersChange={onPaqueteriaFiltersChange}
                  filtersConfig={paqueteriaFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>

              <TabsContent value="Concecionados">
                <ArticulosConTable
                  data={listArticulosCon ?? []}
                  isLoadingListArticulosCon={isLoadingListArticulosCon}
                  openModal={() => setIsSuccessCon(true)}
                  setSelectedArticulos={setSelectedArticulos}
                  date1={date1} date2={date2}
                  setDate1={setDate1} setDate2={setDate2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={concesionadosFilters}
                  onExternalFiltersChange={onConcesionadosFiltersChange}
                  filtersConfig={concesionadosFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>

              <TabsContent value="Perdidos">
                <ArticulosPerdidosTable
                  data={listArticulosPerdidos}
                  isLoadingListArticulosPerdidos={isLoadingListArticulosPerdidos}
                  openModal={() => setIsSuccess(true)}
                  setSelectedArticulos={setSelectedArticulos}
                  date1={date1} date2={date2}
                  setDate1={setDate1} setDate2={setDate2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  viewMode={viewMode}
                  searchTags={searchQuery}
                  externalFilters={perdidosFilters}
                  onExternalFiltersChange={onPerdidosFiltersChange}
                  filtersConfig={perdidosFiltersConfig}
                  setTotalRegistros={setTotalRegistros}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <AddArticuloModal
        title="Crear Artículo Perdido"
        data={modalData}
        isSuccess={isSuccess}
        setIsSuccess={handleOpenChange}
        onClose={() => handleOpenChange(false)}
      />
      <AddArticuloConModal
        isSuccess={isSuccessCon}
        setIsSuccess={handleOpenChangeCon}
        initialData={{}}>
        <div />
      </AddArticuloConModal>
      <AddPaqueteriaModal
        title="Crear Paquetería"
        isSuccess={isSuccessPaq}
        setIsSuccess={handleOpenChangePaq}
        onClose={() => handleOpenChangePaq(false)}
      />
    </div>
  );
};

export default ArticulosPage;