import { test, expect, abrir } from "../support/fixtures";

/**
 * pase-entrada · pintado: el formulario cambia según la config del módulo de
 * seguridad de la ubicación. Todo con respuestas guardadas en respuestas/
 * (no depende de cómo esté hoy la cuenta de pruebas).
 */
const RESPUESTAS = [
  "pase_de_acceso__catalogos_pase_location",
  "script_turnos__assets_access_pass",
  "pase_de_acceso_use_api__get_config_modulo_seguridad",
];
const CONFIG = "pase_de_acceso_use_api__get_config_modulo_seguridad";

/** Abre la pantalla con la config cuyos "Datos Requeridos" son `requerimientos`. */
async function abrirCon(page: any, back: any, requerimientos: string[]) {
  back.simularDesde("pase-entrada", RESPUESTAS, {
    [CONFIG]: (data) => (data.requerimientos = requerimientos),
  });
  await abrir(page, "pase-entrada");
  await expect(page.getByRole("button", { name: "Siguiente →" })).toBeEnabled({ timeout: 20_000 });
}

test.describe("pase-entrada · pintado", () => {
  // TF-007
  test("ofrece capturar identificación si la config la pide", async ({ page, back }) => {
    await abrirCon(page, back, ["identificacion"]);
    await expect(page.getByRole("switch", { name: "Habilitar identificación" })).toBeVisible();
  });

  // TF-008
  test("no ofrece identificación si la config no la pide", async ({ page, back }) => {
    await abrirCon(page, back, []);
    await expect(page.getByRole("switch", { name: "Habilitar identificación" })).toBeHidden();
  });

  // TF-009
  test("exige teléfono si la config lo pide", async ({ page, back }) => {
    await abrirCon(page, back, ["telefono"]);
    await page.getByPlaceholder("Nombre Completo").fill("Visitante Prueba");
    await page.getByRole("button", { name: "Siguiente →" }).click();
    await expect(page.getByText("El teléfono es requerido.")).toBeVisible();
  });

  // TF-010
  test("deja avanzar sin correo ni teléfono si la config no los pide", async ({ page, back }) => {
    await abrirCon(page, back, []);
    await page.getByPlaceholder("Nombre Completo").fill("Visitante Prueba");
    await page.getByRole("button", { name: "Un solo día" }).click();
    await page.getByRole("button", { name: "Siguiente →" }).click();
    await expect(page.getByText("Confirma los detalles del pase")).toBeVisible();
  });
});
