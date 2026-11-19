"use client";
// F0-12 · Selector de periodo: "Este año", flechas, año con desplegable y,
// si la pantalla lo pide, modos Mensual / Cuatrimestral.
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ModoPeriodo = "mensual" | "cuatrimestral";

interface Props {
  anio: number;
  /** Años elegibles, del más reciente al más antiguo. */
  anios: number[];
  onAnio: (anio: number) => void;
  modo?: ModoPeriodo;
  onModo?: (m: ModoPeriodo) => void;
  /** Por defecto, el año en curso. */
  anioActual?: number;
}

const btnIcono = "grid size-8 shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[#475569] transition-colors duration-150 hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40";

export function SelectorPeriodo({ anio, anios, onAnio, modo, onModo, anioActual = new Date().getFullYear() }: Props) {
  const [abierto, setAbierto] = useState(false);
  const i = anios.indexOf(anio);
  const anterior = anios[i + 1];
  const siguiente = anios[i - 1];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button type="button" onClick={() => onAnio(anioActual)}
        className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334155] transition-colors duration-150 hover:border-[var(--c10-acc,#2F80ED)] hover:text-[var(--c10-acc,#2F80ED)]">
        Este año
      </button>
      <div className="flex items-center gap-1">
        <button type="button" className={btnIcono} disabled={anterior == null} onClick={() => anterior != null && onAnio(anterior)}
          title="Ejercicio anterior" aria-label="Ejercicio anterior"><ChevronLeft className="size-4" /></button>
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger asChild>
            <button type="button" title="Elegir ejercicio"
              className="flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-xl font-semibold tabular-nums tracking-[-0.02em] text-[#0F172A] transition-colors duration-150 hover:bg-[#F1F5F9] data-[state=open]:bg-[#F1F5F9]">
              {anio}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex max-h-[264px] w-[120px] flex-col gap-0.5 overflow-y-auto rounded-xl p-1">
            {anios.map((a) => (
              <button key={a} type="button" role="option" aria-selected={a === anio} onClick={() => { onAnio(a); setAbierto(false); }}
                className="flex h-[34px] items-center justify-between rounded-lg px-2.5 text-sm tabular-nums transition-colors duration-150 hover:bg-[var(--c10-acc-s,#EFF6FF)]"
                style={a === anio ? { background: "var(--c10-acc-s,#EFF6FF)", color: "var(--c10-acc,#2F80ED)", fontWeight: 600 } : { color: "#0F172A" }}>
                {a}{a === anio && <Check className="size-4" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <button type="button" className={btnIcono} disabled={siguiente == null} onClick={() => siguiente != null && onAnio(siguiente)}
          title="Ejercicio siguiente" aria-label="Ejercicio siguiente"><ChevronRight className="size-4" /></button>
      </div>
      {modo && onModo && (
        <div role="tablist" className="flex h-9 rounded-lg bg-[#F1F5F9] p-0.5">
          {(["mensual", "cuatrimestral"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => onModo(m)}
              className="rounded-md px-3 text-[13px] font-medium transition-colors duration-150"
              style={modo === m ? { background: "#FFFFFF", color: "#0F172A", fontWeight: 600, boxShadow: "0 1px 2px rgba(15,23,42,.08)" } : { color: "#475569" }}>
              {m === "mensual" ? "Mensual" : "Cuatrimestral"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
