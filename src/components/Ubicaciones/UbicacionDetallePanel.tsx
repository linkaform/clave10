"use client";

import * as React from "react";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import UbicacionDetalle, { UbicacionTab } from "./UbicacionDetalle";

interface UbicacionDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Tab con el que abre el detalle (default "generales"). */
  initialTab?: UbicacionTab;
}

// Panel lateral para ver el detalle de una ubicación sin salir de la lista.
// Mismo componente que Scripts: sin overlay, redimensionable y con ampliar.
export function UbicacionDetallePanel({ recordId, onOpenChange, initialTab = "generales" }: UbicacionDetallePanelProps) {
  return (
    <ResizableLogSheet
      open={!!recordId}
      onOpenChange={onOpenChange}
      title="Detalle de la ubicación"
      keepOpenSelector="[data-ubicacion-eye]"
    >
      <div className="flex-1 overflow-y-auto">
        {recordId && (
          <UbicacionDetalle
            key={`${recordId}-${initialTab}`}
            id={recordId}
            initialTab={initialTab}
            onClose={() => onOpenChange(false)}
          />
        )}
      </div>
    </ResizableLogSheet>
  );
}
