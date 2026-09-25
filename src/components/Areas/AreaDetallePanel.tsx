"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import AreaDetalle from "./AreaDetalle";

interface AreaDetallePanelProps {
  recordId: string | null;
  onOpenChange: (open: boolean) => void;
}

// Panel lateral para ver el detalle de un área sin salir de la lista. Es
// modal: oscurece el fondo y cualquier clic afuera (incluida la grilla) lo
// cierra.
export function AreaDetallePanel({ recordId, onOpenChange }: AreaDetallePanelProps) {
  return (
    <Sheet open={!!recordId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-3xl w-full"
        overlayClassName="bg-black/40"
      >
        <SheetTitle className="sr-only">Detalle del área</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          {recordId && <AreaDetalle id={recordId} onClose={() => onOpenChange(false)} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
