import {
  WorkflowLogFiltersState,
  getWorkflowLogDetailSdk,
  getWorkflowLogFiltersSdk,
  getWorkflowLogsSdk,
} from "@/lib/workflow-logs-sdk";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface WorkflowLogRow {
  id: string;
  success: boolean | null;
  name: string;
  rule: number | null;
  rule_label: string;
  rule_name: string;
  event: string;
  event_label: string;
  form_id: number | null;
  form_name: string;
  folio: string;
  user_id: number | null;
  user_name: string;
  created_at: string | null;
  record_id: string;
  workflow_record_id: string;
  has_log: boolean;
  log_url: string;
  error: string;
}

export interface WorkflowLogsPage {
  records: WorkflowLogRow[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: WorkflowLogsPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useWorkflowLogs = (filters: WorkflowLogFiltersState, limit: number, skip: number) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<WorkflowLogsPage>({
    queryKey: ["workflowLogs", filters, limit, skip],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await getWorkflowLogsSdk(filters, limit, skip);
      if (errorMsj(res)) throw new Error(`Error al obtener logs de workflows: ${res.error}`);
      return res.response?.data ?? EMPTY_PAGE;
    },
  });
  return { workflowLogs: data ?? EMPTY_PAGE, isLoading: isLoading || isFetching, error, refetch };
};

type Option = { value: string | number; label: string };

export interface WorkflowLogFilterOptions {
  rule: Option[];
  event: Option[];
  workflow: Option[];
  form: Option[];
  user: Option[];
}

const EMPTY_OPTIONS: WorkflowLogFilterOptions = { rule: [], event: [], workflow: [], form: [], user: [] };

export const useWorkflowLogFilterOptions = () => {
  const { data } = useQuery<WorkflowLogFilterOptions>({
    queryKey: ["workflowLogFilterOptions"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await getWorkflowLogFiltersSdk();
      if (errorMsj(res)) throw new Error(`Error al obtener filtros: ${res.error}`);
      return res.response?.data ?? EMPTY_OPTIONS;
    },
  });
  return data ?? EMPTY_OPTIONS;
};

export interface WorkflowLogDetail {
  record_request?: unknown;
  record_response?: unknown;
  workflow_request?: unknown;
  workflow_response?: unknown;
  record_response_code?: number | null;
  error?: string;
}

export const useWorkflowLogDetail = (logId: string | null) =>
  useQuery<WorkflowLogDetail>({
    queryKey: ["workflowLogDetail", logId],
    enabled: !!logId,
    queryFn: async () => {
      const res = await getWorkflowLogDetailSdk(logId as string);
      if (errorMsj(res)) throw new Error(`Error al obtener el detalle: ${res.error}`);
      return res.response?.data ?? {};
    },
  });
