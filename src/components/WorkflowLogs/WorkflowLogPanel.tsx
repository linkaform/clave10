"use client";

import * as React from "react";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkflowLogRow, useWorkflowLogDetail } from "@/hooks/WorkflowLogs/useWorkflowLogs";
import { useScriptLogContent } from "@/hooks/ScriptLogs/useScriptLogs";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import { CopyableId } from "@/components/ScriptLogs/CopyableId";
import { formatDate } from "@/components/ScriptLogs/ScriptLogsTable";
import { WorkflowStatusBadge } from "./WorkflowLogsTable";

const RECORD_URL = "https://app.linkaform.com/#/records/detail/";

const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

// Seccion colapsable con un JSON/texto; solo se muestra si hay contenido.
function ContentSection({ title, value }: { title: string; value: unknown }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <details className="border border-slate-200 rounded-md bg-white">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700">{title}</summary>
      <pre className="text-xs text-slate-800 bg-slate-50 border-t border-slate-200 p-3 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono">
        {asText(value)}
      </pre>
    </details>
  );
}

interface Props {
  row: WorkflowLogRow | null;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowLogPanel({ row, onOpenChange }: Props) {
  const detail = useWorkflowLogDetail(row?.id ?? null);
  const log = useScriptLogContent(row?.has_log ? row.log_url : null);
  const content = log.data?.content ?? "";
  const d = detail.data;

  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row?.name || "workflow"}_${row?.id}.log`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Log copiado");
    } catch {
      toast.error("No se pudo copiar el log");
    }
  };

  // Cuando la accion es Ejecutar script, la respuesta es la URL del log (ya se muestra arriba).
  const workflowResponse = row?.has_log ? undefined : d?.workflow_response;

  return (
    <ResizableLogSheet
      open={!!row}
      onOpenChange={onOpenChange}
      title="Detalle del workflow"
      keepOpenSelector="[data-workflow-log-eye]"
    >
      {row && (
        <div className="flex flex-col h-full">
          <div className="p-5 border-b bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{row.name || row.rule_name}</h2>
                <p className="text-xs text-slate-500">
                  {row.rule_label} · {row.event_label} · {row.user_name || "—"} · {formatDate(row.created_at)}
                </p>
                <p className="text-xs text-slate-500">
                  {row.form_name}
                  {row.folio ? ` · Folio ${row.folio}` : ""}
                </p>
                <CopyableId id={row.id} />
              </div>
              <div className="flex items-center gap-2 pr-20">
                <WorkflowStatusBadge row={row} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {row.record_id && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`${RECORD_URL}${row.record_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} className="mr-1" /> Ver registro
                  </a>
                </Button>
              )}
              {row.workflow_record_id && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`${RECORD_URL}${row.workflow_record_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} className="mr-1" /> Ver registro destino
                  </a>
                </Button>
              )}
              {row.has_log && (
                <>
                  <Button size="sm" variant="outline" disabled={!content} onClick={download}>
                    <Download size={14} className="mr-1" /> Descargar .log
                  </Button>
                  <Button size="sm" variant="outline" disabled={!content} onClick={copy}>
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={row.log_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-1" /> Abrir original
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-100">
            {row.success === false && row.error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 break-words">
                {row.error}
              </div>
            )}

            {row.has_log && (
              <div className="rounded-md bg-slate-950 p-4 overflow-auto max-h-[55vh]">
                {log.isLoading ? (
                  <p className="text-sm text-slate-400">Cargando log...</p>
                ) : log.error ? (
                  <p className="text-sm text-red-400">{(log.error as Error).message}</p>
                ) : log.data?.error ? (
                  <p className="text-sm text-red-400">{log.data.error}</p>
                ) : (
                  <pre className="text-xs text-slate-100 whitespace-pre-wrap break-words font-mono">
                    {content || "(log vacío)"}
                  </pre>
                )}
              </div>
            )}

            {detail.isLoading ? (
              <p className="text-sm text-slate-500">Cargando detalle...</p>
            ) : detail.error ? (
              <p className="text-sm text-red-500">{(detail.error as Error).message}</p>
            ) : d?.error ? (
              <p className="text-sm text-red-500">{d.error}</p>
            ) : (
              <>
                <ContentSection title="Respuesta del workflow" value={workflowResponse} />
                <ContentSection title="Payload enviado al destino" value={d?.workflow_request} />
                <ContentSection title="Registro que disparó el workflow" value={d?.record_request} />
                <ContentSection title="Respuesta del registro" value={d?.record_response} />
              </>
            )}
          </div>
        </div>
      )}
    </ResizableLogSheet>
  );
}
