"use client";

import React, { useEffect, useState } from "react";
import { useGetMyPases } from "@/hooks/useGetMyPases";
import PasesEntradaTable from "@/components/table/pases-entrada/table";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { useSearchParams } from "next/navigation";
import { useBoothStore } from "@/store/useBoothStore";
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

type ViewMode = "table" | "grid";

const ListaPasesPage = () => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <ListaPasesContent />
    </React.Suspense>
  );
};

const ListaPasesContent = () => {
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);
  const [searchName, setSearchName] = useState("");
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

  useEffect(() => {
    const status = searchParams.get("status");
    setActiveStatus(status ?? "");
  }, [searchParams]);

  const { data, isLoading } = useGetMyPases({
    skip,
    limit,
    searchName,
    tab: activeStatus,
    location: location ?? "",
    dynamicFilters: externalFilters.dynamic,
    dateFilter: externalFilters.dateFilter,
    date1: externalFilters.date1,
    date2: externalFilters.date2,
  });
  const { records, actual_page, records_on_page, total_pages, total_records } =
    data || {};

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  const activeFiltersCount =
    Object.values(externalFilters.dynamic || {})
      .flat()
      .filter(Boolean).length + (externalFilters.dateFilter ? 1 : 0);

  return (
    <div className="w-full relative">
      {viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={externalFilters}
          onFiltersChange={setExternalFilters}
          filtersConfig={pasesFilters}
        />
      )}

      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Historial De Pases De Entrada"
          totalRecords={total_records}
          onSearch={setSearchName}
          searchPlaceholder="Buscar pase...">
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
                  filters={externalFilters}
                  onFiltersChange={setExternalFilters}
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
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default ListaPasesPage;
