"use client";

import * as React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Selector (data-attr) del boton de la tabla que cambia de log sin cerrar el panel. */
  keepOpenSelector: string;
  children: React.ReactNode;
}

const DEFAULT_WIDTH = 768;

// Panel lateral sin overlay: la tabla sigue clicable, un clic afuera lo cierra
// (salvo sobre el ojito de otra fila, que solo cambia el contenido). El ancho
// se arrastra desde el borde izquierdo o se alterna con el boton de ampliar.
export function ResizableLogSheet({ open, onOpenChange, title, keepOpenSelector, children }: Props) {
  const [width, setWidth] = React.useState(DEFAULT_WIDTH);
  const [maximized, setMaximized] = React.useState(false);

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMaximized(false);
    const onMove = (ev: PointerEvent) =>
      setWidth(Math.min(window.innerWidth, Math.max(420, window.innerWidth - ev.clientX)));
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-none"
        style={{ width: maximized ? "100vw" : width, maxWidth: "100vw" }}
        overlayClassName="hidden"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest(keepOpenSelector)) e.preventDefault();
        }}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <div
          onPointerDown={startResize}
          title="Arrastra para cambiar el tamaño"
          className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/60 z-10"
        />
        <Button
          variant="ghost"
          size="icon"
          title={maximized ? "Restaurar tamaño" : "Ampliar"}
          className="absolute top-2.5 right-11 z-10 h-8 w-8"
          onClick={() => setMaximized((m) => !m)}
        >
          {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
        {children}
      </SheetContent>
    </Sheet>
  );
}
