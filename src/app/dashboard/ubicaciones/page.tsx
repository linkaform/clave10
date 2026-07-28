"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AreasUbicacionesTabs } from "@/components/common/AreasUbicacionesTabs";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useUbicacionesCatalog } from "@/hooks/Ubicaciones/useUbicacionesCatalog";
import { UbicacionesExplorerTable } from "@/components/table/ubicaciones-explorer/table";
import { UbicacionFormModal } from "@/components/Ubicaciones/UbicacionFormModal";
import { NormalizedUbicacion } from "@/lib/ubicaciones";

const UbicacionesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { selectedLocations } = useSelectedLocationsStore();
  const [searchTags, setSearchTags] = React.useState<string[]>([]);
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

  return (
    <div className="w-full relative">
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Ubicaciones"
          totalRecords={ubicaciones.length}
          onSearch={(val) => setSearchTags(val ? [val] : [])}
          searchPlaceholder="Buscar..."
        >
          <AreasUbicacionesTabs active="ubicaciones" />

          <Button onClick={() => setUbicacionFormModal({ mode: "create" })} className="gap-2">
            <Plus size={16} />
            Nueva ubicación
          </Button>
        </PageHeader>

        <UbicacionesExplorerTable
          ubicaciones={ubicaciones}
          isLoading={isLoading}
          searchTags={searchTags}
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
