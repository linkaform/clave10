import { BasicLayout } from "@/components/Layout/BasicLayout";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Reporte de artículos concesionados",
};

export default function ReporteConcesionadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="icon" href="/accesos.svg" type="image/svg+xml" />
      <BasicLayout>{children}</BasicLayout>
    </>
  );
}
