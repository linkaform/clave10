"use client";
// CF-01 · Panel de detalle de un requerimiento: Generales y Aplicación (Exigencia, sujetos
// según el ámbito y contratos donde se solicita).
// Diseño: plataforma.dc.html, rqDetOpen (~1972–2049), rqD (~7186) y rqUso (~6713).
// Back: get_requerimiento y get_aplicacion_requerimiento (CF-01-B).
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Briefcase, ExternalLink, FilePlus2, FileText, IdCard, ListChecks, Pencil, Trash2, Truck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BASE } from "@/lib/contratistas/contexto";
import {
  Boton, BotonIcono, Buscador, CLASE_CHIP, ChipEstado, ChipFolio, EstadoVacio, Paginacion, Tabla, tipoVacio, useTabla,
} from "@/components/contratistas/ui";
import { Dato, Datos, PanelDetalle, TarjetaPanel } from "@/components/contratistas/panel";
import { FiltroChips, FiltrosCabecera, coincide, enLista, useFiltros } from "@/components/contratistas/filtros";
import { ChipAmbito, ChipTipoRequerimiento } from "@/components/contratistas/ligar";
import { ESTADO_CUMPLIMIENTO } from "@/mappers/contratistas.mapper";
import { getAplicacionRequerimiento, getRequerimiento } from "@/services/contratistas";
import type { AplicacionRequerimiento, Requerimiento } from "@/types/contratistas";
import { ChipLimitante } from "./piezas";
import { CLAVE_REQUERIMIENTOS, SUJETOS_AMBITO, type AbrirEditorReq, avisoDeAplicacion, categoriaInspeccion, textoAviso, textoVigencia, vigenciaDe } from "./requerimientos";

export function DetalleRequerimiento({
  id, onCerrar, onEditar, onEliminar,
}: {
  id: string | null;
  onCerrar: () => void;
  onEditar: AbrirEditorReq;
  onEliminar: (r: Requerimiento) => void;
}) {
  const q = useQuery({ queryKey: [...CLAVE_REQUERIMIENTOS, "detalle", id], queryFn: () => getRequerimiento(id!), enabled: !!id });
  const r = q.data;
  const [tab, setTab] = useState("generales");
  useEffect(() => setTab("generales"), [id]);

  return (
    <PanelDetalle
      abierto={!!id} onCerrar={onCerrar} enTabla etiqueta="Detalle del requerimiento" sinPie
      titulo={r?.nombre ?? "Cargando…"} cargando={q.isLoading}
      chips={r && (
        <>
          <ChipTipoRequerimiento tipo={r.tipo} />
          <ChipAmbito ambito={r.ambito} />
          {r.limitante && <ChipLimitante si texto="Limitante" />}
        </>
      )}
      acciones={r && (
        <>
          <BotonIcono titulo="Editar" icono={<Pencil />} onClick={() => onEditar(r)} />
          <BotonIcono titulo="Eliminar" icono={<Trash2 />} peligro onClick={() => onEliminar(r)} />
        </>
      )}
      tabs={r ? [{ k: "generales", etiqueta: "Generales" }, { k: "aplicacion", etiqueta: "Aplicación" }] : []}
      tab={tab} onTab={setTab}
    >
      {r && tab === "generales" && <Generales r={r} onEditar={() => onEditar(r)} />}
      {r && tab === "aplicacion" && <Aplicacion r={r} />}
    </PanelDetalle>
  );
}

/* ---------- Generales ---------- */

const urlSegura = (u?: string | null) => (u && /^(https?:|blob:)/i.test(u) ? u : null);

