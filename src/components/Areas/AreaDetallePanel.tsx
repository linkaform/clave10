"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import AreaDetalle from "./AreaDetalle";

interface AreaDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
  allowOutsideRef?: React.RefObject<HTMLElement | null>;
}

// Panel lateral (estilo Notion "page peek") para ver el detalle de un área
// sin salir de la lista. Los clics dentro de `allowOutsideRef` (la grilla de
// áreas) no cierran el panel -- dejan que la tarjeta clickeada cambie el área
// seleccionada. Cualquier otro clic afuera (filtros, header, fondo) sí cierra.
export function AreaDetallePanel({ recordId, onOpenChange, allowOutsideRef }: AreaDetallePanelProps) {
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
        <SheetTitle className="sr-only">Detalle del área</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          {recordId && <AreaDetalle id={recordId} onClose={() => onOpenChange(false)} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
