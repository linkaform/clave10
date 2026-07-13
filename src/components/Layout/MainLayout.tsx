/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { isTokenExpired } from "@/lib/utils";
import Menus from "../menus";
import { renewJwt } from "@/lib/login/get-login";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore();
  const router = useRouter();
  const { logout , setToken} = useAuthStore();

  useEffect(() => {
    const checkAndRenewToken = async () => {
     const userJwt = localStorage.getItem("access_token") || "";

     if (userJwt === "") {
       logout();
       return;
     }

     if (isTokenExpired(userJwt)) {
       const result = await renewJwt(userJwt);
          if (result?.success && result.jwt) {
            useAuthStore.getState().setToken?.(result.jwt);
            setToken(result.jwt);
          } else {
            logout();
          }
     }
   };

   checkAndRenewToken();
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
