"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import UbicacionDetalle from "./UbicacionDetalle";

interface UbicacionDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
}

// Panel lateral para ver el detalle de una ubicación sin salir de la lista.
// Es modal: oscurece el fondo y cualquier clic afuera lo cierra.
export function UbicacionDetallePanel({ recordId, onOpenChange }: UbicacionDetallePanelProps) {
  return (
    <Sheet open={!!recordId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-5xl w-full"
        overlayClassName="bg-black/40"
      >
        <SheetTitle className="sr-only">Detalle de la ubicación</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          {recordId && <UbicacionDetalle key={recordId} id={recordId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
