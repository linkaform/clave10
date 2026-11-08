import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Configuración de Playwright para clave10 (soter).
 *
 * Requisitos antes de correr los tests:
 *   1. Levantar la app: `docker compose up -d` (desde /docker) o `yarn dev`.
 *   2. Confirmar que responde en http://localhost:3010.
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */

// Carga variables desde tests/.env.test si existe (credenciales de la
// cuenta de pruebas). Ese archivo NUNCA se sube a git (ver .gitignore,
// regla ".env*"). Parseo simple, sin dependencias extra (sin sobreescribir
// variables que ya vengan del entorno, por ejemplo en CI).
const envTestPath = path.resolve(process.cwd(), "tests/.env.test");
if (fs.existsSync(envTestPath)) {
  for (const line of fs.readFileSync(envTestPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  // Estructura: tests/<ruta>/<capa>.spec.ts, con <ruta> igual a la carpeta
  // de src/app/dashboard/ y <capa> = humo | pintado | formulario. Una ruta
  // nueva se detecta sola, sin tocar este archivo.
  testDir: "./tests",

  // Falla el build si algún test.only quedó olvidado en CI.
  forbidOnly: !!process.env.CI,

  // Reintentos solo en CI, para absorber flakiness de red/infra.
  retries: process.env.CI ? 2 : 0,

  // En CI corre en serie para no saturar el server compartido.
  workers: process.env.CI ? 1 : undefined,

  // Reporte HTML y capturas/traces de fallos, ambos dentro de tests/ para
  // no ensuciar la raíz del proyecto.
  reporter: [["html", { outputFolder: "./tests/playwright-report" }]],
  outputDir: "./tests/test_logs",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3010",
    // Guarda el trace completo (timeline, DOM, red, consola) en cualquier
    // falla local, no solo en reintentos — aquí no hay reintentos
    // (retries: 0 fuera de CI), así que "on-first-retry" nunca se
    // activaría. Se borra solo si el test pasa.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    // Inicia sesión una sola vez con la cuenta de pruebas y guarda el
    // localStorage (useAuthStore) para que los tests de pantallas protegidas
    // arranquen ya logueados. Es infraestructura, no un test de negocio.
    {
      name: "setup",
      testDir: "./tests/support",
      testMatch: /auth\.setup\.ts/,
    },

    // tests/login/ prueba la propia pantalla de login: corre sin sesión.
    {
      name: "publico",
      testMatch: "login/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // Todo lo demás: una carpeta por ruta de src/app/dashboard/
    // (tests/<ruta>/{humo,pintado,formulario}.spec.ts), ya autenticado.
    {
      name: "autenticado",
      testMatch: "**/*.spec.ts",
      testIgnore: ["login/**", "support/**"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Para que Playwright levante el server en vez de usar
  // docker compose, descomentar esto (requiere `yarn dev` funcional en host):
  // webServer: {
  //   command: "yarn dev",
  //   url: "http://localhost:3010",
  //   reuseExistingServer: !process.env.CI,
  // },
});
