"use client";
// Combobox buscable con chip de confianza IA ("96%" o "Manual").
// Popover + cmdk, que ya están en el repo (components/ui/command, popover).
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { OpcionCombo } from "@/types/contratistas/uploader";

interface Props {
  etiqueta: string;
  placeholder: string;
  opciones: OpcionCombo[];
  valor: string | null;
  confianza: string;
  error?: boolean;
  onChange: (id: string) => void;
}

export function ComboConfianza({ etiqueta, placeholder, opciones, valor, confianza, error, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const actual = opciones.find((o) => o.id === valor);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase text-[#334155]">
        {etiqueta}
        <span title="Confianza de la IA" className="inline-flex h-[20px] items-center gap-1 rounded-full bg-[var(--c10-acc-l,#DBEAFE)] px-2 normal-case text-[var(--c10-acc-h,#1E6FDB)]">
          {confianza !== "Manual" && <Sparkles className="size-3" />}{confianza}
        </span>
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={etiqueta}
            className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-left text-sm ${error ? "border-[#DC2626]" : "border-[#E5E7EB]"} focus:border-[var(--c10-acc,#2F80ED)] focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)]`}>
            <span className={`flex-1 truncate ${actual ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{actual?.nombre ?? placeholder}</span>
            <Search className="size-4 text-[#94A3B8]" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList className="max-h-60">
              <CommandEmpty>Sin resultados</CommandEmpty>
              {opciones.map((o) => (
                <CommandItem key={o.id} value={`${o.nombre} ${o.sub ?? ""}`} onSelect={() => { onChange(o.id); setOpen(false); }}
                  className={o.id === valor ? "bg-[var(--c10-acc-s,#EFF6FF)]" : ""}>
                  <span className="flex-1 truncate">{o.nombre}</span>
                  {o.sub && <span className="text-xs text-[#94A3B8]">{o.sub}</span>}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
