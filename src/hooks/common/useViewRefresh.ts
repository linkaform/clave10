"use client";

import { useCallback, useEffect, useRef } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import {
  AUTO_RELOAD_INTERVALS,
  AutoReloadConfig,
  getDefaultAutoReload,
  useAutoReloadStore,
} from "@/store/useAutoReloadStore";

/** Ajuste de auto-refresh de una vista (valores guardados + defaults). */
export function useAutoReloadConfig(viewKey: string) {
  const saved = useAutoReloadStore((s) => s.views[viewKey]);
  const setView = useAutoReloadStore((s) => s.setView);
  const config: AutoReloadConfig = { ...getDefaultAutoReload(viewKey), ...saved };
  // Intervalos guardados con opciones anteriores (15 s, 30 s...) ya no existen.
  if (!(AUTO_RELOAD_INTERVALS as readonly number[]).includes(config.intervalSec)) {
    config.intervalSec = getDefaultAutoReload(viewKey).intervalSec;
  }
  const update = useCallback(
    (patch: Partial<AutoReloadConfig>) => setView(viewKey, patch),
    [setView, viewKey],
  );
  return { ...config, update };
}

/**
 * Recarga de una vista: `refresh` manual y un intervalo opcional (auto-refresh).
 * Por defecto refresca todas las queries activas (lista, stats, contadores de
 * lo que está montado); `onRefresh` permite a la vista usar su propio refresco.
 * Solo UN componente por vista debe montar el intervalo (`withInterval`).
 */
export function useViewRefresh(
  viewKey: string,
  opts: { onRefresh?: () => unknown; withInterval?: boolean } = {},
) {
  const { onRefresh, withInterval = false } = opts;
  const qc = useQueryClient();
  const isRefreshing = useIsFetching() > 0;
  const { enabled, intervalSec, inBackground } = useAutoReloadConfig(viewKey);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const refresh = useCallback(
    () =>
      onRefreshRef.current
        ? onRefreshRef.current()
        : qc.refetchQueries({ type: "active" }),
    [qc],
  );

  useEffect(() => {
    if (!withInterval || !enabled) return;
    const id = setInterval(() => {
      if (!inBackground && document.hidden) return;
      void refresh();
    }, intervalSec * 1000);
    return () => clearInterval(id);
  }, [withInterval, enabled, intervalSec, inBackground, refresh]);

  return { refresh, isRefreshing };
}
