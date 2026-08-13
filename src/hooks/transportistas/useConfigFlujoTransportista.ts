"use client";

import { useQuery } from "@tanstack/react-query";
import { getConfigFlujoTransportista } from "@/services/endpoints";

// Etapas opcionales del flujo — si la cuenta no tiene el registro de configuración
// creado todavía, se asume que todas están activas (fail-open, comportamiento actual).
// Valores tal cual quedaron las opciones del checkbox `etapas_activas` en Linkaform.
// 'inspeccion_materiales' no es una etapa del kanban — es un sub-toggle de carga/descarga
// (¿exige inspeccionar cantidad física de materiales, o es solo un estatus informativo?).
const FALLBACK_ETAPAS_ACTIVAS = ["inspeccion_de_entrada", "carga_/_descarga", "inspeccion_salida", "inspeccion_materiales"];

export interface ConfigFlujoTransportista {
  etapasActivas: string[];
}

export function useConfigFlujoTransportista() {
  const { data, isLoading, error } = useQuery<ConfigFlujoTransportista>({
    queryKey: ["configFlujoTransportista"],
    queryFn: async () => {
      const res = await getConfigFlujoTransportista();
      const raw = ((res as Record<string, unknown>)?.response as Record<string, unknown>)?.data
        ?? (res as Record<string, unknown>)?.data;
      const etapasActivas = (raw as { etapas_activas?: string[] })?.etapas_activas;
      return {
        etapasActivas: etapasActivas?.length ? etapasActivas : FALLBACK_ETAPAS_ACTIVAS,
      };
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { data: data ?? { etapasActivas: FALLBACK_ETAPAS_ACTIVAS }, isLoading, error };
}
