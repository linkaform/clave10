// F0-10 · Máquina de estados del uploader. Sin JSX: la UI solo lee `estado`
// y llama acciones. Así cada pantalla consumidora reusa la lógica tal cual.
import { useCallback, useReducer, useRef } from "react";
import { analizarDocumento, subirArchivo, type ArchivoSubido, type ContextoAnalisis } from "@/services/contratistas/analisis";
import type { AnalisisIA, DocumentoExistente, FaseUploader } from "@/types/contratistas/uploader";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const sinExt = (s: string) => s.replace(/\.[^.]+$/, "");

export interface EstadoUploader {
  fase: FaseUploader | null;
  file: File | null;
  pct: number;
  archivo: ArchivoSubido | null;
  analisis: AnalisisIA | null;
  error: string | null;
  duplicado: DocumentoExistente | null;
  eleccion: "reemplazar" | "conservar";
  /** Formulario */
  nombre: string;
  mapeoId: string | null;
  propietarioId: string | null;
  mapeoManual: boolean;
  propietarioManual: boolean;
  registro: string;
  vigenciaFin: string;
  comentario: string;
  intento: boolean;
}

const inicial: EstadoUploader = {
  fase: null, file: null, pct: 0, archivo: null, analisis: null, error: null,
  duplicado: null, eleccion: "reemplazar", nombre: "", mapeoId: null, propietarioId: null,
  mapeoManual: false, propietarioManual: false, registro: "", vigenciaFin: "", comentario: "", intento: false,
};

type Accion =
  | { t: "abrir"; file: File; duplicado: DocumentoExistente | null; propietarioId: string | null; mapeoId: string | null }
  | { t: "set"; p: Partial<EstadoUploader> }
  | { t: "analizado"; a: AnalisisIA }
  | { t: "cerrar" };

function reducer(s: EstadoUploader, a: Accion): EstadoUploader {
  switch (a.t) {
    case "abrir":
      return {
        ...inicial, file: a.file, duplicado: a.duplicado, fase: a.duplicado ? "pregunta" : "subiendo",
        nombre: sinExt(a.file.name), propietarioId: a.propietarioId, mapeoId: a.mapeoId,
      };
    case "analizado":
      return {
        ...s, analisis: a.a, fase: a.a.legible ? "listo" : "falla",
        nombre: s.duplicado && s.eleccion === "reemplazar" ? s.duplicado.nombre : a.a.nombre_sugerido || s.nombre,
        mapeoId: s.mapeoId ?? a.a.mapeo.id,
        propietarioId: s.propietarioId ?? a.a.propietario.id,
        registro: a.a.campos.registro ?? "", vigenciaFin: a.a.campos.vigencia_fin ?? "",
      };
    case "set":
      return { ...s, ...a.p };
    case "cerrar":
      return inicial;
  }
}

export interface OpcionesUploader extends ContextoAnalisis {
  existentes: DocumentoExistente[];
}

export function useUploaderIA({ existentes, ...ctx }: OpcionesUploader) {
  const [s, d] = useReducer(reducer, inicial);
  const ctrl = useRef<AbortController | null>(null);

  const correr = useCallback(async (file: File) => {
    ctrl.current?.abort();
    const ac = (ctrl.current = new AbortController());
    try {
      d({ t: "set", p: { fase: "subiendo", pct: 0, error: null } });
      const archivo = await subirArchivo(file, (pct) => d({ t: "set", p: { pct } }), ac.signal);
      d({ t: "set", p: { archivo, fase: "analizando" } });
      const a = await analizarDocumento(archivo, ctx, ac.signal);
      d({ t: "analizado", a });
      if (a.legible) setTimeout(() => !ac.signal.aborted && d({ t: "set", p: { fase: "revision" } }), 700);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      d({ t: "set", p: { fase: "falla", error: (e as Error).message } });
    }
  }, [ctx.requerimiento_id, ctx.propietario_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = useCallback((file: File) => {
    const dup = existentes.find((x) => norm(x.archivo_nombre) === norm(file.name)) ?? null;
    d({ t: "abrir", file, duplicado: dup, propietarioId: ctx.propietario_id ?? null, mapeoId: ctx.requerimiento_id ?? null });
    if (!dup) correr(file);
  }, [existentes, correr, ctx.propietario_id, ctx.requerimiento_id]);

  const confirmarDuplicado = () => {
    if (!s.file) return;
    if (s.eleccion === "conservar") d({ t: "set", p: { nombre: `${sinExt(s.file.name)} (1)` } });
    correr(s.file);
  };

  const cancelar = () => { ctrl.current?.abort(); d({ t: "cerrar" }); };
  /** Reintentar: vuelve a subir y analizar el mismo archivo (error de red o ilegible). */
  const reintentar = () => s.file && correr(s.file);
  /** No legible: sigue a la revisión para capturar a mano. */
  const capturarManual = () => d({ t: "set", p: { fase: "revision" } });

  const reemplaza = s.duplicado && s.eleccion === "reemplazar";
  const nombreRepetido =
    !reemplaza && !!s.nombre.trim() && existentes.some((x) => norm(x.nombre) === norm(s.nombre));
  const valido = !!s.nombre.trim() && !!s.propietarioId && !nombreRepetido;

  return {
    estado: s,
    nombreRepetido,
    valido,
    reemplazaFolio: reemplaza ? s.duplicado!.folio : null,
    acciones: {
      abrir, cancelar, reintentar, capturarManual, confirmarDuplicado,
      set: (p: Partial<EstadoUploader>) => d({ t: "set", p }),
    },
  };
}
