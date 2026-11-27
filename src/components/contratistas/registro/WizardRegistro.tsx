"use client";
// RG-02 · Wizard de registro: logo, tarjeta con la barra de 5 pasos, encabezado del
// paso, contenido y pie Atrás / Continuar; abajo "¿Ya tienes cuenta?". Atrás en el
// primer paso regresa al login. Diseño: registro.dc.html 48–67 y 372–383.
// Estilos del kit de Contratistas (F0-05); el diseño solo da contenido y orden.
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton, avisar } from "../ui";
import { Pasos } from "../ligar/piezas";
import {
  PASOS,
  REGISTRO_INICIAL,
  pasoListo,
  type DatosRegistro,
} from "./pasos";
import { PasoPerfil, PasoPersona } from "./PasosTipo";
import { PasoRepse } from "./PasoRepse";
import { PasoCsf } from "./PasoCsf";
import { PasoCuenta } from "./PasoCuenta";
import { crearCuenta, prellenarCuenta } from "./cuenta";
import { ExitoRegistro } from "./ExitoRegistro";

/** El mismo logo del login. */
export const LOGO_CLAVE10 =
  "https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png";

export function WizardRegistro() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [datos, setDatos] = useState<DatosRegistro>(REGISTRO_INICIAL);
  const paso = PASOS[i];
  const listo = pasoListo(paso.id, datos);
  const set = (
    p: Partial<DatosRegistro> | ((d: DatosRegistro) => Partial<DatosRegistro>),
  ) => setDatos((d) => ({ ...d, ...(typeof p === "function" ? p(d) : p) }));
  const [creando, setCreando] = useState(false);
  const [creada, setCreada] = useState(false);

  const ir = (n: number) => {
    setI(n);
    window.scrollTo({ top: 0 });
  };
  /** Al entrar al paso 5 se prellena la cuenta con lo leído del REPSE y la constancia. */
  const avanzar = () => {
    const n = Math.min(i + 1, PASOS.length - 1);
    if (PASOS[n].id === "cuenta")
      setDatos((d) => ({ ...d, cuenta: prellenarCuenta(d) }));
    ir(n);
  };
  const props = { datos, set, avanzar };
  const atras = () => (i === 0 ? router.push("/auth/login") : ir(i - 1));

  const crear = async () => {
    setCreando(true);
    try {
      await crearCuenta(datos);
      setCreada(true);
    } catch (e) {
      avisar(
        e instanceof Error && e.message
          ? e.message
          : "No se pudo crear tu cuenta. Intenta de nuevo.",
        "error",
      );
    } finally {
      setCreando(false);
    }
  };
  const ultimo = paso.id === "cuenta";
  const continuar = () => {
    if (!listo || creando) return;
    if (ultimo) crear();
    else avanzar();
  };

  return (
    <div className="flex min-h-screen justify-center bg-c10-canvas px-4 py-10 sm:items-center">
      <div
        className={cn(
          "flex w-full flex-col gap-5",
          creada ? "max-w-[520px]" : ultimo ? "max-w-[660px]" : "max-w-[560px]",
        )}
      >
        <Image
          className="mx-auto dark:brightness-0 dark:invert"
          src={LOGO_CLAVE10}
          alt="Clave 10"
          width={148}
          height={49}
          priority
        />

        {creada ? (
          <ExitoRegistro datos={datos} />
        ) : (
          <section
            aria-labelledby="registro-titulo"
            className="flex flex-col gap-6 rounded-2xl bg-c10-surface p-6 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.08)] sm:p-8"
          >
            <div className="self-end">
              <Pasos pasos={PASOS.map((p) => p.etiqueta)} actual={i + 1} />
            </div>

            <header className="flex items-center gap-3.5">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-c10-acc-subtle text-c10-acc [&_svg]:size-[22px]"
              >
                <paso.Icono />
              </span>
              <h1
                id="registro-titulo"
                className="text-[22px] font-bold tracking-[-.02em] text-c10-title"
              >
                {paso.titulo}
              </h1>
            </header>

            <div key={paso.id} className="duration-200 animate-in fade-in">
              {paso.id === "perfil" ? (
                <PasoPerfil {...props} />
              ) : paso.id === "persona" ? (
                <PasoPersona {...props} />
              ) : paso.id === "repse" ? (
                <PasoRepse {...props} />
              ) : paso.id === "csf" ? (
                <PasoCsf {...props} />
              ) : (
                <PasoCuenta {...props} />
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-c10-line pt-5">
              <Boton
                variante="texto"
                onClick={atras}
                disabled={creando}
                className="font-medium text-c10-secondary hover:text-c10-title hover:no-underline"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Atrás
              </Boton>
              <Boton
                onClick={continuar}
                disabled={!listo || creando}
                className="h-11 px-6"
              >
                {creando && <Loader2 className="animate-spin" aria-hidden />}
                {ultimo ? "Crear cuenta" : "Continuar"}
                {!ultimo && <ChevronRight className="size-4" aria-hidden />}
              </Boton>
            </footer>
          </section>
        )}

        {!creada && (
          <p className="text-center text-sm text-c10-secondary">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-c10-acc hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
