"use client";
// CF-03 · Programar nueva sesión / Editar sesión: nombre, fecha y repetición (F0-14),
// y pestañas Detalles, Temario (Curso), Recursos (Capacitación, Plática, Inducción) y
// Exámenes y requerimientos (todos menos Plática).
// Diseño: plataforma.dc.html, ssnEdOpen (~2160–2262) y lógica ssnE (~7558–7622).
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Link2, Loader2, MapPin, Paperclip, Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaTexto, BotonIcono, Campo, Entrada, Modal, Selector, avisar } from "@/components/contratistas/ui";
import { ListaRequerimientos, type RequerimientoLigar } from "@/components/contratistas/ligar";
import { ProgramacionSesion, erroresSesion } from "@/components/contratistas/vigencia";
import { useAreasCatalog } from "@/hooks/Areas/useAreasCatalog";
import { useLocationOptions } from "@/hooks/useLocationOptions";
import { normalizeArea } from "@/lib/areas";
import { listRequerimientos, saveSesion } from "@/services/contratistas";
import { subirArchivo } from "@/services/contratistas/analisis";
import type { Requerimiento, Sesion, TipoSesion } from "@/types/contratistas";
import { ICONO_TIPO, IconoMaterial } from "./piezas";
import {
  INSTRUCTOR, MATERIAL, TIPOS_MATERIAL, TIPOS_SESION, conExamenes, conRecursos, conTemario, erroresEditor, leccionVacia,
  materialVacio, seccionVacia, sesionInput, type MaterialEd, type SeccionEd, type SesionEd, type TipoMaterial,
} from "./sesiones";

type Tab = "detalles" | "temario" | "recursos" | "examenes";

const vigenciaTexto = (r: Requerimiento) =>
  r.vigencia_modo === "periodo" ? r.periodicidad ?? "Periódico" : r.vigencia ? `Vigente por ${r.vigencia.n} ${r.vigencia.n === 1 ? r.vigencia.unidad.replace(/es$|s$/, "") : r.vigencia.unidad}` : "Permanente";
const aLigar = (r: Requerimiento): RequerimientoLigar => ({ id: r.id, nombre: r.nombre, vigencia: vigenciaTexto(r), ambito: r.ambito, tipo: r.tipo });

