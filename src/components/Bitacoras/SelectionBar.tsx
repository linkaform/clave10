"use client";

import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionBarProps {
  selectedCount: number;
  totalVisible: number;
  onClear: () => void;
  onSelectAll: () => void;
  selectionActions?:
    | React.ReactNode
    | ((
        selectedItems: { record_id: string; record_status: string }[],
      ) => React.ReactNode);
  selectedItems: { record_id: string; record_status: string }[];
}

export function SelectionBar({
  selectedCount,
  totalVisible,
  onClear,
  onSelectAll,
  selectionActions,
  selectedItems,
}: SelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white text-slate-900 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] p-4 px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-50" />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {selectedCount}{" "}
              {selectedCount === 1
                ? "visitante seleccionado"
                : "visitantes seleccionados"}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            onClick={onSelectAll}>
            {selectedCount === totalVisible
              ? "Deseleccionar todos"
              : `Seleccionar todos (${totalVisible})`}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </Button>

          {selectionActions && (
            <div className="flex items-center gap-2">
              {typeof selectionActions === "function"
                ? selectionActions(selectedItems)
                : selectionActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
