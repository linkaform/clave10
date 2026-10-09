import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";
import { SearchFacet } from "@/components/common/FacetSearch";

interface GetMyPasesParams {
  tab?: string;
  limit?: number;
  skip?: number;
  searchName?: string;
  location?: string;
  locations?: string[];
  dynamicFilters?: Record<string, string | string[]>;
  dateFilter?: string;
  /** "AAAA-MM-DD"; el back extiende dateTo al final del día. */
  dateFrom?: string;
  dateTo?: string;
  facets?: SearchFacet[];
}

export const getMyPases = async ({
  tab = "Todos",
  limit = 10,
  skip = 0,
  searchName = "",
  location = "",
  locations = [],
  dynamicFilters = {},
  dateFilter = "",
  dateFrom = "",
  dateTo = "",
  facets = [],
}: GetMyPasesParams = {}) => {
  const dynamic_filters = Object.entries(dynamicFilters)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value : [value],
    }));

  const payload = {
    tab_status: tab,
    limit,
    skip,
    search_name: searchName,
    location,
    locations,
    dynamic_filters,
    filterDate: dateFilter,
    dateFrom,
    dateTo,
    facets,
    option: "get_my_pases",
    script_name: "pase_de_acceso.py",
  };

  const userJwt = await getValidToken();

  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
};
