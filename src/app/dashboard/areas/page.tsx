"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Sheet, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useAreasCatalog } from "@/hooks/Areas/useAreasCatalog";
import { useAreasFilters } from "@/hooks/Areas/useAreasFilters";
import { AreasExplorerTable } from "@/components/table/areas-explorer/table";
import { ViewMode } from "@/lib/utils";
import { SearchFieldsFilter, SearchFieldOption } from "@/components/common/SearchFieldsFilter";
import PaginationPases from "@/components/pages/pases/PaginationPases";

// Campos por los que se puede acotar la búsqueda en el explorador de Áreas.
// key = tal cual lo espera el back en search_fields (get_areas_details).
const AREAS_SEARCH_FIELDS: SearchFieldOption[] = [
  { key: "folio", label: "Folio" },
  { key: "area", label: "Nombre del área" },
  { key: "tipo_de_area", label: "Tipo de área" },
  { key: "area_state", label: "Estado" },
  { key: "area_status", label: "Disponibilidad" },
];

const AreasContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [viewMode, setViewMode] = React.useState<ViewMode>("photos");
  const [selectedAreaId, setSelectedAreaId] = React.useState<string | null>(idParam);
  const [searchFieldsAreas, setSearchFieldsAreas] = React.useState<string[]>([]);
  const [resetSignalAreas, setResetSignalAreas] = React.useState(0);
  const [limitAreas, setLimitAreas] = React.useState(25);
  const [skipAreas, setSkipAreas] = React.useState(0);

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

  const searchAreas = searchTags[0] ?? "";
  // Con campos elegidos en "Buscar en" pero sin texto todavía, no tiene
  // sentido mandar la petición (igual que en Concesionados).
  const puedeBuscarAreas = searchFieldsAreas.length === 0 || searchAreas.trim() !== "";

  const { areasCatalog, isLoading } = useAreasCatalog(
    selectedLocations,
    dynamicFiltersArray,
    limitAreas,
    skipAreas,
    searchAreas,
    searchFieldsAreas,
    puedeBuscarAreas,
  );
  const {
    records: areas = [],
    actual_page: actualPageAreas = 1,
    records_on_page: recordsOnPageAreas = 0,
    total_pages: totalPagesAreas = 1,
    total_records: totalRecordsAreas = 0,
  } = areasCatalog ?? {};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSkipAreas(0); }, [searchAreas, searchFieldsAreas]);

  const handleAreasPageChange = (newSkip: number, newLimit: number) => {
    setSkipAreas(newSkip);
    setLimitAreas(newLimit);
  };

  const resetFiltrosAreas = () => {
    setSearchTags([]);
    setSearchFieldsAreas([]);
    setResetSignalAreas((n) => n + 1);
  };

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
          totalRecords={totalRecordsAreas}
          onSearch={(val) => setSearchTags(val ? [val] : [])}
          searchPlaceholder="Buscar..."
          resetSignal={resetSignalAreas}
        >
          <SearchFieldsFilter
            options={AREAS_SEARCH_FIELDS}
            selected={searchFieldsAreas}
            onChange={setSearchFieldsAreas}
            searchTerm={searchAreas}
          />
          <Button
            type="button"
            size="icon"
            title="Resetear búsqueda"
            className="h-10 w-10 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600 shadow-sm"
            onClick={resetFiltrosAreas}>
            <X size={16} />
          </Button>

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
        {!isLoading && (
          <PaginationPases
            actual_page={actualPageAreas}
            records_on_page={recordsOnPageAreas}
            total_pages={totalPagesAreas}
            total_records={totalRecordsAreas}
            limit={limitAreas}
            onPageChange={handleAreasPageChange}
          />
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
