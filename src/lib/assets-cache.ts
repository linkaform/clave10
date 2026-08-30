// Cache en localStorage de los assets por ubicación (Areas, Visita_a, Perfiles,
// requerimientos y envios). Antes se guardaba el objeto crudo y nunca expiraba,
// así que una respuesta vieja (p.ej. con Perfiles vacío) se quedaba pegada para
// siempre y el select de "Tipo de visita" salía sin opciones. Ahora se guarda
// con versión y timestamp: lo viejo o lo vencido se descarta y se vuelve a pedir.
const ASSETS_CACHE_VERSION = 2;
const ASSETS_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora

export type AssetsData = {
  Areas?: string[];
  Visita_a?: string[];
  Perfiles?: string[];
  requerimientos?: string[];
  envios?: string[];
};

const cacheKey = (location: string) => `assets_${location}`;

export const readAssetsCache = (location: string): AssetsData | null => {
  if (typeof window === "undefined" || !location) return null;
  try {
    const raw = localStorage.getItem(cacheKey(location));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Formato viejo (sin envoltura) o de otra versión: se ignora y se refresca.
    if (parsed?.v !== ASSETS_CACHE_VERSION || typeof parsed?.ts !== "number") {
      localStorage.removeItem(cacheKey(location));
      return null;
    }
    if (Date.now() - parsed.ts > ASSETS_CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(location));
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
};

export const writeAssetsCache = (location: string, data: AssetsData) => {
  if (typeof window === "undefined" || !location) return;
  try {
    localStorage.setItem(
      cacheKey(location),
      JSON.stringify({ v: ASSETS_CACHE_VERSION, ts: Date.now(), data }),
    );
  } catch {
    // localStorage lleno o bloqueado: se trabaja sin cache.
  }
};
