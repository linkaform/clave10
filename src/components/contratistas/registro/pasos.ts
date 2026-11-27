// RG-02 · Pasos y catálogos del wizard de registro, y cuándo se puede continuar.
// Diseño: registro.dc.html, PERFILES / PERSONAS / PASOS (~446–473) y `listo` (~516–535).
import { CUENTA_VACIA, cuentaValida, type DatosCuenta } from "./cuenta";
import { DOCUMENTO_VACIO, csfValido, repseValido, type DatosCsf, type DatosRepse, type PasoDocumento } from "./documentos";
import { Building2, FileText, KeyRound, ShieldCheck, Truck, User, Users, type LucideIcon } from "lucide-react";

export type Perfil = "cliente" | "contratista" | "visitante" | "transportista";

export const PERFILES: { valor: Perfil; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: "cliente", etiqueta: "Cliente", Icono: User },
  { valor: "contratista", etiqueta: "Contratista", Icono: Building2 },
  { valor: "visitante", etiqueta: "Visitante", Icono: Users },
  { valor: "transportista", etiqueta: "Transportista", Icono: Truck },
];

export type Persona = "moral" | "fisica";

export const PERSONAS: { valor: Persona; etiqueta: string; detalle: string; Icono: LucideIcon }[] = [
  { valor: "moral", etiqueta: "Persona moral", detalle: "Empresa constituida ante notario con acta constitutiva y objeto social.", Icono: Building2 },
  { valor: "fisica", etiqueta: "Persona física", detalle: "Persona que presta servicios especializados de forma independiente.", Icono: User },
];

export type IdPaso = "perfil" | "persona" | "repse" | "csf" | "cuenta";

/** En orden. `etiqueta` va en el title de la barra; `titulo`, en el encabezado del paso. */
export const PASOS: { id: IdPaso; etiqueta: string; titulo: string; Icono: LucideIcon }[] = [
  { id: "perfil", etiqueta: "Tipo de perfil", titulo: "Crea tu perfil", Icono: User },
  { id: "persona", etiqueta: "Tipo de persona", titulo: "Tipo de persona", Icono: Building2 },
  { id: "repse", etiqueta: "Registro REPSE", titulo: "Registro REPSE", Icono: ShieldCheck },
  { id: "csf", etiqueta: "Situación fiscal", titulo: "Constancia de situación fiscal", Icono: FileText },
  { id: "cuenta", etiqueta: "Crea tu cuenta", titulo: "Datos de tu cuenta", Icono: KeyRound },
];

/** Lo que se va llenando. Los demás pasos agregan sus campos aquí. */
export interface DatosRegistro {
  perfil: Perfil | null;
  /** Define los campos del paso 5: RFC de 12 (moral) o 13 (física) y CURP solo en física. */
  persona: Persona | null;
  /** Paso 3. Omitido: en el éxito sale "Pendiente". */
  repse: PasoDocumento<DatosRepse>;
  /** Paso 4. Omitida: la cuenta se captura a mano. */
  csf: PasoDocumento<DatosCsf>;
  /** Paso 5. */
  cuenta: DatosCuenta;
}

export const REGISTRO_INICIAL: DatosRegistro = {
  perfil: null, persona: null, repse: DOCUMENTO_VACIO, csf: DOCUMENTO_VACIO, cuenta: CUENTA_VACIA,
};

/** ¿Ya se puede pasar al siguiente paso? */
export function pasoListo(id: IdPaso, d: DatosRegistro): boolean {
  switch (id) {
    case "perfil":
      return !!d.perfil;
    case "persona":
      return !!d.persona;
    case "repse":
      return d.repse.omitido || (d.repse.estado === "listo" && repseValido(d.repse.datos, d.persona));
    case "csf":
      return d.csf.omitido || (d.csf.estado === "listo" && csfValido(d.csf.datos, d.persona));
    case "cuenta":
      return cuentaValida(d.cuenta, d.persona);
  }
}
