"use client";

import React, { Suspense, useState, useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";
import Menus from "@/components/menus";

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {mounted && isAuth && <Menus />}
      <Suspense>{children}</Suspense>
    </div>
  );
}
