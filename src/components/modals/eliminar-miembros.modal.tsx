'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface EliminarMiembroModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onEliminar: () => void;
}

const EliminarMiembroModal: React.FC<EliminarMiembroModalProps> = ({ open, setOpen, onEliminar }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl p-6 border-none" aria-describedby="">
        <DialogTitle className="text-center text-lg font-bold text-gray-800 mb-2">¿Eliminar Miembro?</DialogTitle>
        <p className="text-center text-sm text-gray-400 mb-6">Una vez confirmada, la acción no se podrá deshacer.</p>
        <div className="flex gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-600">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={onEliminar}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EliminarMiembroModal;