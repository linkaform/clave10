import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración de Menús",
};

export default function AdminMenusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
