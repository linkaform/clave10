import { test, expect, abrir } from "../support/fixtures";

/**
 * pase-entrada · formulario: validaciones y el body que manda el front al
 * crear el pase. La creación se simula: nunca se crea un pase de verdad (si
 * el front cambia de script u opción, el candado de tests/support hace
 * fallar el test en vez de dejar pasar la escritura).
 */
const CREAR = "pase_de_acceso.py:create_access_pass";

test.describe("pase-entrada · formulario", () => {
  test.beforeEach(async ({ page, back }) => {
    // Config que solo pide correo: sin identificación que capturar.
    back.simularDesde(
      "pase-entrada",
      [
        "pase_de_acceso__catalogos_pase_location",
        "script_turnos__assets_access_pass",
        "pase_de_acceso_use_api__get_config_modulo_seguridad",
      ],
      { pase_de_acceso_use_api__get_config_modulo_seguridad: (data) => (data.requerimientos = ["correo"]) },
    );
    await abrir(page, "pase-entrada");
    await expect(page.getByRole("button", { name: "Siguiente →" })).toBeEnabled({ timeout: 20_000 });
  });

  // TF-011
  test("pide el nombre completo", async ({ page }) => {
    await page.getByRole("button", { name: "Siguiente →" }).click();
    await expect(page.getByText("Por favor, ingresa un tu nombre completo")).toBeVisible();
  });

  // TF-012
  test("pide el correo cuando la config lo exige", async ({ page }) => {
    await page.getByPlaceholder("Nombre Completo").fill("Visitante Prueba");
    await page.getByRole("button", { name: "Siguiente →" }).click();
    await expect(page.getByText("El correo es requerido.")).toBeVisible();
  });

  // TF-013
  test("manda nombre, correo, teléfono y fecha al crear el pase", async ({ page, back }) => {
    back.simular(CREAR, {
      response: { data: { status_code: 201, json: { id: "000000000000000000000000" } } },
    });

    await page.getByPlaceholder("Nombre Completo").fill("Visitante Prueba");
    await page.getByPlaceholder("example@example.com").fill("visitante@ejemplo.com");
    await page.getByPlaceholder("Teléfono").fill("8112345678");
    await page.getByRole("button", { name: "Un solo día" }).click();
    await page.getByRole("button", { name: "Siguiente →" }).click();

    await expect(page.getByText("Confirma los detalles del pase")).toBeVisible();
    await page.getByRole("button", { name: "Crear pase" }).click();
    await expect(page.getByText("El pase de entrada se ha generado correctamente.")).toBeVisible();

    const [body] = back.llamadas(CREAR);
    expect(body.access_pass).toMatchObject({
      nombre: "Visitante Prueba",
      email: "visitante@ejemplo.com",
      created_from: "web",
    });
    expect(body.access_pass.telefono).toContain("8112345678");
    expect(body.access_pass.fecha_desde_visita).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
