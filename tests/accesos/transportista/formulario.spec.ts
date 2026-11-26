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
});
