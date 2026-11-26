"use client";
// F0-15 · Tabla de requerimientos para elegir: encabezado fijo con "seleccionar todos",
// grupos (por ámbito o por tipo) con su casilla y "n de m", filas con casilla.
// La usan el modal de ligar requerimientos y la lista dentro del alta de servicio/perfil.
// Diseño: plataforma.dc.html, svLk (~2096, ~7698) y svEd (~2303, ~7708).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BotonTodos, ChipAmbito, ChipTipoRequerimiento, Marca, MensajeVacio, iconoAmbito, iconoTipo } from "./piezas";
import { alternarUno, alternarVarios, estadoDe } from "./seleccion";

export interface RequerimientoLigar {
  id: string;
  nombre: string;
  /** Texto de vigencia: "Vigente por 1 año", "Mensual · entrega el día 17". */
  vigencia: string;
  ambito: string;
  tipo: string;
}

export interface TablaRequerimientosProps {
  /** Filas ya filtradas (búsqueda y filtros). */
  filas: RequerimientoLigar[];
  sel: string[];
  onSel: (sel: string[]) => void;
  /** Muestra la columna Ámbito (en el alta de un perfil todos son de persona: no hace falta). */
  conAmbito?: boolean;
  /** Agrupa por ámbito o por tipo; sin grupos, lista plana. */
  agruparPor?: "ambito" | "tipo";
  /** Orden de los grupos; los que no estén aquí van al final. */
  ordenGrupos?: string[];
  /** Sin filas: mensaje en lugar de la lista. */
  vacio?: string;
  /** Error del formulario: borde rojo. */
  invalida?: boolean;
  className?: string;
}

const TH = "px-3 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary";

export function TablaRequerimientos({
  filas, sel, onSel, conAmbito, agruparPor, ordenGrupos = [], vacio = "No se encontraron registros", invalida, className,
}: TablaRequerimientosProps) {
  const cols = conAmbito
    ? "44px minmax(180px,1.6fr) minmax(150px,1fr) 124px 124px"
    : "44px minmax(180px,1.6fr) minmax(150px,1fr) 124px";
  const ids = filas.map((r) => r.id);

  const grupos: { clave: string; filas: RequerimientoLigar[] }[] = [];
  if (agruparPor) {
    const pos = (k: string) => (ordenGrupos.includes(k) ? ordenGrupos.indexOf(k) : ordenGrupos.length);
    for (const r of filas) {
      const k = r[agruparPor];
      const g = grupos.find((x) => x.clave === k);
      if (g) g.filas.push(r);
      else grupos.push({ clave: k, filas: [r] });
    }
    grupos.sort((a, b) => pos(a.clave) - pos(b.clave));
  } else if (filas.length) grupos.push({ clave: "", filas });

  const fila = (r: RequerimientoLigar): ReactNode => {
    const on = sel.includes(r.id);
    return (
      <button
        key={r.id}
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={() => onSel(alternarUno(sel, r.id))}
        style={{ gridTemplateColumns: cols }}
        className={cn(
          "grid min-h-12 w-full items-center border-t border-c10-sunken text-left outline-none transition-colors duration-150",
          "focus-visible:shadow-[inset_0_0_0_2px_var(--c10-acc)]",
          on ? "bg-c10-acc-subtle hover:bg-c10-acc-l" : "bg-c10-surface hover:bg-c10-panel",
        )}
      >
        <span className="flex px-3">
          <Marca estado={on ? "todos" : "nada"} tam={20} />
        </span>
        <span className="min-w-0 px-3 py-2 text-sm leading-[1.35] text-c10-title [text-wrap:pretty]">{r.nombre}</span>
        <span className="min-w-0 px-3 py-2 text-[13px] leading-[1.35] text-c10-secondary [text-wrap:pretty]">{r.vigencia}</span>
        {conAmbito && (
          <span className="flex px-3 py-2">
            <ChipAmbito ambito={r.ambito} />
          </span>
        )}
        <span className="flex px-3 py-2">
          <ChipTipoRequerimiento tipo={r.tipo} />
        </span>
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl",
        invalida ? "ring-1 ring-red-600" : "shadow-[0_0_0_1px_var(--c10-line)]",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin]">
        <div className={conAmbito ? "min-w-[620px]" : "min-w-[500px]"}>
          <div role="row" style={{ gridTemplateColumns: cols }} className="sticky top-0 z-[2] grid h-10 items-center bg-c10-acc-l">
            <BotonTodos
              estado={estadoDe(ids, sel)}
              onAlternar={() => onSel(alternarVarios(sel, ids))}
              deshabilitado={!ids.length}
              tam={20}
              className="h-10 rounded-none px-3"
            />
            <span className={TH}>Requerimiento</span>
            <span className={TH}>Vigencia</span>
            {conAmbito && <span className={TH}>Ámbito</span>}
            <span className={TH}>Tipo</span>
          </div>

          {grupos.map((g) => {
            if (!agruparPor) return g.filas.map(fila);
            const gIds = g.filas.map((r) => r.id);
            const Icono = agruparPor === "ambito" ? iconoAmbito(g.clave) : iconoTipo(g.clave);
            const marcados = gIds.filter((id) => sel.includes(id)).length;
            return (
              <div key={g.clave} role="group" aria-label={g.clave}>
                <BotonTodos
                  estado={estadoDe(gIds, sel)}
                  onAlternar={() => onSel(alternarVarios(sel, gIds))}
                  tam={20}
                  titulo={`Seleccionar todos: ${g.clave}`}
                  className="h-10 w-full rounded-none border-t border-c10-line bg-c10-panel px-3 text-left focus-visible:shadow-[inset_0_0_0_2px_var(--c10-acc)]"
                >
                  <Icono className="size-4 shrink-0 text-c10-meta" aria-hidden />
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-c10-label">{g.clave}</span>
                  <span className="shrink-0 text-xs tabular-nums text-c10-meta">
                    {marcados} de {gIds.length}
                  </span>
                </BotonTodos>
                {g.filas.map(fila)}
              </div>
            );
          })}

          {!filas.length && <MensajeVacio className="px-3 py-6">{vacio}</MensajeVacio>}
        </div>
      </div>
    </div>
  );
}
