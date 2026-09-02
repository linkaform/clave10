/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect } from "react";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface InputChangeLocation {
  ubicacionSeleccionada: string;
  setUbicacionSeleccionada: (location: string) => void;
  areaSeleccionada: string;
  setAreaSeleccionada: (area: string) => void;
  ubicacion?: string;
}

const ChangeLocation: React.FC<InputChangeLocation> = ({
  ubicacionSeleccionada,
  setUbicacionSeleccionada,
  areaSeleccionada,
  setAreaSeleccionada,
  ubicacion,
}) => {
  const { locations, fetchLocations } = useAreasLocationStore();

  // Este selector lista casetas: usa la marca "Utilizar Area en: Casetas".
  // Si la ubicacion no tiene ninguna marcada, el back regresa todas.
  const { dataAreas } = useCatalogoPaseAreaLocation(
    ubicacionSeleccionada ?? "",
    false,
    Boolean(ubicacionSeleccionada),
    { uso: "casetas" },
  );
  const areas: string[] = dataAreas ?? [];

  useEffect(() => {
    if (locations.length == 0) {
      fetchLocations();
    }
  }, []);

  const locationOptions = locations.map((loc: string) => ({
    value: loc,
    label: loc,
  }));

  const areaOptions = [
    { value: "todas", label: "Todas las Casetas" },
    ...areas.map((area: string) => ({
      value: area,
      label: area,
    })),
  ];

  return (
    <div className="flex flex-col w-full gap-2">

      <Select
        value={
          ubicacionSeleccionada
            ? { value: ubicacionSeleccionada, label: ubicacionSeleccionada }
            : null
        }
        options={locationOptions}
        onChange={(value: any) => {
          setUbicacionSeleccionada(value?.value ?? "");
          setAreaSeleccionada(""); 
        }}
        isClearable
        isDisabled={ubicacion === "accesos"}
        placeholder="Ubicación"
        // menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        styles={{
          menuPortal: (base) => ({ 
            ...base, 
            zIndex: 9999, 
            pointerEvents: "auto" 
          }),
        }}
      />

      <Select
        value={
          areaSeleccionada
            ? { value: areaSeleccionada, label: areaSeleccionada }
            : null
        }
        options={areaOptions}
        onChange={(value: any) => {
          setAreaSeleccionada(value?.value ?? "");
        }}
        isClearable
        isDisabled={ubicacion === "accesos"}
        placeholder="Caseta"
        // menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        styles={{
          menuPortal: (base) => ({ 
            ...base, 
            zIndex: 9999, 
            pointerEvents: "auto" 
          }),
        }}
      />

    </div>
  );
};

export default ChangeLocation;
