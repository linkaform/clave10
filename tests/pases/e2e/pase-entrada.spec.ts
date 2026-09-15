import { test, expect } from "@playwright/test";

/**
 * Tests para /dashboard/pase-entrada (creación de pases de entrada).
 *
 * Corren en el proyecto "authenticated" (ver playwright.config.ts), así
 * que ya arrancan con sesión iniciada gracias a e2e/auth.setup.ts.
 */

test.describe("Crear pase de entrada", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/pase-entrada");

    // El botón "Siguiente" arranca deshabilitado como "Cargando..." mientras
    // se resuelven los fetches de assets/ubicaciones/config de la ubicación.
    // Esperamos a que quede habilitado antes de que cada test continúe.
    // Timeout amplio: bajo carga (varios workers en paralelo pegándole al
    // mismo servidor de desarrollo real) estas consultas pueden tardar más.
    await expect(
      page.getByRole("button", { name: /Siguiente →|Cargando/ }),
    ).toBeEnabled({ timeout: 20_000 });
  });

  test("muestra el formulario con sus secciones principales", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Crear pase de entrada" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Nombre Completo")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Siguiente →" }),
    ).toBeVisible();
  });

  test("muestra error de validación si el nombre está vacío", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Siguiente →" }).click();

    await expect(
      page.getByText("Por favor, ingresa un tu nombre completo"),
    ).toBeVisible();
  });

  test("crea un pase de entrada de punta a punta", async ({ page }) => {
    // La creación pega al backend real (no está mockeada), así que le
    // damos más margen que el default de 30s para todo el test.
    test.setTimeout(45_000);

    const visitante = "Prueba QA Front";

    await page.getByPlaceholder("Nombre Completo").fill(visitante);
    await page
      .getByPlaceholder("example@example.com")
      .fill("qa.playwright@linkaform.com");

    // "Un solo día" fija automáticamente la fecha de visita a hoy, así
    // evitamos tener que operar el date-picker de "Rango de fechas"
    // (que es el que queda seleccionado por default).
    await page.getByRole("button", { name: "Un solo día" }).click();

    await page.getByRole("button", { name: "Siguiente →" }).click();

    // Se abre el modal de confirmación con el resumen del pase.
    await expect(
      page.getByText("Confirma los detalles del pase"),
    ).toBeVisible();
    await expect(page.getByText(visitante)).toBeVisible();

    await page.getByRole("button", { name: "Crear pase" }).click();

    // Confirmación final de que el backend lo creó.
    await expect(
      page.getByText("El pase de entrada se ha generado correctamente."),
    ).toBeVisible({ timeout: 30_000 });
  });
});
