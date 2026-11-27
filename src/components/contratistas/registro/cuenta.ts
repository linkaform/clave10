// RG-02 · Paso 5 · Datos de la cuenta: reglas, dominio, prellenado y alta.
// Diseño: registro.dc.html 302–371; reglas y `obligatorios` (~516–535), dominio (~724),
// prellenado al pasar del 4 al 5 (~772). El alta real es de RG-01: `crearCuenta` es SIMULADA.
import { domicilioTexto } from "./documentos";
import type { DatosRegistro, Persona } from "./pasos";

export interface DatosCuenta {
  /** Razón social (moral) o nombre completo (física). */
  razon: string;
  rfc: string;
  /** Solo moral. */
  representante: string;
  /** Solo física. */
  curp: string;
  /** Será el usuario para iniciar sesión. */
  correo: string;
  /** 10 dígitos máximo, sin el +52. */
  telefono: string;
  /** Sin ".clave10.com". Obligatorio en moral. */
  dominio: string;
  direccion: string;
  contrasena: string;
  confirmacion: string;
  terminos: boolean;
}

export const CUENTA_VACIA: DatosCuenta = {
  razon: "", rfc: "", representante: "", curp: "", correo: "", telefono: "", dominio: "", direccion: "",
  contrasena: "", confirmacion: "", terminos: false,
};

export const largoRfc = (persona: Persona | null) => (persona === "moral" ? 12 : 13);
export const LARGO_CURP = 18;
export const SUFIJO_DOMINIO = ".clave10.com";

/** Minúsculas, sin acentos ni ñ, espacios y "_" a "-", solo a-z 0-9 y "-", sin "--". */
export function normalizarDominio(v: string): string {
  return v
    .toLowerCase()
    .replace(/ñ/g, "n")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

/** Reglas de la contraseña, en el orden en que se muestran. */
export function reglasContrasena(p: string) {
  return [
    { etiqueta: "Mínimo 8 caracteres", ok: p.length >= 8 },
    { etiqueta: "Una mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(p) },
    { etiqueta: "Un número", ok: /\d/.test(p) },
    { etiqueta: "Un carácter especial", ok: /[^\w\sÁÉÍÓÚÑáéíóúñ]/.test(p) },
  ];
}

export type CampoCuenta = Exclude<keyof DatosCuenta, "terminos">;

/** Lo que falta o está mal. `terminos` aparte: no lleva mensaje, solo deshabilita "Crear cuenta". */
export function erroresCuenta(c: DatosCuenta, persona: Persona | null): Partial<Record<CampoCuenta, string>> {
  const moral = persona === "moral";
  const largo = largoRfc(persona);
  const e: Partial<Record<CampoCuenta, string>> = {};
  if (!c.razon.trim()) e.razon = moral ? "Escribe la razón social" : "Escribe tu nombre completo";
  if (c.rfc.length !== largo) e.rfc = `El RFC lleva ${largo} caracteres`;
  if (moral && !c.representante.trim()) e.representante = "Escribe el nombre del representante legal";
  if (!moral && c.curp.length !== LARGO_CURP) e.curp = `La CURP lleva ${LARGO_CURP} caracteres`;
  if (!c.correo.trim()) e.correo = "Escribe tu correo";
  if (!c.telefono.trim()) e.telefono = "Escribe tu teléfono";
  if (moral && !c.dominio.trim()) e.dominio = "Escribe el dominio de tu empresa";
  if (!c.direccion.trim()) e.direccion = "Escribe la dirección";
  if (!reglasContrasena(c.contrasena).every((r) => r.ok)) e.contrasena = "La contraseña no cumple las reglas";
  if (!c.confirmacion || c.confirmacion !== c.contrasena) e.confirmacion = "Las contraseñas no coinciden";
  return e;
}

export const cuentaValida = (c: DatosCuenta, persona: Persona | null) =>
  c.terminos && Object.keys(erroresCuenta(c, persona)).length === 0;

/** Correos genéricos: su dominio no sirve como dominio de la empresa. */
const CORREO_PUBLICO = /^(gmail|hotmail|outlook|live|yahoo|icloud|me|aol|proton|protonmail)$/;

/**
 * Al llegar al paso 5: llena la cuenta con lo leído. Del REPSE, lo que esté vacío (razón o
 * nombre, RFC y representante); de la constancia, razón social, RFC, correo y dirección
 * (como el diseño) y el dominio si está vacío (la parte del correo después de la @).
 */
export function prellenarCuenta(d: DatosRegistro): DatosCuenta {
  const c = { ...d.cuenta };
  const moral = d.persona === "moral";
  const r = d.repse.estado === "listo" ? d.repse.datos : null;
  const f = d.csf.estado === "listo" ? d.csf.datos : null;
  if (r) {
    c.razon ||= moral ? r.razon : [r.nombres, r.apellido1, r.apellido2].filter(Boolean).join(" ");
    c.rfc ||= r.rfc;
    if (moral) c.representante ||= r.representante;
  }
  if (f) {
    c.razon = f.razon || c.razon;
    c.rfc = f.rfc || c.rfc;
    c.correo = f.correo || c.correo;
    c.direccion = domicilioTexto(f) || c.direccion;
    const dominio = (f.correo.split("@")[1] ?? "").split(".")[0];
    if (!c.dominio && dominio && !CORREO_PUBLICO.test(dominio)) c.dominio = normalizarDominio(dominio);
  }
  c.rfc = c.rfc.toUpperCase().slice(0, largoRfc(d.persona));
  return c;
}

/** SIMULADO (RG-01 lo cambia): crea la cuenta. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- la firma es la que usará RG-01
export async function crearCuenta(_d: DatosRegistro): Promise<void> {
  await new Promise((r) => setTimeout(r, 1200));
}
