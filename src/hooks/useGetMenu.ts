import { getMenu } from "@/lib/login/get-menu";
import { buildHomeMenuCards } from "@/config/home-menu-cards";
import { useGetMenus } from "@/hooks/useGetMenus";
import { useMenuStore } from "@/store/useGetMenuStore";
import useAuthStore from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useGetMenu = () => {
  const {
    menuItems,
    setLabels,
    labels,
    setMenuItems,
    setExcludes,
    setGrupoRequisitos,
    grupoRequisitos,
  } = useMenuStore();

  // exclude_inputs / requisitos siguen viniendo de "Configuracion Accesos":
  // son personalización de pases (CONF_MODULO_SEGURIDAD), no tienen relación
  // con qué menús ve el usuario.
  useQuery<any>({
    queryKey: ["getMenu"],
    queryFn: async () => {
      const data = await getMenu();
      if (!data.response?.data) {
        return null;
      }

      setExcludes(data.response.data.exclude_inputs);
      setGrupoRequisitos(data.response.data.requisitos || []);

      if (data.response.data.new_user_username) {
        useAuthStore.getState().setNewUserUsername(data.response.data.new_user_username);
      }

      return data.response.data;
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  // Las tarjetas del home salen del mismo catálogo/mega menú que ya
  // consume el navbar (useGetMenus → menuConfig), no de un permiso aparte.
  const {
    menuConfig,
    isLoading: isLoadingMenu,
    error: errorMenu,
    refetch: refetfchMenu,
  } = useGetMenus();

  useEffect(() => {
    if (!menuConfig) return;
    const cards = buildHomeMenuCards(menuConfig);
    setMenuItems(cards);
    setLabels(cards.map((card) => card.id));
  }, [menuConfig, setMenuItems, setLabels]);

  return {
    menuItems,
    labels,
    isLoadingMenu,
    errorMenu,
    refetfchMenu,
    grupoRequisitos,
  };
};