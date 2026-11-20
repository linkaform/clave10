// F0-10 · Subida de archivo + análisis IA (el back es F0-11).
// Mientras no exista F0-11, se usa el mock con los 4 escenarios del diseño
// (DUP_SC). Mismo switch que el resto: NEXT_PUBLIC_CONTRATISTAS_MOCKS=0 apaga.
import type { AnalisisIA } from "@/types/contratistas/uploader";
import { getValidToken } from "@/lib/login/get-valid-token";
import { API_ENDPOINTS } from "@/config/api";

const USE_MOCKS = process.env.NEXT_PUBLIC_CONTRATISTAS_MOCKS !== "0";

export interface ArchivoSubido {
  name: string;
  file_url: string;
  size: number;
}

/**
 * Sube el archivo reportando %. Usa XMLHttpRequest porque fetch no expone
 * progreso de subida. Endpoint y field_id/form_id: PENDIENTE de F0-11.
 */
export function subirArchivo(
  file: File,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
): Promise<ArchivoSubido> {
  if (USE_MOCKS) return mockSubir(file, onProgress, signal);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("File", file);
    xhr.open("POST", UPLOAD_URL);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const r = JSON.parse(xhr.responseText);
        resolve({ name: file.name, file_url: r.file, size: file.size });
      } else reject(new Error("No se pudo subir el archivo"));
    };
    xhr.onerror = () => reject(new Error("No se pudo subir el archivo"));
    signal.addEventListener("abort", () => { xhr.abort(); reject(new DOMException("Cancelado", "AbortError")); });
    xhr.send(fd);
  });
}
const UPLOAD_URL = "https://app.linkaform.com/api/clave10/cloud_upload/"; // PENDIENTE F0-11

export interface ContextoAnalisis {
  /** Requerimiento esperado si se sube desde una fila (ME-11, ME-07). */
  requerimiento_id?: string;
  propietario_id?: string;
}

export async function analizarDocumento(
  archivo: ArchivoSubido,
  ctx: ContextoAnalisis,
  signal: AbortSignal,
): Promise<AnalisisIA> {
  if (USE_MOCKS) return mockAnalizar(archivo, ctx, signal);
  const jwt = await getValidToken();
  const res = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify({
      script_name: "contratistas_sdk.py", // PENDIENTE F0-11
      option: "analizar_documento",
      archivo,
      ...ctx,
    }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Error al analizar el documento");
  return data.response.data as AnalisisIA;
}

/* ---------------- Mock (escenarios del diseño) ---------------- */

const espera = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok, ko) => {
    const t = setTimeout(ok, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); ko(new DOMException("Cancelado", "AbortError")); });
  });

async function mockSubir(file: File, onProgress: (p: number) => void, signal: AbortSignal) {
  for (let p = 0; p < 100; p = Math.min(100, p + 7)) { onProgress(p); await espera(90, signal); }
  onProgress(100);
  return { name: file.name, file_url: URL.createObjectURL(file), size: file.size };
}

/** El escenario se elige por el nombre del archivo para poder probar los 4. */
async function mockAnalizar(a: ArchivoSubido, _ctx: ContextoAnalisis, signal: AbortSignal): Promise<AnalisisIA> {
  await espera(2300, signal);
  const n = a.name.toLowerCase();
  if (/^img_|borros|ilegible/.test(n)) {
    return {
      legible: false, tipo: null, confianza: 0, nombre_sugerido: "",
      mapeo: { id: null, confianza: 58 }, propietario: { id: null, confianza: 61 },
      campos: {},
      alertas: [{
        nivel: "error", titulo: "No pudimos leer el documento",
        detalle: "La imagen está borrosa o tiene baja resolución. Captura los datos manualmente o sube un archivo más nítido.",
        accion: { tipo: "otro_archivo", etiqueta: "Subir otro archivo" },
      }],
    };
  }
  if (/icsoe/.test(n)) {
    return {
      legible: true, tipo: "Acuse ICSOE · Seguridad social", confianza: 92, nombre_sugerido: "Acuse ICSOE",
      mapeo: { id: "rq-icsoe", confianza: 96 }, propietario: { id: null, confianza: 99 },
      campos: { vigencia_fin: "2027-01-17", registro: "Y5412345107" },
      alertas: [
        {
          nivel: "error", titulo: "El registro patronal no coincide",
          detalle: "El acuse declara Y5412345107 y en Nuevo León tienes dado de alta Y5412345108. El IMSS rechazará la informativa.",
          accion: { tipo: "usar_valor", etiqueta: "Usar Y5412345108", campo: "registro", valor: "Y5412345108" },
        },
        { nivel: "aviso", titulo: "Faltan 2 contratos por reportar", detalle: "El acuse reporta 5 contratos y tienes 7 vigentes en el cuatrimestre." },
      ],
    };
  }
  return {
    legible: true, tipo: "Constancia de situación fiscal · Fiscal", confianza: 99,
    nombre_sugerido: "Constancia de situación fiscal",
    mapeo: { id: "rq-csf", confianza: 96 }, propietario: { id: null, confianza: 99 },
    campos: { vigencia_fin: "2026-12-31", registro: "CDS180514KJ2" }, alertas: [],
  };
}
