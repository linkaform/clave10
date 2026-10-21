"use client";

import { useMemo, useState } from "react";
import { Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBandeja } from "@/hooks/useBandeja";
import { BandejaItemRow } from "@/components/bandeja/bandeja-item";

const PENDIENTES = ["new", "in_progress", "paused"];
const DIA = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" });

export default function BandejaPage() {
  const { data, isLoading, isFetching, isError, error, refetch } = useBandeja();
  const [filtro, setFiltro] = useState<"pendientes" | "todos">("pendientes");

  const grupos = useMemo(() => {
    const items = (data?.items ?? []).filter((i) => filtro === "todos" || PENDIENTES.includes(i.estado));
    const porDia = new Map<string, typeof items>();
    for (const i of items) {
      const dia = i.fecha ? i.fecha.slice(0, 10) : "sin-fecha";
      porDia.set(dia, [...(porDia.get(dia) ?? []), i]);
    }
    return [...porDia.entries()];
  }, [data, filtro]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bandeja</h1>
          <p className="text-sm text-slate-500">Lo que tienes asignado. Los rondines se hacen desde la app.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "pendientes" | "todos")}>
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes {data ? `(${data.pendientes})` : ""}</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" aria-label="Actualizar" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar tu bandeja. {(error as Error)?.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <div className="text-sm font-medium text-slate-700">Tu bandeja está al día</div>
          <div className="text-sm text-slate-500">Aquí verás los rondines y pendientes que te asignen.</div>
        </div>
      ) : (
        grupos.map(([dia, items]) => (
          <section key={dia} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[.05em] text-slate-500">
              {dia === "sin-fecha" ? "Sin fecha" : DIA.format(new Date(`${dia}T12:00:00`))}
            </h2>
            {items.map((i) => (
              <BandejaItemRow key={i.id} item={i} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
