"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Settings2,
  ShieldAlert,
  Star,
  StickyNote,
  Ticket,
  Truck,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Fijas por ahora: no hay endpoint de favoritos por usuario. Las rutas abren el
// modal de alta con ?action= donde la pantalla lo soporta.
const SHORTCUTS: {
  key: string;
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { key: "F1", label: "Nuevo Acceso Visita", desc: "Entrada de visitante", href: "/dashboard/accesos?action=nueva_visita", icon: UserPlus, color: "text-[#16A34A]" },
  { key: "F2", label: "Nuevo Acceso Transportista", desc: "Entrada de transporte o proveedor", href: "/dashboard/bitacoras_transportistas", icon: Truck, color: "text-[#2F80ED]" },
  { key: "F3", label: "Nueva Incidencia", desc: "Reporta un evento de seguridad", href: "/dashboard/incidencias?tab=incidencia&action=nueva_incidencia", icon: ShieldAlert, color: "text-[#DC2626]" },
  { key: "F4", label: "Nueva Falla", desc: "Reporta una falla de instalación", href: "/dashboard/incidencias?tab=falla&action=nueva_falla", icon: Wrench, color: "text-[#B45309]" },
  { key: "F5", label: "Nueva Paquetería", desc: "Paquetería y correspondencia", href: "/dashboard/articulos?tab=paqueteria&action=nuevo_paquete", icon: Package, color: "text-[#B45309]" },
  { key: "F6", label: "Nuevo Artículo Perdido", desc: "Registra un artículo extraviado", href: "/dashboard/articulos?tab=articulos_perdidos&action=nuevo_articulo_perdido", icon: Search, color: "text-[#7C3AED]" },
  { key: "F7", label: "Nuevo Pase", desc: "Genera un pase de entrada", href: "/dashboard/pase-entrada", icon: Ticket, color: "text-[#2F80ED]" },
  { key: "F8", label: "Nueva Nota", desc: "Deja una nota para el siguiente relevo", href: "/dashboard/notas?action=nueva_nota", icon: StickyNote, color: "text-[#2F80ED]" },
];

export function FavoriteActions({ className }: { className?: string }) {
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = SHORTCUTS.find((x) => x.key === e.key);
      if (!s) return;
      e.preventDefault();
      router.push(s.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <HomeCard className={cn("px-[22px] pt-5 pb-[22px] gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-slate-900">
          <Star className="h-[18px] w-[18px] fill-[#F59E0B] text-[#F59E0B]" />
          Acciones favoritas
        </h2>
        <button
          type="button"
          onClick={() => toast("Pendiente: personalizar acciones favoritas")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-[#2F80ED]">
          <Settings2 className="h-3.5 w-3.5" />
          Personalizar
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto content-start grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            title={s.desc}
            className="group relative flex flex-col items-start gap-2.5 min-w-0 p-3.5 rounded-2xl bg-[#F8FAFC] text-slate-700 transition-colors hover:bg-[#EFF6FF] hover:text-[#2F80ED]">
            <span className="absolute top-3 right-3 h-5 min-w-6 px-1.5 rounded-md bg-white shadow-[0_0_0_1px_#E2E8F0,inset_0_-1px_0_#E2E8F0] text-[11px] font-semibold text-slate-400 hidden sm:flex items-center justify-center tabular-nums">
              {s.key}
            </span>
            <span
              className={cn(
                "h-9 w-9 flex-shrink-0 rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,.08)] flex items-center justify-center",
                s.color,
              )}>
              <s.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 text-sm font-semibold leading-[1.3]">{s.label}</span>
          </Link>
        ))}
      </div>
    </HomeCard>
  );
}
