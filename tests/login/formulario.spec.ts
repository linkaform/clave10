import { test, expect } from "../support/fixtures";

/**
 * login · formulario: validaciones del cliente, el botón de mostrar
 * contraseña y lo que manda el front al back. El login se intercepta: no se
 * usa ninguna credencial real.
 */
test.describe("login · formulario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  // TF-003
  test("pide usuario y contraseña si se envía vacío", async ({ page }) => {
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("El usuario debe tener al menos 2 caracteres")).toBeVisible();
    await expect(page.getByText("La contraseña debe tener al menos 2 caracteres")).toBeVisible();
  });

  // TF-004
  test("muestra la contraseña al presionar el ojo", async ({ page }) => {
    const password = page.getByPlaceholder("Password");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(password).toHaveAttribute("type", "text");
  });

  // TF-005
  test("manda usuario y contraseña, y muestra el error del back si no son válidos", async ({ page }) => {
    let body: any;
    await page.route("**/user_admin/login/", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Usuario o contraseña inválida", code: 401 }),
      });
    });

    await page.getByPlaceholder("Usuario").fill("nadie@ejemplo.com");
    await page.getByPlaceholder("Password").fill("no-es-la-clave");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Usuario o contraseña inválida")).toBeVisible();
    expect(body).toMatchObject({ username: "nadie@ejemplo.com", password: "no-es-la-clave" });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
