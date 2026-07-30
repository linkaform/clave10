"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Plus, Trash2, X, Boxes, CheckCircle2, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { MaterialVisita } from "@/hooks/useGetVisitTransportista";
import { saveBitacoraTransportistaRecord } from "@/services/endpoints";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Catálogo basado en las unidades de carga y empaque más comunes en
// transporte terrestre de carga general (lo que sube a un remolque o
// contenedor vía tarima, huacal, tambor, etc.), alineado con los tipos de
// UN/CEFACT Rec. 21 (bag, bale, box, crate, drum, pallet, roll, sack, tote...).
export const TIPOS_UNIDAD_EMPAQUE = [
  "Tarima",
  "Pallet",
  "Huacal / Jaula",
  "Big Bag (Supersaco)",
  "Contenedor IBC (Tote)",
  "Fardo",
  "Rollo / Bobina",
  "Tambor",
  "Barril",
  "Cubeta",
  "Costal",
  "Bulto",
  "Caja",
  "Bolsa",
  "Paquete",
  "Pieza / Unidad",
];

// Qué puede ir dentro de cada tipo: en una tarima o pallet van cajas,
// costales, tambos, barriles, fardos, bobinas, etc.; un huacal puede traer
// cajas o piezas sueltas; una caja puede traer piezas, bolsas o paquetes más
// chicos. Un renglón solo puede elegir un tipo que quepa dentro del tipo del
// renglón anterior — los tipos sin entrada aquí (ej. "Pieza / Unidad",
// "Big Bag" o "Contenedor IBC") son el nivel más chico o ya vienen a granel,
// y no admiten un renglón anidado debajo.
const JERARQUIA_EMPAQUE: Record<string, string[]> = {
  Tarima: ["Caja", "Costal", "Tambor", "Barril", "Cubeta", "Fardo", "Rollo / Bobina", "Bolsa", "Huacal / Jaula", "Bulto"],
  Pallet: ["Caja", "Costal", "Tambor", "Barril", "Cubeta", "Fardo", "Rollo / Bobina", "Bolsa", "Huacal / Jaula", "Bulto"],
  "Huacal / Jaula": ["Caja", "Bolsa", "Pieza / Unidad"],
  Caja: ["Pieza / Unidad", "Bolsa", "Paquete"],
  Paquete: ["Pieza / Unidad"],
  Bolsa: ["Pieza / Unidad"],
  Costal: ["Pieza / Unidad"],
  Tambor: ["Pieza / Unidad"],
  Barril: ["Pieza / Unidad"],
  Cubeta: ["Pieza / Unidad"],
  Fardo: ["Pieza / Unidad"],
  "Rollo / Bobina": ["Pieza / Unidad"],
};

const opcionesHijas = (tipoPadre: string): string[] => JERARQUIA_EMPAQUE[tipoPadre] ?? [];

interface DesgloseRenglon {
  id: string;
  tipo: string;
  cantidad: string;
}

const emptyRenglon = (): DesgloseRenglon => ({
  id: Math.random().toString(36).slice(2),
  tipo: "",
  cantidad: "",
});

interface MaterialDesglose {
  material: MaterialVisita;
  renglones: DesgloseRenglon[];
}

