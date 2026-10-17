"use client";

import * as React from "react";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScriptLogRow, useScriptLogContent } from "@/hooks/ScriptLogs/useScriptLogs";
import { ResizableLogSheet } from "./ResizableLogSheet";
import { CopyableId } from "./CopyableId";
import { StatusBadge, formatDate, formatDuration } from "./ScriptLogsTable";

interface Props {
  row: ScriptLogRow | null;
  onOpenChange: (open: boolean) => void;
}

// Panel lateral con el log de una ejecucion. El contenido lo baja el backend
// (evita CORS contra Backblaze), asi que descargar/copiar usan ese texto.
export function ScriptLogPanel({ row, onOpenChange }: Props) {
  const { data, isLoading, error } = useScriptLogContent(row?.has_log ? row.log_url : null);
  const content = data?.content ?? "";

  const fileName = row ? `${row.script_name || "script"}_${row.id}.log`.replace(/\s+/g, "_") : "script.log";

  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
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

  return (
    <ResizableLogSheet
      open={!!row}
      onOpenChange={onOpenChange}
      title="Log del script"
      keepOpenSelector="[data-script-log-eye]"
    >
        {row && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b bg-white space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{row.script_name}</h2>
                  <p className="text-xs text-slate-500">
                    {row.user_name} · {formatDate(row.start_date)} · {formatDuration(row.duration)}
                  </p>
                  <CopyableId id={row.id} />
                </div>
                <div className="flex items-center gap-2 pr-20">
                  <StatusBadge row={row} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" disabled={!content} onClick={download}>
                  <Download size={14} className="mr-1" /> Descargar .log
                </Button>
                <Button size="sm" variant="outline" disabled={!content} onClick={copy}>
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
                {row.log_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={row.log_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-1" /> Abrir original
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-950 p-4">
              {!row.has_log ? (
                <p className="text-sm text-slate-400">
                  {row.status === "running" ? "El script sigue en ejecución; el log aún no está disponible." : "Sin log disponible."}
                </p>
              ) : isLoading ? (
                <p className="text-sm text-slate-400">Cargando log...</p>
              ) : error ? (
                <p className="text-sm text-red-400">{(error as Error).message}</p>
              ) : data?.error ? (
                <p className="text-sm text-red-400">{data.error}</p>
              ) : (
                <>
                  <pre className="text-xs text-slate-100 whitespace-pre-wrap break-words font-mono">{content || "(log vacío)"}</pre>
                </>
              )}
            </div>
          </div>
        )}
    </ResizableLogSheet>
  );
}
