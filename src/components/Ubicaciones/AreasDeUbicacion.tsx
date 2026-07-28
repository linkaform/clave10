"use client";

import * as React from "react";
import { Plus, X, Search, Tag as TagIcon } from "lucide-react";
import { useAreasCatalog } from "@/hooks/Areas/useAreasCatalog";
import { useAreaActions } from "@/hooks/Areas/useAreaActions";
import { normalizeArea } from "@/lib/areas";
import { normalizeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaCreateModal } from "./AreaCreateModal";

interface AreasDeUbicacionProps {
  ubicacion: string;
}

export function AreasDeUbicacion({ ubicacion }: AreasDeUbicacionProps) {
  const { areas, isLoading } = useAreasCatalog([ubicacion]);
  const { handleToggleAreaEstado } = useAreaActions();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const areasActivas = areas
    .map((area, index) => normalizeArea(area, index))
    .filter((area) => area.estado?.toLowerCase() !== "inactiva");

  const areasFiltradas = search
    ? areasActivas.filter((area) => normalizeText(area.nombre).includes(normalizeText(search)))
    : areasActivas;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm text-gray-800">
          Áreas registradas
          <span className="ml-2 text-blue-600 font-bold">{areasActivas.length}</span>
        </span>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
          <Plus size={14} />
          Agregar área
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar área..."
          className="pl-8 h-8 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400">Cargando áreas...</div>
      ) : areasActivas.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400 text-center">
          Esta ubicación todavía no tiene áreas.
        </div>
      ) : areasFiltradas.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400 text-center">
          Ningún área coincide con &quot;{search}&quot;.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {areasFiltradas.map((area) => (
            <div key={area.recordId || area.id} className="flex items-center gap-3 py-2.5">
              {area.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={area.foto} alt={area.nombre} className="h-9 w-9 rounded-md object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-md bg-gray-100 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{area.nombre}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] capitalize">
                    {area.tipo}
                  </span>
                  {area.tagId && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">
                      <TagIcon size={9} />
                      Con tag
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleToggleAreaEstado(area.recordId, area.estado)}
                title="Quitar área (marca como inactiva)"
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AreaCreateModal open={isCreateOpen} onOpenChange={setIsCreateOpen} ubicacion={ubicacion} />
    </div>
  );
}
