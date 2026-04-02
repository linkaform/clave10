"use client";

import { Header } from "@/components/navigation/header";
import useAuthStore from "@/store/useAuthStore";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useQueryClient } from "@tanstack/react-query";
import { menuStructure } from "@/config/menu-config";
import { filterMenuByPermissions } from "@/utils/filterMenuByPermissions";

export default function Menus() {
  const queryClient = useQueryClient();
  const { logout, userPhoto, userNameSoter, userEmailSoter } = useAuthStore();
  const { labels, clearMenu } = useMenuStore();
  const visibleMenu = filterMenuByPermissions(menuStructure, labels);

  const handleLogout = () => {
    queryClient.removeQueries({ queryKey: ["getMenu"] });
    clearMenu();
    logout(queryClient);
  };

  return (
    <Header
      menuConfig={visibleMenu}
      user={{
        name: userNameSoter || "Usuario",
        email: userEmailSoter || "usuario@empresa.com",
        avatar: userPhoto || undefined,
      }}
      onLogout={handleLogout}
    />
  );
}
