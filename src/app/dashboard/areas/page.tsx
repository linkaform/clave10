"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Sheet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useAreasCatalog } from "@/hooks/Areas/useAreasCatalog";
import { useAreasFilters } from "@/hooks/Areas/useAreasFilters";
import { AreasExplorerTable } from "@/components/table/areas-explorer/table";
import { ViewMode } from "@/lib/utils";

const AreasContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [viewMode, setViewMode] = React.useState<ViewMode>("photos");
  const [selectedTab, setSelectedTab] = React.useState<"ubicaciones" | "areas">("areas");
  const [selectedAreaId, setSelectedAreaId] = React.useState<string | null>(idParam);

  useEffect(() => {
    setSelectedAreaId(idParam);
  }, [idParam]);

  const handleAreaIdChange = useCallback(
    (id: string | null) => {
      setSelectedAreaId(id);
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("id", id);
      } else {
        params.delete("id");
      }
      router.replace(`/dashboard/areas${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams],
  );

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    dynamicFiltersArray,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  } = useAreasFilters({
    ...(statusParam === "disponible" ? { disponibilidad: ["disponible"] } : {}),
  });

  const { areas, isLoading } = useAreasCatalog(selectedLocations, dynamicFiltersArray);

  const btnClass = (mode: ViewMode) =>
    `h-full w-10 transition-all rounded-none hover:bg-slate-200/50 border-x border-slate-300/50 ${
      viewMode === mode ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"
    }`;

  return (
    <div className="w-full relative">
      {selectedTab === "areas" && viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={externalFilters}
          onFiltersChange={onExternalFiltersChange}
          filtersConfig={filtersConfig}
          hideFecha
        />
      )}
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title={statusParam === "disponible" ? "Áreas disponibles" : "Áreas"}
          totalRecords={areas.length}
          onSearch={(val) => setSearchTags(val ? [val] : [])}
          searchPlaceholder="Buscar..."
        >
          <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as "ubicaciones" | "areas")} className="w-auto">
            <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
              <TabsTrigger
                value="ubicaciones"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50"
              >
                Ubicaciones
              </TabsTrigger>
              <TabsTrigger
                value="areas"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50"
              >
                Áreas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedTab === "areas" && (
            <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
              <Button variant="ghost" size="icon" className={btnClass("photos")} onClick={() => setViewMode("photos")}>
                <LayoutGrid size={18} />
              </Button>
              <Button variant="ghost" size="icon" className={btnClass("list")} onClick={() => setViewMode("list")}>
                <LayoutList size={18} />
              </Button>
              <Button variant="ghost" size="icon" className={btnClass("table")} onClick={() => setViewMode("table")}>
                <Sheet size={18} />
              </Button>
            </div>
          )}
        </PageHeader>

        {selectedTab === "areas" ? (
          <AreasExplorerTable
            areas={areas}
            isLoading={isLoading}
            viewMode={viewMode}
            searchTags={searchTags}
            filtersConfig={filtersConfig}
            externalFilters={externalFilters}
            onExternalFiltersChange={onExternalFiltersChange}
            selectedAreaId={selectedAreaId}
            onSelectedAreaIdChange={handleAreaIdChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
            Vista de ubicaciones — próximamente.
          </div>
        )}
      </div>
    </div>
  );
};

export default function AreasPage() {
  return (
    <Suspense fallback={null}>
      <AreasContent />
    </Suspense>
  );
}
