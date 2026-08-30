import { PaseLayout } from "@/components/Layout/PaseLayout";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Invitación de contratista",
};

// Este archivo es lo unico que hace publica la pagina: envuelve en PaseLayout
// (que solo pinta HeaderPase, sin checar auth) en vez de MainLayout, que hace
// router.push("/auth/login"). No hay middleware.ts ni dashboard/layout.tsx raiz,
// asi que la eleccion del layout ES el control de acceso de la ruta.
// Mismo mecanismo que dashboard/pase-update y dashboard/reset.
export default function InvitacionContratistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="icon" href="/pases.svg" type="image/svg+xml" />
      <PaseLayout>{children}</PaseLayout>
    </>
  );
}
