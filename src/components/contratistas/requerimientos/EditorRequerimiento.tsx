"use client";
// CF-01 · Asistente Nuevo / Editar requerimiento en 2 pasos.
//   1. Datos generales: documento de ejemplo (la IA autocompleta nombre, tipo y descripción),
//      nombre, plataforma, descripción, tipo (inspección / examen) y ámbito.
//   2. Configuración: vigencia o periodicidad (F0-14), avisos, acuse, limitante y criterios.
// Diseño: plataforma.dc.html, rqEdOpen (~2324–2434) y rqVals → rqEd (~7194–7320).
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, BellRing, Check, ExternalLink, FileText, FileUp, Link2, Loader2, MonitorCheck, FilePenLine, Pencil, Plus, SearchCheck,
  ShieldAlert, Shuffle, Sparkles, Stamp, Stethoscope, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaTexto, Boton, BotonIcono, Campo, Casilla, Consejo, Entrada, Etiqueta, Interruptor, Modal, Selector, avisar,
} from "@/components/contratistas/ui";
import { Pasos, TarjetaOpcion } from "@/components/contratistas/ligar";
import { Fila, Numero, PanelVigencia, Segmentado, VigenciaRequerimiento } from "@/components/contratistas/vigencia";
import { saveRequerimiento } from "@/services/contratistas";
import { analizarDocumento, subirArchivo } from "@/services/contratistas/analisis";
import type { Ambito, Plataforma, Requerimiento, TipoRequerimiento } from "@/types/contratistas";
import { iconoAmbito } from "@/components/contratistas/ligar/piezas";
import {
  AMBITOS_REQ, AYUDA_AMBITO, CRITERIOS_DEFECTO, INSPECCIONES, PLATAFORMAS, SUJETO_LIMITANTE, TIPOS_REQ, UNIDADES_AVISO,
  avisoDeAplicacion, categoriaInspeccion, conVigencia, criterio, erroresPaso1, erroresPaso2, requerimientoEditor, requerimientoInput,
  requerimientoNuevo, resumenAviso, urlSugerida, type CriterioEd, type RequerimientoEd,
} from "./requerimientos";

const PASOS = ["Datos generales", "Configuración"];
const MAX_MB = 10;

const ICONO_TIPO: Record<TipoRequerimiento, ReactNode> = {
  Documento: <FileText />, Examen: <Stethoscope />, "Inspección": <SearchCheck />,
};

export function EditorRequerimiento({
  requerimiento, onCerrar, onGuardado,
}: {
  requerimiento?: Requerimiento;
  onCerrar: () => void;
  onGuardado: (r: Requerimiento) => void;
}) {
  const [e, setE] = useState<RequerimientoEd>(() => (requerimiento ? requerimientoEditor(requerimiento) : requerimientoNuevo()));
  const [paso, setPaso] = useState(1);
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = (p: Partial<RequerimientoEd>) => setE((x) => ({ ...x, ...p }));

  const err1 = erroresPaso1(e);
  const err2 = erroresPaso2(e);
  const hay = (o: object) => Object.keys(o).length > 0;

  const siguiente = () => {
    if (paso === 1) {
      if (hay(err1)) return setIntento(true);
      setIntento(false);
      return setPaso(2);
    }
    guardar();
  };

  const guardar = async () => {
    setIntento(true);
    if (hay(err1)) return setPaso(1);
    if (hay(err2)) return;
    setGuardando(true);
    try {
      const r = await saveRequerimiento(requerimientoInput(e), requerimiento?.id);
      avisar(requerimiento ? "Se guardaron los cambios" : "Se creó el requerimiento");
      onGuardado(r);
      onCerrar();
    } catch (x) {
      avisar(x instanceof Error ? x.message : "No se pudo guardar el requerimiento", "error");
    } finally {
      setGuardando(false);
    }
  };

  const etiquetaGuardar = requerimiento ? "Guardar Cambios" : "Guardar";

  return (
    <Modal
      abierto onCerrar={onCerrar} ancho={720} titulo={requerimiento ? "Editar requerimiento" : "Nuevo requerimiento"}
      onGuardar={siguiente} guardando={guardando}
      cabecera={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-c10-meta">
            Paso {paso} de 2 · <b className="font-semibold text-c10-label">{PASOS[paso - 1]}</b>
          </span>
          <Pasos pasos={PASOS} actual={paso} />
        </div>
      }
      pie={
        <div className="flex gap-2 border-t border-c10-sunken px-6 py-4">
          <Boton variante="cancelar" flex disabled={guardando} onClick={paso === 1 ? onCerrar : () => { setIntento(false); setPaso(1); }}>
            {paso === 1 ? "Cancelar" : "Anterior"}
          </Boton>
          <Boton type="submit" flex disabled={guardando}>
            {guardando && <Loader2 className="animate-spin" />}
            {paso === 1 ? "Siguiente" : etiquetaGuardar}
          </Boton>
        </div>
      }
    >
      {paso === 1 ? <DatosGenerales e={e} set={set} setE={setE} err={intento ? err1 : {}} /> : <Configuracion e={e} set={set} intento={intento} />}
    </Modal>
  );
}

