"use client";

import React from "react";

// Sección del panel de filtros: separador, título y contador opcional
export const Seccion = ({ titulo, cnt, children }: { titulo: string; cnt?: number; children: React.ReactNode }) => (
  <div className="border-t border-c10-sunken py-3.5">
    <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-c10-label">
      {titulo}
      {!!cnt && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-button-primary px-[5px] text-[11px] font-bold text-white">{cnt}</span>}
    </div>
    {children}
  </div>
);
