/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { isTokenExpired } from "@/lib/utils";
import Menus from "../menus";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore();
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    const userJwt = localStorage.getItem("access_token") || "";
    if (isTokenExpired(userJwt) || userJwt == "") {
      logout();
    }
  }, []);

  useEffect(() => {
    if (!isAuth) {
      router.push("/auth/login");
    }
  }, [isAuth, router]);

  return (
    <div>
      <Menus />
      <main>{children}</main>
    </div>
  );
};
