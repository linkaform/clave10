import { MainLayout } from "@/components/Layout/MainLayout";
import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "Ver Recorrido",
}

export default function VerRecorridoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="icon" href="/rondines.svg" type="image/svg+xml" />
      <MainLayout>{children}</MainLayout>
      {/* {children} */}
    </>
  );
}