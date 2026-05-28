"use client";

import { ListaNotasTable } from "@/components/table/notas/lista-notas/table";
import React, { useState, useEffect } from "react";
import { useBoothStore } from "@/store/useBoothStore";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AddNoteModal } from "@/components/modals/add-note-modal";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Plus, Sheet } from "lucide-react";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { ViewMode } from "@/lib/utils";
import { useNotasFilters } from "@/hooks/Notas/useNotasFIlters";

const NotasPage = () => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <NotasContent />
    </React.Suspense>
  );
};

const NotasContent = () => {
  const { location, area } = useBoothStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location ?? "");
  const [areaSeleccionada] = useState(area ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const {
    externalFilters: notasFilters,
    onExternalFiltersChange: onNotasFiltersChange,
    filtersConfig: notasFiltersConfig,
    activeFiltersCount: notasFiltersCount,
    isSidebarOpen: notasSidebarOpen,
    setIsSidebarOpen: setNotasSidebarOpen,
    setSearchTags,
  } = useNotasFilters();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "nueva_nota") setIsModalOpen(true);

    const status = searchParams.get("status");
    setStatusFilter(status || "");
  }, [searchParams]);

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && searchParams.get("action") === "nueva_nota") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    }
  };

  return (
    <main className="mt-4 mx-4">
      <AddNoteModal
        title="Nueva nota"
        externalOpen={isModalOpen}
        onExternalOpenChange={handleOpenChange}
      />

      {viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={notasSidebarOpen}
          onOpenChange={setNotasSidebarOpen}
          activeFiltersCount={notasFiltersCount}
          filters={notasFilters}
          onFiltersChange={onNotasFiltersChange}
          filtersConfig={notasFiltersConfig}
          filtroUbicacion={false}
        />
      )}

      <PageHeader
        title="Notas"
        totalRecords={totalRegistros}
        onSearch={(val) => {
          const tags = val ? [val] : [];
          setSearchQuery(tags);
          setSearchTags(tags);
        }}
        searchPlaceholder="Buscar...">

        <Button
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Nueva Nota
        </Button>

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

      <section>
        <ListaNotasTable
          statusFilter={statusFilter}
          ubicacionSeleccionada={ubicacionSeleccionada}
          setUbicacionSeleccionada={setUbicacionSeleccionada}
          areaSeleccionada={areaSeleccionada}
          viewMode={viewMode}
          searchTags={searchQuery}
          externalFilters={notasFilters}
          onExternalFiltersChange={onNotasFiltersChange}
          filtersConfig={notasFiltersConfig}
          setTotalRegistros={setTotalRegistros}
        />
      </section>
    </main>
  );
};

export default NotasPage;