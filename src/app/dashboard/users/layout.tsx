import { MainLayout } from "@/components/Layout/MainLayout";
import { Metadata } from "next";
import { RequireMenuAccess } from "@/components/menus-admin/require-menu-access";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default function AdminUsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <RequireMenuAccess requiredKey="admin_users">
        {children}
      </RequireMenuAccess>
    </MainLayout>
  );
}
