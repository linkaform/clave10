"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuItemAdmin } from "@/services/menus-admin";
import { parseMenuItemsFromExcel } from "@/lib/menus-admin-export";

interface ImportCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItemCount: number;
  isImporting: boolean;
  onConfirm: (items: MenuItemAdmin[]) => void;
}

export const ImportCatalogDialog: React.FC<ImportCatalogDialogProps> = ({
  open,
  onOpenChange,
  currentItemCount,
  isImporting,
  onConfirm,
}) => {
  const [fileName, setFileName] = useState("");
  const [parsedItems, setParsedItems] = useState<MenuItemAdmin[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => {
    setFileName("");
    setParsedItems(null);
    setParseError("");
    setConfirmed(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsedItems(null);
    setParseError("");
    setConfirmed(false);
    try {
      const items = await parseMenuItemsFromExcel(file);
      setParsedItems(items);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    }
  };

  const moduleCount = parsedItems
    ? new Set(parsedItems.map((i) => i.menu_key)).size
    : 0;

  const handleConfirm = () => {
    if (!parsedItems) return;
    onConfirm(parsedItems);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Importar catálogo
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sube un .xlsx exportado con el botón "Exportar Excel" (de esta cuenta o de otra)
            para restaurar el catálogo completo de menús.
          </p>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-slate-50 text-center">
            <Upload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {fileName || "Selecciona un archivo .xlsx"}
            </span>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {parseError && <p className="text-sm text-red-600">{parseError}</p>}

          {parsedItems && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Se detectaron <strong>{parsedItems.length}</strong> items en{" "}
                  <strong>{moduleCount}</strong> módulos. Esto va a{" "}
                  <strong>borrar los {currentItemCount} items actuales</strong> del catálogo
                  de esta cuenta y reemplazarlos por los del archivo. Esta acción no se puede
                  revertir.
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                Entiendo que esto borra el catálogo actual de esta cuenta.
              </label>
            </>
          )}

          <div className="flex gap-2 mt-2">
            <DialogClose asChild>
              <Button type="button" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={!parsedItems || !confirmed || isImporting}
              onClick={handleConfirm}>
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin" /> Importando...
                </>
              ) : (
                "Reemplazar catálogo"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
