"use client";
// ME-12 · Piezas del alta de contrato: tarjeta numerada, combo con búsqueda y chip quitable.
import { useState, type ReactNode } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Sección numerada del alta ("1 · Documento físico firmado"). */
export function Tarjeta({ n, titulo, extra, children }: { n: number; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-c10-surface px-6 pb-6 pt-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-c10-sunken pb-3.5">
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-c10-acc text-[13px] font-bold text-white">{n}</span>
        <h2 className="m-0 text-base font-bold text-c10-title">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export const MarcaIA = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-c10-acc-l px-2 py-px text-[10px] font-bold tracking-[.03em] text-c10-acc ring-1 ring-blue-200">
    <Sparkles className="size-3" aria-hidden />IA
  </span>
);

export interface OpcionBuscar {
  id: string;
  nombre: string;
  /** Texto gris a la derecha ("8 documentos"). */
  extra?: string;
}

/**
 * Combo con búsqueda. Con `valor` muestra lo elegido (selector de una fila);
 * sin él funciona como buscador que agrega (servicios, centros de trabajo).
 */
export function ComboBuscar({
  opciones, valor, onCambio, placeholder, invalido, deshabilitado, etiqueta,
}: {
  opciones: OpcionBuscar[];
  valor?: string | null;
  onCambio: (id: string) => void;
  placeholder: string;
  invalido?: boolean;
  deshabilitado?: boolean;
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const actual = valor ? opciones.find((o) => o.id === valor) : undefined;
  return (
    <Popover open={abierto && !deshabilitado} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button" aria-label={etiqueta} disabled={deshabilitado}
          className={cn(
            "flex h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-c10-surface px-3 text-left text-sm ring-1 transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c10-acc disabled:cursor-not-allowed disabled:opacity-60",
            invalido ? "ring-red-300" : "ring-c10-line",
          )}
        >
          <span className={cn("flex-1 truncate", actual ? "text-c10-title" : "text-c10-faint")}>{actual?.nombre ?? placeholder}</span>
          <Search className="size-4 shrink-0 text-c10-faint" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList className="max-h-64">
            <CommandEmpty>Sin resultados</CommandEmpty>
            {opciones.map((o) => (
              <CommandItem
                key={o.id} value={`${o.nombre} ${o.id}`} className={cn(o.id === valor && "bg-c10-acc-l")}
                onSelect={() => { onCambio(o.id); setAbierto(false); }}
              >
                <span className="flex-1 truncate">{o.nombre}</span>
                {o.extra && <span className="whitespace-nowrap text-xs text-c10-meta">{o.extra}</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Chip azul con conteo opcional y botón quitar (servicios y centros de trabajo). */
export function ChipQuitable({ texto, n, titulo, onQuitar, etiquetaQuitar }: {
  texto: string; n?: number; titulo?: string; onQuitar: () => void; etiquetaQuitar: string;
}) {
  return (
    <span title={titulo} className="inline-flex h-[34px] items-center gap-2 rounded-full bg-c10-acc-l pl-3.5 pr-2 text-[13px] font-semibold text-c10-acc-h ring-1 ring-blue-200">
      {texto}
      {n !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-c10-acc px-1.5 text-[11px] font-bold tabular-nums text-white">{n}</span>
      )}
      <button type="button" onClick={onQuitar} title={etiquetaQuitar} aria-label={`${etiquetaQuitar}: ${texto}`}
        className="flex size-5 items-center justify-center rounded-full hover:bg-blue-100 [&_svg]:size-3.5">
        <X />
      </button>
    </span>
  );
}

/** Franja azul de resumen bajo una sección ("2 servicios · 9 documentos requeridos"). */
export const Resumen = ({ fuerte, texto }: { fuerte: string; texto: string }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-c10-acc-l px-3 py-2.5 text-xs">
    <span className="font-semibold text-c10-acc-h">{fuerte}</span>
    <span className="text-c10-meta">{texto}</span>
  </div>
);
