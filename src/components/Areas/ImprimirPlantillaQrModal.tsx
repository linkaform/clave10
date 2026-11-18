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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateImpresionQr } from "@/hooks/Areas/useCreateImpresionQr";
import { usePlantillasImpresionQr } from "@/hooks/Areas/usePlantillasImpresionQr";

// Valor del selector para la plantilla por defecto de la forma Impresión de QR
// (se pide el PDF sin template_id). Las demás opciones son los ids de plantilla
// de la cuenta, que regresa el back.
const PLANTILLA_DEFAULT = "default";

interface ImprimirPlantillaQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImprimirPlantillaQrModal = ({ open, onOpenChange }: ImprimirPlantillaQrModalProps) => {
  const [paginas, setPaginas] = React.useState("1");
  const [plantilla, setPlantilla] = React.useState(PLANTILLA_DEFAULT);
  const { handleCreateImpresionQr, handlePrintPlantillaQr, isCreating } = useCreateImpresionQr();
  const { plantillas, isLoadingPlantillas } = usePlantillasImpresionQr(open);

  // Cada vez que se abre arranca en 1 página y la plantilla por defecto.
  React.useEffect(() => {
    if (open) {
      setPaginas("1");
      setPlantilla(PLANTILLA_DEFAULT);
    }
  }, [open]);

  const numPaginas = Number(paginas);
  const paginasValidas = Number.isInteger(numPaginas) && numPaginas >= 1;

  // Crea el registro en Impresión de QR y abre el diálogo de impresión de su PDF.
  const handleImprimir = async () => {
    if (!paginasValidas) return;
    const recordId = await handleCreateImpresionQr(numPaginas);
    if (!recordId) return;
    onOpenChange(false);
    handlePrintPlantillaQr(recordId, plantilla === PLANTILLA_DEFAULT ? undefined : plantilla);
  };

  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 gap-0">
        <DialogHeader className="bg-white px-6 py-5 border-b">
          <DialogTitle className="text-xl text-center font-bold text-gray-800">Imprimir plantilla QR</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 flex flex-col gap-1.5">
          <Label htmlFor="plantilla-qr-tamano" className={labelClass}>Plantilla</Label>
          <Select value={plantilla} onValueChange={setPlantilla} disabled={isCreating || isLoadingPlantillas}>
            <SelectTrigger id="plantilla-qr-tamano" className="bg-white border-gray-200">
              <SelectValue placeholder={isLoadingPlantillas ? "Cargando plantillas..." : "Selecciona una plantilla"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PLANTILLA_DEFAULT}>Predeterminada</SelectItem>
              {plantillas.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-6 py-5 flex flex-col gap-1.5">
          <Label htmlFor="plantilla-qr-paginas" className={labelClass}>Número de páginas</Label>
          <Input
            id="plantilla-qr-paginas"
            type="number"
            min={1}
            value={paginas}
            onChange={(e) => setPaginas(e.target.value)}
            className="bg-white border-gray-200"
            disabled={isCreating}
          />
          {!paginasValidas && <p className="text-xs text-red-500">Ingresa un número de páginas mayor a 0.</p>}
        </div>

        <div className="bg-white border-t px-6 py-4 flex gap-3">
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            onClick={handleImprimir}
            disabled={isCreating || !paginasValidas}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creando plantilla...
              </>
            ) : (
              "Imprimir plantilla"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
