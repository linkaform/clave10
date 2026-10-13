"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCatalogDirecciones } from "@/hooks/Areas/useCatalogDirecciones";
import { SelectorDireccion } from "@/components/Areas/SelectorDireccion";
import { NuevoContactoModal } from "./NuevoContactoModal";

interface SelectorContactoProps {
  /** address_name del contacto elegido. */
  value: string;
  onChange: (contacto: string) => void;
}

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

// Contacto (dirección) de la ubicación: selector del catálogo "contacto", "+"
// para dar de alta uno nuevo (queda seleccionado) y los datos del elegido.
// Lo usan el modal de nueva ubicación y el tab "Configuración" del detalle.
export function SelectorContacto({ value, onChange }: SelectorContactoProps) {
  const { direcciones } = useCatalogDirecciones();
  const [isNuevoContactoOpen, setIsNuevoContactoOpen] = React.useState(false);
  const seleccionado = direcciones.find((d) => d.nombre_direccion === value);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className={labelClass}>Contacto</Label>
        <div className="flex items-center gap-2">
          <SelectorDireccion value={value} onChange={onChange} className="bg-white border-gray-200" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Dar de alta un contacto nuevo"
            onClick={() => setIsNuevoContactoOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-xs text-slate-400">
          Elige un contacto del catálogo, o da de alta uno nuevo con el botón +.
        </span>
      </div>

      {seleccionado && (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          {[
            { label: "Tipo", value: seleccionado.tipo === "Direccion" ? "Dirección" : seleccionado.tipo },
            { label: "Dirección", value: [seleccionado.direccion, seleccionado.colonia].filter(Boolean).join(", ") },
            { label: "Ciudad", value: seleccionado.ciudad },
            { label: "Estado", value: seleccionado.estado },
            { label: "País", value: seleccionado.pais },
            { label: "Código Postal", value: seleccionado.codigo_postal },
            { label: "Teléfono", value: seleccionado.telefono },
            { label: "Email", value: seleccionado.email },
          ].map(({ label, value: dato }) => (
            <div key={label} className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="text-sm font-medium text-gray-800 truncate">{dato || "-"}</span>
            </div>
          ))}
        </div>
      )}

      <NuevoContactoModal
        open={isNuevoContactoOpen}
        onOpenChange={setIsNuevoContactoOpen}
        onCreated={onChange}
      />
    </div>
  );
}