export function EditorSesion({
  sesion, inicial, onCerrar, onGuardado,
}: {
  sesion?: Sesion;
  inicial: SesionEd;
  onCerrar: () => void;
  onGuardado: (s: Sesion) => void;
}) {
  const [e, setE] = useState<SesionEd>(inicial);
  const [tab, setTab] = useState<Tab>("detalles");
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = (p: Partial<SesionEd>) => setE((x) => ({ ...x, ...p }));

  const reqsQ = useQuery({
    queryKey: ["contratistas", "requerimientos", "persona"],
    queryFn: () => listRequerimientos({ ambito: "Persona", estatus: "Activo", limit: 1000 }),
    enabled: conExamenes(e.tipo),
  });
  const examenes = useMemo(() => (reqsQ.data?.items ?? []).filter((r) => r.tipo === "Examen").map(aLigar), [reqsQ.data]);
  const otorgables = useMemo(() => (reqsQ.data?.items ?? []).filter((r) => r.tipo === "Documento").map(aLigar), [reqsQ.data]);

  const errProg = erroresSesion(e.horario, e.recurrencia);
  const err = erroresEditor(e);
  const errDetalles = !!(err.nombre || err.tipo || err.lugar || errProg.hayErrores);

  const tabs: { k: Tab; etiqueta: string; error?: boolean }[] = [
    { k: "detalles", etiqueta: "Detalles", error: intento && errDetalles },
    ...(conTemario(e.tipo) ? [{ k: "temario" as const, etiqueta: "Temario", error: intento && !!err.temario }] : []),
    ...(conRecursos(e.tipo) ? [{ k: "recursos" as const, etiqueta: "Recursos" }] : []),
    ...(conExamenes(e.tipo) ? [{ k: "examenes" as const, etiqueta: "Exámenes y requerimientos" }] : []),
  ];
  const tabActiva = tabs.some((t) => t.k === tab) ? tab : "detalles";

  const guardar = async () => {
    setIntento(true);
    if (errDetalles) return setTab("detalles");
    if (err.temario) return setTab("temario");
    setGuardando(true);
    try {
      const s = await saveSesion(sesionInput(e), sesion?.id);
      avisar(sesion ? "Se guardaron los cambios" : "Se creó la sesión");
      onGuardado(s);
      onCerrar();
    } catch (x) {
      avisar(x instanceof Error ? x.message : "No se pudo guardar la sesión", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto onCerrar={onCerrar} ancho={760} titulo={sesion ? "Editar sesión" : "Programar nueva sesión"}
      onGuardar={guardar} guardando={guardando} etiquetaGuardar={sesion ? "Guardar Cambios" : "Programar Sesión"}
      cabecera={
        <div role="tablist" aria-label="Secciones de la sesión" className="-mb-4 flex gap-5 overflow-x-auto">
          {tabs.map((t) => {
            const on = t.k === tabActiva;
            return (
              <button
                key={t.k} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.k)}
                className={cn(
                  "relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 text-sm transition-colors",
                  on ? "border-c10-acc font-semibold text-c10-acc" : "border-transparent font-medium text-c10-secondary hover:text-c10-acc",
                )}
              >
                {t.etiqueta}
                {t.error && <span className="size-1.5 rounded-full bg-red-600" title="Hay campos por completar" />}
              </button>
            );
          })}
        </div>
      }
    >
      {tabActiva === "detalles" && (
        <Detalles e={e} set={set} intento={intento} err={err} />
      )}
      {tabActiva === "temario" && (
        <Temario secciones={e.temario} onCambio={(temario) => set({ temario })} error={intento ? err.temario : undefined} />
      )}
      {tabActiva === "recursos" && <Recursos recursos={e.recursos} onCambio={(recursos) => set({ recursos })} />}
      {tabActiva === "examenes" && (
        <div className="flex flex-col gap-5">
          <p className="m-0 rounded-lg bg-c10-blue-subtle px-3 py-2.5 text-[13px] leading-[1.45] text-c10-label">
            <b>Exámenes:</b> se aplican a los participantes al terminar la sesión para evaluar lo aprendido.{" "}
            <b>Requerimientos que otorga:</b> quien acredite la sesión cumplirá automáticamente esos requerimientos (por ejemplo, la constancia DC-3).
          </p>
          <ListaRequerimientos
            titulo="Exámenes" requerimientos={examenes} valor={e.examenes} onCambio={(examenes) => set({ examenes })} conAmbito={false} obligatorio={false}
          />
          <ListaRequerimientos
            titulo="Requerimientos que otorga" requerimientos={otorgables} valor={e.otorgados} onCambio={(otorgados) => set({ otorgados })} conAmbito={false} obligatorio={false}
          />
        </div>
      )}
    </Modal>
  );
}

/* ---------- Detalles ---------- */

function Detalles({
  e, set, intento, err,
}: { e: SesionEd; set: (p: Partial<SesionEd>) => void; intento: boolean; err: ReturnType<typeof erroresEditor> }) {
  const modalidad = e.lugar.trim() && e.enlace.trim() ? "Híbrida" : e.enlace.trim() ? "Virtual" : e.lugar.trim() ? "Presencial" : null;
  const [etiquetaInst, phInst] = e.tipo ? INSTRUCTOR[e.tipo] : ["Instructor", "Nombre de quien imparte"];
  return (
    <div className="flex flex-col gap-5">
      <Campo etiqueta="Nombre de la sesión" obligatorio error={intento && err.nombre}>
        <Entrada value={e.nombre} onChange={(x) => set({ nombre: x.target.value })} placeholder="Agrega el nombre de la sesión" autoFocus />
      </Campo>

      <ProgramacionSesion
        horario={e.horario} onHorario={(horario) => set({ horario })}
        recurrencia={e.recurrencia} onRecurrencia={(recurrencia) => set({ recurrencia })} intento={intento}
      />

      <Campo etiqueta="Tipo de sesión" obligatorio error={intento && err.tipo}>
        <div role="radiogroup" aria-label="Tipo de sesión" className="grid grid-cols-2 gap-2 min-[560px]:grid-cols-4">
          {TIPOS_SESION.map((t) => (
            <TipoOpcion key={t} tipo={t} on={e.tipo === t} onClick={() => set({ tipo: t })} />
          ))}
        </div>
      </Campo>

      <div className="grid gap-4 min-[620px]:grid-cols-2">
        <Lugar e={e} set={set} error={intento && err.lugar} />
        <Campo etiqueta="Enlace de la reunión">
          <Entrada value={e.enlace} onChange={(x) => set({ enlace: x.target.value })} placeholder="https://" type="url" />
        </Campo>
      </div>
      <span className="-mt-3 flex items-center gap-1.5 text-xs text-c10-meta">
        <Info className="size-3.5" aria-hidden />
        {modalidad ? <>Modalidad: <b className="font-semibold text-c10-label">{modalidad}</b></> : "Con lugar es presencial, con enlace virtual y con ambos híbrida."}
      </span>

      <div className="grid gap-4 min-[620px]:grid-cols-[1fr_180px]">
        <Campo etiqueta={etiquetaInst}>
          <Entrada value={e.instructor} onChange={(x) => set({ instructor: x.target.value })} placeholder={phInst} />
        </Campo>
        <Campo etiqueta="Cupo" ayuda="Vacío o 0: sin límite">
          <Entrada type="number" min={0} step={1} value={e.cupo} onChange={(x) => set({ cupo: x.target.value })} placeholder="Sin límite" />
        </Campo>
      </div>

      <Campo etiqueta="Descripción">
        <AreaTexto value={e.descripcion} onChange={(x) => set({ descripcion: x.target.value })} rows={3} placeholder="Objetivo y temas de la sesión" />
      </Campo>
    </div>
  );
}

