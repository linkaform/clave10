"use client";

import { Header } from "@/components/navigation/header";
import useAuthStore from "@/store/useAuthStore";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMenus } from "@/hooks/useGetMenus";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";

export default function Menus() {
  const queryClient = useQueryClient();
  const { logout, userPhoto, userNameSoter, userEmailSoter } = useAuthStore();
  const { clearMenu } = useMenuStore();
  const { menuConfig } = useGetMenus();
  const { clearSelectedLocations } = useSelectedLocationsStore();

  const handleLogout = () => {
    queryClient.removeQueries({ queryKey: ["getMenu"] });
    queryClient.removeQueries({ queryKey: ["getMenus"] });
    clearMenu();
    clearSelectedLocations();
    logout(queryClient);
  };

  return (
    <Header
      menuConfig={menuConfig ?? { modules: [] }}
      user={{
        name: userNameSoter || "Usuario",
        email: userEmailSoter || "usuario@empresa.com",
        avatar: userPhoto || undefined,
      }}
      onLogout={handleLogout}
    />
  );
}
