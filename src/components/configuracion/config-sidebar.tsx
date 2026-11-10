"use client";

import {
  type LucideIcon,
  CalendarClock,
  ListTree,
  Newspaper,
  Settings,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfigTab =
  | "perfil"
  | "fotos"
  | "favs"
  | "noticias"
  | "menus"
  | "usuarios"
  | "sistema";

export interface ConfigTabDef {
  key: ConfigTab;
  label: string;
  icon: LucideIcon;
  /** Sin funcionalidad todavía: se muestra en gris. */
  pending?: boolean;
  /** Key del catálogo de menús que hace falta para ver la pestaña. */
  requiredKey?: string;
}

export const CONFIG_TABS: ConfigTabDef[] = [
  { key: "perfil", label: "Mi perfil", icon: UserRound },
  { key: "fotos", label: "Check In / Check Out", icon: CalendarClock, pending: true },
  { key: "favs", label: "Acciones favoritas", icon: Star, pending: true },
  { key: "noticias", label: "Noticias", icon: Newspaper, pending: true },
  { key: "menus", label: "Menús", icon: ListTree, requiredKey: "admin_menus" },
  { key: "usuarios", label: "Usuarios", icon: Users, pending: true },
  { key: "sistema", label: "Sistema", icon: Settings },
];

interface ConfigSidebarProps {
  tabs: ConfigTabDef[];
  active: ConfigTab;
  onSelect: (tab: ConfigTab) => void;
}

/** Panel de navegación de Configuración: lateral en escritorio, chips arriba en pantallas chicas. */
export function ConfigSidebar({ tabs, active, onSelect }: ConfigSidebarProps) {
  return (
    <>
      {/* Escritorio */}
      <nav
        aria-label="Secciones de configuración"
        className="sticky top-[calc(var(--c10-header-h,65px)+88px)] hidden w-[296px] shrink-0 flex-col gap-1 self-start rounded-[20px] bg-c10-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)] min-[1080px]:flex">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors duration-150",
                isActive
                  ? "bg-c10-blue-subtle font-semibold text-[#2F80ED]"
                  : t.pending
                    ? "text-c10-faint hover:bg-c10-panel"
                    : "text-c10-text hover:bg-c10-sunken",
              )}>
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="flex-1 truncate">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Pantallas chicas */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 min-[1080px]:hidden">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-150",
                isActive
                  ? "border-[#2F80ED] bg-[#2F80ED] font-semibold text-white"
                  : t.pending
                    ? "border-c10-line bg-c10-surface text-c10-faint"
                    : "border-c10-line bg-c10-surface text-c10-text",
              )}>
              <Icon className="h-4 w-4" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
