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
import { mapRondinGrid } from "@/mappers/rondin.grid.mapper";
import { mapIncidenciaList } from "@/mappers/incidencias.list.mapper";
import { mapFallaList } from "@/mappers/fallas.list.mapper";
import { mapIncidenciaGrid } from "@/mappers/incidencias.grid.mapper";
import { mapFallaGrid } from "@/mappers/fallas.grid.mapper";
import { mapRondinIncidenciaList } from "@/mappers/incidencias.rondines.list.mapper";
import { mapRondinIncidenciaGrid } from "@/mappers/incidencias.rondines.grid.mapper";
import { mapCheckUbicacionGrid } from "@/mappers/check-ubicaiones.grid.mapper";
import { mapCheckUbicacionList } from "@/mappers/check-ubicaciones.list.mapper";

import { mapRondinBitacoraList } from "@/mappers/rondin.bitacora.list.mapper";
import { mapPaseGrid } from "@/mappers/pase.grid.mapper";

const mappers_list: Record<string, (raw: any, base: any) => ListRecord> = {
  bitacora: mapBitacoraList,
  bitacoras_equipos: mapBitacoraListEquipos,
  bitacora_vehiculos: mapBitacoraListVehiculos,
  asistencia_personal: mapAsistenciaList,
  incidencia: mapIncidenciaList,
  falla: mapFallaList,
  rondin_incidencia: mapRondinIncidenciaList,
  check_ubicacion: mapCheckUbicacionList,
  rondin_bitacora: mapRondinBitacoraList,
};

const mappers_grid: Record<string, (raw: any, base: any) => PhotoRecord> = {
  pase: mapPaseGrid,
  bitacora: mapBitacoraGrid,
  bitacoras_equipos: mapBitacoraGridEquipos,
  bitacora_vehiculos: mapBitacoraGridVehiculos,
  asistencia_personal: mapAsistenciaGrid,
  rondin: mapRondinGrid,
  incidencia: mapIncidenciaGrid,
  falla: mapFallaGrid,
  rondin_incidencia: mapRondinIncidenciaGrid,
  check_ubicacion: mapCheckUbicacionGrid,
};

export type RegistryType =
  | "pase"
  | "bitacora"
  | "bitacora_vehiculos"
  | "bitacoras_equipos"
  | "asistencia_personal"
  | "rondin"
  | "incidencia"
  | "falla"
  | "check_ubicaciones"
  | "rondin_incidencia"
  | "check_ubicacion"
  | "rondin_bitacora"; 


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