function Generales({ r, onEditar }: { r: Requerimiento; onEditar: () => void }) {
  const ej = r.documento_ejemplo;
  const urlEj = urlSegura(ej?.file_url);
  const urlPl = urlSegura(r.plataforma_url);
  const aviso = textoAviso(r);
  const v = vigenciaDe(r);
  const ex = r.examen;
  return (
    <div className="flex flex-col gap-4">
      <TarjetaPanel titulo="Documento de ejemplo">
        {ej ? (
          <div className="flex items-center gap-3 rounded-lg bg-c10-panel px-3 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-c10-acc-l text-c10-acc [&_svg]:size-4" aria-hidden><FileText /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-c10-title" title={ej.name}>{ej.name}</span>
            {urlEj && <BotonIcono titulo="Abrir documento" icono={<ExternalLink />} sinFondo onClick={() => window.open(urlEj, "_blank", "noopener")} />}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-c10-meta">Aún no hay un documento de ejemplo para quien lo sube.</span>
            <Boton variante="contorno" tam="sm" icono={<FilePlus2 />} onClick={onEditar}>Agregar Documento</Boton>
          </div>
        )}
      </TarjetaPanel>

      <TarjetaPanel titulo="Generales">
        <Datos>
          <Dato nombre="Vigencia">{textoVigencia(r)}</Dato>
          <Dato nombre={avisoDeAplicacion(r.tipo, v) && v.activa ? "Recordatorios de aplicación" : "Avisos de vencimiento"}>
            {aviso ?? undefined}
          </Dato>
          <Dato nombre="Plataforma">
            {r.plataforma === "Sin plataforma" ? undefined : urlPl ? (
              <a href={urlPl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-c10-acc hover:underline">
                {r.plataforma}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : r.plataforma}
          </Dato>
          {r.tipo === "Documento" && <Dato nombre="Requiere acuse">{r.requiere_acuse ? "Sí, acuse de recibo de la autoridad" : "No"}</Dato>}
          <Dato nombre="Descripción" completo>{r.descripcion || undefined}</Dato>
        </Datos>
      </TarjetaPanel>

      {r.tipo === "Examen" && (
        <TarjetaPanel titulo="Configuración del examen">
          <Datos>
            <Dato nombre="Tipo de examen">{ex ? (ex.modalidad === "digital" ? "Digital" : "Físico") : undefined}</Dato>
            <Dato nombre="Intentos permitidos">{ex ? `${ex.intentos} ${ex.intentos === 1 ? "intento" : "intentos"}` : undefined}</Dato>
            {ex?.modalidad === "digital" && (
              <Dato nombre="Aplicación aleatoria">
                {ex.preguntas_aleatorias || ex.respuestas_aleatorias
                  ? `Mezcla ${[ex.preguntas_aleatorias && "orden de preguntas", ex.respuestas_aleatorias && "orden de respuestas"].filter(Boolean).join(" y ")}`
                  : "No"}
              </Dato>
            )}
          </Datos>
        </TarjetaPanel>
      )}

      {r.tipo === "Inspección" && (
        <TarjetaPanel titulo="Configuración de la inspección">
          <Datos>
            <Dato nombre="Inspección">{r.inspeccion || undefined}</Dato>
            <Dato nombre="Categoría">{categoriaInspeccion(r.inspeccion) ?? undefined}</Dato>
          </Datos>
        </TarjetaPanel>
      )}

      <TarjetaPanel
        titulo={
          <span className="flex items-center gap-2">
            <ListChecks className="size-4 text-c10-acc" aria-hidden />
            Criterios de revisión
            <span className="text-xs font-normal tabular-nums text-c10-meta">{r.criterios.length}</span>
          </span>
        }
      >
        {r.criterios.length ? (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {r.criterios.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-c10-title">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-c10-acc-l text-[11px] font-semibold tabular-nums text-c10-acc">{i + 1}</span>
                {c}
              </li>
            ))}
          </ol>
        ) : (
          <span className="text-sm text-c10-meta">Sin criterios de revisión.</span>
        )}
      </TarjetaPanel>
    </div>
  );
}

/* ---------- Aplicación ---------- */

type SubTab = "exigencia" | "sujetos" | "contratos";

