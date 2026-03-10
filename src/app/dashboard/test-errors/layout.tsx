import { BasicLayout } from "@/components/Layout/BasicLayout"
import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "Turnos",
}

export default function TestErrorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Favicon directamente */}
      <link rel="icon" href="/turnos.svg" type="image/svg+xml" />
      
      {/* Layout principal */}
      <BasicLayout>{children}</BasicLayout>
    </>
  );
}