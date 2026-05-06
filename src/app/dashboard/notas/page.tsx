"use client";

import { ListaNotasTable } from "@/components/table/notas/lista-notas/table";
import PageTitle from "@/components/page-title";
import Stats from "@/components/pages/notas/StatsNotas";
import React, { useState, useEffect } from "react";
import { useBoothStore } from "@/store/useBoothStore";
import { useSearchParams, useRouter } from "next/navigation";
import { AddNoteModal } from "@/components/modals/add-note-modal";

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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(
    location ?? "",
  );
  const [areaSeleccionada, setAreaSeleccionada] = useState(area ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "nueva_nota") {
      setIsModalOpen(true);
    }

    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    } else {
      setStatusFilter("");
    }
  }, [searchParams]);

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && searchParams.get("action") === "nueva_nota") {
      // Limpiar el parámetro de la URL al cerrar el modal
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(
        `/dashboard/notas${params.toString() ? `?${params.toString()}` : ""}`,
      );
    }
  };

  return (
    <main className="mt-4 mx-4">
      <AddNoteModal
        title="Nueva nota"
        externalOpen={isModalOpen}
        onExternalOpenChange={handleOpenChange}
      />
      <header className="flex flex-col md:flex-row md:justify-between">
        <PageTitle title="Listado De Notas" />
        <div className="w-full md:w-3/5">
          <Stats
            setStatusFilter={setStatusFilter}
            ubicacionSeleccionada={ubicacionSeleccionada}
            areaSeleccionada={areaSeleccionada}
            setUbicacionSeleccionada={setUbicacionSeleccionada}
            setAreaSeleccionada={setAreaSeleccionada}
          />
        </div>
      </header>
      <section>
        <ListaNotasTable
          statusFilter={statusFilter}
          ubicacionSeleccionada={ubicacionSeleccionada}
          areaSeleccionada={areaSeleccionada}
        />
      </section>
    </main>
  );
};

export default NotasPage;
