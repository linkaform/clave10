"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HorarioItem {
  hora: string;
  count: number;
  nivel: string;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const NIVEL_LABEL: Record<string, string> = {
  sin_concurrencia: "Sin concurrencia",
  poco_concurrido:  "Poco concurrido",
  concurrido:       "Concurrido",
  muy_concurrido:   "Muy concurrido",
};

const X_LABELS: Record<number, string> = {
  0: "12a", 3: "3a", 6: "6a", 9: "9a", 12: "12p", 15: "3p", 18: "6p", 21: "9p",
};

const BAR_HEIGHT = 52;

function parseSlot(slot: string): { start: number; end: number } {
  const [from, to] = slot.split("-");
  const start = parseInt(from.split(":")[0], 10);
  const end = parseInt(to.split(":")[0], 10);
  return { start, end: end === 0 ? 24 : end };
}

function slotForHour(hour: number, slots: string[]): string | null {
  for (const slot of slots) {
    const { start, end } = parseSlot(slot);
    if (hour >= start && hour < end) return slot;
  }
  return null;
}

interface Props {
  horarios: HorarioItem[];
  diaIndex: number;
  onDiaChange: (index: number) => void;
  isLoading?: boolean;
  slots?: string[];
  selectedSlot?: string;
  onSlotSelect?: (slot: string) => void;
}

export function HorariosConcurrenciaChart({
  horarios,
  diaIndex,
  onDiaChange,
  isLoading = false,
  slots = [],
  selectedSlot = "",
  onSlotSelect,
}: Props) {
  const [hovered, setHovered] = useState<HorarioItem | null>(null);

  const maxCount = Math.max(...horarios.map((h) => h.count), 1);

  const nivelActual = hovered
    ? NIVEL_LABEL[hovered.nivel] ?? hovered.nivel
    : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-700">Horarios de mayor concurrencia</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDiaChange((diaIndex - 1 + DIAS.length) % DIAS.length)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium text-gray-700 w-16 text-center">{DIAS[diaIndex]}</span>
          <button
            type="button"
            onClick={() => onDiaChange((diaIndex + 1) % DIAS.length)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nivel label */}
      <p className={cn(
        "text-[10px] mb-3 transition-opacity",
        nivelActual ? "text-gray-500 opacity-100" : "opacity-0"
      )}>
        {nivelActual ?? "—"}
      </p>

      {/* Barras */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
            <span className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="flex items-end gap-px" style={{ height: BAR_HEIGHT }}>
          {horarios.map((item) => {
            const barH = item.count === 0
              ? 4
              : Math.max(8, Math.round((item.count / maxCount) * BAR_HEIGHT));

            const hour = parseInt(item.hora.split(":")[0], 10);
            const slot = slots.length > 0 ? slotForHour(hour, slots) : null;
            const isSelected = !!slot && slot === selectedSlot;
            const isInSlot = !!slot;
            const isClickable = isInSlot && !!onSlotSelect;

            return (
              <div
                key={item.hora}
                className={cn(
                  "relative flex-1 flex items-end group",
                  isClickable ? "cursor-pointer" : "cursor-default",
                )}
                style={{ height: BAR_HEIGHT }}
                onClick={() => { if (slot && onSlotSelect) onSlotSelect(slot); }}
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className={cn(
                    "w-full rounded-t-[2px] transition-colors",
                    slots.length === 0
                      ? "bg-teal-500 group-hover:bg-teal-600"
                      : isSelected
                        ? "bg-blue-500 group-hover:bg-blue-600"
                        : isInSlot
                          ? "bg-teal-500 group-hover:bg-teal-600"
                          : "bg-gray-200 group-hover:bg-gray-300",
                  )}
                  style={{ height: barH }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                    {slot ? slot : item.hora}
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-800 rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Eje X */}
        <div className="flex mt-1.5">
          {horarios.map((item) => {
            const hour = parseInt(item.hora.split(":")[0], 10);
            const label = X_LABELS[hour];
            return (
              <div key={item.hora} className="flex-1 text-center">
                {label && (
                  <span className="text-[9px] text-gray-400">{label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
