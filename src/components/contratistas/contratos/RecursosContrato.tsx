"use client";
// ME-12 · Sección 5 del alta: Recursos asignados (Perfiles / Equipo). Cada fila
// elige un recurso de Configuración (CF-02) y su cantidad; sus requerimientos se
// pueden quitar o reponer (requerimientos_excluidos). Diseño: nuevo-contrato.dc.html
// 335–391, nTabsRec / nFilasRec / CAMPOS_REC (~4006).
import { useState } from "react";
import { Plus, Trash2, UsersRound, Wrench } from "lucide-react";
import { Entrada, ModalConfirmar, Selector } from "@/components/contratistas/ui";
import { cn } from "@/lib/utils";
import type { Id, RecursoContrato, TipoRequerimiento } from "@/types/contratistas";
import {
  COLOR_FORMATO, ERROR_RECURSOS, equipoIncompleto, filaEquipo, filaPerfil, perfilIncompleto, reqsActivos,
  type FilaEquipo, type FilaPerfil,
} from "./nuevoContrato";
import { ComboBuscar } from "./piezasNuevo";

type Pestana = "perfiles" | "equipos";
const CLASES = [{ valor: "Equipo" as const, etiqueta: "Equipo" }, { valor: "Vehículo" as const, etiqueta: "Vehículo" }];

export interface RecursosContratoProps {
  perfiles: FilaPerfil[];
  equipos: FilaEquipo[];
  onPerfiles: (f: FilaPerfil[]) => void;
  onEquipos: (f: FilaEquipo[]) => void;
  catPerfiles: RecursoContrato[];
  catEquipos: RecursoContrato[];
  /** Tipo de cada requerimiento (para el color del chip). */
  tipos: Map<Id, TipoRequerimiento>;
  intento: boolean;
  pestana: Pestana;
  onPestana: (p: Pestana) => void;
}

const nReqs = (n: number) => `${n} ${n === 1 ? "requerimiento" : "requerimientos"}`;

