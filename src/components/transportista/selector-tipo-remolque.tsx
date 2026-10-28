"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Icono, resolverTipoVehiculo } from "@/components/transportista/selector-tipo-vehiculo";
import type { UnidadConfig } from "@/components/transportista/agregar-unidad-modal";

// ─── Tipos de remolque ────────────────────────────────────────────────────────
// Misma lista que el select anterior (TIPOS_REMOLQUE); se guarda el `value`
// como texto en "tipo_remolque". Mismo patrón que SelectorTipoVehiculo
// (botón + galería en modal), sin la opción "Otro".

// `contenedor`: el remolque puede llevar un contenedor montado (2610-1382);
// junta 19 oct: solo el chasis portacontenedor. `sinSello`: no se pide sello
// (la plataforma va descubierta). `alias`: valores guardados antes del
// renombre, para seguir reconociéndolos.
export interface TipoRemolque {
  value: string;
  detalle?: string;
  alias?: string[];
  silueta: ReactNode;
  contenedor?: boolean;
  sinSello?: boolean;
}

export const TIPOS_REMOLQUE_SILUETA: TipoRemolque[] = [
  {
    value: "Caja seca",
    silueta: <Icono src="/transportistas/remolque/caja_seca.png" />,
  },
  {
    value: "Plataforma",
    sinSello: true,
    silueta: <Icono src="/transportistas/remolque/plataforma.png" />,
  },
  {
    value: "Chasis portacontenedor",
    contenedor: true,
    silueta: <Icono src="/transportistas/remolque/chasis_portacontenedor.png" />,
  },
  {
    value: "Caja refrigerada",
    silueta: <Icono src="/transportistas/remolque/caja_refrigerada.png" />,
  },
  {
    value: "Ganadero",
    silueta: <Icono src="/transportistas/remolque/ganadero.png" />,
  },
  {
    value: "Basculante",
    silueta: <Icono src="/transportistas/remolque/basculante.png" />,
  },
  {
    value: "Madrina",
    detalle: "Portavehículos",
    alias: ["Portavehículos"],
    silueta: <Icono src="/transportistas/remolque/madrina.png" />,
  },
  {
    value: "Caravana",
    silueta: <Icono src="/transportistas/remolque/caravana.png" />,
  },
  {
    value: "Pipa",
    detalle: "Autotanque",
    alias: ["Tanque"],
    silueta: <Icono src="/transportistas/remolque/pipa.png" />,
  },
];

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const resolverTipoRemolque = (tipo?: string | null): TipoRemolque | undefined => {
  const t = normalizar(tipo ?? "");
  return TIPOS_REMOLQUE_SILUETA.find((r) => [r.value, ...(r.alias ?? [])].some((v) => normalizar(v) === t));
};

// Si el tipo de remolque admite contenedor (chasis portacontenedor).
export const remolquePermiteContenedor = (tipo?: string | null): boolean =>
  !!resolverTipoRemolque(tipo)?.contenedor;

// Si el tipo de remolque lleva número de sello (todos menos la plataforma).
export const remolqueLlevaSello = (tipo?: string | null): boolean =>
  !resolverTipoRemolque(tipo)?.sinSello;

// ─── Sugerencias por tipo de vehículo ─────────────────────────────────────────
// Solo sugieren (ordenan la galería y proponen la configuración de una unidad
// nueva); nunca esconden opciones ni cambian unidades ya capturadas.
// Torton/Rabón/3.5 t traen caja integrada: arrancan en "Solo vehículo".
const SUGERENCIAS_POR_VEHICULO: Record<string, { remolques: string[]; config: UnidadConfig }> = {
  "Tractocamión":    { remolques: ["Caja seca", "Caja refrigerada", "Plataforma", "Chasis portacontenedor", "Madrina", "Pipa", "Basculante", "Ganadero"], config: "solo_remolque" },
  "Torton":          { remolques: [], config: "solo_vehiculo" },
  "Rabón":           { remolques: [], config: "solo_vehiculo" },
  "Camioneta 3.5 t": { remolques: [], config: "solo_vehiculo" },
  "Pickup":          { remolques: ["Caravana", "Plataforma"], config: "solo_vehiculo" },
  "Automóvil":       { remolques: [], config: "solo_vehiculo" },
};

export function sugerenciaPorTipoVehiculo(tipoVehiculo?: string | null) {
  const tipo = resolverTipoVehiculo(tipoVehiculo ?? "");
  return tipo ? { tipoVehiculo: tipo.value, ...SUGERENCIAS_POR_VEHICULO[tipo.value] } : null;
}

export function SelectorTipoRemolque({
  value,
  onChange,
  tipoVehiculo,
}: {
  value: string;
  onChange: (tipo: string) => void;
  // Tipo de vehículo del acceso: si tiene sugerencias, van primero.
  tipoVehiculo?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const actual = resolverTipoRemolque(value);
  const sugerencia = sugerenciaPorTipoVehiculo(tipoVehiculo);
  const sugeridos = TIPOS_REMOLQUE_SILUETA.filter((t) => sugerencia?.remolques.includes(t.value));
  const otros = TIPOS_REMOLQUE_SILUETA.filter((t) => !sugeridos.includes(t));

  const tarjeta = (t: (typeof TIPOS_REMOLQUE_SILUETA)[number]) => {
    const activo = actual?.value === t.value;
    return (
      <button
        key={t.value}
        type="button"
        onClick={() => elegir(t.value)}
        className={cn(
          "rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-colors",
          activo ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50",
        )}
      >
        <span className="w-full h-12">{t.silueta}</span>
        <span className="text-xs font-semibold leading-tight text-center">
          {t.value}
          {t.detalle && <span className="block text-[10px] font-normal text-gray-400">{t.detalle}</span>}
        </span>
      </button>
    );
  };

  const elegir = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      {/* Registros viejos pueden traer un tipo fuera de la lista: se muestra
          tal cual (sin silueta) para no perderlo hasta que elijan uno. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={value || undefined}
        className={cn(
          "w-full h-9 rounded-md border px-2.5 flex items-center gap-2 text-sm text-left transition-colors",
          value ? "border-input bg-transparent shadow-sm hover:border-blue-300" : "border-dashed border-gray-300 bg-gray-50/60 hover:border-blue-400 hover:bg-blue-50/40",
        )}
      >
        {value ? (
          <>
            {actual && <span className="w-12 h-6 shrink-0">{actual.silueta}</span>}
            <span className="truncate text-gray-800">{value}</span>
            <span className="ml-auto text-[11px] font-semibold text-blue-600 shrink-0">Cambiar</span>
          </>
        ) : (
          <>
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate text-blue-600 font-medium text-xs">Elegir tipo de remolque</span>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tipo de remolque</DialogTitle>
            <DialogDescription>Elige el que más se parezca al remolque que llegó.</DialogDescription>
          </DialogHeader>

          {sugeridos.length > 0 ? (
            <>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sugeridos para {sugerencia?.tipoVehiculo}</p>
              <div className="grid grid-cols-4 gap-3">{sugeridos.map(tarjeta)}</div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Otros</p>
              <div className="grid grid-cols-4 gap-3">{otros.map(tarjeta)}</div>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-3">{otros.map(tarjeta)}</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
