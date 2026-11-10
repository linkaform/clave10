import { cn } from "@/lib/utils";

interface DiagBlockProps {
  title: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Bloque del Diagnóstico de menús: tarjeta con borde, título, conteo y acciones. */
export function DiagBlock({ title, count, description, actions, children }: DiagBlockProps) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-c10-surface p-4 shadow-[0_0_0_1px_var(--c10-line-card)] min-[1080px]:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-c10-title">
            {title}
            {count !== undefined && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                  count > 0 ? "bg-c10-red-subtle text-[#DC2626]" : "bg-c10-sunken text-c10-secondary",
                )}>
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[13px] leading-[1.45] text-c10-meta [text-wrap:pretty]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Mensaje de estado dentro de un bloque (cargando, vacío, error). */
export function DiagEmpty({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-c10-panel p-5 text-center text-sm",
        tone === "error" ? "text-[#DC2626]" : "text-c10-meta",
      )}>
      {children}
    </div>
  );
}

/** Contenedor que da el estilo del diseño a una `<Table>` de shadcn. */
export const diagTableWrap =
  "overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--c10-line)] [&_thead_tr]:border-0 [&_th]:h-auto [&_th]:bg-c10-blue-light [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[.05em] [&_th]:text-c10-secondary [&_tbody_tr]:border-c10-line [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-c10-text";

/** Clases de tabla del diseño: encabezado azul claro, filas con borde. */
export const diagTable = {
  wrap: "overflow-x-auto rounded-xl shadow-[0_0_0_1px_var(--c10-line)]",
  table: "w-full border-collapse text-sm",
  th: "bg-c10-blue-light px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary whitespace-nowrap",
  tr: "border-t border-c10-line bg-c10-surface",
  td: "px-3 py-2.5 text-c10-text",
};

/** Botón primario (azul) y secundario (borde) del diagnóstico. */
export const diagBtn = {
  primary:
    "flex h-9 items-center gap-1.5 rounded-lg bg-[#2F80ED] px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E6FDB] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "flex h-9 items-center gap-1.5 rounded-lg border border-c10-line bg-c10-surface px-3 text-sm font-medium text-c10-label transition-colors duration-150 hover:bg-c10-sunken disabled:cursor-not-allowed disabled:opacity-50",
};
