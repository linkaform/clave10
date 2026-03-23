import {
  Bitacora_record,
  Comentarios_bitacoras,
} from "@/components/table/bitacoras/bitacoras-columns";
import { VisitaA } from "@/hooks/useGetCatologoPaseNoJwt";

export const processBitacorasE = (bitacoras: Bitacora_record[]) => {
  return bitacoras.flatMap((bitacora) => {
    if (
      !bitacora.equipos ||
      !Array.isArray(bitacora.equipos) ||
      bitacora.equipos.length === 0
    ) {
      return [];
    }

    const hasValidVehicle = bitacora.equipos.some((eq: any) => {
      return eq.tipo_equipo && eq.tipo_equipo.trim() !== "";
    });

    if (!hasValidVehicle) {
      return [];
    }

    return bitacora.equipos.map((eq: any) => ({
      ...bitacora,
      equipos: [eq],
      formated_visita:
        bitacora.visita_a?.map((item: VisitaA) => item.nombre).join(", ") || "",
      formated_comentarios:
        bitacora.comentarios
          ?.map((item: Comentarios_bitacoras) => item.comentario)
          .join(", ") || "",
    }));
  });
};

export const processBitacorasV = (bitacoras: Bitacora_record[]) => {
  return bitacoras?.flatMap((bitacora) => {
    if (
      !bitacora.vehiculos ||
      !Array.isArray(bitacora.vehiculos) ||
      bitacora.vehiculos.length === 0
    ) {
      return [];
    }
    const hasValidVehicle = bitacora.vehiculos.some((eq: any) => {
      return eq.tipo && eq.tipo.trim() !== "";
    });

    if (!hasValidVehicle) {
      return [];
    }

    return bitacora.vehiculos.map((eq: any) => {
      return {
        ...bitacora,
        vehiculos: [eq],
        formated_visita: bitacora.visita_a
          .map((item: VisitaA) => item.nombre)
          .join(", "),
        formated_comentarios: bitacora.comentarios
          .map((item: Comentarios_bitacoras) => item.comentario)
          .join(", "),
      };
    });
  });
};
