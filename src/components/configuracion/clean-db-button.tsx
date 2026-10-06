"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cleanDb } from "@/lib/configuracion/clean-db";

export const CleanDbButton = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClean = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const data = await cleanDb();
      const payload = data?.response ?? data;
      if (payload?.data?.deleted !== undefined) {
        toast.success(
          `${payload.data.deleted} registros eliminados, ${payload.data.purged} purgados.`,
        );
      } else if (payload?.status_code && payload.status_code >= 400) {
        toast.error(payload?.msg ?? "Error al limpiar la base.");
      } else {
        toast.info(payload?.msg ?? "Limpieza completada.");
      }
    } catch {
      toast.error("No se pudo limpiar la base.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="gap-2">
        <Trash2 className="w-4 h-4" />
        {loading ? "Limpiando..." : "Clean DB"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpiar base de datos</DialogTitle>
            <DialogDescription>
              Se eliminarán de CouchDB todos los registros con estatus
              &quot;received&quot; y se purgarán los registros ya eliminados.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClean}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
