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
      <div className="bg-blue-600 text-white shadow-[0_-8px_30px_rgba(37,99,235,0.25)] p-4 px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white fill-white/20" />
            <span className="text-sm font-bold text-white whitespace-nowrap tracking-wide">
              {selectedCount}{" "}
              {selectedCount === 1
                ? "visitante seleccionado"
                : "visitantes seleccionados"}
            </span>
          </div>

          <div className="h-6 w-px bg-white/30" />

          <button
            type="button"
            className="text-sm font-bold text-blue-100 hover:text-white transition-colors hover:underline underline-offset-4 decoration-2"
            onClick={onSelectAll}>
            {selectedCount === totalVisible
              ? "Deseleccionar todos"
              : `Seleccionar todos (${totalVisible})`}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {selectionActions && (
            <div className="flex items-center gap-2">
              {typeof selectionActions === "function" ? (
                selectionActions(selectedItems)
              ) : (
                <div className="[&_button]:bg-white [&_button]:text-blue-600 [&_button:hover]:bg-blue-50 [&_button]:border-none [&_button]:shadow-lg [&_button]:font-bold [&_button]:px-6">
                  {selectionActions}
                </div>
              )}
            </div>
          )}

          <div className="h-6 w-px bg-white/30" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
