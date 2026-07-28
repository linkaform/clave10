"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import UbicacionDetalle from "./UbicacionDetalle";

interface UbicacionDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
  allowOutsideRef?: React.RefObject<HTMLElement | null>;
}

// Panel lateral (estilo Notion "page peek"), espejo de AreaDetallePanel — ver
// el detalle de una ubicación sin salir de la lista.
export function UbicacionDetallePanel({ recordId, onOpenChange, allowOutsideRef }: UbicacionDetallePanelProps) {
  const handleOutsideInteraction = (e: Event) => {
    const target = e.target as Node | null;
    if (target && allowOutsideRef?.current?.contains(target)) {
      e.preventDefault();
    }
  };

  return (
    <Sheet open={!!recordId} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-3xl w-full"
        overlayClassName="pointer-events-none bg-transparent"
        onPointerDownOutside={handleOutsideInteraction}
        onInteractOutside={handleOutsideInteraction}
      >
        <SheetTitle className="sr-only">Detalle de la ubicación</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          {recordId && <UbicacionDetalle id={recordId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
