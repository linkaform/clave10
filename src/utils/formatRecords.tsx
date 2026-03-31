import { PhotoRecord, ListRecord } from "@/types/bitacoras";
import {
  mapBitacora,
  mapBitacoraEquipos,
  mapBitacoraVehiculos,
} from "@/mappers/bitacora.list.mapper";

const mappers = {
  bitacora: mapBitacora,
  bitacoras_equipos: mapBitacoraEquipos,
  bitacora_vehiculos: mapBitacoraVehiculos,
};

export type RegistryType =
  | "bitacora"
  | "bitacora_vehiculos"
  | "bitacoras_equipos";

export function formatListRecord(raw: any, type: RegistryType): ListRecord {
  const base = {
    id: raw?._id || raw?.id || "no-id",
    folio: raw?.folio || "S/F",
  };

  const mapper = mappers[type];

  if (!mapper) {
    return {
      ...base,
      title: "Registro Desconocido",
      description: "No se encontró un formateador para este tipo",
      images: [],
      status: "cerrado",
      modalDetailsList: [],
      rawData: [],
    };
  }

  return mapper(raw, base);
}

export function formatPhotoRecord(raw: any, type: RegistryType): PhotoRecord {
  const base = {
    id: raw?._id || raw?.id || "no-id",
    folio: raw?.folio || "S/F",
  };

  const mapper = mappers[type];

  if (!mapper) {
    return {
      ...base,
      title: "Registro Desconocido",
      description: "No se encontró un formateador para este tipo",
      images: [],
      status: "cerrado",
      modalDetailsList: [],
      rawData: [],
    };
  }

  return mapper(raw, base);
}
