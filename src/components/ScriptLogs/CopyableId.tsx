"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyableId({ id, label = "ID" }: { id: string; label?: string }) {
  return (
    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
      <span>{label}:</span>
      <code className="font-mono text-slate-700 select-all">{id}</code>
      <button
        type="button"
        title="Copiar ID"
        className="text-slate-400 hover:text-slate-700"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(id);
            toast.success("ID copiado");
          } catch {
            toast.error("No se pudo copiar el ID");
          }
        }}
      >
        <Copy size={12} />
      </button>
    </p>
  );
}
