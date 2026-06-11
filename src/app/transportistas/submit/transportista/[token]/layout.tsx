"use client";

import React, { Suspense } from "react";
import useAuthStore from "@/store/useAuthStore";
import Menus from "@/components/menus";

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuth && <Menus />}
      <Suspense>{children}</Suspense>
    </div>
  );
}
