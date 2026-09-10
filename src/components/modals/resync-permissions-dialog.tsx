"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResyncPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isResyncing: boolean;
  onConfirm: () => void;
}

export const ResyncPermissionsDialog: React.FC<ResyncPermissionsDialogProps> = ({
  open,
  onOpenChange,
  isResyncing,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Resincronizar permisos
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Esto vuelve a compartir Formas, Catálogos y Scripts para{" "}
            <strong>todos los usuarios</strong> que ya tienen una asignación de menús
            guardada en esta cuenta, según lo que cada quien ya tiene. Útil cuando hay
            usuarios con permisos desactualizados sin tener que reguardar su asignación
            uno por uno.
          </p>
          <p className="text-sm text-muted-foreground">
            Corre en segundo plano: al confirmar se cierra esta ventana de inmediato y
            puedes seguir usando el sistema. Si hay muchos usuarios puede tardar varios
            minutos en reflejarse.
          </p>

          <div className="flex gap-2 mt-2">
            <DialogClose asChild>
              <Button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isResyncing}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isResyncing}
              onClick={onConfirm}>
              {isResyncing ? (
                <>
                  <Loader2 className="animate-spin" /> Resincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Resincronizar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
