"use client";

import { useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiltersPanelProps } from "@/types/bitacoras";
import { FiltersPanel } from "./PhotoGridFiltersPanel";

interface FloatingFiltersDrawerProps extends FiltersPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeFiltersCount: number;
}

export function FloatingFiltersDrawer({
  isOpen,
  onOpenChange,
  activeFiltersCount,
  filters,
  onFiltersChange,
  filtersConfig,
}: FloatingFiltersDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Botón flotante lateral izquierdo */}
      {!isOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[45]">
          <Button
            onClick={() => onOpenChange(true)}
            className="h-14 w-14 rounded-full rounded-l-none shadow-2xl bg-[#3B83F7] hover:bg-[#3B83F7] text-white p-0 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-none"
            style={{ boxShadow: "4px 0 15px rgba(230, 81, 65, 0.4)" }}>
            <Filter className="h-6 w-6 fill-current" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#e65141] shadow-lg border-2 border-[#e65141]">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[60px] bg-black/40 backdrop-blur-md z-[100] lg:flex hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`${
          isOpen ? "translate-x-0 w-80" : "-translate-x-full w-0 invisible"
        } fixed left-0 top-[60px] bottom-0 z-[101] hidden lg:flex shrink-0 flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out`}>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <FiltersPanel
              filters={filters}
              onFiltersChange={onFiltersChange}
              filtersConfig={filtersConfig}
            />
          </div>
        </ScrollArea>

        {/* Botón de cierre flotante posicionado para no interferir */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive z-[102]">
          <X className="h-4 w-4 rotate-180" />
        </Button>
      </aside>
    </>
  );
}
