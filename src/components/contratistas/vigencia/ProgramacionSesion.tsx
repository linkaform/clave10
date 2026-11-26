"use client";
// F0-14 · Fecha, horario y repetición de una sesión (Configuraciones → Sesiones → Nueva
// Sesión), con "Personalizado" y cuándo termina. Diseño: plataforma.dc.html 2166–2210,
// lógica ssnRep / ssnEnd / ssnWhenErrTxt (~7559). El calendario de sesiones es de CF-03.
import { useId, type ReactNode } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Casilla, Entrada, Etiqueta, Selector } from "../ui";
import { EditorRecurrencia } from "./EditorRecurrencia";
import { Numero, PanelVigencia } from "./piezas";
import {
  duracionSesion, erroresSesion, fechaLocal, opcionesRepeticion, sumarMeses,
  type HorarioSesion, type RecurrenciaSesionValor, type Repeticion, type TerminoSesion,
} from "./textos";

export interface ProgramacionSesionProps {
  horario: HorarioSesion;
  onHorario: (h: HorarioSesion) => void;
  recurrencia: RecurrenciaSesionValor;
  onRecurrencia: (v: RecurrenciaSesionValor) => void;
  /** Ya se intentó guardar: muestra los errores (erroresSesion). */
  intento?: boolean;
}

/**
 *   <ProgramacionSesion horario={h} onHorario={setH} recurrencia={r} onRecurrencia={setR} intento={intento} />
 *   // al guardar: erroresSesion(h, r).hayErrores; en el detalle: textoRecurrenciaSesion(r, h.fecha)
 */
export function ProgramacionSesion({ horario: h, onHorario, recurrencia: v, onRecurrencia, intento }: ProgramacionSesionProps) {
  const e = intento ? erroresSesion(h, v) : null;
  const setH = (p: Partial<HorarioSesion>) => onHorario({ ...h, ...p });
  const setV = (p: Partial<RecurrenciaSesionValor>) => onRecurrencia({ ...v, ...p });
  const custom = v.repeticion === "personalizado";
  const dur = duracionSesion(h);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Clock className="mt-3 size-4 shrink-0 text-c10-meta" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Entrada
              type="date"
              aria-label="Fecha de inicio"
              value={h.fecha}
              onChange={(ev) => setH({ fecha: ev.target.value, fechaFin: h.fechaFin && h.fechaFin < ev.target.value ? ev.target.value : h.fechaFin })}
              invalido={!!e?.horario}
              className="w-[168px]"
            />
            {!h.todoElDia && (
              <>
                <Entrada type="time" aria-label="Hora de inicio" value={h.inicio} onChange={(ev) => setH({ inicio: ev.target.value })} invalido={!!e?.horario} className="w-[120px]" />
                <span className="text-c10-meta" aria-hidden>–</span>
                <Entrada type="time" aria-label="Hora de fin" value={h.fin} onChange={(ev) => setH({ fin: ev.target.value })} invalido={!!e?.horario} className="w-[120px]" />
              </>
            )}
            <Entrada
              type="date"
              aria-label="Fecha de fin"
              value={h.fechaFin}
              min={h.fecha || undefined}
              onChange={(ev) => setH({ fechaFin: ev.target.value })}
              invalido={!!e?.horario}
              className="w-[168px]"
            />
            {dur && <span className="text-[13px] tabular-nums text-c10-meta">{dur}</span>}
          </div>
          {e?.horario && <span className="text-xs text-red-600">{e.horario}</span>}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="flex items-center gap-2">
              <Casilla marcada={h.todoElDia} onCambio={(todoElDia) => setH({ todoElDia })} titulo="Todo el día" />
              <span className="cursor-pointer select-none text-sm text-c10-label" onClick={() => setH({ todoElDia: !h.todoElDia })} aria-hidden>
                Todo el día
              </span>
            </span>
            <Selector<Repeticion>
              opciones={opcionesRepeticion(h.fecha)}
              valor={v.repeticion}
              onCambio={(repeticion) => setV({ repeticion })}
              etiqueta="Repetición"
              className="min-w-[220px] flex-[0_1_340px]"
            />
          </div>
        </div>
      </div>

      {custom && (
        <PanelVigencia
          titulo="Vigencia personalizada"
          ayuda="Define cada cuánto se repite la sesión y cuándo termina."
          className="ml-7 duration-200 animate-in fade-in"
        >
          <EditorRecurrencia
            valor={v.personalizada}
            onCambio={(personalizada) => setV({ personalizada })}
            referencia={fechaLocal(h.fecha) ?? new Date()}
            errores={e?.recurrencia}
          />
          <Termina valor={v.termina} onCambio={(termina) => setV({ termina })} fechaSesion={h.fecha} error={e?.termina} />
        </PanelVigencia>
      )}
    </div>
  );
}

