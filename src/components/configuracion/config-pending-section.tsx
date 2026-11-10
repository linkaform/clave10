import { Clock } from "lucide-react";
import { ConfigCard } from "./config-card";

/** Sección de Configuración que todavía no tiene funcionalidad. */
export function ConfigPendingSection({ title }: { title: string }) {
  return (
    <ConfigCard title={title}>
      <div className="flex flex-col gap-3" aria-hidden>
        {[72, 56, 64].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-c10-skeleton" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 rounded bg-c10-skeleton" style={{ width: `${w}%` }} />
              <div className="h-3 w-1/3 rounded bg-c10-skeleton" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-c10-panel px-3 py-2.5 text-[13px] text-c10-meta">
        <Clock className="h-4 w-4 shrink-0 text-c10-faint" />
        Esta sección todavía no está disponible.
      </div>
    </ConfigCard>
  );
}
