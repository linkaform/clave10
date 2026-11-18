"use client";

import React, { useEffect, useRef, useState } from "react";

// Contenedor con scroll horizontal: si queda contenido a la derecha, se difumina el borde (como el diseño)
export const ScrollBox = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const up = () => setMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 2);
    up();
    el.addEventListener("scroll", up, { passive: true });
    const ro = new ResizeObserver(up);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => { el.removeEventListener("scroll", up); ro.disconnect(); };
  }, []);
  const mask = "linear-gradient(to left, transparent 0, #000 64px)";
  return (
    <div ref={ref} className={`overflow-x-auto ${className}`} style={{ ...style, ...(more ? { maskImage: mask, WebkitMaskImage: mask } : {}) }}>
      {children}
    </div>
  );
};
