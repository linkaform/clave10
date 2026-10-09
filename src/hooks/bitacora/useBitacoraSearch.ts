import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchCandidate, SearchFacet, SearchFieldConfig } from "@/components/common/FacetSearch";
import { getSearchCounts, getSearchFields } from "@/lib/facet-search";

const SCRIPT = "script_turnos.py";

// Buscador avanzado de Bitácoras. A diferencia de useFacetSection, aquí el panel
// (dynamicFilters) sigue siendo la fuente de los filtros exactos, porque también
// alimenta las estadísticas y se sincroniza con ?status= de la URL. Los chips
// exactos se leen/escriben ahí y las búsquedas de texto viven en textFacets.
interface BitacoraSearchInput {
  dynamicFilters: Record<string, any>;
  setDynamicFilters: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  textFacets: SearchFacet[];
  setTextFacets: (facets: SearchFacet[]) => void;
  formattedDates: string[];
  activeDateFilter: string;
  selectedLocation: string | string[];
}

export const useBitacoraSearch = ({
  dynamicFilters,
  setDynamicFilters,
  textFacets,
  setTextFacets,
  formattedDates,
  activeDateFilter,
  selectedLocation,
}: BitacoraSearchInput) => {
  const { data: searchFields = [] } = useQuery<SearchFieldConfig[]>({
    queryKey: ["searchFields", SCRIPT],
    staleTime: Infinity,
    queryFn: async () => (await getSearchFields(SCRIPT))?.response?.data ?? [],
  });

  const searchFacets = useMemo<SearchFacet[]>(() => {
    const panel = Object.entries(dynamicFilters)
      // La ubicación la maneja el selector de la barra superior, no es un chip.
      .filter(([key, value]) => key !== "ubicacion" && (Array.isArray(value) ? value.length > 0 : !!value))
      .map(([key, value]) => ({
        key,
        values: (Array.isArray(value) ? value : [value]).map(String),
        exact: true,
      }));
    return [...textFacets, ...panel];
  }, [dynamicFilters, textFacets]);

  const onSearchFacetsChange = useCallback(
    (next: SearchFacet[]) => {
      setTextFacets(next.filter((f) => !f.exact));
      setDynamicFilters((prev) => {
        const updated: Record<string, any> = {};
        if (prev.ubicacion) updated.ubicacion = prev.ubicacion;
        next.filter((f) => f.exact).forEach((f) => {
          updated[f.key] = f.values;
        });
        return updated;
      });
    },
    [setDynamicFilters, setTextFacets],
  );

  const fetchSearchCounts = useCallback(
    async (current: SearchFacet[], candidates: SearchCandidate[]) => {
      const locations = Array.isArray(selectedLocation)
        ? selectedLocation
        : selectedLocation
          ? [selectedLocation]
          : [];
      const res = await getSearchCounts(
        SCRIPT,
        {
          status: "",
          dateFrom: formattedDates[0] ?? "",
          dateTo: formattedDates[1] ?? "",
          filterDate: activeDateFilter ?? "",
          locations,
        },
        current,
        candidates,
      );
      return (res?.response?.data ?? []) as number[];
    },
    [formattedDates, activeDateFilter, selectedLocation],
  );

  return { searchFields, searchFacets, onSearchFacetsChange, fetchSearchCounts };
};
