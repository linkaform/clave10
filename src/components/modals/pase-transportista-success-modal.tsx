"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Check, Mail, Link } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  id: string;
  folio: string;
  accountId?: number;
}

export function PaseTransportistaSuccessModal({ open, onClose, id, folio, accountId }: Props) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/transportistas/preview/transportista/${id}${accountId ? `?p_id=${accountId}` : ""}`
    : `/transportistas/preview/transportista/${id}${accountId ? `?p_id=${accountId}` : ""}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Pase creado exitosamente</DialogTitle>

        {/* Header verde */}
        <div className="bg-gradient-to-b from-green-50 to-white px-6 pt-8 pb-5 flex flex-col items-center text-center border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 ring-4 ring-green-50">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Pase creado</h2>
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
            Folio {folio}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Notificación */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <Mail className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p>La notificación ha sido enviada por correo electrónico.</p>
          </div>

          {/* Enlace */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" /> Enlace del pase
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-mono break-all leading-relaxed mb-3">{url}</p>
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {copied
                  ? <><Check className="w-4 h-4" /> URL copiada</>
                  : <><Copy className="w-4 h-4" /> Copiar URL</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Listo
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
