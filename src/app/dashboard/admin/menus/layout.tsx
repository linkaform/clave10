import { MainLayout } from "@/components/Layout/MainLayout";
import { Metadata } from "next";
import { RequireMenuAccess } from "@/components/menus-admin/require-menu-access";

export const metadata: Metadata = {
  title: "Configuración de Menús",
};

export default function AdminMenusLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <RequireMenuAccess requiredKey="admin_menus">{children}</RequireMenuAccess>
    </MainLayout>
  );
}
