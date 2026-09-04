"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useAuthStore from "@/store/useAuthStore";
import { useUserMenuAssignment } from "@/hooks/menus-admin/useUserMenuAssignment";

interface RequireMenuAccessProps {
  requiredKey: string;
  children: React.ReactNode;
}

export function RequireMenuAccess({ requiredKey, children }: RequireMenuAccessProps) {
  const router = useRouter();
  const userIdSoter = useAuthStore((state) => state.userIdSoter);
  const { assignedKeys, isLoadingAssignedKeys, errorAssignedKeys } = useUserMenuAssignment(
    userIdSoter ? [userIdSoter] : [],
  );

  const isChecking = !userIdSoter || isLoadingAssignedKeys;
  const isAuthorized = !isChecking && !errorAssignedKeys && assignedKeys.includes(requiredKey);

  useEffect(() => {
    if (isChecking) return;
    if (!isAuthorized) {
      toast.error("No tienes acceso a esta sección.");
      router.push("/");
    }
  }, [isChecking, isAuthorized, router]);

  if (isChecking || !isAuthorized) {
    return <div className="text-center py-10 text-muted-foreground">Cargando...</div>;
  }

  return <>{children}</>;
}
