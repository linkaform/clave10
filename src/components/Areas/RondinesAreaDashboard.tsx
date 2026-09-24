"use client";

import { useState } from "react";
import Link from "next/link";
import { Route, ExternalLink } from "lucide-react";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { EstatusBadge } from "@/components/estatus-badge";
import { useAreaRondines, AreaRondinItem } from "@/hooks/Areas/useAreaRondines";

export function RondinesAreaDashboard({ areaId }: { areaId: string }) {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(5);
  const { rondines, isLoadingRondines, isFetchingRondines } = useAreaRondines(areaId, limit, skip);

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  if (isLoadingRondines) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Cargando rondines...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {rondines.records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <Route className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay rondines que incluyan esta área.</span>
        </div>
      ) : (
        <>
          <div className={`flex flex-col gap-3 transition-opacity ${isFetchingRondines ? "opacity-60" : ""}`}>
            {rondines.records.map((rondin) => (
              <RondinCard key={rondin.record_id} rondin={rondin} />
            ))}
          </div>
          <PaginationPases
            actual_page={rondines.actual_page}
            records_on_page={rondines.records_on_page}
            total_pages={rondines.total_pages}
            total_records={rondines.total_records}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

function RondinCard({ rondin }: { rondin: AreaRondinItem }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{rondin.nombre_recorrido}</span>
          {rondin.estatus_rondin && (
            <EstatusBadge
              estatus={rondin.estatus_rondin}
              className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold"
            />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span># {rondin.folio}</span>
          <span>{rondin.ubicacion}</span>
        </div>
      </div>

      <Link
        href={`/dashboard/ver-recorrido/${rondin.record_id}`}
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
      >
        Ver <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default RondinesAreaDashboard;
