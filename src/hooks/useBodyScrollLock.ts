import { useEffect } from "react";

// Bloquea el scroll del body mientras `active` sea true — evita que se pueda
// hacer scroll en el contenido detrás de un modal fixed/overlay.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
