import { useEffect, useCallback } from "react";
import { useFiltersStore } from "@/store/useFiltersStore";
import { errorMsj } from "@/lib/utils";

interface UseFiltersProps {
  key: string;
  endpoint: () => Promise<any>;
}

export const useFilters = ({ key, endpoint }: UseFiltersProps) => {
  const { cache, fetchFilter, isLoading } = useFiltersStore();

  const fetch = useCallback(
    () =>
      fetchFilter(key, async () => {
        const res = await endpoint();
        const error = errorMsj(res);
        if (error) throw new Error(error.text);
        const raw = res?.response?.data ?? [];
        return Array.isArray(raw) ? raw : [];
      }),
    [fetchFilter, key, endpoint],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    filters: cache[key] ?? [],
    loadingFilters: isLoading(key),
  };
};
