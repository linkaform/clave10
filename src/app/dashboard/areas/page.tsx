"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Sheet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
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
      {viewMode === "table" && (
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
          <AreasUbicacionesTabs active="areas" />

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
        </PageHeader>

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
