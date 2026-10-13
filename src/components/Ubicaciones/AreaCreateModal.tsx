"use client";

import * as React from "react";
import { Layers, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateArea } from "@/hooks/Areas/useCreateArea";

interface AreaCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ubicacion: string;
}

export function AreaCreateModal({ open, onOpenChange, ubicacion }: AreaCreateModalProps) {
  const { tiposDeArea, handleCreateArea, isCreating } = useCreateArea();
  const [nombre, setNombre] = React.useState("");
  const [tipoDeArea, setTipoDeArea] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNombre("");
      setTipoDeArea("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!nombre.trim() || !tipoDeArea) return;
    const ok = await handleCreateArea({ ubicacion, nombre, tipo_de_area: tipoDeArea });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            Nueva área
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            Registra un área nueva en {ubicacion}
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información general</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="area-nombre" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nombre *
              </Label>
              <Input
                id="area-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bodega Norte"
                className="bg-white border-gray-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tipo de área *
              </Label>
              <Select value={tipoDeArea || undefined} onValueChange={setTipoDeArea}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDeArea.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            onClick={handleSubmit}
            disabled={isCreating || !nombre.trim() || !tipoDeArea}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Crear área"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
