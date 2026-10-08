import { runScriptSdk } from "./script-logs-sdk";

// Pantalla "Logs de workflows" (Config). Backend: lkf-sanic-apps, modulo Base,
// workflow_logs_sdk.py (coleccion workflow_log).

export interface WorkflowLogFiltersState {
  /** "success" | "error" | "" */
  status: string;
  rules: string[];
  events: string[];
  workflowNames: string[];
  formIds: string[];
  userIds: string[];
  /** ISO 8601 (UTC) */
  dateFrom: string;
  dateTo: string;
}

const runScript = (payload: Record<string, any>) => runScriptSdk("workflow_logs_sdk.py", payload);

export const getWorkflowLogsSdk = (filters: WorkflowLogFiltersState, limit: number = 25, skip: number = 0) =>
  runScript({
    option: "list_workflow_logs",
    limit,
    offset: skip,
    status: filters.status,
    rules: filters.rules,
    events: filters.events,
    workflow_names: filters.workflowNames,
    form_ids: filters.formIds,
    user_ids: filters.userIds,
    date1: filters.dateFrom,
    date2: filters.dateTo,
  });

export const getWorkflowLogFiltersSdk = () => runScript({ option: "get_workflow_log_filters" });

export const getWorkflowLogDetailSdk = (log_id: string) =>
  runScript({ option: "get_workflow_log_detail", log_id });
