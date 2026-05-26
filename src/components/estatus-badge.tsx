import { cn } from "@/lib/utils";

const normalize = (str: string) =>
  str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() ?? "";

const ESTATUS_STYLES: Record<string, string> = {
  // Verdes
  corriendo:  "bg-green-50 text-green-700 border border-green-200",
  realizado:  "bg-green-50 text-green-700 border border-green-200",
  entregado:  "bg-green-50 text-green-700 border border-green-200",
  devuelto:   "bg-green-50 text-green-700 border border-green-200",
  entrada:   "bg-green-50 text-green-700 border border-green-200",
  // Amarillos
  pausado:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  guardado:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  // Azules
  "en proceso": "bg-blue-50 text-blue-700 border border-blue-200",
  // Morados
  programado: "bg-purple-50 text-purple-700 border border-purple-200",
  // Rojos
  abierto:    "bg-red-50 text-red-700 border border-red-200",
  pendiente:  "bg-red-50 text-red-700 border border-red-200",
  salida:   "bg-red-50 text-red-700 border border-red-200",
  // Grises
  eliminado:  "bg-slate-50 text-slate-500 border border-slate-200",
  cerrado:    "bg-slate-50 text-slate-500 border border-slate-200",
  // Parcial
  parcial:    "bg-amber-50 text-amber-700 border border-amber-200",
};

interface EstatusBadgeProps {
  estatus: string;
  className?: string;
}

export function EstatusBadge({ estatus, className }: EstatusBadgeProps) {
  const key = normalize(estatus);
  
  // Validación especial para incidencias
  const style = (() => {
    if (key.includes("incidencia") && !key.includes("sin"))
      return "bg-red-50 text-red-700 border border-red-200";
    if (key.includes("sin incidencias"))
      return "bg-green-50 text-green-700 border border-green-200";
    return ESTATUS_STYLES[key] ?? "bg-slate-50 text-slate-500 border border-slate-200";
  })();

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap",
      style,
      className
    )}>
      {estatus?.replace(/_/g, " ") || "—"}
    </span>
  );
}