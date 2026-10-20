"use client";

import * as React from "react";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useBoothStore } from "@/store/useBoothStore";

// "Mi caseta" del resto del front (useBoothStore) sale del Check In abierto. Al hacer
// Check Out se conserva la última, para que bitácoras y notas sigan mostrando algo.
export function CheckInSync() {
  const { checkIn } = useCheckIn();
  const { area, location, setBooth } = useBoothStore();

  React.useEffect(() => {
    if (checkIn && (checkIn.caseta !== area || checkIn.ubicacion !== location)) {
      setBooth(checkIn.caseta, checkIn.ubicacion);
    }
  }, [checkIn, area, location, setBooth]);

  return null;
}
