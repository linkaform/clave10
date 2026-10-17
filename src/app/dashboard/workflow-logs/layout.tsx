import { MainLayout } from "@/components/Layout/MainLayout";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Logs de workflows",
};

export default function WorkflowLogsLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
