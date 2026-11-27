// RG-02 · Documentos del wizard (REPSE y CSF): validación del archivo, lectura y datos.
// La lectura es SIMULADA como en el diseño (registro.dc.html `simular`, ~615): espera
// 1.9 s y regresa datos fijos. RG-03 la cambia por el servicio de extracción (F0-11).
import type { Persona } from "./pasos";

export const MAX_PDF_MB = 10;

/** Estado de un paso con documento: vacío → leyendo → listo, u omitido. */
export interface PasoDocumento<D> {
  estado: "vacio" | "leyendo" | "listo";
  archivo: File | null;
  datos: D | null;
  omitido: boolean;
  /** No se pudo usar el archivo (tipo, tamaño o lectura). */
  error?: string;
}

export const DOCUMENTO_VACIO = { estado: "vacio", archivo: null, datos: null, omitido: false } as const;

/** "El archivo debe ser PDF" / "…pesa más de 10 MB"; null si sirve. */
export function errorPdf(f: File): string | null {
  const pdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
  if (!pdf) return "El archivo debe ser PDF";
  if (f.size > MAX_PDF_MB * 1024 * 1024) return `El archivo pesa más de ${MAX_PDF_MB} MB`;
  return null;
}

export interface ActividadRepse {
  nombre: string;
  clave: string;
}

export interface DatosRepse {
  folio: string;
  /** yyyy-mm-dd */
  inicio: string;
  fin: string;
  /** Persona moral. */
  razon: string;
  /** Persona física. */
  nombres: string;
  apellido1: string;
  apellido2: string;
  /** Autorizadas ante la STPS; solo lectura. */
  actividades: ActividadRepse[];
  /** Para prellenar el paso 5 (RG-03). */
  rfc: string;
  representante: string;
}

/** Obligatorios del REPSE: folio y razón social (moral) o nombre y primer apellido (física). */
export function erroresRepse(d: DatosRepse, persona: Persona | null) {
  return {
    folio: d.folio.trim() ? undefined : "Escribe el número de registro",
    razon: persona === "moral" && !d.razon.trim() ? "Escribe la razón social" : undefined,
    nombres: persona !== "moral" && !d.nombres.trim() ? "Escribe el nombre" : undefined,
    apellido1: persona !== "moral" && !d.apellido1.trim() ? "Escribe el primer apellido" : undefined,
  };
}

export const repseValido = (d: DatosRepse | null, persona: Persona | null) =>
  !!d && !Object.values(erroresRepse(d, persona)).some(Boolean);

