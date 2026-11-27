"use client";
// RG-02 · Pantalla de éxito del registro: bienvenida, resumen (razón social, número REPSE
// o "Pendiente" si se omitió, correo), completitud del perfil y a dónde seguir.
// Diseño: registro.dc.html 385–419. La completitud es fija en 25 % como en el diseño.
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { ChipEstado } from "../ui";
import type { DatosRegistro } from "./pasos";

const COMPLETITUD = 25;

/** Razón social o nombre que se muestra: lo capturado, o lo leído de la constancia o del REPSE. */
function nombreRegistrado(d: DatosRegistro) {
  const r = d.repse.datos;
  const desdeRepse = d.persona === "moral" ? r?.razon : r && [r.nombres, r.apellido1, r.apellido2].filter(Boolean).join(" ");
  return d.cuenta.razon || d.csf.datos?.razon || desdeRepse || "—";
}

export function ExitoRegistro({ datos }: { datos: DatosRegistro }) {
  const folio = !datos.repse.omitido && datos.repse.estado === "listo" ? datos.repse.datos?.folio : null;
  const resumen = [
    { k: datos.persona === "moral" ? "Razón social" : "Nombre", v: nombreRegistrado(datos) },
    { k: "Número REPSE", v: folio || <ChipEstado tono="warning" texto="Pendiente" /> },
    { k: "Correo registrado", v: datos.cuenta.correo || "—" },
  ];

  return (
    <section
      aria-labelledby="exito-titulo"
      className="flex flex-col gap-6 rounded-2xl bg-c10-surface p-6 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.08)] duration-200 animate-in fade-in sm:p-8"
    >
      <header className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 duration-300 animate-in zoom-in-50"
        >
          <Check className="size-[30px]" strokeWidth={2.5} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <h1 id="exito-titulo" className="text-[22px] font-bold tracking-[-.02em] text-c10-title">
            ¡Bienvenido a Clave 10!
          </h1>
          <span className="text-sm text-c10-meta">Se creó tu cuenta y tu perfil quedó activo.</span>
        </span>
      </header>

      <dl className="flex flex-col gap-3.5 rounded-xl bg-c10-acc-subtle p-5 shadow-[inset_0_0_0_1px_var(--c10-acc-b)]">
        {resumen.map((r) => (
          <div key={r.k} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[.05em] text-c10-acc sm:w-[130px]">{r.k}</dt>
            <dd className="min-w-0 break-words text-sm font-semibold tabular-nums text-c10-title">{r.v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2.5 rounded-xl bg-c10-panel p-5 shadow-[inset_0_0_0_1px_var(--c10-line)]">
        <div className="flex items-baseline justify-between gap-3">
          <span id="exito-completitud" className="text-sm font-bold text-c10-title">
            Completitud del perfil
          </span>
          <span className="text-sm font-bold tabular-nums text-c10-acc">{COMPLETITUD} %</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="exito-completitud"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={COMPLETITUD}
          className="h-2 overflow-hidden rounded-full bg-c10-line"
        >
          <span className="block h-full rounded-full bg-c10-acc" style={{ width: `${COMPLETITUD}%` }} />
        </div>
        <span className="text-[13px] leading-[1.55] text-c10-meta">
          Completa la información de tu empresa para poder operar con clientes y contratistas.
        </span>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-c10-line pt-5">
        <Link href="/" className="text-sm font-semibold text-c10-acc hover:underline">
          Explorar el dashboard
        </Link>
        <Link
          href="/dashboard/contratistas/mi-empresa"
          className="ml-auto inline-flex h-11 items-center gap-2 rounded-lg bg-c10-acc px-6 text-sm font-semibold text-white outline-none transition-colors duration-150 hover:bg-c10-acc-h focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]"
        >
          Ir a Mi empresa
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </footer>
    </section>
  );
}
