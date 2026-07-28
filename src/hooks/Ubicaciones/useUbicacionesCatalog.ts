import { getUbicacionesCatalogSdk } from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";
import { UbicacionRow } from "@/lib/ubicaciones";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

// Una petición por cada ubicación ya seleccionada en el top-nav
// (useSelectedLocationsStore) — nunca por cada ubicación que exista en el
// catálogo completo de la cuenta. Ver gotcha #7 de
// knowledge/patterns/clave10_front_explorer_screen.md.
export const useUbicacionesCatalog = (locations: string[]) => {
  const queries = useQueries({
    queries: locations.map((ubicacion) => ({
      queryKey: ["ubicacionesCatalog", ubicacion],
      enabled: Boolean(ubicacion),
      queryFn: async (): Promise<UbicacionRow[]> => {
        const data = await getUbicacionesCatalogSdk(ubicacion);
        const textMsj = errorMsj(data);
        if (textMsj) {
          throw new Error(`Error al obtener la ubicación ${ubicacion}: ${data.error}`);
        }
        const items: UbicacionRow[] = data.response?.data ?? [];
        return items;
      },
    })),
  });

  const ubicaciones = useMemo(
    () => queries.flatMap((q) => q.data ?? []),
    [queries],
  );
  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const error = queries.find((q) => q.error)?.error;
  const refetch = () => queries.forEach((q) => q.refetch());

  return { ubicaciones, isLoading, isFetching, error, refetch };
};
