import { test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { escribirSesionOffline } from "./sesion-offline";

/**
 * Corre una sola vez antes de los tests del proyecto "autenticado"
 * (ver playwright.config.ts). Inicia sesión con la cuenta de pruebas y
 * guarda el estado resultante (localStorage, donde useAuthStore guarda
 * el token) para que esos tests arranquen ya logueados.
 *
 * Si la sesión guardada sigue vigente (el JWT de access_token vence en más
 * de 10 min), se reusa y no se hace login: ahorra ~9 s por corrida (el
 * login espera load_shift). FORZAR_LOGIN=1 hace login de todos modos.
 *
 * Con TESTS_OFFLINE=1 (GitHub Actions) no hay login: escribe una sesión
 * falsa (ver sesion-offline.ts) y todo el back se simula.
 *
 * tests/.auth/ nunca se sube a git (ver .gitignore) porque contiene un
 * token de sesión real.
 */
const authFile = path.resolve(process.cwd(), "tests/.auth/user.json");
const MARGEN_MS = 10 * 60 * 1000;

/** Minutos que le quedan al token guardado, o null si no hay sesión usable. */
function minutosDeSesion(): number | null {
  try {
    const state = JSON.parse(fs.readFileSync(authFile, "utf8"));
    const token = state.origins
      ?.flatMap((o: any) => o.localStorage ?? [])
      .find((i: any) => i.name === "access_token")?.value;
    if (!token) return null;
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    const restante = payload.exp * 1000 - Date.now();
    return restante > MARGEN_MS ? Math.floor(restante / 60_000) : null;
  } catch {
    return null;
  }
}

setup("autenticarse con la cuenta de pruebas", async ({ page, baseURL }) => {
  if (process.env.TESTS_OFFLINE) {
    escribirSesionOffline(authFile, new URL(baseURL!).origin);
    return;
  }

  const minutos = process.env.FORZAR_LOGIN ? null : minutosDeSesion();
  if (minutos !== null) {
    setup.info().annotations.push({
      type: "sesión",
      description: `se reusa la guardada (vence en ${Math.floor(minutos / 60)} h)`,
    });
    return;
  }

  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Define TEST_USERNAME y TEST_PASSWORD (por ejemplo en tests/.env.test) " +
        "antes de correr la suite: los tests de pantallas protegidas " +
        "dependen de este login para generar su sesión.",
    );
  }

  await page.goto("/auth/login");
  await page.getByPlaceholder("Usuario").fill(username);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  // El login espera a load_shift antes de redirigir, y load_shift solo
  // tarda ~7s; 10s no alcanzaba.
  await page.waitForURL("/", { timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
