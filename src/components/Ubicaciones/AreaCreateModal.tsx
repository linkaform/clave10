"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Nueva área en {ubicacion}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-nombre">Nombre *</Label>
            <Input
              id="area-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Bodega Norte"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de área *</Label>
            <Select value={tipoDeArea || undefined} onValueChange={setTipoDeArea}>
              <SelectTrigger className="w-full">
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

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !nombre.trim() || !tipoDeArea}>
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
