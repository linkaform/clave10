import { isTokenExpired } from "@/lib/utils";
import { renewJwt } from "@/lib/login/get-login";
import useAuthStore from "@/store/useAuthStore";

let renewPromise: Promise<string | null> | null = null;

export const getValidToken = async (): Promise<string | null> => {
  const userJwt = localStorage.getItem("access_token") || "";

  if (!userJwt) return null;

  if (!isTokenExpired(userJwt)) return userJwt;

  // evita renovaciones duplicadas si varias peticiones detectan expiración a la vez
  if (!renewPromise) {
    renewPromise = renewJwt(userJwt)
      .then((result) => {
        if (result?.success && result.jwt) {
          useAuthStore.getState().setToken(result.jwt);
          return result.jwt;
        }
        useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        renewPromise = null;
      });
  }

  return renewPromise;
};