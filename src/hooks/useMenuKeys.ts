import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/useAuthStore";
import { getUserMenuItems } from "@/services/menus-admin";

/**
 * Keys de menú del usuario en sesión (CONFIGURACION_MENUS). Se piden una vez
 * por sesión: sirven para mostrar u ocultar componentes atómicos (una pestaña,
 * un botón), igual que en la app.
 *
 * Ojo: ocultar en el front es solo UX. Lo que de verdad protege es que el
 * script del back solo se comparte a quien tiene la key (key_permits).
 */
export const useMenuKeys = () => {
  const userIdSoter = useAuthStore((s) => s.userIdSoter);

  const { data, isLoading, error } = useQuery<string[]>({
    queryKey: ["myMenuKeys", userIdSoter],
    enabled: !!userIdSoter,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const res = await getUserMenuItems(userIdSoter as number);
      if (!res?.success) throw new Error("Error al obtener los menús del usuario");
      return res.response?.data?.item_keys ?? [];
    },
  });

  const keys = data ?? [];
  return {
    keys,
    /** true mientras no se sabe todavía (sin usuario o cargando). */
    isChecking: !userIdSoter || isLoading,
    error,
    has: (key: string) => keys.includes(key),
  };
};

/** ¿El usuario en sesión tiene esta key? `undefined` mientras se revisa. */
export const useHasMenuKey = (key: string): boolean | undefined => {
  const { isChecking, error, has } = useMenuKeys();
  if (isChecking) return undefined;
  if (error) return false;
  return has(key);
};
