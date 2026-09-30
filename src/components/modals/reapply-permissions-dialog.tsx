"use client";

import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReapplyPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userCount: number;
  faltantes: number;
  sobrantes: number;
  isReapplying: boolean;
  onConfirm: () => void;
}

export const ReapplyPermissionsDialog: React.FC<ReapplyPermissionsDialogProps> = ({
  open,
  onOpenChange,
  userCount,
  faltantes,
  sobrantes,
  isReapplying,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Reaplicar permisos
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Se volverán a compartir las Formas, Catálogos y Scripts que piden los menús de{" "}
            <strong>{userCount} usuario(s)</strong>, sin cambiar sus menús asignados.
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>
              Se compartirán <strong>{faltantes}</strong> permiso(s) que les faltan.
            </li>
            {sobrantes > 0 && (
              <li className="text-amber-700">
                Se quitarán <strong>{sobrantes}</strong> permiso(s) compartidos que sus menús ya
                no piden.
              </li>
            )}
          </ul>

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" disabled={isReapplying}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onConfirm}
              disabled={isReapplying}>
              {isReapplying ? <Loader2 className="animate-spin" /> : <ShieldCheck size={16} />}
              {isReapplying ? "Reaplicando..." : "Reaplicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