/** "Termina": Nunca, El {fecha} o Después de N repeticiones. */
function Termina({
  valor: t, onCambio, fechaSesion, error,
}: { valor: TerminoSesion; onCambio: (t: TerminoSesion) => void; fechaSesion: string; error?: string }) {
  const id = useId();
  const elegir = (modo: TerminoSesion["modo"]) => {
    if (modo === t.modo) return;
    // Al elegir sin dato se propone uno: 3 meses después de la sesión, o 10 repeticiones.
    onCambio({
      ...t,
      modo,
      fecha: modo === "fecha" && !t.fecha && fechaSesion ? sumarMeses(fechaSesion, 3) : t.fecha,
      repeticiones: modo === "repeticiones" && !t.repeticiones ? 10 : t.repeticiones,
    });
  };
  const apagado = (m: TerminoSesion["modo"]) => t.modo !== m && "bg-c10-panel text-c10-faint";

  return (
    <div className="flex flex-col gap-2">
      <span id={id}>
        <Etiqueta>Termina</Etiqueta>
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-col gap-2">
        <OpcionTermina on={t.modo === "nunca"} onElegir={() => elegir("nunca")} texto="Nunca" />
        <OpcionTermina on={t.modo === "fecha"} onElegir={() => elegir("fecha")} texto="El">
          <Entrada
            type="date"
            aria-label="Fecha de término"
            value={t.fecha}
            min={fechaSesion || undefined}
            onFocus={() => elegir("fecha")}
            onChange={(ev) => onCambio({ ...t, modo: "fecha", fecha: ev.target.value })}
            invalido={t.modo === "fecha" && !!error}
            className={cn("w-[200px]", apagado("fecha"))}
          />
          {t.modo === "fecha" && <span className="text-xs text-c10-meta">Sugerencia: 3 meses después del inicio</span>}
        </OpcionTermina>
        <OpcionTermina on={t.modo === "repeticiones"} onElegir={() => elegir("repeticiones")} texto="Después de">
          <span className="relative" onFocus={() => elegir("repeticiones")}>
            <Numero
              valor={t.repeticiones}
              onCambio={(repeticiones) => onCambio({ ...t, modo: "repeticiones", repeticiones })}
              max={999}
              etiqueta="Número de repeticiones"
              invalido={t.modo === "repeticiones" && !!error}
              className={cn("w-[200px] pr-28 text-left", apagado("repeticiones"))}
            />
            <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-sm text-c10-meta">
              {t.repeticiones === 1 ? "repetición" : "repeticiones"}
            </span>
          </span>
        </OpcionTermina>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function OpcionTermina({ on, onElegir, texto, children }: { on: boolean; onElegir: () => void; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={onElegir}
        className="flex w-[104px] shrink-0 items-center gap-2.5 rounded-md py-1.5 text-left text-sm text-c10-label outline-none focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.25)]"
      >
        <span
          className={cn(
            "size-[18px] shrink-0 rounded-full bg-c10-surface transition-shadow duration-150",
            on ? "shadow-[inset_0_0_0_5px_var(--c10-acc)]" : "shadow-[inset_0_0_0_1.5px_var(--c10-line-strong)]",
          )}
          aria-hidden
        />
        {texto}
      </button>
      {children}
    </div>
  );
}
