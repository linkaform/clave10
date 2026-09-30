"use client";

import { useQuery } from "@tanstack/react-query";
import { getConfigFlujoTransportista } from "@/services/endpoints";

// Etapas opcionales del flujo — si la cuenta no tiene el registro de configuración
// creado todavía, se asume que todas están activas (fail-open, comportamiento actual).
// Valores tal cual quedaron las opciones del checkbox `etapas_activas` en Linkaform.
// 'inspeccion_materiales' no es una etapa del kanban — es un sub-toggle de carga/descarga
// (¿exige inspeccionar cantidad física de materiales, o es solo un estatus informativo?).
const FALLBACK_ETAPAS_ACTIVAS = ["inspeccion_de_entrada", "carga_/_descarga", "inspeccion_salida", "inspeccion_materiales"];

// Qué columnas del kanban se muestran — puramente visual, no afecta el flujo/estatus
// real (a diferencia de `etapas_activas`). Fail-open: todas visibles si la cuenta
// todavía no configuró el campo `kanban_view`. Valores tal cual las opciones del
// checkbox en Linkaform.
const FALLBACK_KANBAN_VIEW = ["programados", "arribo", "inspeccion_de_entrada", "carga_/_descarga", "inspeccion_salida", "terminados"];

export interface ConfigFlujoTransportista {
  etapasActivas: string[];
  kanbanView: string[];
}

export function useConfigFlujoTransportista() {
  const { data, isLoading, error } = useQuery<ConfigFlujoTransportista>({
    queryKey: ["configFlujoTransportista"],
    queryFn: async () => {
      const res = await getConfigFlujoTransportista();
      const raw = ((res as Record<string, unknown>)?.response as Record<string, unknown>)?.data
        ?? (res as Record<string, unknown>)?.data;
      const etapasActivas = (raw as { etapas_activas?: string[] })?.etapas_activas;
      const kanbanView = (raw as { kanban_view?: string[] })?.kanban_view;
      return {
        etapasActivas: etapasActivas?.length ? etapasActivas : FALLBACK_ETAPAS_ACTIVAS,
        kanbanView: kanbanView?.length ? kanbanView : FALLBACK_KANBAN_VIEW,
      };
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    // Por campo, no por objeto completo: una caché de React Query con una forma
    // más vieja (ej. de antes de agregar `kanbanView`) igual trae `data` truthy,
    // así que `data ?? fallback` no la cubre — pero `data?.kanbanView` sí.
    data: {
      etapasActivas: data?.etapasActivas ?? FALLBACK_ETAPAS_ACTIVAS,
      kanbanView: data?.kanbanView ?? FALLBACK_KANBAN_VIEW,
    },
    isLoading,
    error,
  };
}