export function RecursosContrato(p: RecursosContratoProps) {
  const [borrar, setBorrar] = useState<string | null>(null);
  const esPerfil = p.pestana === "perfiles";
  const filas: (FilaPerfil | FilaEquipo)[] = esPerfil ? p.perfiles : p.equipos;
  const incompletas = esPerfil ? p.perfiles.some(perfilIncompleto) : p.equipos.some(equipoIncompleto);

  const setPerfil = (key: string, c: Partial<FilaPerfil>) => p.onPerfiles(p.perfiles.map((f) => (f.key === key ? { ...f, ...c } : f)));
  const setEquipo = (key: string, c: Partial<FilaEquipo>) => p.onEquipos(p.equipos.map((f) => (f.key === key ? { ...f, ...c } : f)));
  const agregar = () => (esPerfil ? p.onPerfiles([...p.perfiles, filaPerfil()]) : p.onEquipos([...p.equipos, filaEquipo()]));
  const eliminar = () => {
    if (esPerfil) p.onPerfiles(p.perfiles.filter((f) => f.key !== borrar));
    else p.onEquipos(p.equipos.filter((f) => f.key !== borrar));
    setBorrar(null);
  };

  const pestanas = [
    { key: "perfiles" as const, label: "Perfiles", icono: <UsersRound />, n: p.perfiles.length },
    { key: "equipos" as const, label: "Equipo", icono: <Wrench />, n: p.equipos.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="-mt-2 flex gap-1 border-b border-c10-line">
        {pestanas.map((t) => {
          const on = t.key === p.pestana;
          return (
            <button
              key={t.key} type="button" role="tab" aria-selected={on} onClick={() => p.onPestana(t.key)}
              className={cn(
                "-mb-px flex h-[42px] items-center gap-2 border-b-2 px-3.5 text-sm font-semibold transition-colors [&_svg]:size-4",
                on ? "border-c10-acc text-c10-acc" : "border-transparent text-c10-meta hover:text-c10-title",
              )}
            >
              {t.icono}{t.label}
              <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                on ? "bg-c10-acc text-white" : "bg-c10-sunken text-c10-meta")}>{t.n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {!filas.length && (
          <span className="text-[13px] text-c10-faint">
            {esPerfil ? "Sin perfiles. Los recursos son opcionales." : "Sin equipo. Los recursos son opcionales."}
          </span>
        )}
        {esPerfil
          ? p.perfiles.map((f) => {
              const usados = new Set(p.perfiles.filter((o) => o.key !== f.key).map((o) => o.perfil));
              const opciones = p.catPerfiles
                .filter((r) => !usados.has(r.id))
                .map((r) => ({ id: r.id, nombre: r.nombre, extra: nReqs(r.requerimientos.length) }));
              return (
                <Fila
                  key={f.key} recurso={p.catPerfiles.find((r) => r.id === f.perfil)} excluidos={f.excluidos} tipos={p.tipos}
                  onExcluidos={(excluidos) => setPerfil(f.key, { excluidos })} onEliminar={() => setBorrar(f.key)}
                >
                  <div className="min-w-0 flex-[1_1_260px]">
                    <ComboBuscar
                      etiqueta="Perfil" placeholder="Buscar un perfil" opciones={opciones} valor={f.perfil}
                      invalido={p.intento && !f.perfil} onCambio={(perfil) => setPerfil(f.key, { perfil, excluidos: [] })}
                    />
                  </div>
                  <Cantidad valor={f.cantidad} onCambio={(cantidad) => setPerfil(f.key, { cantidad })} invalido={p.intento && perfilIncompleto(f) && !!f.perfil} />
                </Fila>
              );
            })
          : p.equipos.map((f) => {
              const opciones = p.catEquipos
                .filter((r) => (r.clase ?? "Equipo") === f.clase)
                .map((r) => ({ id: r.id, nombre: r.nombre, extra: nReqs(r.requerimientos.length) }));
              return (
                <Fila
                  key={f.key} recurso={p.catEquipos.find((r) => r.id === f.equipo)} excluidos={f.excluidos} tipos={p.tipos}
                  onExcluidos={(excluidos) => setEquipo(f.key, { excluidos })} onEliminar={() => setBorrar(f.key)}
                >
                  <div className="min-w-0 flex-[0_0_150px]">
                    <Selector
                      etiqueta="Tipo" placeholder="Tipo" opciones={CLASES} valor={f.clase} invalido={p.intento && !f.clase}
                      onCambio={(clase) => setEquipo(f.key, { clase, equipo: null, excluidos: [] })}
                    />
                  </div>
                  <div className="min-w-0 flex-[1_1_260px]">
                    <ComboBuscar
                      etiqueta="Equipo" opciones={opciones} valor={f.equipo} deshabilitado={!f.clase}
                      placeholder={!f.clase ? "Elige primero el tipo" : f.clase === "Vehículo" ? "Buscar un vehículo" : "Buscar un equipo"}
                      invalido={p.intento && !!f.clase && !f.equipo} onCambio={(equipo) => setEquipo(f.key, { equipo, excluidos: [] })}
                    />
                  </div>
                  <Cantidad valor={f.cantidad} onCambio={(cantidad) => setEquipo(f.key, { cantidad })} invalido={p.intento && equipoIncompleto(f) && !!f.equipo} />
                </Fila>
              );
            })}

        {p.intento && incompletas && <span className="text-[13px] text-red-600">{ERROR_RECURSOS[p.pestana]}</span>}

        <button
          type="button" onClick={agregar}
          className="flex h-9 items-center gap-1.5 self-start rounded-lg border border-dashed border-c10-line bg-c10-surface px-3.5 text-[13px] font-semibold text-c10-acc transition-colors hover:border-c10-acc hover:bg-c10-acc-l [&_svg]:size-4"
        >
          <Plus />{esPerfil ? "Añadir perfil" : "Añadir equipo"}
        </button>
      </div>

      <ModalConfirmar
        abierto={!!borrar} onCancelar={() => setBorrar(null)} onConfirmar={eliminar} peligro etiqueta="Eliminar"
        titulo="¿Eliminar fila?" descripcion="Se quitará esta fila de los recursos del contrato."
      />
    </div>
  );
}

function Cantidad({ valor, onCambio, invalido }: { valor: string; onCambio: (v: string) => void; invalido: boolean }) {
  return (
    <div className="min-w-0 flex-[0_0_110px]">
      <Entrada
        inputMode="numeric" placeholder="Cantidad" aria-label="Cantidad" value={valor} invalido={invalido}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, ""))}
      />
    </div>
  );
}

/** Fila: controles, botón eliminar y abajo sus requerimientos como chips que se quitan o reponen. */
function Fila({ recurso, excluidos, tipos, onExcluidos, onEliminar, children }: {
  recurso: RecursoContrato | undefined;
  excluidos: Id[];
  tipos: Map<Id, TipoRequerimiento>;
  onExcluidos: (x: Id[]) => void;
  onEliminar: () => void;
  children: React.ReactNode;
}) {
  const reqs = recurso?.requerimientos ?? [];
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {children}
      <button
        type="button" onClick={onEliminar} title="Eliminar fila" aria-label="Eliminar fila"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-c10-sunken text-c10-meta transition-colors hover:bg-red-100 hover:text-red-600 [&_svg]:size-4"
      >
        <Trash2 />
      </button>
      {!!reqs.length && (
        <div className="flex basis-full flex-wrap items-center gap-1.5 pb-1.5 pt-0.5">
          <span className="mr-0.5 text-xs text-c10-meta">
            {reqsActivos(recurso, excluidos)} de {reqs.length} requerimientos seleccionados:
          </span>
          {reqs.map((q) => {
            const fuera = excluidos.includes(q.id);
            const tipo = tipos.get(q.id) ?? "Documento";
            return (
              <button
                key={q.id} type="button" title={fuera ? `${tipo} · reponer` : `${tipo} · quitar`} aria-pressed={!fuera}
                onClick={() => onExcluidos(fuera ? excluidos.filter((x) => x !== q.id) : [...excluidos, q.id])}
                className={cn(
                  "rounded-full px-2.5 py-[3px] text-xs font-semibold ring-1 transition-colors",
                  fuera ? "bg-c10-surface text-c10-faint line-through ring-c10-line" : COLOR_FORMATO[tipo],
                )}
              >
                {q.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
