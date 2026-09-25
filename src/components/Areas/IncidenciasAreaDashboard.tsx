"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { useAreaIncidencias, AreaIncidenciaItem } from "@/hooks/Areas/useAreaIncidencias";

export function IncidenciasAreaDashboard({ areaId }: { areaId: string }) {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(5);
  const { incidencias, isLoadingIncidencias, isFetchingIncidencias } = useAreaIncidencias(areaId, limit, skip);

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  if (isLoadingIncidencias) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Cargando incidencias...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {incidencias.records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay incidencias registradas para esta área.</span>
        </div>
      ) : (
        <>
          <div className={`flex flex-col gap-3 transition-opacity ${isFetchingIncidencias ? "opacity-60" : ""}`}>
            {incidencias.records.map((incidencia) => (
              <IncidenciaCard key={`${incidencia.id}-${incidencia.ref_number}`} incidencia={incidencia} />
            ))}
          </div>
          <PaginationPases
            actual_page={incidencias.actual_page}
            records_on_page={incidencias.records_on_page}
            total_pages={incidencias.total_pages}
            total_records={incidencias.total_records}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

function IncidenciaCard({ incidencia }: { incidencia: AreaIncidenciaItem }) {
  const evidencias = (incidencia.evidencias ?? []).filter((e) => e.file_url);

  return (
    <div className="border-2 border-orange-500 bg-red-50/40 rounded-xl p-4 flex gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{incidencia.incidente || "Sin incidente"}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-50 text-orange-700 border-orange-200">
            {incidencia.categoria} · {incidencia.subcategoria}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
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

      {evidencias.length > 0 && (
        <div className="flex gap-2 shrink-0 h-fit">
          {evidencias.slice(0, 3).map((evidencia) => (
            <a
              key={evidencia.file_url}
              href={evidencia.file_url}
              target="_blank"
              rel="noopener noreferrer"
              title={evidencia.file_name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={evidencia.file_url}
                alt={evidencia.file_name || "Evidencia"}
                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default IncidenciasAreaDashboard;
