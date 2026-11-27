import { BasicLayout } from "@/components/Layout/BasicLayout";
import React from "react";

export const metadata = {
  title: "Registro",
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return <BasicLayout>{children}</BasicLayout>;
}
