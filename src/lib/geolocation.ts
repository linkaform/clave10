export interface DeviceLocation {
  lat: number;
  long: number;
}

/**
 * Ubicación actual del navegador. Nunca truena ni se cuelga: si no hay permiso,
 * no hay soporte o no responde en `timeoutMs`, regresa null y el flujo sigue
 * sin geo. El timer es propio porque el `timeout` de getCurrentPosition no
 * cuenta mientras el aviso de permiso está abierto (si lo ignoran, esperaría
 * para siempre; en algunos Firefox cerrar el aviso tampoco responde).
 */
export const getDeviceLocation = (timeoutMs = 10000): Promise<DeviceLocation | null> =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let done = false;
    const finish = (value: DeviceLocation | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      () => finish(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });

// Ubicación pedida por adelantado (al empezar un flujo) para no esperar al confirmar.
const PREFETCH_MAX_AGE_MS = 2 * 60 * 1000;
let prefetched: { promise: Promise<DeviceLocation | null>; at: number } | null = null;

/** Empieza a pedir la ubicación (y el permiso) sin esperar el resultado. */
export const prefetchDeviceLocation = () => {
  if (prefetched && Date.now() - prefetched.at < PREFETCH_MAX_AGE_MS) return;
  prefetched = { promise: getDeviceLocation(), at: Date.now() };
};

/**
 * Usa la ubicación pedida por adelantado si es reciente; si no, la pide en ese
 * momento. Cada prefetch se usa una sola vez.
 */
export const takeDeviceLocation = async (): Promise<DeviceLocation | null> => {
  const cached = prefetched;
  prefetched = null;
  if (cached && Date.now() - cached.at < PREFETCH_MAX_AGE_MS) {
    const location = await cached.promise;
    if (location) return location;
  }
  return getDeviceLocation();
};
