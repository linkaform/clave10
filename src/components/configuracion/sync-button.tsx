"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncOffline } from "@/lib/configuracion/sync-offline";

export const SyncButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await syncOffline();
      const status = data?.status_code ?? data?.response?.status_code;
      if (status && status >= 400) {
        toast.error(data?.msg ?? data?.response?.msg ?? "Error al sincronizar.");
      } else {
        toast.success("Sincronización completada.");
      }
    } catch {
      toast.error("No se pudo sincronizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={loading} className="gap-2">
      <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
      {loading ? "Sincronizando..." : "Sync"}
    </Button>
  );
};
