import { useFiltersStore } from "@/store/useFiltersStore";
import { getAreasFilters } from "@/services/endpoints";
import { errorMsj } from "@/lib/utils";
import { FilterOption } from "@/types/bitacoras";

const CACHE_KEY = "area-disponibilidad-options";

// Muestra las opciones ya cacheadas (localStorage) de inmediato la primera
// vez que el usuario abre el menú, y siempre dispara un refetch en segundo
// plano para refrescar el cache de cara a la próxima vez.
export const useAreaDisponibilidadOptions = () => {
  const { cache, fetchFilterStale } = useFiltersStore();
  const options: FilterOption[] = cache[CACHE_KEY] ?? [];

  const ensureOptions = () => {
    fetchFilterStale(CACHE_KEY, async () => {
      const data = await getAreasFilters();
      const error = errorMsj(data);
      if (error) throw new Error(error.text);
      const raw = data?.response?.data ?? [];
      const disponibilidadConfig = raw.find((f: any) => f.key === "disponibilidad");
      return disponibilidadConfig?.options ?? [];
    });
  };

  return { options, ensureOptions };
};
