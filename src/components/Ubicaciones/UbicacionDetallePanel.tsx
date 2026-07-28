"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import UbicacionDetalle from "./UbicacionDetalle";

interface UbicacionDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
}

// Panel lateral (estilo Notion "page peek") — ver el detalle de una ubicación
// sin salir de la lista. Un clic afuera del panel lo cierra (fila en blanco,
// header, filtros, etc.), EXCEPTO el ícono "Ver" (marcado con
// data-ubicacion-ver en columns.tsx): ese clic no debe cerrar el panel, solo
// cambiar el recordId — así, con `key={recordId}` en UbicacionDetalle, el
// panel se queda abierto y remonta con la info de la nueva ubicación en un
// solo clic, en vez de cerrar y requerir un segundo clic para reabrir.
export function UbicacionDetallePanel({ recordId, onOpenChange }: UbicacionDetallePanelProps) {
  const handleOutsideInteraction = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest?.("[data-ubicacion-ver]")) {
      e.preventDefault();
    }
  };

  return (
    <Sheet open={!!recordId} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-5xl w-full"
        overlayClassName="pointer-events-none bg-transparent"
        onPointerDownOutside={handleOutsideInteraction}
        onInteractOutside={handleOutsideInteraction}
      >
        <SheetTitle className="sr-only">Detalle de la ubicación</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          {recordId && <UbicacionDetalle key={recordId} id={recordId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
