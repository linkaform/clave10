import { MainLayout } from "@/components/Layout/MainLayout";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Bitácoras Transportistas",
};

export default function BitacorasTransportistasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="icon" href="/accesos.svg" type="image/svg+xml" />
      <MainLayout>{children}</MainLayout>
    </>
  );
}
