"use client";
// RG-02 · Paso 5 · Datos de tu cuenta: identidad, contacto, dominio, contraseña y términos.
// Moral pide razón social, RFC de 12 y representante legal; física, nombre, RFC de 13 y CURP.
// Diseño: registro.dc.html 302–371. Los errores salen al salir de cada campo.
import { useState, type ReactNode } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotonIcono, Campo, Casilla, Consejo, Entrada } from "../ui";
import { DatosExtraidos } from "./CargaDocumento";
import {
  LARGO_CURP, SUFIJO_DOMINIO, erroresCuenta, largoRfc, normalizarDominio, reglasContrasena,
  type CampoCuenta, type DatosCuenta,
} from "./cuenta";
import type { PasoProps } from "./PasosTipo";

export function PasoCuenta({ datos, set }: PasoProps) {
  const c = datos.cuenta;
  const moral = datos.persona === "moral";
  const [tocados, setTocados] = useState<Set<CampoCuenta>>(() => new Set());
  const errores = erroresCuenta(c, datos.persona);
  const err = (k: CampoCuenta) => (tocados.has(k) ? errores[k] : undefined);
  const cambiar = (p: Partial<DatosCuenta>) => set((d) => ({ cuenta: { ...d.cuenta, ...p } }));
  const campo = (k: CampoCuenta, transformar: (v: string) => string = (v) => v) => ({
    value: c[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => cambiar({ [k]: transformar(e.target.value) }),
    onBlur: () => setTocados((t) => new Set(t).add(k)),
  });
  const largo = largoRfc(datos.persona);
  const dominio = c.dominio.trim();

  return (
    <div className="flex flex-col gap-5">
      {datos.csf.estado === "listo" && (
        <DatosExtraidos titulo="Confirma tus datos">
          Prellenamos razón social, RFC y domicilio fiscal con lo que leímos de tu constancia. Completa el resto para activar tu cuenta.
        </DatosExtraidos>
      )}

      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Campo etiqueta={moral ? "Razón social" : "Nombre completo"} obligatorio error={err("razon")} className="sm:col-span-2">
          <Entrada
            {...campo("razon")}
            placeholder={moral ? "Ej. Grupo Insa Servicios Industriales, S.A. de C.V." : "Ej. Carlos Alberto Mendoza Torres"}
          />
        </Campo>
        <Campo etiqueta="RFC" obligatorio error={err("rfc")} ayuda={`${largo} caracteres para persona ${moral ? "moral" : "física"}`}>
          <Entrada
            {...campo("rfc", (v) => v.toUpperCase().replace(/\s/g, ""))}
            maxLength={largo}
            placeholder={moral ? "Ej. GIS180415QX3" : "Ej. METC850215AB3"}
            className="uppercase tabular-nums"
          />
        </Campo>
        {moral ? (
          <Campo etiqueta="Nombre del representante legal" obligatorio error={err("representante")}>
            <Entrada {...campo("representante")} placeholder="Ej. Eduardo Delgado Ríos" />
          </Campo>
        ) : (
          <Campo etiqueta="CURP" obligatorio error={err("curp")}>
            <Entrada
              {...campo("curp", (v) => v.toUpperCase().replace(/\s/g, ""))}
              maxLength={LARGO_CURP}
              placeholder="Ej. METC850215HNLRRS09"
              className="uppercase tabular-nums"
            />
          </Campo>
        )}
        <Campo etiqueta="Correo electrónico" obligatorio error={err("correo")} ayuda="Este será tu usuario para iniciar sesión.">
          <Entrada type="email" {...campo("correo", (v) => v.trim())} placeholder="Ej. contacto@empresa.com" />
        </Campo>
        <Campo etiqueta="Teléfono" obligatorio error={err("telefono")}>
          <ConAfijo antes="MX +52">
            <Entrada
              {...campo("telefono", (v) => v.replace(/\D/g, "").slice(0, 10))}
              inputMode="tel"
              maxLength={10}
              placeholder="Ej. 8112345678"
              className="pl-[68px] tabular-nums"
            />
          </ConAfijo>
        </Campo>
        <Campo
          etiqueta={moral ? "Dominio de tu empresa" : "Dominio de tu perfil"}
          obligatorio={moral}
          error={err("dominio")}
          ayuda={
            dominio && (
              <>
                Vas a entrar en <strong className="font-semibold text-c10-title">{dominio + SUFIJO_DOMINIO}</strong>. Lo confirmamos al crear tu
                cuenta.
              </>
            )
          }
          className="sm:col-span-2"
        >
          <ConAfijo despues={SUFIJO_DOMINIO}>
            <Entrada {...campo("dominio", normalizarDominio)} placeholder="constructoraperez" className="pr-[108px]" />
          </ConAfijo>
        </Campo>
        <Campo etiqueta={moral ? "Dirección de la empresa" : "Dirección"} obligatorio error={err("direccion")} className="sm:col-span-2">
          <Entrada
            {...campo("direccion")}
            placeholder={moral ? "Ej. Blvd. Fundadores 1200, Col. Cumbres, Monterrey, N.L." : "Ej. Av. Revolución 450, Col. Centro, Monterrey, N.L."}
          />
        </Campo>

        <Campo etiqueta="Contraseña" obligatorio>
          <Contrasena {...campo("contrasena")} placeholder="Contraseña" />
          <ul className="flex flex-col gap-1" aria-label="Reglas de la contraseña">
            {reglasContrasena(c.contrasena).map((r) => (
              <li key={r.etiqueta} className={cn("flex items-center gap-1.5 text-xs", r.ok ? "text-green-700" : "text-c10-faint")}>
                {r.ok ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <Circle className="size-3" aria-hidden />}
                {r.etiqueta}
                <span className="sr-only">{r.ok ? "(cumple)" : "(falta)"}</span>
              </li>
            ))}
          </ul>
        </Campo>
        <Campo etiqueta="Confirmar contraseña" obligatorio>
          <Contrasena {...campo("confirmacion")} placeholder="Repite tu contraseña" invalido={!!c.confirmacion && c.confirmacion !== c.contrasena} />
          {c.confirmacion && (
            <span aria-live="polite" className={cn("text-xs", c.confirmacion === c.contrasena ? "text-green-700" : "text-red-600")}>
              {c.confirmacion === c.contrasena ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
            </span>
          )}
        </Campo>
      </div>

      <Consejo>
        <strong className="font-semibold">Nota:</strong> Tu correo será el usuario con el que inicies sesión. Podrás completar documentos,
        ubicaciones y empleados desde Mi empresa en cualquier momento.
      </Consejo>

      <div className="flex items-start gap-2.5">
        <Casilla marcada={c.terminos} onCambio={(terminos) => cambiar({ terminos })} titulo="Acepto los Términos y Condiciones y el Aviso de Privacidad" />
        <span className="cursor-pointer select-none text-sm leading-5 text-c10-label" onClick={() => cambiar({ terminos: !c.terminos })} aria-hidden>
          Al registrarte aceptas los <span className="font-semibold text-c10-acc">Términos y Condiciones</span> y el{" "}
          <span className="font-semibold text-c10-acc">Aviso de Privacidad</span> de Clave 10
        </span>
      </div>
    </div>
  );
}

/** Texto fijo dentro del campo: "MX +52" a la izquierda o ".clave10.com" a la derecha. */
function ConAfijo({ antes, despues, children }: { antes?: string; despues?: string; children: ReactNode }) {
  const afijo = "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-c10-meta";
  return (
    <div className="relative">
      {antes && <span className={cn(afijo, "left-3")}>{antes}</span>}
      {children}
      {despues && <span className={cn(afijo, "right-3")}>{despues}</span>}
    </div>
  );
}

/** Contraseña con el ojo para mostrarla u ocultarla. */
function Contrasena({ invalido, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <Entrada {...props} type={ver ? "text" : "password"} autoComplete="new-password" invalido={invalido} className="pr-11" />
      <BotonIcono
        titulo={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        icono={ver ? <EyeOff /> : <Eye />}
        sinFondo
        onClick={() => setVer((v) => !v)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}
