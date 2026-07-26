import { getAreasCatalogSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { AreaItem } from "@/types/bitacoras";
import { AreaRow } from "@/lib/areas";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export const useAreasCatalog = (
  locations: string[],
  dynamicFilters: { key: string; value: any }[] = [],
) => {
  const queries = useQueries({
    queries: locations.map((ubicacion) => ({
      queryKey: ["areasCatalog", ubicacion, dynamicFilters],
      enabled: Boolean(ubicacion),
      queryFn: async (): Promise<AreaRow[]> => {
        const data = await getAreasCatalogSdk(ubicacion, dynamicFilters);
        const textMsj = errorMsj(data);
        if (textMsj) {
          throw new Error(`Error al obtener áreas de ${ubicacion}: ${data.error}`);
        }
        const items: AreaItem[] = data.response?.data ?? [];
        return items.map((item) => ({ ...item, ubicacion }));
      },
    })),
  });

  const areas = useMemo(
    () => queries.flatMap((q) => q.data ?? []),
    [queries],
  );
  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const error = queries.find((q) => q.error)?.error;
  const refetch = () => queries.forEach((q) => q.refetch());

  return { areas, isLoading, isFetching, error, refetch };
};
