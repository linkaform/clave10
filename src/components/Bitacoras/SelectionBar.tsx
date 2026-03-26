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
    <div className="fixed bottom-0 left-0 right-0 z-[100] w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="bg-slate-200 text-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-slate-600 fill-slate-600/10" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              {selectedCount}{" "}
              {selectedCount === 1
                ? "visitante seleccionado"
                : "visitantes seleccionados"}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-400/30" />

          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors hover:underline underline-offset-4"
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
            className="h-8 w-8 rounded-full hover:bg-slate-300/50 text-slate-500 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </Button>

          {selectionActions && (
            <div className="flex items-center gap-2">
              {typeof selectionActions === "function" ? (
                selectionActions(selectedItems)
              ) : (
                <div className="[&_button]:bg-slate-800 [&_button]:text-white [&_button:hover]:bg-slate-900 [&_button]:border-none [&_button]:shadow-sm">
                  {selectionActions}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