/** Meses completos que faltan para `fin` (yyyy-mm-dd); negativo si ya venció. */
export function mesesRestantes(fin: string, hoy = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fin);
  if (!m) return null;
  const f = new Date(+m[1], +m[2] - 1, +m[3]);
  if (f < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return -1;
  let meses = (f.getFullYear() - hoy.getFullYear()) * 12 + f.getMonth() - hoy.getMonth();
  if (f.getDate() < hoy.getDate()) meses--;
  return Math.max(0, meses);
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** SIMULADO (RG-03 lo cambia): lee el aviso de registro REPSE. */
export async function leerRepse(_archivo: File, persona: Persona | null): Promise<DatosRepse> {
  await espera(1900);
  const fisica = persona === "fisica";
  return {
    folio: "AGN-2841/2024",
    inicio: "2024-12-28",
    fin: "2027-12-28",
    razon: "Grupo Insa Servicios Industriales, S.A. de C.V.",
    nombres: "Carlos",
    apellido1: "Mendoza",
    apellido2: "Torres",
    actividades: [
      { nombre: "Mantenimiento industrial", clave: "3339" },
      { nombre: "Instalaciones eléctricas", clave: "2382" },
      { nombre: "Soldadura especializada", clave: "3323" },
      { nombre: "Obra civil complementaria", clave: "2379" },
      { nombre: "Seguridad industrial", clave: "5616" },
      { nombre: "Transporte y maniobras", clave: "4841" },
    ],
    rfc: fisica ? "METC850215AB3" : "GIS180415QX3",
    representante: fisica ? "" : "Eduardo Delgado Ríos",
  };
}

// ---------- Constancia de situación fiscal (paso 4) ----------

export interface DatosCsf {
  /** Razón social (moral) o nombre completo (física). */
  razon: string;
  rfc: string;
  correo: string;
  /** Estatus en el padrón del SAT; solo lectura. */
  estatus: "Activo" | "Inactivo";
  cp: string;
  tipoVialidad: string;
  vialidad: string;
  exterior: string;
  interior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  estado: string;
  entreCalle: string;
  yCalle: string;
}

/** Campos del domicilio fiscal, en el orden del diseño. `ancho`: ocupa las dos columnas. */
export const CAMPOS_DOMICILIO: { k: keyof DatosCsf; etiqueta: string; ancho?: boolean }[] = [
  { k: "cp", etiqueta: "Código postal" },
  { k: "tipoVialidad", etiqueta: "Tipo de vialidad" },
  { k: "vialidad", etiqueta: "Nombre de vialidad", ancho: true },
  { k: "exterior", etiqueta: "Número exterior" },
  { k: "interior", etiqueta: "Número interior" },
  { k: "colonia", etiqueta: "Nombre de la colonia" },
  { k: "localidad", etiqueta: "Nombre de la localidad" },
  { k: "municipio", etiqueta: "Nombre del municipio o delegación" },
  { k: "estado", etiqueta: "Nombre del estado o Distrito Federal" },
  { k: "entreCalle", etiqueta: "Entre calle" },
  { k: "yCalle", etiqueta: "Y calle" },
];

/** Obligatorios de la constancia: razón social o nombre, RFC y correo. */
export function erroresCsf(d: DatosCsf, persona: Persona | null) {
  return {
    razon: d.razon.trim() ? undefined : persona === "moral" ? "Escribe la razón social" : "Escribe el nombre completo",
    rfc: d.rfc.trim() ? undefined : "Escribe el RFC",
    correo: d.correo.trim() ? undefined : "Escribe el correo",
  };
}

export const csfValido = (d: DatosCsf | null, persona: Persona | null) =>
  !!d && !Object.values(erroresCsf(d, persona)).some(Boolean);

/** "Boulevard Fundadores, No. 1200, Piso 4, Col. Cumbres, C.P. 64610, Monterrey, Nuevo León". */
export function domicilioTexto(f: DatosCsf): string {
  return [
    [f.tipoVialidad, f.vialidad].filter(Boolean).join(" "),
    f.exterior && `No. ${f.exterior}`,
    f.interior,
    f.colonia && `Col. ${f.colonia}`,
    f.cp && `C.P. ${f.cp}`,
    f.municipio,
    f.estado,
  ]
    .filter(Boolean)
    .join(", ");
}

/** SIMULADO (RG-03 lo cambia): lee la constancia de situación fiscal. */
export async function leerCsf(_archivo: File, persona: Persona | null): Promise<DatosCsf> {
  await espera(1900);
  return persona === "fisica"
    ? {
        razon: "Carlos Alberto Mendoza Torres", rfc: "METC850215AB3", correo: "carlos.mendoza.elec@gmail.com", estatus: "Activo",
        cp: "64000", tipoVialidad: "Avenida", vialidad: "Revolución", exterior: "450", interior: "", colonia: "Centro",
        localidad: "Monterrey", municipio: "Monterrey", estado: "Nuevo León", entreCalle: "Calle Padre Mier", yCalle: "Calle Matamoros",
      }
    : {
        razon: "Grupo Insa Servicios Industriales, S.A. de C.V.", rfc: "GIS180415QX3", correo: "contacto@grupoinsa.mx", estatus: "Activo",
        cp: "64610", tipoVialidad: "Boulevard", vialidad: "Fundadores", exterior: "1200", interior: "Piso 4", colonia: "Cumbres",
        localidad: "Monterrey", municipio: "Monterrey", estado: "Nuevo León", entreCalle: "Av. Paseo de los Leones", yCalle: "Calle Cordillera",
      };
}