function Aplicacion({ r }: { r: Requerimiento }) {
  const q = useQuery({ queryKey: [...CLAVE_REQUERIMIENTOS, "aplicacion", r.id], queryFn: () => getAplicacionRequerimiento(r.id) });
  const [sub, setSub] = useState<SubTab>("exigencia");
  const a = q.data;
  const s = SUJETOS_AMBITO[r.ambito];
  const subs: { k: SubTab; etiqueta: string; n?: number }[] = [
    { k: "exigencia", etiqueta: "Exigencia", n: a ? a.exigencia.length + a.relaciones.length : undefined },
    { k: "sujetos", etiqueta: s.pestana, n: a ? new Set(a.sujetos.map((x) => x.sujeto.id)).size : undefined },
    { k: "contratos", etiqueta: "Contratos donde se solicita", n: a?.contratos.length },
  ];
  const vacio = (titulo: string, texto: string) => (
    <EstadoVacio tipo={tipoVacio({ error: q.error })} titulo={q.error ? undefined : titulo} texto={q.error ? undefined : texto} className="min-h-[240px]" />
  );
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Aplicación" className="flex flex-wrap gap-2">
        {subs.map((t) => {
          const on = t.k === sub;
          return (
            <button
              key={t.k} type="button" role="tab" aria-selected={on} onClick={() => setSub(t.k)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors duration-150",
                on ? "bg-c10-acc font-semibold text-white" : "bg-c10-surface font-medium text-c10-label shadow-[0_0_0_1px_var(--c10-line)] hover:text-c10-acc",
              )}
            >
              {t.etiqueta}
              {t.n !== undefined && <span className={cn("text-[11px] tabular-nums", on ? "text-white/80" : "text-c10-meta")}>{t.n}</span>}
            </button>
          );
        })}
      </div>
      {sub === "exigencia" && (
        <Exigencia a={a} cargando={q.isLoading} vacio={vacio("Nadie lo exige todavía", "Lígalo a servicios, perfiles o equipos desde sus pestañas en Configuraciones.")} />
      )}
      {sub === "sujetos" && (
        <Sujetos a={a} cargando={q.isLoading} nombre={s} vacio={vacio(`Sin ${s.plural} con este requerimiento`, "Aparecen cuando un contrato o una relación lo exige.")} />
      )}
      {sub === "contratos" && (
        <Contratos a={a} cargando={q.isLoading} vacio={vacio("No se solicita en ningún contrato", "Se solicita en los contratos que incluyen un servicio, perfil o equipo que lo exige.")} />
      )}
    </div>
  );
}

interface SubProps {
  a?: AplicacionRequerimiento;
  cargando: boolean;
  vacio: ReactNode;
}

/** Buscador, filtros y tabla paginada de una sub-pestaña. */
function Lista<T>({
  datos, columnas, getId, cargando, vacio, filtros, buscar, placeholder, onLimpiar, cuenta, nombreFila,
}: {
  datos: T[];
  columnas: ColumnDef<T, unknown>[];
  getId: (x: T) => string;
  cargando: boolean;
  vacio: ReactNode;
  filtros?: ReactNode;
  buscar: [string, (v: string) => void];
  placeholder: string;
  onLimpiar?: () => void;
  cuenta?: number;
  nombreFila: (x: T) => string;
}) {
  const tabla = useTabla({ datos, columnas, getId });
  const [qq, setQq] = buscar;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-2">
        {filtros && <FiltrosCabecera cuenta={cuenta ?? 0} onLimpiar={onLimpiar ?? (() => {})} filtros={filtros} />}
        <Buscador value={qq} onChange={(e) => setQq(e.target.value)} placeholder={placeholder} className="w-[220px]" />
      </div>
      <Tabla tabla={tabla} cargando={cargando} vacio={vacio} nombreFila={nombreFila} />
      <Paginacion tabla={tabla} />
    </div>
  );
}

