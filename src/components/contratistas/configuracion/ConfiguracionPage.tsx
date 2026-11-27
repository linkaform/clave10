"use client";
// Mi empresa → Configuraciones: Requerimientos, Servicios, Perfiles, Equipos y Sesiones.
// Diseño: plataforma.dc.html, isEcfg (~1824) y ET (~7170). La pestaña sale de `?tab=`.
// Cada pestaña es de su tarea (CF-01, CF-02, CF-03); mientras no exista se dice cuál es.
// Requerimientos acepta ?tipo=Documento|Examen|Inspección (sub-ítems del menú).
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { RequerimientosConfig } from "@/components/contratistas/requerimientos/RequerimientosConfig";
import { SesionesConfig } from "@/components/contratistas/sesiones/SesionesConfig";
import { CabeceraConfig } from "./CabeceraConfig";

export const PESTANAS_CONFIG = [
  { key: "requerimientos", label: "Requerimientos", tarea: "CF-01" },
  { key: "servicios", label: "Servicios", tarea: "CF-02" },
  { key: "perfiles", label: "Perfiles", tarea: "CF-02" },
  { key: "equipos", label: "Equipos", tarea: "CF-02" },
  { key: "sesiones", label: "Sesiones", tarea: "CF-03" },
] as const;

export type PestanaConfig = (typeof PESTANAS_CONFIG)[number];

export function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <Configuracion />
    </Suspense>
  );
}

function Configuracion() {
  const tab = useSearchParams().get("tab");
  const activa = PESTANAS_CONFIG.find((p) => p.key === tab) ?? PESTANAS_CONFIG[0];
  const pestanas = <PestanasConfig activa={activa.key} />;
  return (
    <div data-c10-acc="propio" className="min-h-[calc(100vh-var(--c10-header-h,65px))] bg-c10-canvas font-[Arial,Helvetica,sans-serif]">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 pb-20 pt-6 min-[1080px]:px-5 min-[1080px]:pt-10 min-[1440px]:px-6 min-[1440px]:pt-12">
        {activa.key === "requerimientos" ? (
          <RequerimientosConfig pestanas={pestanas} />
        ) : activa.key === "sesiones" ? (
          <SesionesConfig pestanas={pestanas} />
        ) : (
          <Pendiente p={activa} pestanas={pestanas} />
        )}
      </main>
    </div>
  );
}

function PestanasConfig({ activa }: { activa: string }) {
  const pathname = usePathname();
  return (
    <div role="tablist" aria-label="Configuraciones" className="flex max-w-full overflow-x-auto rounded-lg bg-c10-surface ring-1 ring-c10-line">
      {PESTANAS_CONFIG.map((p, i) => {
        const on = p.key === activa;
        return (
          <Link
            key={p.key}
            role="tab"
            aria-selected={on}
            href={`${pathname}?tab=${p.key}`}
            scroll={false}
            className={cn(
              "flex h-10 shrink-0 items-center whitespace-nowrap px-4 text-sm transition-colors",
              i > 0 && "border-l border-c10-line",
              on ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-secondary hover:bg-c10-sunken",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}

function Pendiente({ p, pestanas }: { p: PestanaConfig; pestanas: ReactNode }) {
  return (
    <>
      <CabeceraConfig titulo={p.label}>{pestanas}</CabeceraConfig>
      <section className="flex flex-col items-center gap-2 rounded-xl bg-c10-surface px-6 py-16 text-center ring-1 ring-c10-line-card">
        <span className="rounded-full bg-c10-acc-l px-3 py-1 text-xs font-semibold text-c10-acc">{p.tarea}</span>
        <h2 className="text-lg font-semibold text-c10-title">{p.label}</h2>
        <p className="max-w-md text-sm text-c10-meta">Esta sección la construye la tarea {p.tarea} del plan de contratistas.</p>
      </section>
    </>
  );
}
