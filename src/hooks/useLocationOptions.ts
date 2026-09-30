import { useMemo } from "react";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useBoothStore } from "@/store/useBoothStore";

// Opciones del selector de ubicaciones del header: las permitidas al usuario más las
// ubicaciones extra de la caseta multiubicación activa (que pueden no estar permitidas).
export function useLocationOptions() {
  const { locations } = useAreasLocationStore();
  const { extra_locations } = useBoothStore();
  return useMemo(
    () => [...locations, ...(extra_locations ?? []).filter((loc) => !locations.includes(loc))],
    [locations, extra_locations],
  );
}
