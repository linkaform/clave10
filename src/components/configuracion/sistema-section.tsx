import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { SyncButton } from "./sync-button";
import { CleanDbButton } from "./clean-db-button";
import { ConfigCard } from "./config-card";

const GROUPS: {
  title: string;
  items: { label: string; href?: string }[];
}[] = [
  {
    title: "Administración del sistema",
    items: [
      { label: "Logs de scripts", href: "/dashboard/script-logs" },
      { label: "Catálogos generales" },
      { label: "Configuración de módulos" },
      { label: "Parámetros de operación" },
    ],
  },
  {
    title: "Control de acceso",
    items: [
      { label: "Gestión de roles" },
      { label: "Permisos por usuario" },
      { label: "Auditoría de cambios" },
    ],
  },
  {
    title: "Recursos y ayuda",
    items: [
      { label: "Centro de ayuda" },
      { label: "Documentación técnica" },
      { label: "Soporte técnico" },
    ],
  },
];

/** Configuración > Sistema: lo que antes era la página completa de Configuración. */
export function SistemaSection() {
  return (
    <ConfigCard
      title="Sistema"
      actions={
        <div className="flex gap-2">
          <SyncButton />
          <CleanDbButton />
        </div>
      }>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1440px]:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g.title} className="rounded-xl bg-c10-panel p-2">
            <div className="px-2.5 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">
              {g.title}
            </div>
            <ul className="flex flex-col">
              {g.items.map((item) =>
                item.href ? (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm text-c10-text transition-colors duration-150 hover:bg-c10-surface hover:text-[#2F80ED]">
                      {item.label}
                      <ChevronRight className="h-4 w-4 text-c10-faint" />
                    </Link>
                  </li>
                ) : (
                  <li
                    key={item.label}
                    className="flex h-10 cursor-not-allowed items-center justify-between px-2.5 text-sm text-c10-faint">
                    {item.label}
                    <Lock className="h-3.5 w-3.5" />
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </ConfigCard>
  );
}
