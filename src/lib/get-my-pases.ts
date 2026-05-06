import { API_ENDPOINTS } from "@/config/api";

interface GetMyPasesParams {
  tab?: string;
  limit?: number;
  skip?: number;
  searchName?: string;
  location?: string;
  dynamicFilters?: Record<string, string | string[]>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
}

export const getMyPases = async ({
  tab = "Todos",
  limit = 10,
  skip = 0,
  searchName = "",
  location = "",
  dynamicFilters = {},
  dateFilter = "",
  date1 = "",
  date2 = "",
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
    dynamic_filters,
    filterDate: dateFilter,
    dateFrom: date1 ? (date1 as Date).toISOString() : "",
    dateTo: date2 ? (date2 as Date).toISOString() : "",
    option: "get_my_pases",
    script_name: "pase_de_acceso.py",
  };

  const userJwt = localStorage.getItem("access_token");

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
