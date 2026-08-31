"use client";

import React from "react";
import { Car, Laptop } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface EquipoVehiculoBadgesProps {
  /** Lo que el acompañante declaró que trae ("vehiculo"/"equipo"), solo como nota. */
  equipoVehiculo?: string[];
  /**
   * Si se pasa, el badge se vuelve interactivo: el guardia puede prender/apagar
   * cada ícono para confirmar qué se presentó realmente al momento de entrar.
   * Sin este prop, el badge es de solo lectura.
   */
  confirmados?: Set<string>;
  onToggle?: (valor: string) => void;
  className?: string;
}

const ITEMS: { valor: string; label: string; Icon: typeof Car }[] = [
  { valor: "vehiculo", label: "Trae vehículo", Icon: Car },
  { valor: "equipo", label: "Trae equipo", Icon: Laptop },
];

export const EquipoVehiculoBadges: React.FC<EquipoVehiculoBadgesProps> = ({
  equipoVehiculo = [],
  confirmados,
  onToggle,
  className,
}) => {
  const declarados = ITEMS.filter((item) => equipoVehiculo.includes(item.valor));
  if (declarados.length === 0) return null;

  const interactivo = Boolean(onToggle && confirmados);

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      {declarados.map(({ valor, label, Icon }) => {
        const confirmado = confirmados?.has(valor) ?? false;
        const icon = (
          <Icon
            size={14}
            className={
              interactivo
                ? confirmado
                  ? "text-emerald-600"
                  : "text-slate-300"
                : "text-slate-400"
            }
          />
        );

        return (
          <Tooltip key={valor} content={label}>
            {interactivo ? (
              <button
                type="button"
                onClick={() => onToggle?.(valor)}
                className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${
                  confirmado
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                {icon}
              </button>
            ) : (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 border border-slate-200">
                {icon}
              </span>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
};

export default EquipoVehiculoBadges;
