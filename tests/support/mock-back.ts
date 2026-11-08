import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * Control de las llamadas del front al back durante los tests.
 *
 * Todas las llamadas pasan por POST .../scripts/run/ (hoy /clave10/scripts/run/,
 * antes /infosync/scripts/run/) con { script_name, option, ... }. Cada una
 * se identifica con la llave "script.py:option".
 *
 * Reglas, en este orden:
 *   1. Simulada (back.simular / back.simularDesde): responde lo guardado y
 *      registra el body para revisarlo despues.
 *   2. Lectura (la option empieza con get_, catalogo, assets_, load_, search...):
 *      sigue al back real, para que la pantalla cargue.
 *   3. Cualquier otra = posible escritura: SE BLOQUEA y el test falla al
 *      terminar.
 *
 * Modo offline (TESTS_OFFLINE=1, GitHub Actions): no hay back. Se simulan
 * solas las respuestas comunes de tests/support/respuestas/ (las del layout,
 * como el menú) y una lectura sin respuesta guardada también se bloquea y
 * hace fallar el test, diciendo cuál falta. Los tests del front nunca crean, editan ni borran en prod;
 *      si una escritura cambia de nombre o de ruta, el test truena aqui en
 *      vez de escribir de verdad.
 *
 * Se instala solo en cada test (fixture automatico en tests/support/fixtures.ts).
 */

type Respuesta = unknown | ((body: any) => unknown);

const LECTURA = /^(get_|get[A-Z]|catalogo|assets_|load_|search|buscar|list|ver_|obtener)/;
const OFFLINE = !!process.env.TESTS_OFFLINE;
const COMUNES = path.resolve(process.cwd(), "tests", "support", "respuestas");

/** "<script>__<option>.json" -> ["<script>.py:<option>", contenido] */
function leerRespuesta(file: string): [string, any] {
  const [script, option] = path.basename(file, ".json").split("__");
  return [`${script}.py:${option}`, JSON.parse(fs.readFileSync(file, "utf8"))];
}

export interface Back {
  /** Responde `respuesta` a la llave "script.py:option" en vez de llamar al back. */
  simular(llave: string, respuesta: Respuesta): void;
  /**
   * Simula con las respuestas guardadas en tests/<ruta>/respuestas/.
   * Archivo "<script>__<option>.json" -> llave "<script>.py:<option>".
   * `cambios` modifica una copia antes de responder (para variar un caso).
   */
  simularDesde(ruta: string, archivos: string[], cambios?: Record<string, (data: any) => void>): void;
  /** Bodies que mando el front a una llave simulada. */
  llamadas(llave: string): any[];
  /** Falla si hubo escrituras bloqueadas. Lo llama el fixture al terminar. */
  verificar(): void;
}

export async function instalarBack(page: Page): Promise<Back> {
  const simuladas = new Map<string, Respuesta>();
  const llamadas: { llave: string; body: any }[] = [];
  const bloqueadas: string[] = [];
  const faltantes: string[] = [];

  if (OFFLINE && fs.existsSync(COMUNES)) {
    for (const f of fs.readdirSync(COMUNES).filter((f) => f.endsWith(".json"))) {
      const [llave, json] = leerRespuesta(path.join(COMUNES, f));
      simuladas.set(llave, json);
    }
  }

  await page.route("**/scripts/run/", async (route) => {
    const body = route.request().postDataJSON() ?? {};
    const llave = `${body.script_name}:${body.option}`;

    if (simuladas.has(llave)) {
      llamadas.push({ llave, body });
      const r = simuladas.get(llave);
      const json = typeof r === "function" ? (r as (b: any) => unknown)(body) : r;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
    }
    if (LECTURA.test(body.option ?? "")) {
      if (!OFFLINE) return route.continue();
      faltantes.push(llave);
      return route.abort("blockedbyclient");
    }

    bloqueadas.push(llave);
    return route.abort("blockedbyclient");
  });

  return {
    simular(llave, respuesta) {
      simuladas.set(llave, respuesta);
    },
    simularDesde(ruta, archivos, cambios = {}) {
      for (const archivo of archivos) {
        const [llave, json] = leerRespuesta(path.resolve(process.cwd(), "tests", ruta, "respuestas", `${archivo}.json`));
        cambios[archivo]?.(json.response.data);
        simuladas.set(llave, json);
      }
    },
    llamadas(llave) {
      return llamadas.filter((l) => l.llave === llave).map((l) => l.body);
    },
    verificar() {
      if (faltantes.length) {
        throw new Error(
          `Modo offline: lectura(s) sin respuesta guardada: ${[...new Set(faltantes)].join(", ")}. ` +
            "Guárdala en tests/<ruta>/respuestas/ (o en tests/support/respuestas/ si es del layout).",
        );
      }
      if (bloqueadas.length) {
        throw new Error(
          `Llamada(s) de escritura sin simular, bloqueadas para no tocar prod: ${[...new Set(bloqueadas)].join(", ")}. ` +
            "Simulala con back.simular(...) o, si es una lectura, agrega su prefijo a LECTURA en tests/support/mock-back.ts.",
        );
      }
    },
  };
}
