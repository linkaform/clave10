import { useEffect, useCallback } from "react";
import { useFiltersStore } from "@/store/useFiltersStore";
import { errorMsj } from "@/lib/utils";

interface UseFiltersProps {
  key: string;
  endpoint: () => Promise<any>;
}

export const useFilters = ({ key, endpoint }: UseFiltersProps) => {
  const { cache, fetchFilterStale, isLoading } = useFiltersStore();

  // Stale-while-revalidate: muestra el cache persistido de inmediato y siempre lo
  // refresca al montar, para que opciones nuevas (y cambios de cuenta) sí lleguen.
  const fetch = useCallback(
    () =>
      fetchFilterStale(key, async () => {
        const res = await endpoint();
        const error = errorMsj(res);
        if (error) throw new Error(error.text);
        const raw = res?.response?.data ?? [];
        return Array.isArray(raw) ? raw : [];
      }),
    [fetchFilterStale, key, endpoint],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    filters: cache[key] ?? [],
    loadingFilters: isLoading(key),
  };
};
