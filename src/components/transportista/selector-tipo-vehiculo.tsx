"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Tipos de vehículo ────────────────────────────────────────────────────────
// Lista fija en el front por ahora (2610-1323). Se guarda el `value` como
// texto en el mismo campo "Tipo de Vehiculo" de la bitácora, así que la forma
// no cambia. Todavía no decide qué inspección aplica a cada tipo.

// Siluetas de perfil (mirando a la derecha), mismo trazo que los íconos.
export const Rueda = ({ x }: { x: number }) => (
  <>
    <circle cx={x} cy={38} r={5} fill="white" />
    <circle cx={x} cy={38} r={1.5} fill="currentColor" stroke="none" />
  </>
);

const Cabina = ({ x }: { x: number }) => (
  <>
    <path d={`M${x} 34 V12 H${x + 16} L${x + 26} 22 H${x + 32} V34 Z`} />
    <path d={`M${x + 17} 14.5 L${x + 23.5} 21 H${x + 17} Z`} />
  </>
);

export const Silueta = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 128 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="w-full h-full">
    {children}
  </svg>
);

export const Auto = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} V${y - 4} H${x + 4} L${x + 8} ${y - 8} H${x + 18} L${x + 22} ${y - 4} H${x + 26} V${y}`} />
);

export interface TipoVehiculo {
  value: string;
  detalle?: string;
  // Textos que suele leer la IA o escribir alguien, para reconocer el tipo.
  alias: string[];
  silueta: ReactNode;
  // Camiones rígidos y pickup no traen tracto ni caja aparte (junta 14 oct):
  // en la captura se esconden el no. de tracto y la caja rápida.
  rigido?: boolean;
}

export const TIPOS_VEHICULO: TipoVehiculo[] = [
  {
    value: "Tractocamión",
    detalle: "Tráiler",
    alias: ["tractocamion", "tracto", "tractor", "trailer", "quinta rueda", "articulado"],
    silueta: (
      <Silueta>
        <rect x={4} y={8} width={78} height={24} rx={2} />
        <path d="M82 30 H90" />
        <Cabina x={90} />
        <Rueda x={18} /><Rueda x={31} /><Rueda x={100} /><Rueda x={115} />
      </Silueta>
    ),
  },
  {
    value: "Torton",
    rigido: true,
    alias: ["torton"],
    silueta: (
      <Silueta>
        <rect x={6} y={8} width={74} height={26} rx={2} />
        <Cabina x={82} />
        <Rueda x={22} /><Rueda x={35} /><Rueda x={106} />
      </Silueta>
    ),
  },
  {
    value: "Rabón",
    rigido: true,
    alias: ["rabon"],
    silueta: (
      <Silueta>
        <rect x={18} y={10} width={62} height={24} rx={2} />
        <Cabina x={82} />
        <Rueda x={36} /><Rueda x={106} />
      </Silueta>
    ),
  },
  {
    value: "Camioneta 3.5 t",
    rigido: true,
    alias: ["3.5", "3 1/2", "tres y media", "camioneta de carga", "caja seca chica"],
    silueta: (
      <Silueta>
        <rect x={26} y={14} width={54} height={20} rx={2} />
        <path d="M82 34 V16 H95 L104 25 H110 V34 Z" />
        <path d="M96 18.5 L101.5 24 H96 Z" />
        <Rueda x={40} /><Rueda x={100} />
      </Silueta>
    ),
  },
  {
    value: "Pickup",
    rigido: true,
    alias: ["pickup", "pick up", "pick-up", "camioneta"],
    silueta: (
      <Silueta>
        <path d="M18 34 V24 H64 V16 H84 L94 24 H106 Q110 24 110 28 V34 Z" />
        <path d="M68 18.5 H82 L88 24 H68 Z" />
        <Rueda x={34} /><Rueda x={96} />
      </Silueta>
    ),
  },
  {
    value: "Madrina",
    detalle: "Portavehículos",
    alias: ["madrina", "portavehiculos", "porta vehiculos", "nodriza", "autotransporte"],
    silueta: (
      <Silueta>
        <path d="M4 18 H84 M4 32 H84 M6 6 V32 M82 6 V32" />
        <Auto x={10} y={18} /><Auto x={46} y={18} />
        <Auto x={10} y={32} /><Auto x={46} y={32} />
        <path d="M84 30 H90" />
        <Cabina x={90} />
        <Rueda x={18} /><Rueda x={31} /><Rueda x={100} /><Rueda x={115} />
      </Silueta>
    ),
  },
  {
    value: "Pipa",
    alias: ["pipa", "tanque", "cisterna", "autotanque"],
    silueta: (
      <Silueta>
        <rect x={6} y={10} width={76} height={22} rx={11} />
        <path d="M82 30 H90" />
        <Cabina x={90} />
        <Rueda x={20} /><Rueda x={33} /><Rueda x={100} /><Rueda x={115} />
      </Silueta>
    ),
  },
];

const OTRO = "Otro";

const SiluetaOtro = (
  <Silueta>
    <rect x={18} y={10} width={62} height={24} rx={2} strokeDasharray="4 3" />
    <path d="M82 34 V14 H98 L108 24 H114 V34 Z" strokeDasharray="4 3" />
    <path d="M44 18 Q44 14 49 14 Q54 14 54 18 Q54 21 49 22 V25 M49 29 V29.5" />
    <Rueda x={36} /><Rueda x={106} />
  </Silueta>
);

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Tipo de la lista que corresponde a un texto (el guardado o el que leyó la
// IA); null si no se reconoce y debe tratarse como "Otro".
export function resolverTipoVehiculo(texto: string): TipoVehiculo | null {
  const t = normalizar(texto);
  if (!t) return null;
  return TIPOS_VEHICULO.find((tipo) => normalizar(tipo.value) === t)
    ?? TIPOS_VEHICULO.find((tipo) => tipo.alias.some((a) => t.includes(a)))
    ?? null;
}

// Campos que aplican según el tipo de vehículo. Un tipo no reconocido ("Otro"
// o vacío) pide todo, como antes.
export function camposDeVehiculo(texto: string): { tracto: boolean; caja: boolean } {
  const rigido = !!resolverTipoVehiculo(texto)?.rigido;
  return { tracto: !rigido, caja: !rigido };
}

// ─── Galería ──────────────────────────────────────────────────────────────────
// Cuadros con siluetas. La usa el modal del selector y, en línea, la pantalla
// de fotos de Nuevo acceso (2610-1382). `compacta` = 3 columnas y cuadros chicos.

export function GaleriaTipoVehiculo({
  value,
  onChange,
  compacta,
}: {
  value: string;
  onChange: (tipo: string) => void;
  compacta?: boolean;
}) {
  const tipo = resolverTipoVehiculo(value);
  const [otroTexto, setOtroTexto] = useState(value && !tipo ? value : "");
  const [capturandoOtro, setCapturandoOtro] = useState(false);
  const cuadro = cn(
    "rounded-xl border-2 flex flex-col items-center transition-colors",
    compacta ? "p-2 gap-1" : "p-3 gap-2",
  );
  const activoCls = "border-blue-500 bg-blue-50 text-blue-700";
  const inactivoCls = "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50";

  return (
    <div className="space-y-3">
      <div className={cn("grid", compacta ? "grid-cols-3 gap-2" : "grid-cols-4 gap-3")}>
        {TIPOS_VEHICULO.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => { setCapturandoOtro(false); onChange(t.value); }}
            className={cn(cuadro, tipo?.value === t.value ? activoCls : inactivoCls)}
          >
            <span className={cn("w-full", compacta ? "h-8" : "h-12")}>{t.silueta}</span>
            <span className={cn("font-semibold leading-tight text-center", compacta ? "text-[11px]" : "text-xs")}>
              {t.value}
              {t.detalle && !compacta && <span className="block text-[10px] font-normal text-gray-400">{t.detalle}</span>}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCapturandoOtro(true)}
          className={cn(cuadro, (capturandoOtro || (value && !tipo)) ? activoCls : inactivoCls)}
        >
          <span className={cn("w-full", compacta ? "h-8" : "h-12")}>{SiluetaOtro}</span>
          <span className={cn("font-semibold", compacta ? "text-[11px]" : "text-xs")}>{OTRO}</span>
        </button>
      </div>

      {capturandoOtro && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            className="text-sm"
            placeholder="¿Qué tipo de vehículo es?"
            value={otroTexto}
            onChange={(e) => setOtroTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && otroTexto.trim()) { e.preventDefault(); onChange(otroTexto.trim()); } }}
          />
          <button
            type="button"
            disabled={!otroTexto.trim()}
            onClick={() => onChange(otroTexto.trim())}
            className="h-9 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-40"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Selector ─────────────────────────────────────────────────────────────────

export function SelectorTipoVehiculo({
  value,
  onChange,
  aiFilled,
  invalid,
}: {
  value: string;
  onChange: (tipo: string) => void;
  aiFilled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const tipo = resolverTipoVehiculo(value);

  const abrir = () => setOpen(true);

  const elegir = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      {/* Botón que abre la galería en modal (no un select): vacío se ve como
          "Elegir…" con borde punteado; con tipo elegido muestra la silueta y
          "Cambiar". */}
      <button
        type="button"
        onClick={abrir}
        className={cn(
          "w-full h-9 rounded-md border px-2.5 flex items-center gap-2 text-sm text-left transition-colors",
          value ? "border-input bg-transparent shadow-sm hover:border-blue-300" : "border-dashed border-gray-300 bg-gray-50/60 hover:border-blue-400 hover:bg-blue-50/40",
          aiFilled && value && "border-violet-200 bg-violet-50/40",
          invalid && "border-red-300 bg-red-50",
        )}
      >
        {value ? (
          <>
            <span className="w-9 h-5 text-gray-600 shrink-0">{tipo ? tipo.silueta : SiluetaOtro}</span>
            <span className="truncate text-gray-800">{value}</span>
            <span className="ml-auto flex items-center gap-1.5 shrink-0">
              {aiFilled && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> IA
                </span>
              )}
              <span className="text-[11px] font-semibold text-blue-600">Cambiar</span>
            </span>
          </>
        ) : (
          <>
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate text-blue-600 font-medium text-xs">Elegir tipo de vehículo</span>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tipo de vehículo</DialogTitle>
            <DialogDescription>Elige el que más se parezca a la unidad que llegó.</DialogDescription>
          </DialogHeader>

          <GaleriaTipoVehiculo value={value} onChange={elegir} />
        </DialogContent>
      </Dialog>
    </>
  );
}
