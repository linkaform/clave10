"use client";

import { useEffect } from "react";

// Esta ruta se migró a src/app/dashboard/registro-ingreso siguiendo las
// convenciones de pase-update (react-hook-form + zod, hooks de react-query,
// modales shadcn) en vez del fetch crudo + SweetAlert2 + QRious anteriores.
// Se deja este redirect para no romper links/QRs ya impresos que apunten aquí.
export default function IngresoRedirectPage() {
  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    window.location.replace(`/dashboard/registro-ingreso${search}`);
  }, []);

  return null;
}
