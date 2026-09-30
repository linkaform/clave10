"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useUbicacionesCatalog } from "@/hooks/Ubicaciones/useUbicacionesCatalog";
import { UbicacionesExplorerTable } from "@/components/table/ubicaciones-explorer/table";
import { UbicacionFormModal } from "@/components/Ubicaciones/UbicacionFormModal";
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { SearchFieldsFilter, SearchFieldOption } from "@/components/common/SearchFieldsFilter";

// Campos por los que se puede acotar la búsqueda. key = id de la columna en
// ubicaciones-explorer/columns.tsx (el filtro es local, en la tabla).
const UBICACIONES_SEARCH_FIELDS: SearchFieldOption[] = [
  { key: "nombre", label: "Nombre" },
  { key: "direccion", label: "Dirección" },
  { key: "ciudad", label: "Ciudad" },
  { key: "estado", label: "Estado" },
];

const UbicacionesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchFields, setSearchFields] = React.useState<string[]>([]);
  const [resetSignal, setResetSignal] = React.useState(0);
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

  const { ubicaciones, isLoading } = useUbicacionesCatalog(selectedLocations);

  const resetFiltros = () => {
    setSearchTags([]);
    setSearchFields([]);
    setResetSignal((n) => n + 1);
  };

  return (
    <div className="w-full relative">
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Ubicaciones"
          totalRecords={ubicaciones.length}
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
        </PageHeader>

        <UbicacionesExplorerTable
          ubicaciones={ubicaciones}
          isLoading={isLoading}
          searchTags={searchTags}
          searchFields={searchFields}
          selectedUbicacionId={selectedUbicacionId}
          onSelectedUbicacionIdChange={handleUbicacionIdChange}
          onEditarUbicacion={(ubicacion) => setUbicacionFormModal({ mode: "edit", ubicacion })}
        />
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
