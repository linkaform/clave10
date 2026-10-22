"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Plus, Sheet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FacetSearch } from "@/components/common/FacetSearch";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useAreasCatalog } from "@/hooks/Areas/useAreasCatalog";
import { useAreasFilters } from "@/hooks/Areas/useAreasFilters";
import { useFacetSection } from "@/hooks/common/useFacetSection";
import { AreasExplorerTable } from "@/components/table/areas-explorer/table";
import { ViewMode } from "@/lib/utils";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { NuevaAreaModal } from "@/components/Areas/NuevaAreaModal";

const AreasContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [viewMode, setViewMode] = React.useState<ViewMode>("photos");
  const [selectedAreaId, setSelectedAreaId] = React.useState<string | null>(idParam);
  const [nuevaAreaOpen, setNuevaAreaOpen] = React.useState(false);

  useEffect(() => {
    setSelectedAreaId(idParam);
  }, [idParam]);

  const actionParam = searchParams.get("action");
  useEffect(() => {
    if (actionParam === "nueva_area") setNuevaAreaOpen(true);
  }, [actionParam]);

  const handleNuevaAreaOpenChange = (open: boolean) => {
    setNuevaAreaOpen(open);
    if (!open && actionParam === "nueva_area") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/dashboard/areas${params.toString() ? `?${params.toString()}` : ""}`);
    }
  };

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
    searchTags,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  } = useAreasFilters({
    ...(statusParam === "disponible" ? { disponibilidad: ["disponible"] } : {}),
  });

  // Buscador avanzado (igual que Incidencias): chips + panel comparten filtro
  // y todo se resuelve en el back, paginado (ver useFacetSection).
  const sec = useFacetSection({
    scriptName: "rondines_sdk.py",
    optionSuffix: "_areas",
    panel: { externalFilters, onExternalFiltersChange, activeFiltersCount },
    status: "",
    locations: selectedLocations,
  });

  // Los filtros iniciales del panel (Estatus "activa", y Disponibilidad con
  // ?status=disponible) se pasan una vez a facets, que es lo que aplica el
  // back. Hasta entonces no se pide el catálogo, para no hacerlo dos veces.
  const [filtrosIniciales, setFiltrosIniciales] = React.useState(false);
  useEffect(() => {
    sec.onFiltersChange(externalFilters);
    setFiltrosIniciales(true);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { areasCatalog, isLoading } = useAreasCatalog(
    selectedLocations,
    [],
    sec.paging.limit,
    sec.paging.skip,
    sec.facets,
    filtrosIniciales,
  );
  const {
    records: areas = [],
    actual_page: actualPageAreas = 1,
    records_on_page: recordsOnPageAreas = 0,
    total_pages: totalPagesAreas = 1,
    total_records: totalRecordsAreas = 0,
  } = areasCatalog ?? {};

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
          activeFiltersCount={sec.activeFiltersCount}
          filters={sec.filtersView}
          onFiltersChange={sec.onFiltersChange}
          filtersConfig={filtersConfig}
          hideFecha
        />
      )}
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title={statusParam === "disponible" ? "Áreas disponibles" : "Áreas"}
          totalRecords={totalRecordsAreas}
          isLoadingTotal={isLoading}
          search={
            <FacetSearch
              fields={sec.fields}
              facets={sec.facets}
              onChange={sec.setFacets}
              fetchCounts={sec.fetchCounts}
              placeholder="Buscar por folio, nombre, tipo..."
            />
          }
        >
          <Button
            onClick={() => setNuevaAreaOpen(true)}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus size={16} />
            Nueva área
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
          externalFilters={sec.filtersView}
          onExternalFiltersChange={sec.onFiltersChange}
          selectedAreaId={selectedAreaId}
          onSelectedAreaIdChange={handleAreaIdChange}
        />
        {!isLoading && (
          <PaginationPases
            actual_page={actualPageAreas}
            records_on_page={recordsOnPageAreas}
            total_pages={totalPagesAreas}
            total_records={totalRecordsAreas}
            limit={sec.paging.limit}
            onPageChange={sec.onPageChange}
          />
        )}
      </div>

      <NuevaAreaModal open={nuevaAreaOpen} onOpenChange={handleNuevaAreaOpenChange} />
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
