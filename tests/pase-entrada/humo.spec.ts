import { test, expect, abrir } from "../support/fixtures";

/**
 * pase-entrada · humo: la pantalla carga con los datos reales de la cuenta
 * de pruebas (ubicaciones, config del módulo de seguridad). Solo lectura:
 * no presiona nada que guarde.
 */
test.describe("pase-entrada · humo", () => {
  // TF-006
  test("carga el formulario y termina de traer la config de la ubicación", async ({ page }) => {
    await abrir(page, "pase-entrada");

    await expect(page.getByRole("heading", { name: "Crear pase de entrada" })).toBeVisible();
    await expect(page.getByPlaceholder("Nombre Completo")).toBeVisible();
    // "Siguiente" arranca como "Cargando..." hasta que llegan ubicaciones,
    // assets y config; si se queda así, alguna lectura del back falló.
    // 45 s porque es el back real: tras un update de prod el contenedor
    // arranca en frío (~15 s) y con varios tests en paralelo tarda más.
    await expect(page.getByRole("button", { name: "Siguiente →" })).toBeEnabled({ timeout: 45_000 });
  });
});
