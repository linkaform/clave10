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
import { mapAsistenciaList } from "@/mappers/asistencia.list.mapper";
import { mapAsistenciaGrid } from "@/mappers/asistencia.grid.mapper";
import { mapRondinList } from "@/mappers/rondin.list.mapper";
import { mapRondinGrid } from "@/mappers/rondin.grid.mapper";
import { mapIncidenciaList } from "@/mappers/incidencias.list.mapper";
import { mapFallaList } from "@/mappers/fallas.list.mapper";
import { mapIncidenciaGrid } from "@/mappers/incidencias.grid.mapper";
import { mapFallaGrid } from "@/mappers/fallas.grid.mapper";

const mappers_list: Record<string, (raw: any, base: any) => ListRecord> = {
  bitacora: mapBitacoraList,
  bitacoras_equipos: mapBitacoraListEquipos,
  bitacora_vehiculos: mapBitacoraListVehiculos,
  asistencia_personal: mapAsistenciaList,
  rondin: mapRondinList,
  incidencia: mapIncidenciaList,
  falla: mapFallaList,
};

const mappers_grid: Record<string, (raw: any, base: any) => PhotoRecord> = {
  bitacora: mapBitacoraGrid,
  bitacoras_equipos: mapBitacoraGridEquipos,
  bitacora_vehiculos: mapBitacoraGridVehiculos,
  asistencia_personal: mapAsistenciaGrid,
  rondin: mapRondinGrid,
  incidencia: mapIncidenciaGrid,
  falla: mapFallaGrid,
};

export type RegistryType =
  | "bitacora"
  | "bitacora_vehiculos"
  | "bitacoras_equipos"
  | "asistencia_personal"
  | "rondin"
  | "incidencia"
  | "falla";

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