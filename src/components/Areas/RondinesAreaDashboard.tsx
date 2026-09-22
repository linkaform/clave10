"use client";

import { useMemo, useState } from "react";
import { Route, ExternalLink } from "lucide-react";
import PaginationPases from "@/components/pages/pases/PaginationPases";

// TODO: reemplazar por useRondinesByArea (option "get_rondines_by_area",
// script_name "rondines.py", ya implementada en el back) cuando se conecte
// de verdad. Por ahora esta pantalla solo maqueta el tab con datos de
// ejemplo -- mismo shape que regresa el back: record_id, folio,
// nombre_recorrido, ubicacion, estatus_rondin.
interface RondinDemo {
  record_id: string;
  folio: string;
  nombre_recorrido: string;
  ubicacion: string;
  estatus_rondin: "programado" | "en curso" | "pausado" | "finalizado";
}

function buildDemoRondines(area: string, ubicacion: string): RondinDemo[] {
  const nombres = [
    `Recorrido nocturno — ${area}`,
    `Recorrido matutino — ${area}`,
    `Ronda de seguridad perimetral`,
    `Recorrido de cierre de turno`,
    `Ronda especial — ${area}`,
    `Recorrido de apertura`,
    `Ronda de verificación de accesos`,
    `Recorrido vespertino — ${area}`,
    `Ronda de mantenimiento`,
    `Recorrido de fin de semana`,
    `Ronda extraordinaria — ${area}`,
    `Recorrido de auditoría`,
  ];
  const estatus: RondinDemo["estatus_rondin"][] = ["programado", "en curso", "pausado", "finalizado"];

  return nombres.map((nombre, index) => ({
    record_id: `demo-${index}`,
    folio: `RND-${1000 + index}`,
    nombre_recorrido: nombre,
    ubicacion: ubicacion || "-",
    estatus_rondin: estatus[index % estatus.length],
  }));
}

const ESTATUS_STYLES: Record<string, string> = {
  programado: "bg-blue-50 text-blue-700 border-blue-200",
  "en curso": "bg-green-50 text-green-700 border-green-200",
  pausado: "bg-amber-50 text-amber-700 border-amber-200",
  finalizado: "bg-slate-100 text-slate-500 border-slate-200",
};

export function RondinesAreaDashboard({ ubicacion, area }: { ubicacion: string; area: string }) {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(5);

  const allDemo = useMemo(() => buildDemoRondines(area, ubicacion), [area, ubicacion]);
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
          <Route className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay rondines que incluyan esta área.</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((rondin) => (
              <RondinCard key={rondin.record_id} rondin={rondin} />
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

function RondinCard({ rondin }: { rondin: RondinDemo }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{rondin.nombre_recorrido}</span>
          <span
            className={`inline-flex items-center capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              ESTATUS_STYLES[rondin.estatus_rondin] || "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            {rondin.estatus_rondin}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span># {rondin.folio}</span>
          <span>{rondin.ubicacion}</span>
        </div>
      </div>

      <span
        className="flex items-center gap-1 text-xs font-semibold text-gray-300 cursor-not-allowed shrink-0"
        title="Disponible cuando se conecte con datos reales"
      >
        Ver <ExternalLink className="w-3 h-3" />
      </span>
    </div>
  );
}

export default RondinesAreaDashboard;
