"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Printer } from "lucide-react";

interface PrintRondinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rondines?: any[];
}

export const PrintRondinModal: React.FC<PrintRondinModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white rounded-2xl border-0 shadow-xl">
        <DialogTitle className="flex items-center gap-2 text-slate-700">
          <Printer className="w-5 h-5 text-blue-500" />
          Imprimir Rondines
        </DialogTitle>
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
          <Printer className="w-10 h-10 text-slate-200" />
          <span className="text-base font-medium">PENDIENTE: AGREGAR PDF </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};