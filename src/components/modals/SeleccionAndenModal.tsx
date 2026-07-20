"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getAndenes } from "@/services/endpoints";

const SENTINEL = Symbol("unset");

export function SeleccionAndenModal({
  folio,
  placa,
  confirmLabel,
  onConfirm,
  onClose,
  saving,
}: {
  folio?: string | null;
  placa?: string | null;
  confirmLabel?: string;
  onConfirm: (anden: string | null) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<string | null | typeof SENTINEL>(SENTINEL);
  const confirmed = selected !== SENTINEL;

  const { data: andenesData, isLoading: isLoadingAndenes } = useQuery({
    queryKey: ["getAndenes"],
    queryFn: getAndenes,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });
  const andenes: string[] = andenesData?.response?.data ?? [];

  const toggle = (id: string) => setSelected((p) => (p === id ? SENTINEL : id));
  const toggleNone = () => setSelected((p) => (p === null ? SENTINEL : null));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Cambiar andén</p>
              <p className="text-xs text-gray-400">{[folio, placa].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid de andenes */}
        {isLoadingAndenes ? (
          <div className="flex items-center justify-center py-6 text-xs text-gray-400">
            Cargando andenes...
          </div>
        ) : andenes.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-gray-400">
            No hay andenes configurados
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {andenes.map((id) => {
              const isSelected = selected === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={cn(
                    "rounded-xl border-2 py-3 flex flex-col items-center gap-1 text-xs font-semibold transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-500 text-white shadow-md"
                      : "border-gray-200 hover:border-blue-300 text-gray-700",
                  )}>
                  <svg className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span>{id}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sin andén */}
        <button
          type="button"
          onClick={toggleNone}
          className={cn(
            "w-full h-9 rounded-xl border-2 text-xs font-semibold transition-all",
            selected === null
              ? "border-gray-400 bg-gray-700 text-white"
              : "border-gray-200 text-gray-500 hover:border-gray-300",
          )}>
          Sin andén
        </button>

        {/* Confirmar */}
        <button
          type="button"
          disabled={!confirmed || saving}
          onClick={() => confirmed && onConfirm(selected as string | null)}
          className="w-full h-10 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? "Guardando..." : (confirmLabel ?? "Confirmar")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
