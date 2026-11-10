"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useHasMenuKey } from "@/hooks/useMenuKeys";

interface RequireMenuAccessProps {
  requiredKey: string;
  children: React.ReactNode;
}

/** Protege una página completa: sin la key manda a Inicio. */
export function RequireMenuAccess({ requiredKey, children }: RequireMenuAccessProps) {
  const router = useRouter();
  const allowed = useHasMenuKey(requiredKey);

  useEffect(() => {
    if (allowed === false) {
      toast.error("No tienes acceso a esta sección.");
      router.push("/");
    }
  }, [allowed, router]);

  if (!allowed) {
    return <div className="text-center py-10 text-muted-foreground">Cargando...</div>;
  }

  return <>{children}</>;
}