type FilaExigencia = { id: string; nombre: string; clase: "Servicio" | "Perfil" | "Equipo" | "Contratista"; detalle?: string; href?: string };

const CLASE: Record<FilaExigencia["clase"], { chip: string; Icono: typeof Briefcase }> = {
  Servicio: { chip: "bg-c10-blue-light text-blue-700", Icono: Briefcase },
  Perfil: { chip: "bg-violet-100 text-violet-700", Icono: IdCard },
  Equipo: { chip: "bg-orange-100 text-orange-800", Icono: Truck },
  Contratista: { chip: "bg-green-100 text-green-700", Icono: Building2 },
};

function ChipClase({ clase }: { clase: FilaExigencia["clase"] }) {
  const { chip, Icono } = CLASE[clase];
  return (
    <span className={cn(CLASE_CHIP, chip)}>
      <Icono className="size-3" aria-hidden />
      {clase === "Contratista" ? "Asignado al contratista" : clase}
    </span>
  );
}

function Exigencia({ a, cargando, vacio }: SubProps) {
  const [q, setQ] = useState("");
  const f = useFiltros({ clase: [] as string[] }, { url: false });
  const base = useMemo<FilaExigencia[]>(
    () => [
      ...(a?.exigencia ?? []).map((x) => ({ id: x.id, nombre: x.nombre, clase: (x.tipo || "Servicio") as FilaExigencia["clase"] })),
      ...(a?.relaciones ?? []).map((x) => ({
        id: `rel-${x.id}`, nombre: x.contratista, clase: "Contratista" as const, detalle: x.folio, href: `${BASE}/contratistas/${x.id}`,
      })),
    ],
    [a],
  );
  const datos = useMemo(() => base.filter((x) => coincide(q, x.nombre, x.detalle) && enLista(f.valores.clase, x.clase)), [base, q, f.valores]);
  const clases = (["Servicio", "Perfil", "Equipo", "Contratista"] as const).filter((c) => base.some((x) => x.clase === c));
  const columnas = useMemo<ColumnDef<FilaExigencia, unknown>[]>(
    () => [
      {
        id: "nombre", header: "Nombre", accessorFn: (x) => x.nombre, meta: { principal: true },
        cell: ({ row: { original: x } }) =>
          x.href ? (
            <Link href={x.href} className="font-semibold text-c10-title hover:text-c10-acc hover:underline">{x.nombre}</Link>
          ) : (
            <span className="font-semibold text-c10-title">{x.nombre}</span>
          ),
      },
      { id: "clase", header: "Tipo", accessorFn: (x) => x.clase, cell: ({ row }) => <ChipClase clase={row.original.clase} /> },
      { id: "detalle", header: "Folio", enableSorting: false, cell: ({ row }) => (row.original.detalle ? <ChipFolio folio={row.original.detalle} /> : <span className="text-c10-faint">---</span>) },
    ],
    [],
  );
  return (
    <Lista
      datos={datos} columnas={columnas} getId={(x) => x.id} cargando={cargando} vacio={vacio} buscar={[q, setQ]} placeholder="Buscar"
      nombreFila={(x) => x.nombre} cuenta={f.cuenta} onLimpiar={f.limpiar}
      filtros={
        clases.length > 1 ? (
          <FiltroChips
            titulo="Tipo" valor={f.valores.clase} onCambio={(v) => f.poner("clase", v)}
            opciones={clases.map((c) => ({ valor: c, etiqueta: c === "Contratista" ? "Asignado al contratista" : c, cuenta: base.filter((x) => x.clase === c).length }))}
          />
        ) : undefined
      }
    />
  );
}

type FilaSujeto = AplicacionRequerimiento["sujetos"][number] & { key: string };

