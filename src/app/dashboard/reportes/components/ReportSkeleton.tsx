import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportSkeletonProps {
  variant: "grid" | "table" | "cards";
  columns?: number; // días del periodo (grid)
}

const ROWS = 8;

// Esqueleto de carga con la forma de la vista que se va a mostrar
export const ReportSkeleton: React.FC<ReportSkeletonProps> = ({ variant, columns = 7 }) => {
  if (variant === "cards") {
    return (
      <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="Cargando">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-32 rounded-full" />)}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
              <Skeleton className="h-11 w-11 flex-none rounded-[7px]" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white" aria-busy="true" aria-label="Cargando">
        <div className="h-10 bg-[#DBEAFE]" />
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-t border-[#E2E8F0] px-3 py-3">
            <div className="flex w-48 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            {Array.from({ length: 6 }, (_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white" aria-busy="true" aria-label="Cargando">
      <div className="h-11 bg-[#DBEAFE]" />
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} className="flex items-center gap-1 border-t border-[#E2E8F0] px-3 py-2">
          <div className="flex w-[180px] flex-none flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-1 justify-around gap-1">
            {Array.from({ length: columns }, (_, j) => (
              <Skeleton key={j} className={`flex-none rounded-[7px] ${columns > 7 ? "h-[26px] w-[26px]" : "h-8 w-8"}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
