import { test, expect } from "../support/fixtures";

/**
 * login · humo: la pantalla carga y se puede entrar con la cuenta de pruebas
 * (TEST_USERNAME / TEST_PASSWORD en tests/.env.test). Solo lectura.
 */
test.describe("login · humo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  // TF-001
  test("muestra usuario, contraseña y el botón de entrar", async ({ page }) => {
    await expect(page.getByPlaceholder("Usuario")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  // TF-002
  test("entra con la cuenta de pruebas y llega al inicio", async ({ page }) => {
    const { TEST_USERNAME, TEST_PASSWORD } = process.env;
    test.skip(!TEST_USERNAME || !TEST_PASSWORD, "Define TEST_USERNAME y TEST_PASSWORD en tests/.env.test");

    await page.getByPlaceholder("Usuario").fill(TEST_USERNAME!);
    await page.getByPlaceholder("Password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // Antes de redirigir, el login espera load_shift (~7 s).
    await expect(page).toHaveURL("/", { timeout: 30_000 });
  });
});
