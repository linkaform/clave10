import { test, expect, abrir } from "../support/fixtures";
import type { Page } from "@playwright/test";
import type { Back } from "../support/mock-back";

/**
 * bitacoras_transportistas · formulario: lo que mandan los modales "Nuevo
 * Acceso Transportista" y "Registrar llegada de pase" de Control de patio, y
 * lo que muestran con la respuesta del back (Sanic, transportistas_sdk.py).
 * El turno abierto, la bitácora vacía y el pase programado salen de
 * respuestas guardadas; todas las escrituras se simulan, y la subida de fotos
 * (va directo a cloud_upload, fuera de scripts/run) también se intercepta:
 * nunca se crea una visita ni se sube un archivo de verdad.
 */
const ALTA = "transportistas_sdk.py:create_visit_transportista";
const OCR = "ocr_docs_sdk.py:ocr_acceso_transportista";
const PASE = "PT-QA-1";
const PASE_ID = "0000000000000000000000e1";
const FOTO = { name: "licencia.jpg", mimeType: "image/jpeg", buffer: Buffer.from("foto de prueba") };

/** Respuesta del mini-back cuando el script lanza LKFException (HTTP 400). */
async function falloDelBack(page: Page, option: string, mensaje: string) {
  await page.route("**/scripts/run/", async (route) => {
    if (route.request().postDataJSON()?.option !== option) return route.fallback();
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ code: 12, success: false, response: {}, error: { exception: { msg: [mensaje] } } }),
    });
  });
}

/** Subida de fotos: `ok` responde como la nube; si no, como un error de la nube. */
async function subidaDeFotos(page: Page, ok: boolean) {
  await page.route("**/cloud_upload/**", (route) =>
    route.fulfill({
      status: ok ? 200 : 500,
      contentType: "application/json",
      body: JSON.stringify(
        ok
          ? { file: "https://f001.backblazeb2.com/file/qa/licencia-qa.jpg", file_name: "licencia-qa.jpg" }
          : { error: "No se pudo guardar el archivo." },
      ),
    }),
  );
}

async function abrirControlDePatio(page: Page, back: Back) {
  back.simularDesde("bitacoras_transportistas", [
    "script_turnos__load_shift",
    "transportistas_sdk__get_bitac_transportista_records",
    "filters_sdk__transportistas",
    "transportistas_sdk__get_pass_transportista",
  ]);
  await abrir(page, "bitacoras_transportistas");
  // Mientras llegan las lecturas reales (encabezado, menús) la página se
  // queda en el spinner; tras un update de prod puede pasar de 30 s.
  await expect(page.getByRole("button", { name: "Nuevo Acceso Transportista" })).toBeVisible({ timeout: 45_000 });
}

/** Nuevo Acceso: Entrega, Torton y la foto de la licencia. */
async function capturarLlegada(page: Page) {
  await page.getByRole("button", { name: "Nuevo Acceso Transportista" }).click();
  await page.getByRole("button", { name: /^Entrega/ }).click();
  await page.getByRole("button", { name: /^Torton/ }).click();
  await page.getByRole("button", { name: "Documento del conductor" }).click();
  await page.locator('input[type="file"]').setInputFiles(FOTO);
}

/** Registrar llegada: busca el pase por su folio y llega al formulario. */
async function buscarPasePorFolio(page: Page) {
  await page.getByTitle("Registrar llegada de pase").click();
  await page.getByPlaceholder("Folio o ID del pase de entrada").fill(PASE);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
}

test.describe("bitacoras_transportistas · formulario", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page, back }) => {
    await abrirControlDePatio(page, back);
  });

  // TF-024
  test("al registrar la llegada buscando por folio manda el id del pase", async ({ page, back }) => {
    back.simular(ALTA, { success: true, response: { data: { status_code: 201, json: {} } } });

    await buscarPasePorFolio(page);
    await page.getByRole("button", { name: "Confirmar llegada" }).click();

    await expect.poll(() => back.llamadas(ALTA).length, { timeout: 10_000 }).toBe(1);
    const [body] = back.llamadas(ALTA);
    // El back busca la visita programada por el id del pase; con el folio crea otra.
    expect(body.payload.num_de_pase).toBe(PASE_ID);
  });
});
