"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogDirecciones } from "@/hooks/Areas/useCatalogDirecciones";

interface SelectorDireccionProps {
  value: string;
  onChange: (nombreDireccion: string) => void;
  className?: string;
}

export function SelectorDireccion({ value, onChange, className = "" }: SelectorDireccionProps) {
  const { direcciones: todas, isLoadingDirecciones } = useCatalogDirecciones();
  // El catálogo puede traer contactos repetidos con el mismo nombre; el
  // selector elige por nombre, así que se muestra uno solo.
  const direcciones = todas.filter(
    (d, i) => todas.findIndex((x) => x.nombre_direccion === d.nombre_direccion) === i,
  );
  const opciones =
    value && !direcciones.some((d) => d.nombre_direccion === value)
      ? [{ nombre_direccion: value, tipo: "", ciudad: "", estado: "" }, ...direcciones]
      : direcciones;

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={isLoadingDirecciones}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder={isLoadingDirecciones ? "Cargando direcciones..." : "Selecciona una dirección"} />
      </SelectTrigger>
      <SelectContent>
        {opciones.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-400">No hay direcciones en el catálogo.</div>
        ) : (
          opciones.map((d) => {
            const tipo = d.tipo === "Direccion" ? "Dirección" : d.tipo;
            const lugar = [tipo, [d.ciudad, d.estado].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
            return (
              <SelectItem key={d.nombre_direccion} value={d.nombre_direccion}>
                {d.nombre_direccion}
                {lugar && <span className="ml-2 text-xs text-gray-400">{lugar}</span>}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}
