"use client";

import * as React from "react";
import { ScanBarcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScanBarcodeModal } from "@/components/modals/scan-barcode-modal";
import { cn } from "@/lib/utils";

interface TagIdInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Input del Tag ID con botón para escanearlo con la cámara, igual que el
// número de serie en accesos (ScanBarcodeModal), pero leyendo también QR.
export function TagIdInput({ id, value, onChange, className }: TagIdInputProps) {
  const [openScan, setOpenScan] = React.useState(false);

  // Estable: ScanBarcodeModal reinicia la cámara si cambia onScan.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const handleScan = React.useCallback((code: string) => onChangeRef.current(code.trim()), []);

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej. 698653701b7735a0a164b4e0"
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
        onClick={() => setOpenScan(true)}
        title="Escanear Tag ID"
      >
        <ScanBarcode size={20} />
      </button>
      <ScanBarcodeModal open={openScan} setOpen={setOpenScan} onScan={handleScan} incluirQr titulo="Escanear Tag ID" />
    </div>
  );
}