function Sujetos({ a, cargando, vacio, nombre }: SubProps & { nombre: (typeof SUJETOS_AMBITO)[keyof typeof SUJETOS_AMBITO] }) {
  const [q, setQ] = useState("");
  const f = useFiltros({ estado: [] as string[] }, { url: false });
  const base = useMemo<FilaSujeto[]>(() => (a?.sujetos ?? []).map((x, i) => ({ ...x, key: `${x.sujeto.id}-${x.periodo}-${x.contrato ?? ""}-${i}` })), [a]);
  const etiqueta = (x: FilaSujeto) => ESTADO_CUMPLIMIENTO[x.estado]?.label ?? x.estado;
  const datos = useMemo(
    () => base.filter((x) => coincide(q, x.sujeto.nombre, x.empresa.nombre, x.periodo) && enLista(f.valores.estado, etiqueta(x))),
    [base, q, f.valores],
  );
  const estados = [...new Set(base.map(etiqueta))];
  const columnas = useMemo<ColumnDef<FilaSujeto, unknown>[]>(
    () => [
      {
        id: "sujeto", header: nombre.pestana.replace(/s$/, ""), accessorFn: (x) => x.sujeto.nombre, meta: { principal: true },
        cell: ({ row: { original: x } }) => <span className="font-semibold text-c10-title">{x.sujeto.nombre}</span>,
      },
      ...(nombre.pestana !== "Contratistas"
        ? [{ id: "empresa", header: "Empresa", accessorFn: (x: FilaSujeto) => x.empresa.nombre, cell: ({ row }: { row: { original: FilaSujeto } }) => <span className="text-c10-secondary">{row.original.empresa.nombre}</span> }]
        : []),
      { id: "periodo", header: "Periodo", accessorFn: (x) => x.periodo, cell: ({ row }) => <span className="tabular-nums text-c10-secondary">{row.original.periodo || "---"}</span> },
      {
        id: "estado", header: "Estado", accessorFn: (x) => etiqueta(x),
        cell: ({ row: { original: x } }) => <ChipEstado texto={etiqueta(x)} tono={ESTADO_CUMPLIMIENTO[x.estado]?.tono ?? "neutral"} />,
      },
    ],
    [nombre],
  );
  return (
    <Lista
      datos={datos} columnas={columnas} getId={(x) => x.key} cargando={cargando} vacio={vacio} buscar={[q, setQ]} placeholder={`Buscar ${nombre.singular}`}
      nombreFila={(x) => x.sujeto.nombre} cuenta={f.cuenta} onLimpiar={f.limpiar}
      filtros={
        estados.length > 1 ? (
          <FiltroChips
            titulo="Estado" valor={f.valores.estado} onCambio={(v) => f.poner("estado", v)}
            opciones={estados.map((e) => ({ valor: e, cuenta: base.filter((x) => etiqueta(x) === e).length }))}
          />
        ) : undefined
      }
    />
  );
}

type FilaContrato = AplicacionRequerimiento["contratos"][number];

function Contratos({ a, cargando, vacio }: SubProps) {
  const [q, setQ] = useState("");
  const base = useMemo(() => a?.contratos ?? [], [a]);
  const datos = useMemo(() => base.filter((x) => coincide(q, x.folio, x.contratista)), [base, q]);
  const columnas = useMemo<ColumnDef<FilaContrato, unknown>[]>(
    () => [
      {
        id: "folio", header: "Contrato", accessorFn: (x) => x.folio, meta: { principal: true },
        cell: ({ row: { original: x } }) => (
          <Link href={`${BASE}/contratos/${x.id}`} className="hover:opacity-80" title="Abrir contrato"><ChipFolio folio={x.folio} /></Link>
        ),
      },
      { id: "contratista", header: "Contratista", accessorFn: (x) => x.contratista, cell: ({ row }) => <span className="text-c10-title">{row.original.contratista || "---"}</span> },
    ],
    [],
  );
  return (
    <Lista
      datos={datos} columnas={columnas} getId={(x) => x.id} cargando={cargando} vacio={vacio} buscar={[q, setQ]} placeholder="Buscar contrato"
      nombreFila={(x) => x.folio}
    />
  );
}

