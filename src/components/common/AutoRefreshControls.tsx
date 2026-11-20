"use client";

import { createContext, useContext } from "react";
import { Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAutoReloadConfig } from "@/hooks/common/useViewRefresh";
import { AUTO_RELOAD_INTERVALS } from "@/store/useAutoReloadStore";

const formatInterval = (sec: number) => (sec < 60 ? `${sec} s` : `${sec / 60} min`);

/** Switch + intervalo de auto-refresh de una vista. Lo usan el cog y el panel de filtros. */
export function AutoRefreshControls({ viewKey }: { viewKey: string }) {
  const { enabled, intervalSec, inBackground, update } = useAutoReloadConfig(viewKey);

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700">
      <label className="flex items-center justify-between gap-6">
        <span className="font-medium">Auto-refresh</span>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => update({ enabled: v })}
          aria-label="Auto-refresh"
        />
      </label>
      {enabled && (
        <>
          <label className="flex items-center justify-between gap-6">
            <span>Cada</span>
            <select
              value={intervalSec}
              onChange={(e) => update({ intervalSec: Number(e.target.value) })}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-400">
              {AUTO_RELOAD_INTERVALS.map((s) => (
                <option key={s} value={s}>
                  {formatInterval(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-slate-600">
            <input
              type="checkbox"
              checked={inBackground}
              onChange={(e) => update({ inBackground: e.target.checked })}
            />
            Con la pestaña en segundo plano
          </label>
        </>
      )}
    </div>
  );
}

// PageHeader publica la vista actual para que el buscador (FacetSearch) pueda
// ofrecer el mismo control sin que cada pantalla se lo pase a mano.
const ViewRefreshContext = createContext<string | null>(null);
export const ViewRefreshProvider = ({
  viewKey,
  children,
}: {
  viewKey: string;
  children: React.ReactNode;
}) => <ViewRefreshContext.Provider value={viewKey}>{children}</ViewRefreshContext.Provider>;
export const useViewRefreshKey = () => useContext(ViewRefreshContext);

/** Engrane al extremo del buscador: azul con punto si el auto-refresh está activo; abre el control. */
export function AutoRefreshButton({ viewKey }: { viewKey: string }) {
  const { enabled, intervalSec } = useAutoReloadConfig(viewKey);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={enabled ? `Auto-refresh cada ${formatInterval(intervalSec)}` : "Auto-refresh apagado"}
          aria-label="Auto-refresh"
          // El contenedor del buscador enfoca el input en mousedown: aquí no.
          onMouseDown={(e) => e.stopPropagation()}
          className={`relative flex flex-none items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-slate-100 ${
            enabled ? "text-blue-600" : "text-slate-500"
          }`}>
          <Settings size={15} />
          {enabled && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[240px] p-3"
        // El popover está en un portal, pero los eventos de React burbujean hasta
        // el contenedor del buscador, que en mousedown hace preventDefault y
        // enfoca el input: eso cerraba el popover y bloqueaba el <select>.
        onMouseDown={(e) => e.stopPropagation()}>
        <AutoRefreshControls viewKey={viewKey} />
      </PopoverContent>
    </Popover>
  );
}
