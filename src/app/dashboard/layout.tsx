"use client";

import { MainLayout } from "@/components/Layout/MainLayout";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}