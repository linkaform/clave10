"use client";

import React, { useEffect, useRef, useState } from "react";

// Panel de filtros que se abre y se cierra suave (250 ms) en lugar de aparecer de golpe.
// En línea anima el ancho; en modo flotante (pantalla angosta) se desliza desde la izquierda.
const FX = { duration: 250, easing: "ease-in-out" };
export const PanelAnim = ({ open, gap = 16, children }: { open: boolean; gap?: number; children: React.ReactNode }) => {
  const [show, setShow] = useState(open);
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const aside = () => ref.current?.querySelector("aside") as HTMLElement | null;

  useEffect(() => {
    if (open) { setShow(true); return; }
    const el = aside();
    if (!el) { setShow(false); return; }
    const cs = getComputedStyle(el);
    const a = cs.position === "fixed"
      ? el.animate([{ transform: "none" }, { transform: "translateX(-100%)" }], { ...FX, fill: "forwards" })
      : (el.style.overflow = "hidden", el.animate([
          { width: cs.width, minWidth: "0px", paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, marginRight: "0px", opacity: 1 },
          { opacity: 0, offset: 0.4 },
          { width: "0px", minWidth: "0px", paddingLeft: "0px", paddingRight: "0px", marginRight: `${-gap}px`, opacity: 0 },
        ], { ...FX, fill: "forwards" }));
    a.onfinish = () => setShow(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Sin animación al cargar la página; solo cuando el usuario lo abre
    if (!mounted.current) { mounted.current = true; return; }
    if (!show || !open) return;
    const el = aside();
    if (!el) return;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") {
      el.animate([{ transform: "translateX(-100%)" }, { transform: "none" }], FX);
      return;
    }
    const ov = el.style.overflow;
    el.style.overflow = "hidden";
    el.animate([
      { width: "0px", minWidth: "0px", paddingLeft: "0px", paddingRight: "0px", marginRight: `${-gap}px`, opacity: 0 },
      { opacity: 0, offset: 0.45 },
      { width: cs.width, minWidth: "0px", paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, marginRight: "0px", opacity: 1 },
    ], FX).onfinish = () => { el.style.overflow = ov; };
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return show ? <div ref={ref} className="contents">{children}</div> : null;
};
