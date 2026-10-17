"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Auto, Rueda, Silueta, resolverTipoVehiculo } from "@/components/transportista/selector-tipo-vehiculo";
import type { UnidadConfig } from "@/components/transportista/agregar-unidad-modal";

// ─── Tipos de remolque ────────────────────────────────────────────────────────
// Misma lista que el select anterior (TIPOS_REMOLQUE); se guarda el `value`
// como texto en "tipo_remolque". Mismo patrón que SelectorTipoVehiculo
// (botón + galería en modal), sin la opción "Otro".

// Remolque sin tracto: lanza y patín de apoyo al frente (derecha).
const Enganche = () => <path d="M110 30 H118 M98 32 V40 M95 40 H101" />;

// `contenedor`: el remolque puede llevar un contenedor montado (2610-1382).
export const TIPOS_REMOLQUE_SILUETA: { value: string; silueta: ReactNode; contenedor?: boolean }[] = [
  {
    value: "Caja seca",
    silueta: (
      <Silueta>
        <rect x={6} y={8} width={104} height={24} rx={2} />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Plataforma",
    contenedor: true,
    silueta: (
      <Silueta>
        <rect x={6} y={26} width={104} height={6} rx={1} />
        <path d="M14 26 V20 M40 26 V20 M66 26 V20 M92 26 V20" />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Chasis portacontenedor",
    contenedor: true,
    silueta: (
      <Silueta>
        <rect x={6} y={27} width={92} height={4} rx={1} />
        <path d="M98 31 V24 H110 V31 M10 27 V23 M94 27 V23 M52 27 V24" />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Caja refrigerada",
    silueta: (
      <Silueta>
        <rect x={6} y={8} width={96} height={24} rx={2} />
        <rect x={102} y={11} width={8} height={14} rx={1} />
        <path d="M54 13 V27 M48 16.5 L60 23.5 M48 23.5 L60 16.5" />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Ganadero",
    silueta: (
      <Silueta>
        <rect x={6} y={8} width={104} height={24} rx={2} />
        <path d="M16 13 V19 M26 13 V19 M36 13 V19 M46 13 V19 M56 13 V19 M66 13 V19 M76 13 V19 M86 13 V19 M96 13 V19" />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Basculante",
    silueta: (
      <Silueta>
        <path d="M6 10 H110 L104 32 H14 Z" />
        <Enganche /><Rueda x={24} /><Rueda x={37} />
      </Silueta>
    ),
  },
  {
    value: "Portavehículos",
    silueta: (
      <Silueta>
        <path d="M6 18 H110 M6 32 H110 M8 6 V32 M108 6 V32" />
        <Auto x={14} y={18} /><Auto x={48} y={18} /><Auto x={80} y={18} />
        <Auto x={14} y={32} /><Auto x={48} y={32} /><Auto x={80} y={32} />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
  {
    value: "Caravana",
    silueta: (
      <Silueta>
        <rect x={10} y={8} width={92} height={24} rx={8} />
        <rect x={22} y={13} width={18} height={9} rx={1} />
        <rect x={66} y={13} width={11} height={19} rx={1} />
        <path d="M102 28 L118 32 M98 32 V40 M95 40 H101" />
        <Rueda x={50} />
      </Silueta>
    ),
  },
  {
    value: "Tanque",
    silueta: (
      <Silueta>
        <rect x={6} y={10} width={104} height={22} rx={11} />
        <Enganche /><Rueda x={20} /><Rueda x={33} />
      </Silueta>
    ),
  },
];

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Si el tipo de remolque admite contenedor (plataforma, chasis portacontenedor).
export const remolquePermiteContenedor = (tipo?: string | null): boolean =>
  !!TIPOS_REMOLQUE_SILUETA.find((t) => normalizar(t.value) === normalizar(tipo ?? ""))?.contenedor;

// ─── Sugerencias por tipo de vehículo ─────────────────────────────────────────
// Solo sugieren (ordenan la galería y proponen la configuración de una unidad
// nueva); nunca esconden opciones ni cambian unidades ya capturadas.
// Madrina y Pipa ya implican su remolque, por eso traen uno solo y se
// preselecciona. Torton/Rabón/3.5 t traen caja integrada: arrancan en
// "Solo vehículo".
const SUGERENCIAS_POR_VEHICULO: Record<string, { remolques: string[]; config: UnidadConfig }> = {
  "Tractocamión":    { remolques: ["Caja seca", "Caja refrigerada", "Plataforma", "Chasis portacontenedor", "Basculante", "Ganadero"], config: "solo_remolque" },
  "Madrina":         { remolques: ["Portavehículos"], config: "solo_remolque" },
  "Pipa":            { remolques: ["Tanque"], config: "solo_remolque" },
  "Torton":          { remolques: [], config: "solo_vehiculo" },
  "Rabón":           { remolques: [], config: "solo_vehiculo" },
  "Camioneta 3.5 t": { remolques: [], config: "solo_vehiculo" },
  "Pickup":          { remolques: ["Caravana", "Plataforma"], config: "solo_vehiculo" },
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
  const actual = TIPOS_REMOLQUE_SILUETA.find((t) => normalizar(t.value) === normalizar(value));
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
        <span className="text-xs font-semibold leading-tight text-center">{t.value}</span>
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
        className={cn(
          "w-full h-9 rounded-md border px-2.5 flex items-center gap-2 text-sm text-left transition-colors",
          value ? "border-input bg-transparent shadow-sm hover:border-blue-300" : "border-dashed border-gray-300 bg-gray-50/60 hover:border-blue-400 hover:bg-blue-50/40",
        )}
      >
        {value ? (
          <>
            {actual && <span className="w-9 h-5 text-gray-600 shrink-0">{actual.silueta}</span>}
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
