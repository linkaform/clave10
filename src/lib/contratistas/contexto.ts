// Contexto de Contratistas (F0-03): modo, lado, etiquetas espejo y pestañas.
// Todo sale de la URL, así que funciona con atrás/adelante, ligas y recarga.
// Diseño: plataforma.dc.html, kLbl() (línea ~5713), EMP_TABS/CTR_TABS/CLI_TABS/
// CTO_TABS (~4775) y empTabs (~8503). Spec del modelo: clave10-sdk/specs.

export const BASE = "/dashboard/contratistas";

/**
 * propio   = Mi empresa
 * lista    = lista de clientes o contratistas
 * detalle  = un cliente o contratista (solo lectura)
 * contrato = detalle de un contrato
 */
export type Modo = "propio" | "lista" | "detalle" | "contrato";

/** Lado de la relación que se está viendo: contratistas o clientes. */
export type Lado = "ctr" | "cli";

/** Acento de color: azul propio, naranja contratista, violeta cliente. */
export type Acento = "propio" | Lado;

export interface Etiquetas {
  cli: boolean;
  /** Cliente / Contratista */
  kSg: string;
  /** cliente / contratista */
  kSgL: string;
  /** Clientes / Contratistas */
  kPl: string;
  /** clientes / contratistas */
  kPlL: string;
}

export interface Pestana {
  key: string;
  label: string;
  /** Tarea del plan que construye esta pestaña (se muestra mientras no exista). */
  tarea: string;
}

/** Pestañas de Mi empresa (EMP_TABS sin Cumplimiento, que se abre desde Generales o Empleados). */
const EMP: Pestana[] = [
  { key: "generales", label: "Generales", tarea: "ME-01" },
  { key: "ubicaciones", label: "Ubicaciones", tarea: "ME-02" },
  { key: "empleados", label: "Empleados", tarea: "ME-03" },
  { key: "documentos", label: "Documentos", tarea: "ME-06" },
  { key: "activos", label: "Activos", tarea: "ME-08" },
  { key: "contratos", label: "Contratos", tarea: "ME-09" },
];

const CTO: Pestana[] = [
  { key: "generales", label: "Generales", tarea: "ME-10" },
  { key: "empleados", label: "Empleados", tarea: "ME-11" },
  { key: "documentos", label: "Documentos", tarea: "ME-11" },
  { key: "requerimientos", label: "Requerimientos", tarea: "ME-11" },
  { key: "incidencias", label: "Incidencias & Fallas", tarea: "ME-11" },
];

const listaPestanas = (lado: Lado): Pestana[] =>
  lado === "cli"
    ? [
        { key: "clientes", label: "Clientes", tarea: "R-04" },
        { key: "contratos", label: "Contratos", tarea: "ME-09" },
      ]
    : [
        { key: "contratistas", label: "Contratistas", tarea: "R-04" },
        { key: "contratos", label: "Contratos", tarea: "ME-09" },
        { key: "empleados", label: "Empleados", tarea: "R-06" },
      ];

/**
 * Pestañas que no van en la barra pero sí existen: se abren desde otra y
 * resaltan a su "dueña" (en el diseño, `on` de empTabs).
 */
interface Oculta extends Pestana {
  resalta: string;
}

const ocultas = (modo: Modo, lado: Lado | null): Oculta[] => {
  if (modo === "propio") {
    return [{ key: "cumplimiento", label: "Cumplimiento documental", tarea: "ME-07", resalta: "generales" }];
  }
  if (modo === "lista" && lado === "ctr") {
    return [
      { key: "cumplimiento", label: "Cumplimiento de contratistas", tarea: "MX-01", resalta: "contratistas" },
      { key: "asignacion", label: "Asignación de requerimientos", tarea: "MX-05", resalta: "contratistas" },
    ];
  }
  return [];
};

export const pestanasDe = (modo: Modo, lado: Lado | null): Pestana[] => {
  if (modo === "propio") return EMP;
  if (modo === "contrato") return CTO;
  if (modo === "lista") return listaPestanas(lado ?? "ctr");
  // detalle: lo de Mi empresa sin Ubicaciones, en solo lectura (R-05).
  return EMP.filter((p) => p.key !== "ubicaciones").map((p) => ({ ...p, tarea: "R-05" }));
};

export const etiquetasEspejo = (lado: Lado | null, modo: Modo): Etiquetas => {
  const cli = lado === "cli" && modo !== "propio";
  return {
    cli,
    kSg: cli ? "Cliente" : "Contratista",
    kSgL: cli ? "cliente" : "contratista",
    kPl: cli ? "Clientes" : "Contratistas",
    kPlL: cli ? "clientes" : "contratistas",
  };
};

