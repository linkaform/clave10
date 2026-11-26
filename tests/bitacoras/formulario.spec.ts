import { test, expect, abrir } from "../support/fixtures";
import type { Page } from "@playwright/test";

/**
 * bitacoras · formulario: lo que manda cada acción de Entradas & Salidas al
 * back y lo que muestra con su respuesta. La lista y los KPIs salen de
 * respuestas guardadas (dos visitantes dentro, el primero con gafete) y
 * todas las escrituras se simulan: nunca se da salida ni se toca un gafete
 * de verdad.
 */
const DO_OUT = "script_turnos.py:do_out";
const SALIDA_MASIVA = "script_turnos.py:force_quit_all_persons";
const GAFETE = "script_turnos.py:assing_gafete";

const UNO = "Visitante QA Uno";
const DOS = "Visitante QA Dos";

/** Tarjeta de la vista de fotos: el div más chico con el nombre y su casilla. */
function tarjeta(page: Page, nombre: string) {
  return page
    .locator("div")
    .filter({ has: page.getByText(nombre, { exact: true }) })
    .filter({ has: page.getByRole("checkbox") })
    .last();
}

test.describe("bitacoras · formulario", () => {
  test.beforeEach(async ({ page, back }) => {
    back.simularDesde("bitacoras", ["script_turnos__list_bitacora2", "get_stats__get_stats"]);
    await abrir(page, "bitacoras");
    await expect(page.getByText(UNO, { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(DOS, { exact: true })).toBeVisible();
  });

  // TF-014
  test("da salida a todos los visitantes seleccionados", async ({ page, back }) => {
    back.simular(DO_OUT, { success: true, response: { data: { status_code: 202, json: {} } } });

    await tarjeta(page, UNO).getByRole("checkbox").click();
    await page.getByRole("button", { name: "Seleccionar todos (2)" }).click();
    await page.getByRole("button", { name: "Dar salida" }).click();
    await page.getByRole("button", { name: "Confirmar Salida" }).click();

    await expect.poll(() => back.llamadas(DO_OUT).length, { timeout: 5_000 }).toBe(2);
    const registros = back.llamadas(DO_OUT).map((body) => body.record_id);
    expect(registros.sort()).toEqual(["000000000000000000000001", "000000000000000000000002"]);
  });
});
