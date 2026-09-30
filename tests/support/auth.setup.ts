import { test as setup } from "@playwright/test";
import path from "node:path";

/**
 * Corre una sola vez antes de los tests del proyecto "authenticated"
 * (ver playwright.config.ts). Inicia sesión con la cuenta de pruebas y
 * guarda el estado resultante (localStorage, donde useAuthStore guarda
 * el token) para que esos tests arranquen ya logueados.
 *
 * tests/.auth/ nunca se sube a git (ver .gitignore) porque contiene un
 * token de sesión real.
 */
const authFile = path.resolve(process.cwd(), "tests/.auth/user.json");

setup("autenticarse con la cuenta de pruebas", async ({ page }) => {
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
  await page.waitForURL("/", { timeout: 10_000 });

  await page.context().storageState({ path: authFile });
});
