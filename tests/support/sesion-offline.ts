import fs from "node:fs";
import path from "node:path";

/**
 * Sesión falsa para el modo offline (TESTS_OFFLINE=1, el de GitHub Actions).
 *
 * El front solo revisa en el navegador que el JWT de access_token no esté
 * vencido (getValidToken -> isTokenExpired); nunca lo valida contra el back.
 * Así que basta un JWT con "exp" en el futuro y los datos de usuario que lee
 * useAuthStore. No hay credenciales reales: el token no sirve contra el back,
 * y en offline todas las llamadas al back se simulan o se bloquean.
 */
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

export function escribirSesionOffline(authFile: string, origin: string) {
  const payload = {
    username: "usuario.pruebas@ejemplo.com",
    parent_id: 10,
    user_id: 10,
    exp: Math.floor(Date.now() / 1000) + 24 * 3600,
    timezone: "America/Monterrey",
    is_mobile: false,
    device_os: "web",
    email: "usuario.pruebas@ejemplo.com",
  };
  const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.firma-falsa`;
  const localStorage = Object.entries({
    access_token: token,
    user_id: "sesion-offline-de-pruebas",
    userId_soter: "10",
    userParentId_soter: "10",
    userName_soter: "Usuario Pruebas",
    userEmail_soter: "usuario.pruebas@ejemplo.com",
    userTimezone_soter: "America/Monterrey",
    userPhoto_soter: "",
    "booth-storage": JSON.stringify({ state: { area: "Caseta Principal", location: "Planta Monterrey", extra_locations: [] }, version: 0 }),
    "selected-locations-storage": JSON.stringify({ state: { selectedLocations: ["Planta Monterrey"] }, version: 0 }),
  }).map(([name, value]) => ({ name, value }));

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [{ origin, localStorage }] }, null, 2));
}
