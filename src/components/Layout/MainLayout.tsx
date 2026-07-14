/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { isTokenExpired } from "@/lib/utils";
import Menus from "../menus";
import { renewJwt } from "@/lib/login/get-login";
import { getValidToken } from "@/lib/login/get-valid-token";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, logout, setToken } = useAuthStore();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true); 

  useEffect(() => {
    const checkAndRenewToken = async () => {
      const userJwt = await getValidToken()|| "";

      if (userJwt === "") {
        logout();
        setCheckingAuth(false); 
        return;
      }

      if (isTokenExpired(userJwt)) {

        const result = await renewJwt(userJwt);
        if (result?.success && result.jwt) {
          setToken(result.jwt);

        } else {
          logout();
        }
      }

      setCheckingAuth(false); 
    };

    checkAndRenewToken();
  }, []);

  useEffect(() => {
    if (!checkingAuth && !isAuth) { 
      router.push("/auth/login");
    }
  }, [checkingAuth, isAuth, router]);

  if (checkingAuth) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <Menus />
      <main>{children}</main>
    </div>
  );
};