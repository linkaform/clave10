"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchCandidate, SearchFacet, SearchFieldConfig } from "@/components/common/FacetSearch";
import { FacetListParams, getSearchCounts, getSearchFields } from "@/lib/facet-search";
import { dateToString } from "@/lib/utils";

// Estado del buscador avanzado de una sección (Concesionados, Paquetería...):
//  - Los filtros del panel lateral (Estatus, Área...) viven en `facets` como
//    facets exactos, así panel y chips muestran lo mismo y el back los aplica
//    sobre todos los registros. Las llaves del panel son las de get_search_fields.
//  - La fecha del panel va en la petición (no se filtra en cliente).
//  - Paginación en el back; cambiar filtros, fecha, estatus o ubicaciones
//    regresa a la página 1.

interface PanelFilters {
  externalFilters: { dynamic: Record<string, any>; dateFilter?: string; date1?: Date | ""; date2?: Date | "" };
  onExternalFiltersChange: (filters: any) => void;
  activeFiltersCount: number;
}

interface UseFacetSectionOptions {
  /** Script del back (ej. "paqueteria.py") con get_search_fields / get_search_counts. */
  scriptName: string;
  panel: PanelFilters;
  status: string;
  locations: string[];
  /** Sufijo de las opciones del script (ej. "_recorridos" en rondines.py). */
  optionSuffix?: string;
}

export function useFacetSection({ scriptName, panel, status, locations, optionSuffix = "" }: UseFacetSectionOptions) {
  const { externalFilters, onExternalFiltersChange, activeFiltersCount } = panel;
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);

  const { data: fields = [] } = useQuery<SearchFieldConfig[]>({
    queryKey: ["searchFields", scriptName, optionSuffix],
    staleTime: Infinity,
    queryFn: async () => (await getSearchFields(scriptName, optionSuffix))?.response?.data ?? [],
  });

  const dateFrom = externalFilters.date1 ? dateToString(new Date(externalFilters.date1)) : "";
  const dateTo = externalFilters.date2 ? dateToString(new Date(externalFilters.date2)) : "";
  const filterDate = externalFilters.dateFilter ?? "";

  // Cambiar filtros, fecha, estatus/pestaña o ubicaciones regresa a la página 1.
  useEffect(() => {
    setSkip(0);
  }, [facets, dateFrom, dateTo, filterDate, status, locations]);

  const fetchCounts = useCallback(
    async (current: SearchFacet[], candidates: SearchCandidate[]) => {
      const res = await getSearchCounts(
        scriptName,
        { status, dateFrom, dateTo, filterDate, locations },
        current,
        candidates,
        optionSuffix,
      );
      return (res?.response?.data ?? []) as number[];
    },
    [scriptName, status, dateFrom, dateTo, filterDate, locations, optionSuffix],
  );

  const panelDynamic = useMemo(
    () => Object.fromEntries(facets.filter((f) => f.exact).map((f) => [f.key, f.values])),
    [facets],
  );
  const filtersView = useMemo(
    () => ({ ...externalFilters, dynamic: panelDynamic }),
    [externalFilters, panelDynamic],
  );
  const panelCount = useMemo(
    () => facets.filter((f) => f.exact).reduce((n, f) => n + f.values.length, 0),
    [facets],
  );

  const onFiltersChange = useCallback(
    (newFilters: any) => {
      const fromPanel: Record<string, string[]> = {};
      Object.entries(newFilters?.dynamic ?? {}).forEach(([key, v]) => {
        const values = (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean).map(String);
        if (values.length) fromPanel[key] = values;
      });
      setFacets((prev) => {
        // Conserva el orden de los chips: se actualizan en su lugar y los
        // filtros nuevos del panel van al final.
        const next: SearchFacet[] = [];
        prev.forEach((f) => {
          if (!f.exact) next.push(f);
          else if (fromPanel[f.key]) next.push({ ...f, values: fromPanel[f.key] });
        });
        Object.entries(fromPanel).forEach(([key, values]) => {
          if (!prev.some((f) => f.exact && f.key === key)) next.push({ key, values, exact: true });
        });
        return next;
      });
      // Al hook del panel solo le queda la fecha; dynamic ya no se filtra en cliente.
      onExternalFiltersChange({ ...newFilters, dynamic: {} });
    },
    [onExternalFiltersChange],
  );

  const paging: FacetListParams = useMemo(
    () => ({ limit, skip, locations, facets }),
    [limit, skip, locations, facets],
  );

  const onPageChange = useCallback((newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  }, []);

  return {
    fields,
    facets,
    setFacets,
    fetchCounts,
    filtersView,
    onFiltersChange,
    activeFiltersCount: activeFiltersCount + panelCount,
    dateFrom,
    dateTo,
    filterDate,
    paging,
    onPageChange,
  };
}
