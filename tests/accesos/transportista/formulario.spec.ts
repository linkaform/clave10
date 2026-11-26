import { test, expect, abrir } from "../../support/fixtures";
import type { Page } from "@playwright/test";
import type { Back } from "../../support/mock-back";

/**
 * accesos/transportista · formulario: las etapas del detalle de una visita de
 * Control de patio (/dashboard/accesos/transportista/[id]): inspección de
 * sello, pasar a Carga / Descarga y terminar el proceso. La visita, la
 * configuración de etapas y los andenes salen de respuestas guardadas (visita
 * BT-QA-1 en inspección de entrada, con un remolque, la inspección del tractor
 * y el sello del remolque hechos) y todas las escrituras se simulan.
 */
const RUTA = "accesos/transportista";
const VISITA = "transportistas_sdk__get_bitac_transportista_record";
const GUARDAR = "transportistas_sdk.py:save_bitac_transportista_record";
const SELLO = "transportistas_sdk.py:save_inspecciones_sello";
const ID = "0000000000000000000000f1";
const OK = { success: true, response: { data: { status_code: 200, msg: "OK" } } };

const remolque = (n: number) => ({
  tipo_remolque: "Caja seca",
  no_sello: `SELLO-QA-${n}`,
  no_caja: `CAJA-QA-${n}`,
  placas_caja: `QA-78${n}`,
  color: null,
  comentarios: null,
});

/** Abre el detalle de la visita; `cambios` modifica la visita guardada antes de responder. */
async function abrirVisita(page: Page, back: Back, cambios?: (visita: any) => void) {
  back.simularDesde(
    RUTA,
    [
      "script_turnos__load_shift",
      VISITA,
      "transportistas_sdk__get_config_flujo_transportistas",
      "transportistas_sdk__get_andenes",
    ],
    cambios ? { [VISITA]: cambios } : {},
  );
  await abrir(page, `accesos/transportista/${ID}`);
  // Mientras llegan las lecturas reales (encabezado, puntos de inspección) la
  // página se queda en el spinner; tras un update de prod puede pasar de 30 s.
  await expect(page.getByText("BT-QA-1").first()).toBeVisible({ timeout: 45_000 });
}

test.describe("accesos/transportista · formulario", () => {
  test.describe.configure({ timeout: 90_000 });

  // TF-029
  test("con material sobre el vehículo se puede pasar a Carga / Descarga al terminar el sello", { tag: "@bug-1664" }, async ({ page, back }) => {
    await abrirVisita(page, back, (visita) => {
      // Material sin remolque: el detalle arma una unidad "solo vehículo", que no lleva sello.
      visita.materiales.push({ ...visita.materiales[0], lugar: "vehiculo", no_referencia: null, producto: "Producto en vehículo QA" });
    });

    await expect(page.getByRole("button", { name: "Pasar a etapa · Carga / Descarga" })).toBeVisible();
  });

  // TF-030
  test("la inspección de sello solo manda las unidades que faltaban", { tag: "@bug-1665" }, async ({ page, back }) => {
    back.simular(SELLO, OK);
    await abrirVisita(page, back, (visita) => {
      visita.remolques = [remolque(1), remolque(2)];
    });

    await page.getByRole("button", { name: "Realizar inspección de sello" }).click();
    // El modal abre en el remolque principal, que ya tiene su sello.
    await page.getByRole("button", { name: "Siguiente · Remolque #2" }).click();
    await page.getByRole("checkbox", { name: /No aplica/ }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).filter({ visible: true }).click();

    await expect.poll(() => back.llamadas(SELLO).length, { timeout: 10_000 }).toBe(1);
    const [body] = back.llamadas(SELLO);
    // El remolque 1 ya tiene su sello; volver a mandarlo lo duplica.
    expect(body.inspecciones.map((i: any) => i.unidad)).toEqual([2]);
  });

  // TF-031
  test("pasar a Carga / Descarga manda el estatus y el andén elegido", async ({ page, back }) => {
    back.simular(GUARDAR, OK);
    await abrirVisita(page, back);

    await page.getByRole("button", { name: "Pasar a etapa · Carga / Descarga" }).click();
    await page.getByRole("button", { name: "Andén QA 1" }).click();
    await page.getByRole("button", { name: "Confirmar y pasar a Carga / Descarga" }).click();

    await expect.poll(() => back.llamadas(GUARDAR).length, { timeout: 10_000 }).toBe(1);
    const [body] = back.llamadas(GUARDAR);
    expect(body.record_id).toBe(ID);
    expect(body.payload).toEqual({ estatus: "carga_/_descarga", anden: "Andén QA 1" });
  });

  // TF-032
  test("terminar el proceso manda el estatus terminado", async ({ page, back }) => {
    back.simular(GUARDAR, OK);
    await abrirVisita(page, back, (visita) => {
      visita.estatus = "inspeccion_salida";
      visita.inspecciones.push({ tipo: "salida_tractor" });
    });

    await page.getByRole("button", { name: "Terminar proceso · Dar salida" }).click();

    await expect.poll(() => back.llamadas(GUARDAR).length, { timeout: 10_000 }).toBe(1);
    const [body] = back.llamadas(GUARDAR);
    expect(body.record_id).toBe(ID);
    expect(body.payload).toEqual({ estatus: "terminado" });
  });
});
