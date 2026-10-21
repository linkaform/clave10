"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  getReporteHoy,
  getReportePeriodo,
  getReporteUbicaciones,
  type ReporteHoy,
  type ReportePeriodo,
} from "@/lib/asistencia-sdk";
import { HoyView } from "./components/hoy-view";
import { PeriodoView } from "./components/periodo-view";
import { DiaSheet } from "./components/dia-sheet";
import { estilo, hhmm } from "./components/estados";

type Vista = "hoy" | "periodo";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Del primer día del mes al último (o a hoy si es el mes en curso).
const rangoMes = (mes: Date) => {
  const hoy = new Date();
  const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  return { desde: iso(new Date(mes.getFullYear(), mes.getMonth(), 1)), hasta: iso(fin > hoy ? hoy : fin) };
};

export default function ReporteAsistenciasPage() {
  const [vista, setVista] = useState<Vista>("hoy");
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sel, setSel] = useState<{ userId: number; fecha: string } | null>(null);
  const { desde, hasta } = rangoMes(mes);
  const esMesActual = mes.getFullYear() === new Date().getFullYear() && mes.getMonth() === new Date().getMonth();
  const nombreMes = mes.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const tituloMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const ubicacionesQ = useQuery({ queryKey: ["reporteUbicaciones"], queryFn: getReporteUbicaciones, staleTime: Infinity });
  const hoy = useQuery({
    queryKey: ["reporteHoy", ubicaciones],
    queryFn: () => getReporteHoy(ubicaciones),
    enabled: vista === "hoy",
    refetchInterval: 60_000,
  });
  const periodo = useQuery({
    queryKey: ["reportePeriodo", desde, hasta, ubicaciones],
    queryFn: () => getReportePeriodo(desde, hasta, ubicaciones),
    enabled: vista === "periodo",
  });
  const activa = vista === "hoy" ? hoy : periodo;
  const abrir = (userId: number, fecha: string) => setSel({ userId, fecha });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Asistencias</h1>
          <p className="text-sm text-slate-500">
            {vista === "hoy"
              ? hoy.data
                ? `Hoy · actualizado ${hoy.data.hora}`
                : "Hoy"
              : `Del ${Number(desde.slice(8))} al ${Number(hasta.slice(8))} de ${nombreMes}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={vista} onValueChange={(v) => setVista(v as Vista)}>
            <TabsList>
              <TabsTrigger value="hoy">Hoy</TabsTrigger>
              <TabsTrigger value="periodo">Periodo</TabsTrigger>
            </TabsList>
          </Tabs>
          <MultiSelect values={ubicaciones} onValuesChange={setUbicaciones}>
            <MultiSelectTrigger className="h-9 w-[210px]">
              <MultiSelectValue placeholder="Todas las ubicaciones" />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectGroup>
                {(ubicacionesQ.data ?? []).map((u) => (
                  <MultiSelectItem key={u} value={u}>
                    {u}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>
          {vista === "periodo" && (
            <div className="flex items-center rounded-md border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mes anterior"
                onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm">{tituloMes}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mes siguiente"
                disabled={esMesActual}
                onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button variant="outline" size="icon" aria-label="Actualizar" onClick={() => activa.refetch()}>
            <RefreshCw className={`h-4 w-4 ${activa.isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            disabled={!activa.data}
            onClick={() => (vista === "hoy" ? exportarHoy(hoy.data!) : exportarPeriodo(periodo.data!))}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {activa.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar el reporte. {(activa.error as Error)?.message}
        </div>
      )}

      {vista === "hoy" ? (
        <HoyView data={hoy.data} isLoading={hoy.isLoading} onSelect={abrir} />
      ) : (
        <PeriodoView data={periodo.data} isLoading={periodo.isLoading} onSelect={abrir} />
      )}

      <DiaSheet sel={sel} onClose={() => setSel(null)} />
    </div>
  );
}

function descargar(nombre: string, filas: (string | number | null | undefined)[][]) {
  const csv = filas.map((f) => f.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  a.click();
  URL.revokeObjectURL(url);
}

function exportarHoy(d: ReporteHoy) {
  descargar(`asistencias-${d.fecha}.csv`, [
    ["Empleado", "Horario", "Entrada", "Salida", "Llegó", "Retraso (min)", "Estado", "Dónde está", "Rol"],
    ...d.empleados.map((e) => [
      e.nombre,
      e.horario,
      e.turno?.entrada,
      e.turno?.salida,
      e.llegada ? hhmm(e.llegada) : "",
      e.retraso_min,
      estilo(e.estado).label,
      e.lugar,
      e.rol,
    ]),
  ]);
}

function exportarPeriodo(d: ReportePeriodo) {
  const fechas = d.empleados[0]?.dias.map((x) => x.fecha) ?? [];
  descargar(`asistencias-${d.desde}-a-${d.hasta}.csv`, [
    ["Empleado", "Horario", "Asistencias", "Retardos", "Faltas", "Descansos", "Horas trabajadas", "Horas programadas", "Horas extra", ...fechas],
    ...d.empleados.map((e) => [
      e.nombre,
      e.horario,
      e.resumen.asistencias,
      e.resumen.retardos,
      e.resumen.faltas,
      e.resumen.descansos,
      e.resumen.horas_trabajadas,
      e.resumen.horas_programadas,
      e.resumen.horas_extra,
      ...e.dias.map((x) => estilo(x.estado).label),
    ]),
  ]);
}
