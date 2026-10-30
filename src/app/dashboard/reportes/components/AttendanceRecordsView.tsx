import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PaginationTransportistas from "@/components/pages/transportistas/PaginationTransportistas";
import { mapAttendanceGrid } from "@/mappers/attendance.grid.mappers";
import { useAttendanceData } from "../hooks/useAsistenciasReport";

interface AttendanceRecordsViewProps {
  dateFrom: string;
  dateTo: string;
  search: string;
}

// Cards de los registros de check-in del periodo (una por turno abierto), con el grid de bitácoras
export const AttendanceRecordsView: React.FC<AttendanceRecordsViewProps> = ({ dateFrom, dateTo, search }) => {
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Al cambiar de periodo se regresa a la primera página
  useEffect(() => setOffset(0), [dateFrom, dateTo]);

  const { attendanceData, pagination, isLoadingAttendance, errorAttendance, refetchAttendance } = useAttendanceData({
    dateFrom,
    dateTo,
    limit,
    offset,
  });

  const records = useMemo(() => attendanceData.map((raw: any) => mapAttendanceGrid(raw, {})), [attendanceData]);
  const q = search.trim();

  if (errorAttendance) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-2">Error al cargar los registros</p>
        <Button onClick={() => refetchAttendance()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <PhotoGridView
        isLoading={isLoadingAttendance}
        skeleton
        records={records}
        globalSearch={q ? [q] : []}
      />
      {!isLoadingAttendance && pagination.total_records > 0 && (
        <PaginationTransportistas
          {...pagination}
          limit={limit}
          onPageChange={(skip, newLimit) => {
            setOffset(skip);
            setLimit(newLimit);
          }}
        />
      )}
    </div>
  );
};
