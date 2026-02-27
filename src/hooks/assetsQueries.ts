import { getAccessAssets } from "@/lib/access";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

const assets = ["Visita_a", "Perfiles", "Areas"] as const;

const getLocalAssets = (location: string) => {
  try {
    const data = localStorage.getItem(`assets_${location}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const formatAssets = (ubicacionesSeleccionadas: any[]) => {
  const all: { id: string; name: string; category: string }[] = [];
  const itemCount = new Map<string, Set<string>>();

  for (const ubicacion of ubicacionesSeleccionadas) {
    const location = ubicacion.id;
    const localData = getLocalAssets(location);
    if (!localData) continue;

    for (const cat of assets) {
      const items: string[] = localData[cat] ?? [];
      items.forEach((item) => {
        const key = `${item}_${cat}`;
        if (!itemCount.has(key)) itemCount.set(key, new Set());
        itemCount.get(key)!.add(location);
      });
    }
  }

  const seen = new Set<string>();

  for (const ubicacion of ubicacionesSeleccionadas) {
    const location = ubicacion.id;
    const localData = getLocalAssets(location);
    if (!localData) continue;

    for (const cat of assets) {
      const items: string[] = localData[cat] ?? [];
      items.forEach((item) => {
        const key = `${item}_${cat}`;
        if (seen.has(key)) return;
        seen.add(key);

        const locations = itemCount.get(key)!;
        const isInAll = locations.size === ubicacionesSeleccionadas.length;

        all.push({
          id: item,
          name: isInAll ? `${item} - Todas las ubicaciones` : `${item} - ${location}`,
          category: cat,
        });
      });
    }
  }

  return all.sort((a, b) => {
    const aAll = a.name.includes("Todas las ubicaciones") ? 0 : 1;
    const bAll = b.name.includes("Todas las ubicaciones") ? 0 : 1;
    return aAll - bAll;
  });
};

export const useAssetsByLocations = (ubicacionesSeleccionadas: any[], cat?: string) => {
  const queries = useQueries({
    queries: ubicacionesSeleccionadas.map((ubicacion) => {
      const location = ubicacion.id;
      const localData = getLocalAssets(location);
      return {
        queryKey: ["getAssetsAccess", location, cat],
        enabled: !!location && !localData,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        initialData: localData ?? undefined,
        queryFn: async () => {
          const data = await getAccessAssets(location, cat);
          const result = data.response?.data || {};
          localStorage.setItem(`assets_${location}`, JSON.stringify(result));
          return result;
        },
      };
    }),
  });

  const isLoading = queries.some(
    (q) => q.isPending && q.fetchStatus !== "idle"
  );

  const allAssets = useMemo(
    () => formatAssets(ubicacionesSeleccionadas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ubicacionesSeleccionadas, queries.map((q) => q.status).join(",")]
  );

  const visitas = useMemo(() => allAssets.filter((a) => a.category === "Visita_a"), [allAssets]);
  const perfiles = useMemo(() => allAssets.filter((a) => a.category === "Perfiles"), [allAssets]);
  const areas = useMemo(() => allAssets.filter((a) => a.category === "Areas"), [allAssets]);

  return {
    allAssets,
    visitas,
    perfiles,
    areas,
    isLoading,
  };
};