export interface RutaContratistas {
  modo: Modo;
  lado: Lado | null;
  relacionId: string | null;
  contratoId: string | null;
  /** Ruta a la que regresa el detalle de un contrato (ctoBackMode). */
  desde: string;
}

const segmentoLado = (s?: string): Lado | null =>
  s === "contratistas" ? "ctr" : s === "clientes" ? "cli" : null;

/** Solo rutas internas de contratistas; cualquier otra cosa regresa a Mi empresa. */
export const desdeSeguro = (desde: string | null): string =>
  desde && desde.startsWith(`${BASE}/`) && !desde.includes("//") ? desde : `${BASE}/mi-empresa`;

/** Lee modo, lado e ids de la ruta `/dashboard/contratistas/...`. */
export const leerRuta = (pathname: string, desdeParam: string | null): RutaContratistas => {
  const partes = pathname.replace(/\/+$/, "").slice(BASE.length).split("/").filter(Boolean);
  const [primero, segundo] = partes;
  const desde = desdeSeguro(desdeParam);

  if (primero === "contratos" && segundo) {
    // El acento y el lado del contrato salen de desde dónde se abrió.
    const ladoDesde = segmentoLado(desde.slice(BASE.length).split("/").filter(Boolean)[0]);
    return { modo: "contrato", lado: ladoDesde, relacionId: null, contratoId: segundo, desde };
  }
  const lado = segmentoLado(primero);
  if (lado && segundo) return { modo: "detalle", lado, relacionId: segundo, contratoId: null, desde };
  if (lado) return { modo: "lista", lado, relacionId: null, contratoId: null, desde };
  return { modo: "propio", lado: null, relacionId: null, contratoId: null, desde };
};

export interface EstadoPestana {
  /** Pestaña que se está mostrando (puede ser una oculta). */
  activa: Pestana;
  /** Key que se marca en la barra. */
  resaltada: string;
}

/** Resuelve `?tab=`; una key inválida cae en la primera pestaña. */
export const resolverPestana = (modo: Modo, lado: Lado | null, tab: string | null): EstadoPestana => {
  const visibles = pestanasDe(modo, lado);
  const visible = visibles.find((p) => p.key === tab);
  if (visible) return { activa: visible, resaltada: visible.key };
  const oculta = ocultas(modo, lado).find((p) => p.key === tab);
  if (oculta) return { activa: oculta, resaltada: oculta.resalta };
  return { activa: visibles[0], resaltada: visibles[0].key };
};

export const acentoDe = (modo: Modo, lado: Lado | null): Acento =>
  modo === "propio" || !lado ? "propio" : lado;

/** Banderas de lo que se muestra u oculta según el modo (diseño: empRW, ccTgShow, invShow). */
export const banderasDe = (modo: Modo, lado: Lado | null, resaltada: string) => ({
  /** Detalle de cliente/contratista: todo en solo lectura, sin botones de alta. */
  soloLectura: modo === "detalle",
  /** Puede editar en esta pestaña (empRW). */
  editable: modo !== "detalle" && !(modo === "lista" && resaltada === "empleados"),
  /** Selector Lista / Cumplimiento / Asignación (solo lado contratista). */
  selectorCumplimiento: modo === "lista" && lado === "ctr" && resaltada === "contratistas",
  /** Botón flotante de invitar (solo lado contratista). */
  invitar: modo === "lista" && lado === "ctr",
  /** Acciones de cumplimiento en tablas: en Clientes no hay. */
  accionesCumplimiento: lado !== "cli",
});

/** Quita el tipo de sociedad para títulos ("Aceros del Norte, S.A. de C.V." → "Aceros del Norte"). */
export const nombreCorto = (razon: string): string =>
  razon
    .replace(
      /(?:,\s*|\s+)(S\.?\s?A\.?\s*P\.?\s*I\.?|S\.?\s?A\.?\s*B\.?|S\.?\s?A\.?|S\.?\s?de\s?R\.?\s?L\.?|S\.?\s?C\.?)(\s*de\s*C\.?\s?V\.?)?\s*$/i,
      "",
    )
    .trim();

/** Ruta de una pestaña conservando el resto de la URL. */
export const hrefPestana = (pathname: string, key: string, desde?: string) => {
  const q = new URLSearchParams({ tab: key });
  if (desde) q.set("desde", desde);
  return `${pathname}?${q.toString()}`;
};
