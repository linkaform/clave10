"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import PaginationPases from "@/components/pages/pases/PaginationPases";

// TODO: reemplazar por un hook real sobre get_incidencias_rondines (option
// "get_incidencias_rondines", script_name "rondines.py", ya implementada en
// el back con location+area) cuando se conecte de verdad. Por ahora esta
// pantalla solo maqueta el tab con datos de ejemplo -- mismo shape que
// regresa format_incidencias_rondines.
interface IncidenciaDemo {
  id: string;
  folio: string;
  nombre_del_recorrido: string;
  fecha_hora_incidente: string;
  categoria: string;
  subcategoria: string;
  incidente: string;
  accion_tomada: string;
  comentarios: string;
}

function buildDemoIncidencias(area: string): IncidenciaDemo[] {
  const items: Omit<IncidenciaDemo, "id" | "folio" | "nombre_del_recorrido" | "fecha_hora_incidente">[] = [
    { categoria: "Seguridad", subcategoria: "Acceso", incidente: "Puerta sin candado", accion_tomada: "Se colocó candado temporal", comentarios: `Detectado durante recorrido en ${area}.` },
    { categoria: "Mantenimiento", subcategoria: "Iluminación", incidente: "Lámpara fundida", accion_tomada: "Reportado a mantenimiento", comentarios: "" },
    { categoria: "Seguridad", subcategoria: "Perímetro", incidente: "Cerca dañada", accion_tomada: "Pendiente de reparación", comentarios: "Se avisó al supervisor de turno." },
    { categoria: "Limpieza", subcategoria: "General", incidente: "Basura acumulada", accion_tomada: "Se solicitó cuadrilla de limpieza", comentarios: "" },
    { categoria: "Seguridad", subcategoria: "Acceso", incidente: "Cámara fuera de servicio", accion_tomada: "Reportado a sistemas", comentarios: `Área ${area} sin cobertura visual por ~2 horas.` },
    { categoria: "General", subcategoria: "General", incidente: "Ruido inusual", accion_tomada: "Se verificó, sin novedad", comentarios: "" },
    { categoria: "Mantenimiento", subcategoria: "Estructura", incidente: "Fuga de agua menor", accion_tomada: "Reportado a mantenimiento", comentarios: "Charco pequeño, sin riesgo inmediato." },
  ];

  return items.map((item, index) => ({
    id: `demo-inc-${index}`,
    folio: `INC-${2000 + index}`,
    nombre_del_recorrido: index % 2 === 0 ? "Recorrido nocturno" : "Recorrido matutino",
    fecha_hora_incidente: `2026-09-${String(20 - index).padStart(2, "0")} ${String(19 - index).padStart(2, "0")}:30`,
    ...item,
  }));
}

const CATEGORIA_STYLES: Record<string, string> = {
  Seguridad: "bg-red-50 text-red-700 border-red-200",
  Mantenimiento: "bg-amber-50 text-amber-700 border-amber-200",
  Limpieza: "bg-blue-50 text-blue-700 border-blue-200",
  General: "bg-slate-100 text-slate-500 border-slate-200",
};

export function IncidenciasAreaDashboard({ area }: { ubicacion: string; area: string }) {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(5);

  const allDemo = useMemo(() => buildDemoIncidencias(area), [area]);
  const totalRecords = allDemo.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const actualPage = Math.floor(skip / limit) + 1;
  const visible = allDemo.slice(skip, skip + limit);

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay incidencias registradas para esta área.</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((incidencia) => (
              <IncidenciaCard key={incidencia.id} incidencia={incidencia} />
            ))}
          </div>
          <PaginationPases
            actual_page={actualPage}
            records_on_page={visible.length}
            total_pages={totalPages}
            total_records={totalRecords}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

function IncidenciaCard({ incidencia }: { incidencia: IncidenciaDemo }) {
  return (
    <div className="border-2 border-orange-500 bg-red-50/40 rounded-xl p-4 flex gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{incidencia.incidente}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              CATEGORIA_STYLES[incidencia.categoria] || CATEGORIA_STYLES.General
            }`}
          >
            {incidencia.categoria} · {incidencia.subcategoria}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span># {incidencia.folio}</span>
          <span>{incidencia.nombre_del_recorrido}</span>
          <span>{incidencia.fecha_hora_incidente}</span>
        </div>

        {incidencia.accion_tomada && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Acción tomada:</span> {incidencia.accion_tomada}
          </p>
        )}
        {incidencia.comentarios && (
          <p className="text-sm text-gray-500">{incidencia.comentarios}</p>
        )}
      </div>

      <span
        className="flex items-center gap-1 text-xs font-semibold text-gray-300 cursor-not-allowed shrink-0 h-fit"
        title="Disponible cuando se conecte con datos reales"
      >
        Ver <ExternalLink className="w-3 h-3" />
      </span>
    </div>
  );
}

export default IncidenciasAreaDashboard;
