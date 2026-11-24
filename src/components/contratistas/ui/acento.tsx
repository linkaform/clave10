"use client";
// Lo que se pinta en un portal (modales, panel de detalle) sale del contenedor con
// data-c10-acc que pone F0-03 y perdería el acento del modo. El ancla queda en el árbol
// y, al abrir, lee el acento de la pantalla para ponerlo en el portal.
import { useLayoutEffect, useRef, useState } from "react";

export function useAcentoPortal(abierto: boolean) {
  const ancla = useRef<HTMLSpanElement>(null);
  const [acento, setAcento] = useState<string>();
  useLayoutEffect(() => {
    if (abierto) setAcento(ancla.current?.closest("[data-c10-acc]")?.getAttribute("data-c10-acc") ?? undefined);
  }, [abierto]);
  return { ancla: <span ref={ancla} hidden />, acento };
}
