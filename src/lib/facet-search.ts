import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";
import { SearchCandidate, SearchFacet } from "@/components/common/FacetSearch";

// Llamadas del buscador avanzado (FacetSearch). Cada script que lo soporta
// expone las opciones get_search_fields y get_search_counts, y su listado
// acepta limit/skip/locations/facets (con limit regresa el formato paginado).

/** Paginación y filtros que el listado manda al back. */
export interface FacetListParams {
  limit: number;
  skip: number;
  locations: string[];
  facets: SearchFacet[];
}

/** Filtros base (los mismos del listado) para que los conteos cuadren. */
export interface FacetCountsBase {
  status: string;
  dateFrom: string;
  dateTo: string;
  filterDate: string;
  locations: string[];
}

export const runScript = async (scriptName: string, payload: Record<string, unknown>) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({ ...payload, script_name: scriptName }),
  });
  return response.json();
};

// suffix: para scripts que atienden varias secciones (ej. rondines.py usa
// get_search_fields_recorridos).
export const getSearchFields = (scriptName: string, suffix: string = "") =>
  runScript(scriptName, { option: `get_search_fields${suffix}` });

export const getSearchCounts = (
  scriptName: string,
  base: FacetCountsBase,
  facets: SearchFacet[],
  candidates: SearchCandidate[],
  suffix: string = "",
) => runScript(scriptName, { option: `get_search_counts${suffix}`, location: "", ...base, facets, candidates });

/** Payload de paginación para el listado; sin paging el back usa el formato anterior. */
export const facetListPayload = (paging?: FacetListParams) =>
  paging ? { location: "", ...paging } : {};
