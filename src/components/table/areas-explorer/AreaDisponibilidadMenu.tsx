"use client";

import { RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAreaActions } from "@/hooks/Areas/useAreaActions";
import { useAreaDisponibilidadOptions } from "@/hooks/Areas/useAreaDisponibilidadOptions";

interface AreaDisponibilidadMenuProps {
  recordId: string;
  iconClassName?: string;
}

// Muestra las opciones cacheadas (localStorage) de inmediato al abrir el
// menú, y refresca el cache en segundo plano para la próxima vez — ver
// useAreaDisponibilidadOptions.
export function AreaDisponibilidadMenu({ recordId, iconClassName = "w-5 h-5" }: AreaDisponibilidadMenuProps) {
  const { handleChangeAreaDisponibilidad } = useAreaActions();
  const { options, ensureOptions } = useAreaDisponibilidadOptions();

  return (
    <DropdownMenu onOpenChange={(open) => open && ensureOptions()}>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer" title="Cambiar disponibilidad" onClick={(e) => e.stopPropagation()}>
          <RefreshCw className={iconClassName} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {options.length === 0 ? (
          <DropdownMenuItem disabled>Cargando opciones...</DropdownMenuItem>
        ) : (
          options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleChangeAreaDisponibilidad(recordId, opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
