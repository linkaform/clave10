"use client";

import { Suspense } from "react";
import { ContratistasShell } from "./ContratistasShell";

/** Página de Contratistas: el modo y la pestaña salen de la URL (F0-03). */
export function ContratistasPage() {
  return (
    <Suspense fallback={null}>
      <ContratistasShell />
    </Suspense>
  );
}