/* ---------- Paso 1 ---------- */

interface PasoProps {
  e: RequerimientoEd;
  set: (p: Partial<RequerimientoEd>) => void;
}

function DatosGenerales({ e, set, setE, err }: PasoProps & { setE: React.Dispatch<React.SetStateAction<RequerimientoEd>>; err: ReturnType<typeof erroresPaso1> }) {
  const algunaIA = !!(e.ia.nombre || e.ia.tipo || e.ia.descripcion);

  const cambiarTipo = (tipo: TipoRequerimiento) => {
    // Si los criterios siguen siendo los de fábrica del tipo anterior, se cambian por los del nuevo.
    const deFabrica = e.criterios.map((c) => c.texto).join("|") === CRITERIOS_DEFECTO[e.tipo].join("|");
    set({
      tipo, tipoManual: true, ia: { ...e.ia, tipo: false },
      ...(deFabrica ? { criterios: CRITERIOS_DEFECTO[tipo].map(criterio) } : {}),
      ...(tipo !== "Documento" ? { requiere_acuse: false } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <DocumentoEjemplo e={e} setE={setE} />

      {algunaIA && (
        <div className="flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2.5 text-[13px] leading-[1.45] text-violet-800 ring-1 ring-violet-200">
          <Sparkles className="mt-px size-4 shrink-0" aria-hidden />
          <span>Completamos los campos marcados con <b>IA</b> a partir del documento. Revísalos antes de continuar.</span>
        </div>
      )}

      <Campo etiqueta="Nombre del requerimiento" obligatorio error={err.nombre} extra={e.ia.nombre && <MarcaIA />}>
        <Entrada
          value={e.nombre} autoFocus placeholder="Ej. Registro REPSE"
          onChange={(x) => set({ nombre: x.target.value, ia: { ...e.ia, nombre: false } })}
        />
      </Campo>

      <Plataforma e={e} set={set} />

      <Campo etiqueta="Descripción" extra={e.ia.descripcion && <MarcaIA />}>
        <AreaTexto
          value={e.descripcion} rows={3} placeholder="Qué acredita y qué se revisa"
          onChange={(x) => set({ descripcion: x.target.value, ia: { ...e.ia, descripcion: false } })}
        />
      </Campo>

      <Campo etiqueta="Tipo" obligatorio extra={e.ia.tipo && <MarcaIA />}>
        <Segmentado
          etiqueta="Tipo de requerimiento" valor={e.tipo} onCambio={cambiarTipo}
          opciones={TIPOS_REQ.map((t) => ({ valor: t, etiqueta: t, icono: ICONO_TIPO[t] }))}
        />
      </Campo>

      {e.tipo === "Inspección" && <Inspeccion valor={e.inspeccion} onCambio={(inspeccion) => set({ inspeccion })} error={err.inspeccion} />}
      {e.tipo === "Examen" && <Examen e={e} set={set} error={err.modalidad} />}

      <Campo etiqueta="Ámbito" obligatorio error={err.ambito}>
        <div role="radiogroup" aria-label="Ámbito" className="grid gap-2 min-[620px]:grid-cols-3">
          {AMBITOS_REQ.map((a) => (
            <OpcionAmbito key={a} ambito={a} on={e.ambito === a} onClick={() => set({ ambito: a })} error={!!err.ambito} />
          ))}
        </div>
      </Campo>
    </div>
  );
}

const MarcaIA = () => (
  <span className="inline-flex h-[20px] items-center gap-1 rounded-full bg-violet-100 px-2 text-[11px] font-semibold text-violet-700" title="Completado con IA">
    <Sparkles className="size-3" aria-hidden />
    IA
  </span>
);

function OpcionAmbito({ ambito, on, onClick, error }: { ambito: Ambito; on: boolean; onClick: () => void; error: boolean }) {
  const Icono = iconoAmbito(ambito);
  return (
    <div className={cn("rounded-xl", error && !on && "shadow-[0_0_0_1px_#DC2626]")}>
      <TarjetaOpcion tipo="radio" marcada={on} onAlternar={onClick}>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-c10-title">
            <Icono className={cn("size-4 shrink-0", on ? "text-c10-acc" : "text-c10-meta")} aria-hidden />
            Cumplimiento por {ambito.toLowerCase()}
          </span>
          <span className="text-xs leading-snug text-c10-meta">{AYUDA_AMBITO[ambito]}</span>
        </span>
      </TarjetaOpcion>
    </div>
  );
}

/** Plataforma del trámite y su enlace (se sugiere el sitio oficial). */
function Plataforma({ e, set }: PasoProps) {
  const sugerida = urlSugerida(e.nombre, e.plataforma);
  const url = e.plataformaUrl ?? sugerida;
  const seguro = /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
  return (
    <div className="grid gap-4 min-[620px]:grid-cols-[220px_1fr]">
      <Campo etiqueta="Plataforma">
        <Selector<Plataforma>
          valor={e.plataforma} onCambio={(plataforma) => set({ plataforma, plataformaUrl: null })}
          opciones={PLATAFORMAS.map((p) => ({ valor: p, etiqueta: p }))}
        />
      </Campo>
      {e.plataforma !== "Sin plataforma" && (
        <Campo
          etiqueta="Enlace a la plataforma"
          ayuda={e.plataformaUrl === null && sugerida ? `Se sugiere el sitio oficial de ${e.plataforma}; puedes cambiarlo.` : "Se mostrará como acceso directo en el detalle del requerimiento."}
        >
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-c10-meta" aria-hidden />
              <Entrada type="url" className="pl-9" value={url} placeholder="https://" onChange={(x) => set({ plataformaUrl: x.target.value })} />
            </div>
            {seguro && (
              <BotonIcono titulo="Abrir sitio" icono={<ExternalLink />} onClick={() => window.open(seguro, "_blank", "noopener")} />
            )}
          </div>
        </Campo>
      )}
    </div>
  );
}

/* ---------- Documento de ejemplo + IA ---------- */

type FaseIA = { fase: "subiendo"; pct: number } | { fase: "leyendo"; paso: number } | { fase: "listo"; n: number } | { fase: "falla"; msg: string };

const PASOS_IA = ["Identificando documento", "Extrayendo datos"];

function tamano(bytes?: number) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

/** "acta_constitutiva-2024.pdf" → "Acta constitutiva 2024" (si la IA no sugiere nombre). */
function nombreDeArchivo(nombre: string) {
  const t = nombre.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function tipoProbable(texto: string): TipoRequerimiento {
  const t = texto.toLowerCase();
  if (/exam|m[eé]dic|antidop|prueba|evalua/.test(t)) return "Examen";
  if (/inspec|revisi|checklist/.test(t)) return "Inspección";
  return "Documento";
}

function DocumentoEjemplo({ e, setE }: { e: RequerimientoEd; setE: React.Dispatch<React.SetStateAction<RequerimientoEd>> }) {
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [ia, setIA] = useState<FaseIA | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  useEffect(() => () => abort.current?.abort(), []);

  const cargar = async (file?: File) => {
    if (!file) return;
    if (!/\.(pdf|jpe?g)$/i.test(file.name)) return avisar("Sube un archivo PDF o JPG", "error");
    if (file.size > MAX_MB * 1024 * 1024) return avisar(`El archivo pesa más de ${MAX_MB} MB`, "error");
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setIA({ fase: "subiendo", pct: 0 });
    try {
      const archivo = await subirArchivo(file, (pct) => setIA({ fase: "subiendo", pct }), ctl.signal);
      setE((x) => ({ ...x, documento_ejemplo: { name: archivo.name, file_url: archivo.file_url, size: archivo.size } }));
      setIA({ fase: "leyendo", paso: 0 });
      const t = setTimeout(() => setIA((s) => (s?.fase === "leyendo" ? { fase: "leyendo", paso: 1 } : s)), 900);
      let analisis;
      try {
        analisis = await analizarDocumento(archivo, {}, ctl.signal);
      } finally {
        clearTimeout(t);
      }
      if (!analisis.legible) {
        setIA({ fase: "falla", msg: analisis.alertas[0]?.detalle ?? "No pudimos leer el documento. Captura los datos manualmente." });
        return;
      }
      // Solo se llenan los campos vacíos; el tipo, si es alta y nadie lo eligió todavía.
      const nombre = analisis.nombre_sugerido || nombreDeArchivo(file.name);
      let n = 0;
      setE((x) => {
        const p: Partial<RequerimientoEd> = {};
        const marca = { ...x.ia };
        if (!x.nombre.trim() && nombre) { p.nombre = nombre; marca.nombre = true; n++; }
        if (!x.descripcion.trim() && nombre) {
          p.descripcion = `Acredita ${nombre.toLowerCase()}. Se valida que el documento esté vigente, sea legible y corresponda al titular.`;
          marca.descripcion = true;
          n++;
        }
        const tipo = tipoProbable(`${analisis.tipo ?? ""} ${file.name}`);
        if (!x.tipoManual) {
          p.tipo = tipo;
          marca.tipo = true;
          n++;
          // Criterios de fábrica del tipo anterior → los del tipo nuevo
          if (tipo !== x.tipo && x.criterios.map((c) => c.texto).join("|") === CRITERIOS_DEFECTO[x.tipo].join("|")) {
            p.criterios = CRITERIOS_DEFECTO[tipo].map(criterio);
          }
        }
        return { ...x, ...p, ia: marca };
      });
      setIA({ fase: "listo", n });
    } catch (x) {
      if (x instanceof DOMException && x.name === "AbortError") return;
      setIA({ fase: "falla", msg: x instanceof Error ? x.message : "No se pudo procesar el archivo" });
    }
  };

  const quitar = () => {
    abort.current?.abort();
    setIA(null);
    setE((x) => ({ ...x, documento_ejemplo: null }));
  };

  const doc = e.documento_ejemplo;
  const ocupado = ia?.fase === "subiendo" || ia?.fase === "leyendo";

  return (
    <div className="flex flex-col gap-2">
      <Etiqueta>Documento de ejemplo</Etiqueta>
      {doc || ocupado ? (
        <div className="flex items-center gap-3 rounded-xl bg-c10-surface px-3.5 py-3 ring-1 ring-c10-line">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-c10-acc-l text-c10-acc [&_svg]:size-5" aria-hidden>
            {ocupado ? <Loader2 className="animate-spin" /> : ia?.fase === "falla" ? <AlertTriangle /> : <FileText />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-c10-title" title={doc?.name}>{doc?.name ?? "Subiendo archivo…"}</span>
            {ia?.fase === "subiendo" && (
              <span className="h-1 w-full overflow-hidden rounded-full bg-c10-sunken">
                <span className="block h-full rounded-full bg-c10-acc transition-[width]" style={{ width: `${ia.pct}%` }} />
              </span>
            )}
            {ia?.fase === "leyendo" && (
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {PASOS_IA.map((t, i) => (
                  <span key={t} className={cn("inline-flex items-center gap-1", i < ia.paso ? "text-green-700" : i === ia.paso ? "text-c10-acc" : "text-c10-faint")}>
                    {i < ia.paso ? <Check className="size-3" /> : i === ia.paso ? <Loader2 className="size-3 animate-spin" /> : <span className="size-3" />}
                    {t}
                  </span>
                ))}
              </span>
            )}
            {ia?.fase === "listo" && (
              <span className="inline-flex items-center gap-1 text-xs text-c10-meta">
                {ia.n ? <><Sparkles className="size-3 text-violet-600" aria-hidden />{ia.n} {ia.n === 1 ? "campo completado" : "campos completados"} con IA</> : "Documento de referencia"}
                {doc?.size ? ` · ${tamano(doc.size)}` : ""}
              </span>
            )}
            {ia?.fase === "falla" && <span className="text-xs text-red-600">{ia.msg}</span>}
            {!ia && <span className="text-xs text-c10-meta">Documento de referencia{doc?.size ? ` · ${tamano(doc.size)}` : ""}</span>}
          </span>
          {doc && !ocupado && /^https?:|^blob:/.test(doc.file_url) && (
            <BotonIcono titulo="Abrir documento" icono={<ExternalLink />} sinFondo onClick={() => window.open(doc.file_url, "_blank", "noopener")} />
          )}
          <BotonIcono titulo={ocupado ? "Cancelar" : "Quitar documento"} icono={<X />} sinFondo peligro onClick={quitar} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(x) => { x.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(x) => { x.preventDefault(); setArrastrando(false); cargar(x.dataTransfer.files?.[0]); }}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center transition-colors duration-150",
            arrastrando ? "border-c10-acc bg-c10-acc-subtle" : "border-c10-line-strong bg-c10-surface hover:border-c10-acc",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-c10-acc-l text-c10-acc [&_svg]:size-5" aria-hidden><FileUp /></span>
          <span className="text-sm font-semibold text-c10-title">Arrastra un documento o <span className="text-c10-acc">selecciónalo</span></span>
          <span className="inline-flex items-center gap-1 text-xs text-c10-meta">
            <Sparkles className="size-3 text-violet-600" aria-hidden />
            La IA lo analiza y completa nombre, tipo y descripción · PDF o JPG, máx. {MAX_MB} MB
          </span>
        </button>
      )}
      <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" hidden onChange={(x) => { cargar(x.target.files?.[0]); x.target.value = ""; }} />
    </div>
  );
}

/* ---------- Inspección y examen ---------- */

function Inspeccion({ valor, onCambio, error }: { valor: string; onCambio: (v: string) => void; error?: string }) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const grupos = useMemo(
    () => INSPECCIONES.map(([cat, items]) => ({ cat, items: items.filter((n) => !q || norm(n).includes(norm(q)) || norm(cat).includes(norm(q))) })).filter((g) => g.items.length),
    [q],
  );
  const categoria = categoriaInspeccion(valor);
  return (
    <Campo etiqueta="Inspección" obligatorio error={error} ayuda={!abierto && valor && categoria ? `Categoría: ${categoria}` : undefined}>
      <div className="relative">
        <SearchCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-c10-meta" aria-hidden />
        <Entrada
          className="pl-9" role="combobox" aria-expanded={abierto} autoComplete="off" placeholder="Busca la inspección"
          value={abierto ? q : valor}
          onFocus={() => { setQ(""); setAbierto(true); }}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onChange={(x) => { setQ(x.target.value); setAbierto(true); }}
        />
        {abierto && (
          <div role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-[260px] overflow-y-auto rounded-xl bg-c10-surface p-1.5 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]">
            {!grupos.length && <div className="px-3 py-2 text-sm text-c10-meta">No se encontraron inspecciones</div>}
            {grupos.map((g) => (
              <div key={g.cat} className="flex flex-col">
                <span className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[.04em] text-c10-meta">{g.cat}</span>
                {g.items.map((n) => {
                  const on = n === valor && categoria === g.cat;
                  return (
                    <button
                      key={`${g.cat}|${n}`} type="button" role="option" aria-selected={on}
                      onMouseDown={(x) => x.preventDefault()}
                      onClick={() => { onCambio(n); setAbierto(false); }}
                      className={cn("flex min-h-9 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm hover:bg-c10-sunken", on ? "font-semibold text-c10-acc" : "text-c10-title")}
                    >
                      {n}
                      {on && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </Campo>
  );
}

function Examen({ e, set, error }: PasoProps & { error?: string }) {
  const ex = e.examen;
  const pon = (p: Partial<RequerimientoEd["examen"]>) => set({ examen: { ...ex, ...p } });
  const digital = ex.modalidad === "digital";
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-c10-sunken px-4 py-3.5">
      <Campo etiqueta="Tipo de examen" obligatorio error={error}>
        <Segmentado
          etiqueta="Tipo de examen" valor={ex.modalidad ?? ("" as "fisico")} onCambio={(modalidad) => pon({ modalidad })}
          opciones={[
            { valor: "fisico" as const, etiqueta: "Físico", icono: <FilePenLine /> },
            { valor: "digital" as const, etiqueta: "Digital", icono: <MonitorCheck /> },
          ]}
        />
      </Campo>
      {ex.modalidad && (
        <Fila>
          Intentos permitidos
          <Numero valor={ex.intentos} onCambio={(intentos) => pon({ intentos })} min={1} max={10} etiqueta="Intentos permitidos" />
          {ex.intentos === 1 ? "intento" : "intentos"}
        </Fila>
      )}
      {digital && (
        <div className="flex flex-col gap-3 border-t border-c10-line pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-c10-title">
              <Shuffle className="size-4 text-c10-acc" aria-hidden />
              Aplicación aleatoria
            </span>
            <Interruptor valor={ex.aleatoria} onCambio={(aleatoria) => pon({ aleatoria })} etiqueta="Aplicación aleatoria" />
          </div>
          {ex.aleatoria && (
            <div className="flex flex-col gap-2.5 duration-200 animate-in fade-in">
              <OpcionCasilla
                marcada={ex.preguntas_aleatorias} onCambio={(preguntas_aleatorias) => pon({ preguntas_aleatorias })}
                titulo="Mezclar el orden de las preguntas" texto="Las preguntas aparecen en distinto orden para cada empleado."
              />
              <OpcionCasilla
                marcada={ex.respuestas_aleatorias} onCambio={(respuestas_aleatorias) => pon({ respuestas_aleatorias })}
                titulo="Mezclar el orden de las respuestas" texto="Las opciones de cada pregunta cambian de posición."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OpcionCasilla({ marcada, onCambio, titulo, texto }: { marcada: boolean; onCambio: (v: boolean) => void; titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Casilla marcada={marcada} onCambio={onCambio} titulo={titulo} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-c10-title">{titulo}</span>
        <span className="text-xs text-c10-meta">{texto}</span>
      </span>
    </div>
  );
}

/* ---------- Paso 2 ---------- */

function Configuracion({ e, set, intento }: PasoProps & { intento: boolean }) {
  const vig = conVigencia(e);
  const ap = avisoDeAplicacion(e.tipo, e.vigencia);
  const a = e.aviso;
  const ponAviso = (p: Partial<typeof a>) => set({ aviso: { ...a, ...p } });
  return (
    <div className="flex flex-col gap-4">
      <VigenciaRequerimiento tipo={e.tipo} valor={e.vigencia} onCambio={(vigencia) => set({ vigencia })} intento={intento} />

      <div className={cn(!vig && "pointer-events-none opacity-50")} title={vig ? undefined : "Activa la vigencia para configurar los avisos"} aria-disabled={!vig}>
        <PanelVigencia
          icono={<BellRing />}
          titulo={ap ? "Recordatorios de aplicación" : "Avisos de vencimiento"}
          ayuda={
            !vig
              ? "Disponible solo para requerimientos con vigencia."
              : ap
                ? a.activo ? "Se recordará al responsable antes de cada aplicación." : "Activa para recordar al responsable antes de cada aplicación."
                : `${a.activo ? "Se notificará" : "Activa para notificar"} al responsable antes de que ${e.tipo === "Examen" ? "el resultado del examen" : "el documento"} pierda vigencia.`
          }
          activa={vig && a.activo}
          onActiva={(activo) => ponAviso({ activo })}
        >
          {vig && a.activo && (
            <>
              <Fila>
                Primer aviso
                <Numero valor={a.n} onCambio={(n) => ponAviso({ n })} max={99} etiqueta="Primer aviso: cantidad" />
                <Selector
                  className="w-[130px]" etiqueta="Primer aviso: unidad" valor={a.unidad} onCambio={(unidad) => ponAviso({ unidad })}
                  opciones={UNIDADES_AVISO.map((u) => ({ valor: u, etiqueta: u }))}
                />
                {ap ? "antes de cada aplicación" : "antes de que venza"}
              </Fila>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-c10-label">Repetir cada día hasta que {ap ? "se aplique" : "se renueve"}</span>
                <Interruptor valor={a.repetir} onCambio={(repetir) => ponAviso({ repetir })} etiqueta="Repetir el aviso" />
              </div>
              <Consejo>{resumenAviso(e.tipo, e.vigencia, a)}</Consejo>
            </>
          )}
        </PanelVigencia>
      </div>

      {e.tipo === "Documento" && (
        <PanelVigencia
          icono={<Stamp />} titulo="Requiere acuse"
          ayuda={e.requiere_acuse ? "Se pedirá junto con el acuse de recibo de la autoridad." : "Activa si además del documento se pide su acuse de recibo."}
          activa={e.requiere_acuse} onActiva={(requiere_acuse) => set({ requiere_acuse })}
        />
      )}

      <PanelVigencia
        icono={<ShieldAlert />} titulo="Limitante"
        ayuda={`Si está activo, ${e.ambito ? SUJETO_LIMITANTE[e.ambito] : "el ámbito seleccionado"} no podrá operar sin este requerimiento.`}
        activa={e.limitante} onActiva={(limitante) => set({ limitante })}
      />

      <Criterios criterios={e.criterios} onCambio={(criterios) => set({ criterios })} />
    </div>
  );
}

/** Criterios de revisión: alta, edición y borrado en línea. */
function Criterios({ criterios, onCambio }: { criterios: CriterioEd[]; onCambio: (c: CriterioEd[]) => void }) {
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState<{ key: string; texto: string } | null>(null);
  const agregar = () => {
    if (!nuevo.trim()) return;
    onCambio([...criterios, criterio(nuevo.trim())]);
    setNuevo("");
  };
  const confirmar = () => {
    if (!editando) return;
    const t = editando.texto.trim();
    onCambio(t ? criterios.map((c) => (c.key === editando.key ? { ...c, texto: t } : c)) : criterios);
    setEditando(null);
  };
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-c10-title">Criterios de revisión</span>
        <span className="text-xs tabular-nums text-c10-meta">{criterios.length} {criterios.length === 1 ? "criterio" : "criterios"}</span>
      </div>
      {!!criterios.length && (
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {criterios.map((c, i) => {
            const ed = editando?.key === c.key;
            return (
              <li key={c.key} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-2", ed ? "bg-c10-surface ring-1 ring-c10-acc" : "hover:bg-c10-sunken")}>
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-c10-meta">{i + 1}</span>
                {ed ? (
                  <>
                    <Entrada
                      autoFocus className="h-8 flex-1" value={editando.texto} aria-label={`Criterio ${i + 1}`}
                      onChange={(x) => setEditando({ key: c.key, texto: x.target.value })}
                      onKeyDown={(x) => {
                        if (x.key === "Enter") { x.preventDefault(); confirmar(); }
                        if (x.key === "Escape") { x.preventDefault(); x.stopPropagation(); setEditando(null); }
                      }}
                    />
                    <BotonIcono titulo="Guardar criterio" icono={<Check />} sinFondo onClick={confirmar} />
                    <BotonIcono titulo="Cancelar" icono={<X />} sinFondo onClick={() => setEditando(null)} />
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm text-c10-title">{c.texto}</span>
                    <BotonIcono titulo="Editar criterio" icono={<Pencil />} sinFondo onClick={() => setEditando({ key: c.key, texto: c.texto })} />
                    <BotonIcono titulo="Eliminar criterio" icono={<Trash2 />} sinFondo peligro onClick={() => onCambio(criterios.filter((x) => x.key !== c.key))} />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex items-center gap-2">
        <Entrada
          value={nuevo} placeholder="Agrega un criterio de revisión" aria-label="Nuevo criterio"
          onChange={(x) => setNuevo(x.target.value)}
          onKeyDown={(x) => { if (x.key === "Enter") { x.preventDefault(); agregar(); } }}
        />
        <Boton variante="contorno" icono={<Plus />} disabled={!nuevo.trim()} onClick={agregar}>Agregar</Boton>
      </div>
    </section>
  );
}
