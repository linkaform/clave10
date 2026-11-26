"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContratosLista } from "@/components/contratistas/contratos/ContratosLista";
import { DocumentosEmpresa } from "@/components/contratistas/empresa/DocumentosEmpresa";
import { useContratistasContexto } from "@/hooks/Contratistas/useContratistasContexto";
import { BASE, hrefPestana, nombreCorto } from "@/lib/contratistas/contexto";
import { ESTATUS_CONTRATO_TONO, type Tono } from "@/mappers/contratistas.mapper";

const TONO_PILL: Record<Tono, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-600",
};

function Pill({ texto, tono }: { texto: string; tono: Tono }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${TONO_PILL[tono]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {texto}
    </span>
  );
}

/**
 * Marco de todas las pantallas de Contratistas (F0-03): migas, título del
 * registro abierto, barra de pestañas por modo y acento de color. El contenido
 * de cada pestaña lo pone su tarea; mientras no exista se muestra cuál es.
 */
export function ContratistasShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const ctx = useContratistasContexto();
  const { modo, etiquetas, pestanas, pestana, acento, contraparte, contrato, relacion } = ctx;

  const desdeContrato = modo === "contrato" ? ctx.desde : undefined;

  const migaBase =
    modo === "propio"
      ? { label: "Mi empresa", href: `${BASE}/mi-empresa` }
      : modo === "contrato"
        ? { label: "Contratos", href: ctx.desde }
        : { label: etiquetas.kPl, href: `${BASE}/${etiquetas.cli ? "clientes" : "contratistas"}` };

  return (
    <div
      data-c10-acc={acento}
      className="min-h-[calc(100vh-var(--c10-header-h,65px))] bg-c10-canvas font-[Arial,Helvetica,sans-serif]"
    >
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-20 pt-6 min-[1080px]:px-5 min-[1080px]:pt-10 min-[1440px]:px-6 min-[1440px]:pt-12">
        <div className="sticky top-[var(--c10-header-h,65px)] z-20 -mx-4 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 bg-c10-canvas px-4 py-2 min-[1080px]:mx-0 min-[1080px]:px-0">
          <div className="flex min-w-0 flex-col gap-1.5">
            <nav aria-label="Migas" className="flex items-center gap-1.5 text-[13px] text-c10-meta">
              <Link href={migaBase.href} className="hover:text-c10-acc">
                {migaBase.label}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-c10-faint" aria-hidden />
              <span className="font-medium text-c10-label">{pestana.activa.label}</span>
            </nav>

            {modo === "detalle" && (
              <div className="flex min-w-0 items-center gap-2.5">
                <h1 className="truncate text-2xl font-semibold tracking-[-0.025em] text-c10-title">
                  {contraparte ? nombreCorto(contraparte.razon_social) : ctx.isLoading ? "Cargando…" : "—"}
                </h1>
                {relacion && (
                  <Pill texto={relacion.estatus} tono={relacion.estatus === "Activo" ? "success" : "neutral"} />
                )}
              </div>
            )}

            {modo === "contrato" && (
              <div className="flex min-w-0 items-center gap-2.5">
                <Link
                  href={ctx.desde}
                  title="Regresar"
                  aria-label="Regresar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-c10-surface text-c10-secondary ring-1 ring-c10-line hover:text-c10-acc"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <h1 className="truncate text-2xl font-semibold tracking-[-0.025em] text-c10-title">
                  {contrato ? `${contrato.folio} · ${contrato.objeto}` : ctx.isLoading ? "Cargando…" : "—"}
                </h1>
                {contrato && <Pill texto={contrato.estatus} tono={ESTATUS_CONTRATO_TONO[contrato.estatus]} />}
              </div>
            )}

            {(modo === "propio" || modo === "lista") && (
              <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-c10-title min-[1080px]:text-[32px]">
                {modo === "propio" ? "Mi empresa" : etiquetas.kPl}
              </h1>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Secciones"
            className="flex max-w-full overflow-x-auto rounded-lg bg-c10-surface ring-1 ring-c10-line"
          >
            {pestanas.map((p, i) => {
              const on = p.key === pestana.resaltada;
              return (
                <Link
                  key={p.key}
                  role="tab"
                  aria-selected={on}
                  href={hrefPestana(pathname, p.key, desdeContrato)}
                  scroll={false}
                  className={`flex h-10 shrink-0 items-center whitespace-nowrap px-4 text-sm transition-colors ${
                    i ? "border-l border-c10-line" : ""
                  } ${on ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-secondary hover:bg-c10-sunken"}`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        </div>

        {ctx.error ? (
          <div className="rounded-xl bg-red-50 p-6 text-sm text-red-700 ring-1 ring-red-200">
            No se pudo cargar: {ctx.error.message}
          </div>
        ) : (
          children ?? <Pestana />
        )}
      </main>
    </div>
  );
}

/** Contenido de la pestaña activa: la de su tarea si ya existe. */
function Pestana() {
  const { modo, pestana } = useContratistasContexto();
  const key = pestana.activa.key;
  if (modo === "propio" && key === "documentos") return <DocumentosEmpresa />;
  // Mismo componente en Mi empresa, Contratistas / Clientes y el detalle de una relación.
  if (key === "contratos" && modo !== "contrato") return <ContratosLista />;
  return <PestanaPendiente />;
}

/** Lo que se ve en una pestaña que todavía no se construye. */
function PestanaPendiente() {
  const { pestana, etiquetas, editable, soloLectura } = useContratistasContexto();
  return (
    <section className="flex flex-col items-center gap-2 rounded-xl bg-c10-surface px-6 py-16 text-center ring-1 ring-c10-line-card">
      <span className="rounded-full bg-c10-acc-l px-3 py-1 text-xs font-semibold text-c10-acc">
        {pestana.activa.tarea}
      </span>
      <h2 className="text-lg font-semibold text-c10-title">{pestana.activa.label}</h2>
      <p className="max-w-md text-sm text-c10-meta">
        Esta sección la construye la tarea {pestana.activa.tarea} del plan de contratistas.
        {soloLectura && ` En el detalle de un ${etiquetas.kSgL} se verá en solo lectura.`}
        {!soloLectura && !editable && " Aquí no se edita."}
      </p>
    </section>
  );
}
