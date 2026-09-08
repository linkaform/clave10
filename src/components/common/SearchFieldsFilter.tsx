"use client";

import { ListFilter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface SearchFieldOption {
  key: string;
  label: string;
}

interface SearchFieldsFilterProps {
  options: SearchFieldOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Texto actual del buscador — sin esto no tiene sentido acotar campos. */
  searchTerm: string;
  /** Muestra el botón deshabilitado/en gris, ej. mientras el backend de esta sección no soporte search_fields. */
  disabled?: boolean;
}

// Selector "Buscar en" para acotar el buscador de texto a campos específicos
// (en vez de la búsqueda genérica de siempre). Sin nada seleccionado, se
// mantiene el comportamiento actual del buscador.
export const SearchFieldsFilter: React.FC<SearchFieldsFilterProps> = ({
  options,
  selected,
  onChange,
  searchTerm,
  disabled = false,
}) => {
  const sinTermino = !searchTerm.trim();

  const toggle = (key: string) => {
    const yaEstaba = selected.includes(key);
    if (!yaEstaba && sinTermino) {
      toast.info("Escribe algo en el buscador para que se apliquen estos campos.");
    }
    onChange(
      yaEstaba
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );
  };

  if (disabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        title="Próximamente: en desarrollo por el equipo de backend."
        className="h-10 gap-1.5 font-semibold border-slate-200 bg-slate-100 text-slate-400 disabled:opacity-100">
        <ListFilter size={14} />
        Buscar en
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`h-10 gap-1.5 font-semibold transition-colors ${
            selected.length > 0
              ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
              : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}>
          <ListFilter size={14} />
          Buscar en
          {selected.length > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white text-blue-700 text-[10px] font-bold">
              {selected.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
          Buscar solo en
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.key}
            checked={selected.includes(opt.key)}
            onCheckedChange={() => toggle(opt.key)}
            onSelect={(e) => e.preventDefault()}>
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
