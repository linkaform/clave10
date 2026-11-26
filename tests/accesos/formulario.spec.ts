import { test, expect, abrir } from "../support/fixtures";
import type { Page } from "@playwright/test";
import type { Back } from "../support/mock-back";

/**
 * accesos · formulario: lo que manda Nuevo Acceso al buscar un pase y al
 * registrar ingreso o salida, y lo que muestra con la respuesta del back.
 * El turno abierto y el pase salen de respuestas guardadas (turno en Planta
 * Monterrey / Caseta Principal; pase de "Visitante QA Pase" con un vehículo
 * y un equipo) y todas las escrituras se simulan: nunca se registra un
 * acceso de verdad.
 */
const BUSCAR = "script_turnos.py:search_access_pass";
const INGRESO = "script_turnos.py:do_access";
const SALIDA = "script_turnos.py:do_out";

const QR = "0000000000000000000000c1";
const VISITANTE = "Visitante QA Pase";
const PASE = "script_turnos__search_access_pass";

/** Así contesta el runner cuando el script lanza LKFException. */
const errorDelBack = (mensaje: string) => ({
  success: false,
  response: {},
  error: { exception: { msg: [mensaje] } },
});

/** Abre Nuevo Acceso con turno abierto y escanea el pase; `movimiento` = lo que toca hacer. */
async function escanearPase(page: Page, back: Back, movimiento: "Entrada" | "Salida") {
  back.simularDesde("accesos", ["script_turnos__load_shift", "get_stats__get_stats", PASE], {
    [PASE]: (data) => (data.tipo_movimiento = movimiento),
  });
  await abrir(page, "accesos");
  // Mientras llegan las lecturas reales (ubicaciones del encabezado, menús)
  // la página se queda en el spinner; tras un update de prod el back
  // arranca en frío y puede pasar de 30 s, como en pase-entrada · humo.
  const escanear = page.getByPlaceholder("Escanear Pase");
  await expect(escanear).toBeVisible({ timeout: 45_000 });
  await escanear.fill(QR);
  await expect(page.getByText(VISITANTE)).toBeVisible({ timeout: 20_000 });
}

test.describe("accesos · formulario", () => {
  test.describe.configure({ timeout: 90_000 });

  // TF-019
  test("busca el pase escaneado y muestra al visitante", async ({ page, back }) => {
    await escanearPase(page, back, "Entrada");

    expect(back.llamadas(BUSCAR).some((body) => body.qr_code === QR)).toBe(true);
    await expect(page.getByRole("button", { name: "Registrar Ingreso" })).toBeVisible();
  });

  // TF-020
  test("registra el ingreso con el pase, la caseta, el vehículo y el equipo", async ({ page, back }) => {
    back.simular(INGRESO, { success: true, response: { data: { status_code: 201, accesos: [] } } });
    await escanearPase(page, back, "Entrada");

    await page.getByRole("button", { name: "Registrar Ingreso" }).click();
    await expect(page.getByText("Entrada Exitosa")).toBeVisible();

    const [body] = back.llamadas(INGRESO);
    expect(body).toMatchObject({ qr_code: QR, location: "Planta Monterrey", area: "Caseta Principal" });
    expect(body.vehiculo).toEqual([expect.objectContaining({ placas: "QA-123" })]);
    expect(body.equipo).toEqual([expect.objectContaining({ serie: "SERIE-QA-1" })]);
    expect(body.visita_a).toEqual([expect.objectContaining({ nombre: "Empleado QA" })]);
  });

  // TF-021
  test("muestra el mensaje del back si no se puede registrar el ingreso", async ({ page, back }) => {
    const mensaje = "El pase no está vigente para hoy.";
    back.simular(INGRESO, errorDelBack(mensaje));
    await escanearPase(page, back, "Entrada");

    await page.getByRole("button", { name: "Registrar Ingreso" }).click();

    await expect(page.getByText("Error al realizar ingreso:")).toBeVisible();
    await expect(page.getByText(mensaje)).toBeVisible();
  });

  // TF-022
  test("registra la salida con el pase y la caseta", async ({ page, back }) => {
    back.simular(SALIDA, { success: true, response: { data: { status_code: 202 } } });
    await escanearPase(page, back, "Salida");

    await page.getByRole("button", { name: "Registrar Salida" }).click();
    await expect(page.getByText("Salida Exitosa")).toBeVisible();

    const [body] = back.llamadas(SALIDA);
    expect(body).toMatchObject({ qr_code: QR, location: "Planta Monterrey", area: "Caseta Principal" });
  });
});
