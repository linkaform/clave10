import { Mail, Plus, RefreshCw, Upload, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Las acciones llegan del catálogo con "+" al inicio ("+ Nuevo …", "+ Subir …").
// El verbo decide el ícono, como en el diseño del mega-menú.
const ACTION_ICONS: [RegExp, LucideIcon][] = [
  [/^subir\b/i, Upload],
  [/^invitar\b/i, Mail],
  [/^generar\b/i, RefreshCw],
];

export function parseMenuLabel(raw: string) {
  const trimmed = raw.trim();
  const isAction = trimmed.startsWith("+");
  const label = isAction ? trimmed.replace(/^\+\s*/, "") : trimmed;
  const Icon = isAction
    ? ACTION_ICONS.find(([re]) => re.test(label))?.[1] ?? Plus
    : null;
  return { isAction, label, Icon };
}

export function MenuItemLabel({ label: raw, iconClassName }: { label: string; iconClassName?: string }) {
  const { isAction, label, Icon } = parseMenuLabel(raw);
  if (!isAction || !Icon) return <>{label}</>;
  return (
    <>
      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", iconClassName)} />
      <span className="italic">{label}</span>
    </>
  );
}
