import { PhotoRecord, ListRecord } from "@/types/bitacoras";
import {
  mapBitacoraList,
  mapBitacoraListEquipos,
  mapBitacoraListVehiculos,
} from "@/mappers/bitacora.list.mapper";
import {
  mapBitacoraGrid,
  mapBitacoraGridEquipos,
  mapBitacoraGridVehiculos,
} from "@/mappers/bitacora.grid.mapper";

const mappers_list = {
  bitacora: mapBitacoraList,
  bitacoras_equipos: mapBitacoraListEquipos,
  bitacora_vehiculos: mapBitacoraListVehiculos,
};

const mappers_grid = {
  bitacora: mapBitacoraGrid,
  bitacoras_equipos: mapBitacoraGridEquipos,
  bitacora_vehiculos: mapBitacoraGridVehiculos,
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

  const mapper = mappers_list[type];

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

  const mapper = mappers_grid[type];

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
