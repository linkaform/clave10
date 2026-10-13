"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGetMyPases } from "@/hooks/useGetMyPases";
import PasesEntradaTable from "@/components/table/pases-entrada/table";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { useSearchParams } from "next/navigation";
import { useBoothStore } from "@/store/useBoothStore";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import PasesGrid from "@/components/pages/pases/PasesGrid";
import { FilterState } from "@/types/bitacoras";
import { LayoutGrid, Sheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFilters } from "@/hooks/bitacora/useFilters";
import { PageHeader } from "@/components/common/PageHeader";
import { getPasesFilters } from "@/services/endpoints";
import { FacetSearch } from "@/components/common/FacetSearch";
import { useFacetSection } from "@/hooks/common/useFacetSection";

type ViewMode = "table" | "grid";

const ListaPasesPage = () => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <ListaPasesContent />
    </React.Suspense>
  );
};

const ListaPasesContent = () => {
  const [activeStatus, setActiveStatus] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [externalFilters, setExternalFilters] = useState<FilterState>({
    dynamic: {},
    dateFilter: "",
  });
  const { filters: pasesFilters } = useFilters({
    key: "pases-filters",
    endpoint: getPasesFilters,
  });

  const searchParams = useSearchParams();
  const { location } = useBoothStore();
  const { selectedLocations } = useSelectedLocationsStore();

  useEffect(() => {
    const status = searchParams.get("status");
    setActiveStatus(status ?? "");
  }, [searchParams]);

  // Buscador avanzado: los filtros del panel (Estatus, Perfil, Visita a) y
  // los chips comparten filtro; todo se resuelve en el back, siempre dentro
  // de "mis pases" (ver useFacetSection y Accesos.pases_search_fields).
  const panel = useMemo(
    () => ({
      externalFilters,
      onExternalFiltersChange: setExternalFilters,
      activeFiltersCount: externalFilters.dateFilter ? 1 : 0,
    }),
    [externalFilters],
  );
  const section = useFacetSection({
    scriptName: "pase_de_acceso.py",
    panel,
    status: activeStatus,
    locations: selectedLocations,
  });

  const { data, isLoading } = useGetMyPases({
    skip: section.paging.skip,
    limit: section.paging.limit,
    tab: activeStatus,
    location: location ?? "",
    locations: selectedLocations,
    dateFilter: section.filterDate,
    dateFrom: section.dateFrom,
    dateTo: section.dateTo,
    facets: section.facets,
  });
  const { records, actual_page, records_on_page, total_pages, total_records } =
    data || {};

  return (
    <div className="w-full relative">
      {viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={section.activeFiltersCount}
          filters={section.filtersView}
          onFiltersChange={section.onFiltersChange}
          filtersConfig={pasesFilters}
        />
      )}

      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Historial De Pases De Entrada"
          totalRecords={total_records}
          isLoadingTotal={isLoading}
          search={
            <FacetSearch
              fields={section.fields}
              facets={section.facets}
              onChange={section.setFacets}
              fetchCounts={section.fetchCounts}
              placeholder="Buscar por visitante, empresa, folio..."
            />
          }>
          <Link href="/dashboard/pase-entrada">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-4">
              <Plus size={16} />
              Nuevo Pase
            </Button>
          </Link>

          <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className={`h-full w-10 transition-all rounded-none hover:bg-slate-200/50 ${viewMode === "grid" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
              onClick={() => setViewMode("grid")}>
              <LayoutGrid size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-full w-10 transition-all rounded-none hover:bg-slate-200/50 ${viewMode === "table" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
              onClick={() => setViewMode("table")}>
              <Sheet size={18} />
            </Button>
          </div>
        </PageHeader>

        <div className="w-full">
          {viewMode === "table" ? (
            <PasesEntradaTable isLoading={isLoading} pases={records ?? []} />
          ) : (
            <div className="flex gap-4">
              <aside className="w-64 flex-shrink-0 border border-slate-200 rounded-xl bg-white p-4 h-fit sticky top-[120px]">
                <FiltersPanel
                  filters={section.filtersView}
                  onFiltersChange={section.onFiltersChange}
                  filtersConfig={pasesFilters}
                />
              </aside>
              <div className="flex-1 min-w-0">
                <PasesGrid pases={records ?? []} isLoading={isLoading} />
              </div>
            </div>
          )}
        </div>

        {!isLoading && (
          <PaginationPases
            actual_page={actual_page}
            records_on_page={records_on_page}
            total_pages={total_pages}
            total_records={total_records}
            limit={section.paging.limit}
            onPageChange={section.onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default ListaPasesPage;