// Un número puede venir acompañado de unidades (ej. "2500 pzas"); se toma solo
// la parte numérica para poder multiplicar y comparar contra la cantidad registrada.
const toNumber = (v: string | null | undefined): number => {
  if (!v) return 0;
  const match = v.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

// Cada renglón anida al anterior: el primero es el total de ese tipo (ej. 10
// tarimas), cada renglón siguiente es "cuántos de este tipo hay por cada uno
// del renglón anterior" (ej. 10 cajas por tarima, 10 piezas por caja). El
// acumulado de un renglón es entonces el producto de todos los anteriores,
// y el último renglón representa el total final (piezas).
const cumulativos = (renglones: DesgloseRenglon[]): (number | null)[] => {
  let acc = 1;
  let incompleto = false;
  return renglones.map((r) => {
    if (incompleto || r.tipo.trim() === "" || r.cantidad.trim() === "") {
      incompleto = true;
      return null;
    }
    acc *= toNumber(r.cantidad);
    return acc;
  });
};

// Select con búsqueda para el tipo de unidad de empaque; las opciones ya
// vienen acotadas por el llamador según el tipo del renglón anterior (lo que
// cabe dentro de una tarima no es lo mismo que lo que cabe dentro de una caja).
function TipoCombobox({
  value,
  onChange,
  opciones,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: string[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex-1 h-9 rounded-lg border border-gray-200 px-2.5 text-xs bg-white flex items-center justify-between gap-1 focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed",
            !value && "text-gray-400",
          )}
        >
          <span className="truncate">{value || placeholder || "Tipo..."}</span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[10000] w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar tipo..." className="text-xs" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs text-gray-400">Sin resultados</CommandEmpty>
            <CommandGroup>
              {opciones.map((t) => (
                <CommandItem
                  key={t}
                  value={t}
                  onSelect={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check className={cn("w-3.5 h-3.5", value === t ? "opacity-100" : "opacity-0")} />
                  {t}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Paso previo a la inspección de materiales: por cada material ya registrado
// en la visita, se arma un desglose de en qué unidades de empaque viene
// (tarimas, cajas, piezas, etc.) para conciliarlo contra la cantidad
// registrada antes de continuar con la inspección física.
export function DesgloseMaterialesModal({
  materiales,
  recordId,
  onClose,
  onContinuar,
  onSaved,
}: {
  materiales: MaterialVisita[];
  recordId: string;
  onClose: () => void;
  onContinuar: () => void;
  onSaved?: () => void;
}) {
  useBodyScrollLock(true);

  const [desglose, setDesglose] = useState<MaterialDesglose[]>(() =>
    materiales.map((m) => ({
      material: m,
      renglones:
        m.desglose.length > 0
          ? m.desglose.map((d) => ({
              id: Math.random().toString(36).slice(2),
              tipo: d.tipo_unidad_empaque ?? "",
              cantidad: d.cantidad ?? "",
            }))
          : [emptyRenglon()],
    })),
  );
  const [saving, setSaving] = useState(false);

  const addRenglon = (matIdx: number) =>
    setDesglose((p) => p.map((d, i) => (i !== matIdx ? d : { ...d, renglones: [...d.renglones, emptyRenglon()] })));

  // Quitar un renglón también quita todo lo que estaba anidado debajo (ej. si
  // se borra "Caja", las "Piezas" que dependían de esa caja dejan de tener sentido).
  const removeRenglon = (matIdx: number, ri: number) =>
    setDesglose((p) => p.map((d, i) => (i !== matIdx ? d : { ...d, renglones: d.renglones.slice(0, ri) })));

  const updateCantidad = (matIdx: number, ri: number, value: string) =>
    setDesglose((p) =>
      p.map((d, i) =>
        i !== matIdx ? d : { ...d, renglones: d.renglones.map((r, idx) => (idx !== ri ? r : { ...r, cantidad: value })) },
      ),
    );

  // Cambiar el tipo de un renglón invalida cualquier renglón anidado debajo
  // (sus opciones dependían del tipo anterior), así que se truncan.
  const updateTipo = (matIdx: number, ri: number, value: string) =>
    setDesglose((p) =>
      p.map((d, i) => {
        if (i !== matIdx || d.renglones[ri].tipo === value) return d;
        const renglones = d.renglones.slice(0, ri + 1);
        renglones[ri] = { ...renglones[ri], tipo: value };
        return { ...d, renglones };
      }),
    );

  // no_referencia_material se liga por posición dentro de materiales (matIdx),
  // no por d.material.no_referencia — ese campo identifica la unidad
  // (contenedor/remolque/vehiculo), no un material único, y puede repetirse.
  const handleGuardar = async () => {
    const payload = desglose.flatMap((d, matIdx) => {
      const cums = cumulativos(d.renglones);
      return d.renglones
        .map((r, ri) => ({ tipo: r.tipo, cantidad: r.cantidad, nivel: ri + 1, cum: cums[ri] }))
        .filter((r) => r.tipo.trim() !== "" && r.cantidad.trim() !== "" && r.cum !== null)
        .map((r) => ({
          no_referencia_material: String(matIdx),
          nivel: r.nivel,
          tipo_unidad_empaque: r.tipo,
          cantidad: r.cantidad,
          cantidad_acumulada: String(r.cum),
        }));
    });

    if (payload.length === 0) {
      onContinuar();
      return;
    }

    setSaving(true);
    try {
      await saveBitacoraTransportistaRecord(recordId, "desglose_empaque", { desglose_empaque: payload });
      toast.success("Desglose de empaque guardado");
      onSaved?.();
      onContinuar();
    } catch {
      toast.error("Error al guardar el desglose de empaque");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Unidad de empaque</p>
              <p className="text-[11px] text-gray-400">Desglosa cómo viene empacado cada material</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {desglose.length === 0 && <p className="text-center text-xs text-gray-300 py-10">Sin materiales registrados</p>}
          {desglose.map((d, matIdx) => {
            const cums = cumulativos(d.renglones);
            const total = cums[cums.length - 1] ?? null;
            const registrada = toNumber(d.material.cantidad);
            const coincide = total !== null && registrada > 0 && total === registrada;
            const ultimoTipo = d.renglones[d.renglones.length - 1]?.tipo;
            const puedeAgregar = d.renglones.length === 0 || (!!ultimoTipo && opcionesHijas(ultimoTipo).length > 0);
            return (
              <div key={matIdx} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{d.material.producto || "Material sin nombre"}</p>
                    {d.material.lote && <p className="text-[10px] text-gray-400">Lote {d.material.lote}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cantidad registrada</p>
                    <p className="text-sm font-bold text-gray-700">{d.material.cantidad || "—"}</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {d.renglones.length === 0 && (
                    <button
                      type="button"
                      onClick={() => addRenglon(matIdx)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar renglón
                    </button>
                  )}
                  {d.renglones.map((r, ri) => {
                    const prevTipo = ri > 0 ? d.renglones[ri - 1].tipo : null;
                    const opciones = ri === 0 ? TIPOS_UNIDAD_EMPAQUE : prevTipo ? opcionesHijas(prevTipo) : [];
                    const esUltimo = ri === d.renglones.length - 1;
                    const cum = cums[ri];
                    return (
                      <div key={r.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TipoCombobox
                            value={r.tipo}
                            onChange={(v) => updateTipo(matIdx, ri, v)}
                            opciones={opciones}
                            disabled={ri > 0 && !prevTipo}
                            placeholder={ri > 0 && !prevTipo ? "Elige el renglón anterior" : "Tipo..."}
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Cantidad"
                            value={r.cantidad}
                            onChange={(e) => updateCantidad(matIdx, ri, e.target.value)}
                            className="w-28 h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400"
                          />
                          <button
                            type="button"
                            disabled={esUltimo && !puedeAgregar}
                            onClick={() => addRenglon(matIdx)}
                            title={esUltimo && !puedeAgregar ? "Este tipo no admite un nivel anidado debajo" : undefined}
                            className="w-7 h-7 rounded-lg border border-gray-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRenglon(matIdx, ri)}
                            className="w-7 h-7 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-0.5">
                          {ri === 0
                            ? `Cantidad total de ${r.tipo || "este tipo"}`
                            : `${r.tipo || "unidades"} por cada ${prevTipo || "unidad anterior"}`}
                          {cum !== null && ri > 0 && (
                            <span className="ml-1.5 font-semibold text-gray-500">→ {cum} en total</span>
                          )}
                        </p>
                      </div>
                    );
                  })}

                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 mt-2",
                      total === null || registrada === 0 ? "bg-gray-50" : coincide ? "bg-green-50" : "bg-amber-50",
                    )}
                  >
                    <span className="text-[11px] font-semibold text-gray-500">Total desglosado</span>
                    <div className="flex items-center gap-1.5">
                      {total !== null &&
                        registrada > 0 &&
                        (coincide ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ))}
                      <span
                        className={cn(
                          "text-xs font-bold",
                          total === null || registrada === 0 ? "text-gray-500" : coincide ? "text-green-700" : "text-amber-700",
                        )}
                      >
                        {total === null ? "Incompleto" : total}
                        {total !== null && registrada > 0 && ` / ${registrada}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar y continuar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
