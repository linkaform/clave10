import {
  ScriptLogFiltersState,
  getScriptLogContentSdk,
  getScriptLogFiltersSdk,
  getScriptLogsSdk,
} from "@/lib/script-logs-sdk";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface ScriptLogRow {
  id: string;
  status: string;
  run_success: boolean | null;
  script_id: number;
  script_name: string;
  user_id: number;
  user_name: string;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  has_log: boolean;
  log_url: string;
}

export interface ScriptLogsPage {
  records: ScriptLogRow[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: ScriptLogsPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useScriptLogs = (
  filters: ScriptLogFiltersState,
  limit: number,
  skip: number,
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<ScriptLogsPage>({
    queryKey: ["scriptLogs", filters, limit, skip],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await getScriptLogsSdk(filters, limit, skip);
      if (errorMsj(res)) throw new Error(`Error al obtener logs: ${res.error}`);
      return res.response?.data ?? EMPTY_PAGE;
    },
  });
  return { scriptLogs: data ?? EMPTY_PAGE, isLoading: isLoading || isFetching, error, refetch };
};

export interface ScriptLogFilterOptions {
  script: { value: number; label: string }[];
  user: { value: number; label: string }[];
}

export const useScriptLogFilterOptions = () => {
  const { data } = useQuery<ScriptLogFilterOptions>({
    queryKey: ["scriptLogFilterOptions"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await getScriptLogFiltersSdk();
      if (errorMsj(res)) throw new Error(`Error al obtener filtros: ${res.error}`);
      return res.response?.data ?? { script: [], user: [] };
    },
  });
  return data ?? { script: [], user: [] };
};

export interface ScriptLogContent {
  content?: string;
  log_url?: string;
  message?: string;
  error?: string;
}

export const useScriptLogContent = (logUrl: string | null) =>
  useQuery<ScriptLogContent>({
    queryKey: ["scriptLogContent", logUrl],
    enabled: !!logUrl,
    queryFn: async () => {
      const res = await getScriptLogContentSdk(logUrl as string);
      if (errorMsj(res)) throw new Error(`Error al obtener el log: ${res.error}`);
      return res.response?.data ?? {};
    },
  });
