"use client";

import { Loader2, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MigrateLegacyMenusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userCount: number;
  isMigrating: boolean;
  onConfirm: () => void;
}

export const MigrateLegacyMenusDialog: React.FC<MigrateLegacyMenusDialogProps> = ({
  open,
  onOpenChange,
  userCount,
  isMigrating,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Migrar usuarios legacy
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Esto crea el registro de <strong>CONFIGURACION_MENUS</strong> para{" "}
            <strong>
              {userCount} usuario{userCount === 1 ? "" : "s"}
            </strong>{" "}
            que hoy solo tienen su configuración en la forma legacy (Configuración
            Accesos), traduciendo sus grupos de permisos legacy a las keys nuevas del
            catálogo de menús.
          </p>
          <p className="text-sm text-muted-foreground">
            Corre en segundo plano: al confirmar se cierra esta ventana de inmediato y
            la lista se actualiza sola al terminar.
          </p>

          <div className="flex gap-2 mt-2">
            <DialogClose asChild>
              <Button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isMigrating}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isMigrating || userCount === 0}
              onClick={onConfirm}>
              {isMigrating ? (
                <>
                  <Loader2 className="animate-spin" /> Migrando...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={16} /> Migrar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
