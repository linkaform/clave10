import { getMenus } from "@/services/endpoints";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MenuConfig } from "@/types/menu-types";
import { useMenuStore } from "@/store/useGetMenuStore";

export const useGetMenus = () => {
  const { menuConfig, setMenuConfig } = useMenuStore();

  const { isLoading, isFetching, error, refetch } = useQuery<MenuConfig | null>({
    queryKey: ["getMenus"],
    enabled: !menuConfig,
    queryFn: async () => {
      const data = await getMenus();

      const hasError = !data?.success || data?.response?.data?.status_code === 400;
      if (hasError) {
        toast.error("Error al obtener menús");
        return null;
      }

      const config: MenuConfig = data.response?.data ?? null;
      if (config) setMenuConfig(config);
      return config;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  return { menuConfig, isLoading, isFetching, error, refetch };
};
