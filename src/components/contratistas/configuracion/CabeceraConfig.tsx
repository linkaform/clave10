"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BASE } from "@/lib/contratistas/contexto";

/** Migas y título de la sección; a la derecha lo que mande la pestaña (buscador, pestañas, vistas). */
export function CabeceraConfig({ titulo, kpi, children }: { titulo: string; kpi?: ReactNode; children?: ReactNode }) {
  return (
    <div className="sticky top-[var(--c10-header-h,65px)] z-20 -mx-4 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 bg-c10-canvas px-4 py-2 min-[1080px]:mx-0 min-[1080px]:px-0">
      <div className="flex min-w-0 flex-col gap-1.5">
        <nav aria-label="Migas" className="flex items-center gap-1.5 text-[13px] text-c10-meta">
          <Link href={`${BASE}/mi-empresa`} className="hover:text-c10-acc">Mi empresa</Link>
          <ChevronRight className="h-3.5 w-3.5 text-c10-faint" aria-hidden />
          <span className="font-medium text-c10-label">Configuraciones</span>
        </nav>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-c10-title min-[1080px]:text-[32px]">{titulo}</h1>
          {kpi}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
