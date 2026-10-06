"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Plus, Sheet, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useUbicacionesCatalog } from "@/hooks/Ubicaciones/useUbicacionesCatalog";
import { useUbicacionesFilters } from "@/hooks/Ubicaciones/useUbicacionesFilters";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { UbicacionesExplorerTable } from "@/components/table/ubicaciones-explorer/table";
import { UbicacionFormModal } from "@/components/Ubicaciones/UbicacionFormModal";
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { ViewMode } from "@/lib/utils";
import { SearchFieldsFilter, SearchFieldOption } from "@/components/common/SearchFieldsFilter";
import PaginationPases from "@/components/pages/pases/PaginationPases";

// Campos por los que se puede acotar la búsqueda en el explorador de
// Ubicaciones. key = tal cual lo espera el back en search_fields
// (get_catalog_ubicaciones_formatted), igual que en Áreas.
const UBICACIONES_SEARCH_FIELDS: SearchFieldOption[] = [
  { key: "folio", label: "Folio" },
  { key: "location", label: "Nombre" },
  { key: "address", label: "Dirección" },
  { key: "city", label: "Ciudad" },
  { key: "state", label: "Estado" },
];

const UbicacionesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchFields, setSearchFields] = React.useState<string[]>([]);
  const [resetSignal, setResetSignal] = React.useState(0);
  const [limit, setLimit] = React.useState(25);
  const [skip, setSkip] = React.useState(0);
  const [selectedUbicacionId, setSelectedUbicacionId] = React.useState<string | null>(idParam);
  const [ubicacionFormModal, setUbicacionFormModal] = React.useState<
    { mode: "create" } | { mode: "edit"; ubicacion: NormalizedUbicacion } | null
  >(null);

  useEffect(() => {
    setSelectedUbicacionId(idParam);
  }, [idParam]);

  const handleUbicacionIdChange = useCallback(
    (id: string | null) => {
      setSelectedUbicacionId(id);
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("id", id);
      } else {
        params.delete("id");
      }
      router.replace(`/dashboard/ubicaciones${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams],
  );

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    dynamicFiltersArray,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  } = useUbicacionesFilters();

  const search = searchTags[0] ?? "";
  // Con campos elegidos en "Buscar en" pero sin texto todavía, no tiene
  // sentido mandar la petición (igual que en Áreas).
  const puedeBuscar = searchFields.length === 0 || search.trim() !== "";

  const { ubicacionesCatalog, isLoading } = useUbicacionesCatalog(
    selectedLocations,
    dynamicFiltersArray,
    limit,
    skip,
    search,
    searchFields,
    puedeBuscar,
  );
  const {
    records: ubicaciones = [],
    actual_page: actualPage = 1,
    records_on_page: recordsOnPage = 0,
    total_pages: totalPages = 1,
    total_records: totalRecords = 0,
  } = ubicacionesCatalog ?? {};

  // Al cambiar búsqueda o filtros se regresa a la primera página.
  useEffect(() => { setSkip(0); }, [search, searchFields, dynamicFiltersArray]);

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  const resetFiltros = () => {
    setSearchTags([]);
    setSearchFields([]);
    setResetSignal((n) => n + 1);
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
          title="Ubicaciones"
          totalRecords={totalRecords}
          onSearch={(val) => setSearchTags(val ? [val] : [])}
          searchPlaceholder="Buscar..."
          resetSignal={resetSignal}
        >
          <SearchFieldsFilter
            options={UBICACIONES_SEARCH_FIELDS}
            selected={searchFields}
            onChange={setSearchFields}
            searchTerm={searchTags[0] ?? ""}
          />
          <Button
            type="button"
            size="icon"
            title="Resetear búsqueda"
            className="h-10 w-10 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600 shadow-sm"
            onClick={resetFiltros}>
            <X size={16} />
          </Button>

          <Button
            onClick={() => setUbicacionFormModal({ mode: "create" })}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus size={16} />
            Nueva ubicación
          </Button>

          <AreasUbicacionesTabs active="ubicaciones" />

          <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
            <Button variant="ghost" size="icon" className={btnClass("table")} onClick={() => setViewMode("table")}>
              <Sheet size={18} />
            </Button>
            <Button variant="ghost" size="icon" className={btnClass("photos")} onClick={() => setViewMode("photos")}>
              <LayoutGrid size={18} />
            </Button>
            <Button variant="ghost" size="icon" className={btnClass("list")} onClick={() => setViewMode("list")}>
              <LayoutList size={18} />
            </Button>
          </div>
        </PageHeader>

        <UbicacionesExplorerTable
          ubicaciones={ubicaciones}
          isLoading={isLoading}
          viewMode={viewMode}
          filtersConfig={filtersConfig}
          externalFilters={externalFilters}
          onExternalFiltersChange={onExternalFiltersChange}
          selectedUbicacionId={selectedUbicacionId}
          onSelectedUbicacionIdChange={handleUbicacionIdChange}
          onEditarUbicacion={(ubicacion) => setUbicacionFormModal({ mode: "edit", ubicacion })}
        />
        {!isLoading && (
          <PaginationPases
            actual_page={actualPage}
            records_on_page={recordsOnPage}
            total_pages={totalPages}
            total_records={totalRecords}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <UbicacionFormModal
        open={!!ubicacionFormModal}
        onOpenChange={(open) => !open && setUbicacionFormModal(null)}
        ubicacion={ubicacionFormModal?.mode === "edit" ? ubicacionFormModal.ubicacion : null}
      />
    </div>
  );
};

export default function UbicacionesPage() {
  return (
    <Suspense fallback={null}>
      <UbicacionesContent />
    </Suspense>
  );
}
