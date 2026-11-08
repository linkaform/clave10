import { test as base, expect, type Page } from "@playwright/test";
import { instalarBack, type Back } from "./mock-back";

/**
 * `test` de todos los specs: importa { test, expect } de aqui, no de
 * "@playwright/test". Agrega `back` (ver mock-back.ts), que se instala solo
 * en cada test y lo hace fallar si el front intento escribir sin simular.
 */
export const test = base.extend<{ back: Back }>({
  back: [
    async ({ page }, use) => {
      const back = await instalarBack(page);
      await use(back);
      back.verificar();
    },
    { auto: true },
  ],
});

export { expect };

/** Abre una ruta del dashboard. */
export async function abrir(page: Page, ruta: string) {
  await page.goto(`/dashboard/${ruta}`);
}