function TipoOpcion({ tipo, on, onClick }: { tipo: TipoSesion; on: boolean; onClick: () => void }) {
  const Icono = ICONO_TIPO[tipo];
  return (
    <button
      type="button" role="radio" aria-checked={on} onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-lg border text-sm transition-colors duration-150 [&_svg]:size-4",
        on ? "border-c10-acc bg-c10-acc-l font-semibold text-c10-acc" : "border-c10-line bg-c10-surface font-medium text-c10-label hover:border-c10-acc hover:text-c10-acc",
      )}
    >
      <Icono aria-hidden />
      {tipo}
    </button>
  );
}

/** Lugar: texto libre o un área del catálogo (se guarda en `areas` para el back). */
function Lugar({ e, set, error }: { e: SesionEd; set: (p: Partial<SesionEd>) => void; error?: string | false }) {
  const ubicaciones = useLocationOptions();
  const [abierto, setAbierto] = useState(false);
  const { areasCatalog, isLoading } = useAreasCatalog(ubicaciones, [], 500, 0, [], abierto);
  const areas = useMemo(() => areasCatalog.records.map(normalizeArea), [areasCatalog]);
  const q = e.lugar.trim().toLowerCase();
  const opciones = areas.filter((a) => !q || `${a.nombre} ${a.ubicacion}`.toLowerCase().includes(q)).slice(0, 40);

  return (
    <Campo etiqueta="Lugar" error={error}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-c10-meta" aria-hidden />
        <Entrada
          value={e.lugar} placeholder="Busca una ubicación o área" className="pl-9" autoComplete="off"
          onChange={(x) => set({ lugar: x.target.value, areas: [] })}
          onFocus={() => setAbierto(true)} onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
        {abierto && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-[240px] overflow-y-auto rounded-xl bg-c10-surface p-1 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]">
            {isLoading && <div className="flex items-center gap-2 px-3 py-2 text-sm text-c10-meta"><Loader2 className="size-4 animate-spin" />Cargando áreas…</div>}
            {!isLoading && !opciones.length && <div className="px-3 py-2 text-sm text-c10-meta">No se encontraron registros</div>}
            {opciones.map((a) => (
              <button
                key={a.id} type="button"
                onMouseDown={(x) => x.preventDefault()}
                onClick={() => { set({ lugar: `${a.nombre} · ${a.ubicacion}`, areas: [{ id: a.recordId || a.id, nombre: a.nombre }] }); setAbierto(false); }}
                className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-c10-blue-subtle"
              >
                <span className="text-sm text-c10-title">{a.nombre}</span>
                <span className="text-xs text-c10-meta">{a.ubicacion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Campo>
  );
}

/* ---------- Materiales (temario y recursos) ---------- */

function FilaMaterialEd({
  m, onCambio, onQuitar, conNombre,
}: { m: MaterialEd; onCambio: (m: MaterialEd) => void; onQuitar: () => void; conNombre?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const origenes = MATERIAL[m.tipo].origenes;

  const cambiarTipo = (tipo: TipoMaterial) => {
    const ok = MATERIAL[tipo].origenes.includes(m.origen);
    onCambio({ ...m, tipo, origen: ok ? m.origen : MATERIAL[tipo].origenes[0], archivo: ok ? m.archivo : undefined });
  };
  const subir = async (file?: File) => {
    if (!file) return;
    setSubiendo(0);
    try {
      const a = await subirArchivo(file, setSubiendo, new AbortController().signal);
      onCambio({ ...m, origen: "Archivo", archivo: a, enlace: "" });
    } catch {
      avisar("No se pudo subir el archivo", "error");
    } finally {
      setSubiendo(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-c10-surface p-2.5 ring-1 ring-c10-line">
      <div className="flex flex-wrap items-center gap-2">
        <IconoMaterial tipo={m.tipo} />
        <Selector
          compacto className="w-[160px]" etiqueta="Tipo de material" valor={m.tipo} onCambio={cambiarTipo}
          opciones={TIPOS_MATERIAL.map((t) => ({ valor: t, etiqueta: t }))}
        />
        {conNombre && (
          <Entrada
            className="h-9 min-w-[160px] flex-1" value={m.nombre} onChange={(x) => onCambio({ ...m, nombre: x.target.value })}
            placeholder={MATERIAL[m.tipo].ph} aria-label="Nombre del recurso"
          />
        )}
        <span className="ml-auto" />
        <BotonIcono titulo="Quitar material" icono={<Trash2 />} sinFondo peligro onClick={onQuitar} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {origenes.includes("Archivo") && (m.archivo ? (
          <span className="flex h-9 min-w-0 max-w-full items-center gap-2 rounded-lg bg-c10-sunken px-3 text-sm" title={m.archivo.name}>
            <Paperclip className="size-4 shrink-0 text-c10-meta" aria-hidden />
            <span className="truncate text-c10-title">{m.archivo.name}</span>
            <button type="button" title="Quitar archivo" aria-label="Quitar archivo" onClick={() => onCambio({ ...m, archivo: undefined })} className="text-c10-meta hover:text-red-600">
              <X className="size-4" />
            </button>
          </span>
        ) : (
          <button
            type="button" onClick={() => input.current?.click()} disabled={subiendo !== null}
            className="flex h-9 items-center gap-2 rounded-lg border border-dashed border-c10-line-strong px-3 text-sm font-medium text-c10-label hover:border-c10-acc hover:text-c10-acc disabled:opacity-50"
          >
            {subiendo !== null ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {subiendo !== null ? `Subiendo ${subiendo}%` : "Subir archivo"}
          </button>
        ))}
        {origenes.length > 1 && !m.archivo && <span className="text-xs text-c10-meta">o</span>}
        {origenes.includes("Enlace") && !m.archivo && (
          <div className="relative min-w-[200px] flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-c10-meta" aria-hidden />
            <Entrada
              className="h-9 pl-9" type="url" value={m.enlace} placeholder="https://" aria-label="Enlace del material"
              onChange={(x) => onCambio({ ...m, origen: "Enlace", enlace: x.target.value })}
            />
          </div>
        )}
        <input ref={input} type="file" hidden onChange={(x) => { subir(x.target.files?.[0]); x.target.value = ""; }} />
      </div>
    </div>
  );
}

function BotonAgregar({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-c10-acc hover:underline">
      <Plus className="size-4" aria-hidden />
      {children}
    </button>
  );
}

/* ---------- Temario ---------- */

function Temario({ secciones, onCambio, error }: { secciones: SeccionEd[]; onCambio: (s: SeccionEd[]) => void; error?: string }) {
  const lecciones = secciones.reduce((n, s) => n + s.lecciones.length, 0);
  const minutos = secciones.reduce((n, s) => n + s.lecciones.reduce((m, l) => m + (Number(l.minutos) || 0), 0), 0);
  const ponSec = (i: number, s: SeccionEd) => onCambio(secciones.map((x, j) => (j === i ? s : x)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-c10-title">Temario del curso <span className="text-red-600">*</span></span>
        <span className="text-xs text-c10-meta">
          {secciones.length} {secciones.length === 1 ? "sección" : "secciones"} · {lecciones} {lecciones === 1 ? "lección" : "lecciones"}{minutos ? ` · ${minutos} min` : ""}
        </span>
      </div>

      {secciones.map((s, i) => (
        <section key={s.key} className="flex flex-col gap-3 rounded-xl bg-c10-sunken p-3">
          <div className="flex items-center gap-2">
            <span className="w-[72px] shrink-0 text-xs font-semibold text-c10-meta">Sección {i + 1}</span>
            <Entrada
              value={s.titulo} onChange={(x) => ponSec(i, { ...s, titulo: x.target.value })} placeholder="Nombre de la sección"
              aria-label={`Nombre de la sección ${i + 1}`} invalido={!!error && !s.titulo.trim()}
            />
            <BotonIcono titulo="Eliminar sección" icono={<Trash2 />} sinFondo peligro onClick={() => onCambio(secciones.filter((_, j) => j !== i))} />
          </div>

          {s.lecciones.map((l, j) => {
            const ponLec = (nl: typeof l) => ponSec(i, { ...s, lecciones: s.lecciones.map((x, k) => (k === j ? nl : x)) });
            return (
              <div key={l.key} className="ml-2 flex flex-col gap-2 border-l-2 border-c10-line pl-3 min-[560px]:ml-[72px]">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-c10-meta">{i + 1}.{j + 1}</span>
                  <Entrada
                    value={l.titulo} onChange={(x) => ponLec({ ...l, titulo: x.target.value })} placeholder="Título de la lección"
                    aria-label={`Título de la lección ${i + 1}.${j + 1}`} invalido={!!error && !l.titulo.trim()}
                  />
                  <div className="relative w-[96px] shrink-0">
                    <Entrada
                      type="number" min={0} step={1} value={l.minutos} onChange={(x) => ponLec({ ...l, minutos: x.target.value })}
                      placeholder="0" aria-label="Minutos" className="pr-10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-c10-meta">min</span>
                  </div>
                  <BotonIcono
                    titulo="Eliminar lección" icono={<Trash2 />} sinFondo peligro
                    onClick={() => ponSec(i, { ...s, lecciones: s.lecciones.filter((_, k) => k !== j) })}
                  />
                </div>
                <span className="text-xs font-semibold text-c10-label">Materiales {l.materiales.length ? `(${l.materiales.length})` : ""}</span>
                {l.materiales.map((m, k) => (
                  <FilaMaterialEd
                    key={m.key} m={m}
                    onCambio={(nm) => ponLec({ ...l, materiales: l.materiales.map((x, z) => (z === k ? nm : x)) })}
                    onQuitar={() => ponLec({ ...l, materiales: l.materiales.filter((_, z) => z !== k) })}
                  />
                ))}
                <BotonAgregar onClick={() => ponLec({ ...l, materiales: [...l.materiales, materialVacio()] })}>Agregar Material</BotonAgregar>
              </div>
            );
          })}
          <div className="min-[560px]:ml-[72px]">
            <BotonAgregar onClick={() => ponSec(i, { ...s, lecciones: [...s.lecciones, leccionVacia()] })}>Agregar Lección</BotonAgregar>
          </div>
        </section>
      ))}

      <BotonAgregar onClick={() => onCambio([...secciones, seccionVacia()])}>Agregar Sección</BotonAgregar>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/* ---------- Recursos ---------- */

function Recursos({ recursos, onCambio }: { recursos: MaterialEd[]; onCambio: (r: MaterialEd[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-c10-title">Recursos</span>
        <span className="text-xs text-c10-meta">{recursos.length} {recursos.length === 1 ? "recurso" : "recursos"}</span>
      </div>
      <p className="m-0 text-[13px] text-c10-meta">
        Comparte con los participantes los materiales de apoyo: presentaciones, lecturas, videos o archivos descargables.
      </p>
      {!recursos.length && (
        <div className="flex flex-col items-center gap-1 rounded-xl bg-c10-sunken px-6 py-8 text-center">
          <span className="text-sm font-semibold text-c10-title">Sin recursos</span>
          <span className="text-xs text-c10-meta">Agrega los materiales que acompañan a la sesión.</span>
        </div>
      )}
      {recursos.map((m, i) => (
        <FilaMaterialEd
          key={m.key} m={m} conNombre
          onCambio={(nm) => onCambio(recursos.map((x, j) => (j === i ? nm : x)))}
          onQuitar={() => onCambio(recursos.filter((_, j) => j !== i))}
        />
      ))}
      <BotonAgregar onClick={() => onCambio([...recursos, materialVacio("Presentación")])}>Agregar Recurso</BotonAgregar>
    </div>
  );
}
