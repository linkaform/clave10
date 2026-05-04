"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGetMyPases } from "@/hooks/useGetMyPases";
import PasesEntradaTable from "@/components/table/pases-entrada/table";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { useSearchParams } from "next/navigation";
import { useBoothStore } from "@/store/useBoothStore";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import PasesGrid from "@/components/pages/pases/PasesGrid";
import { FilterState } from "@/types/bitacoras";
import { Search, LayoutGrid, Sheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import debounce from "lodash.debounce";
import { useFilters } from "@/hooks/bitacora/useFilters";
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
  const [searchInput, setSearchInput] = useState("");
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

  const debouncedSetSearch = useMemo(
    () => debounce((val: string) => setSearchName(val), 400),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const { data, isLoading } = useGetMyPases({
    skip,
    limit,
    searchName,
    tab: activeStatus,
    location: location ?? "",
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
        <div className="flex items-center justify-between w-full gap-4 sticky top-[57px] z-40 bg-white py-2">
          <div className="flex items-baseline gap-2 min-w-fit">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
              Historial De Pases De Entrada
            </h1>
            <span className="text-sm font-light text-slate-500 whitespace-nowrap">
              {total_records ?? 0} registros
            </span>
          </div>

          <div className="flex items-center gap-3 min-w-0 justify-end flex-shrink-0">
            <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[220px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
              <Search
                className="ml-2 mr-1 flex-shrink-0 text-slate-400"
                size={14}
              />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Buscar pase..."
                className="w-full bg-transparent border-none shadow-none outline-none h-8 text-sm min-w-0 px-1"
              />
            </div>

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
          </div>
        </div>

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
