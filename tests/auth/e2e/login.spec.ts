import { test, expect } from "@playwright/test";

/**
 * Tests para /auth/login.
 *
 * Los de validación corren contra el schema de zod en el propio cliente,
 * así que no dependen de que el backend esté disponible ni de credenciales
 * reales. El de "inicio de sesión exitoso" sí necesita un usuario válido:
 * pásale TEST_USERNAME / TEST_PASSWORD como variables de entorno al correr
 * los tests (nunca los hardcodees aquí). Si no están definidas, ese test
 * se salta solo.
 */

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("muestra el formulario con sus campos y botón", async ({ page }) => {
    await expect(page.getByPlaceholder("Usuario")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
  });

  test("muestra errores de validación si se envía vacío", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(
      page.getByText("El usuario debe tener al menos 2 caracteres"),
    ).toBeVisible();
    await expect(
      page.getByText("La contraseña debe tener al menos 2 caracteres"),
    ).toBeVisible();
  });

  test("el botón de mostrar/ocultar contraseña cambia el tipo de input", async ({
    page,
  }) => {
    const passwordInput = page.getByPlaceholder("Password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // El ícono de ojo está justo a la derecha del input.
    await page.locator(".absolute.right-3").click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("inicia sesión con credenciales válidas", async ({ page }) => {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;

    if (!username || !password) {
      test.skip(
        true,
        "Define TEST_USERNAME y TEST_PASSWORD para correr este test.",
      );
    }

    await page.getByPlaceholder("Usuario").fill(username!);
    await page.getByPlaceholder("Password").fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // Tras un login exitoso, el form redirige a "/" (menú del dashboard).
    await expect(page).toHaveURL("/", { timeout: 10_000 });
  });
});
