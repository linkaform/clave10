import { Clock, Route, ShieldCheck, Smartphone } from "lucide-react";
import type { BandejaItem } from "@/lib/asistencia-sdk";
import { cn } from "@/lib/utils";

const ESTADOS: Record<string, { label: string; className: string }> = {
  new: { label: "Nuevo", className: "bg-[#EFF6FF] text-[#2F80ED]" },
  in_progress: { label: "En curso", className: "bg-amber-50 text-amber-700" },
  paused: { label: "En pausa", className: "bg-slate-100 text-slate-600" },
  completed: { label: "Terminado", className: "bg-green-50 text-green-700" },
};

const ICONOS: Record<string, React.ReactNode> = {
  rondin: <Route className="h-4 w-4" />,
  autorizacion_acceso: <ShieldCheck className="h-4 w-4" />,
  autorizacion_extra: <Clock className="h-4 w-4" />,
};

const FECHA = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const fechaItem = (fecha: string | null) => {
  if (!fecha) return "";
  const d = new Date(fecha.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? fecha : FECHA.format(d);
};

export function BandejaItemRow({
  item,
  compacto = false,
  acciones,
}: {
  item: BandejaItem;
  compacto?: boolean;
  acciones?: React.ReactNode;
}) {
  const estado = ESTADOS[item.estado] ?? { label: item.estado, className: "bg-slate-100 text-slate-600" };
  const p = item.progreso;
  return (
    <div className={cn("flex gap-3", compacto ? "px-3 py-2.5" : "rounded-xl border border-slate-200 bg-white p-4")}>
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-500">
        {ICONOS[item.tipo] ?? <Route className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{item.titulo}</div>
            <div className="truncate text-xs text-slate-500">
              {item.tipo_label}
              {item.detalle ? ` · ${item.detalle}` : ""}
            </div>
          </div>
          <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", estado.className)}>
            {estado.label}
          </span>
        </div>
        {p && p.total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#2F80ED]" style={{ width: `${Math.round((p.hechos / p.total) * 100)}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-slate-500">
              {p.hechos}/{p.total} áreas
            </span>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3 whitespace-nowrap text-[11px] text-slate-400">
          {item.fecha && <span>{fechaItem(item.fecha)}</span>}
          {item.folio && !compacto && <span>Folio {item.folio}</span>}
          {item.solo_app && (
            <span className="flex items-center gap-1 text-violet-600">
              <Smartphone className="h-3 w-3" />
              Hazlo desde la app
            </span>
          )}
        </div>
        {acciones}
      </div>
    </div>
  );
}
