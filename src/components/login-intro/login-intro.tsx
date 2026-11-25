"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LOGO_PATHS } from "./logo-paths";
import styles from "./login-intro.module.css";

const EVENTO = "c10:login-intro";
const LOGO_LOGIN_ID = "login-logo";
const VUELO_MS = 700; // el logo del login viaja al centro
const REGRESO_MS = 450; // vuelta a la tarjeta si el login falla (= .regresando .fondo)
const EXITO_MIN_MS = 1200; // lo que tarda en entrar el slogan tras el éxito
const SALIDA_MS = 450; // = .saliendo en el CSS
const TOPE_MS = 25000; // por si la navegación nunca llega

type Rect = { left: number; top: number; width: number; height: number };
type Fase = "off" | "esperando" | "exito" | "saliendo" | "regresando";
type Detalle = { tipo: "inicio"; desde: Rect | null } | { tipo: "ok" } | { tipo: "cancelar" };

const emitir = (d: Detalle) => window.dispatchEvent(new CustomEvent<Detalle>(EVENTO, { detail: d }));
const logoLogin = () => document.getElementById(LOGO_LOGIN_ID);

/** Al enviar el login: el logo vuela al centro y late mientras corre la petición. */
export function playLoginIntro() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const logo = logoLogin();
  const r = logo?.getBoundingClientRect();
  if (logo) logo.style.visibility = "hidden"; // el overlay toma su lugar
  emitir({ tipo: "inicio", desde: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null });
}

/** Login correcto: aparece el slogan y se va cuando el dashboard está listo. */
export function loginIntroOk() {
  if (typeof window !== "undefined") emitir({ tipo: "ok" });
}

/** Login fallido: el logo regresa a la tarjeta. */
export function cancelLoginIntro() {
  if (typeof window !== "undefined") emitir({ tipo: "cancelar" });
}

/** Overlay con la animación del logo. Va en el layout raíz para que siga
 *  visible mientras el login navega al dashboard. */
export function LoginIntro() {
  const pathname = usePathname();
  const [fase, setFase] = useState<Fase>("off");
  const [desde, setDesde] = useState<Rect | null>(null);
  const [rutaInicio, setRutaInicio] = useState<string | null>(null);
  const [sloganVisto, setSloganVisto] = useState(false);
  const [movil, setMovil] = useState(false); // en pantallas angostas el slogan va abajo
  const vueloRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inicioRef = useRef(0); // cuándo empezó el vuelo
  const faseRef = useRef<Fase>("off");
  faseRef.current = fase;

  // transform de "estar encima del logo del login", relativo a su lugar en el overlay
  const transformDesde = (r: Rect) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p0 = new DOMPoint(0, 0).matrixTransform(ctm); // logo dentro del svg: 0..2078 x 0..828
    const p1 = new DOMPoint(2078, 828).matrixTransform(ctm);
    const w = p1.x - p0.x;
    const dx = r.left + r.width / 2 - (p0.x + w / 2);
    const dy = r.top + r.height / 2 - (p0.y + (p1.y - p0.y) / 2);
    return `translate(${dx}px, ${dy}px) scale(${r.width / w})`;
  };

  // eventos que manda el login
  useEffect(() => {
    let espera: ReturnType<typeof setTimeout>;
    const onEvento = (e: Event) => {
      const d = (e as CustomEvent<Detalle>).detail;
      clearTimeout(espera);
      if (d.tipo === "inicio") {
        inicioRef.current = performance.now();
        setDesde(d.desde);
        setRutaInicio(window.location.pathname);
        setSloganVisto(false);
        setMovil(window.matchMedia("(max-width: 639px)").matches);
        setFase("esperando");
      } else if (d.tipo === "ok" && faseRef.current === "esperando") {
        // el slogan entra cuando el logo ya aterrizó
        const resta = VUELO_MS - (performance.now() - inicioRef.current);
        espera = setTimeout(() => setFase("exito"), Math.max(0, resta));
      } else if (d.tipo === "cancelar" && faseRef.current !== "off") {
        setFase("regresando");
      }
    };
    window.addEventListener(EVENTO, onEvento);
    return () => {
      window.removeEventListener(EVENTO, onEvento);
      clearTimeout(espera);
    };
  }, []);

  // vuelo de ida: del logo del login a su lugar en el overlay (FLIP)
  useLayoutEffect(() => {
    if (fase !== "esperando" || !desde || !vueloRef.current) return;
    const t = transformDesde(desde);
    if (!t) return;
    vueloRef.current.animate([{ transform: t }, { transform: "none" }], {
      duration: VUELO_MS,
      easing: "cubic-bezier(.65,0,.25,1)",
    });
  }, [fase, desde]);

  // vuelo de regreso (login fallido) y desmontaje
  useLayoutEffect(() => {
    if (fase !== "regresando") return;
    const el = vueloRef.current;
    const t = desde && transformDesde(desde);
    if (el && t) {
      const actual = getComputedStyle(el).transform; // por si sigue a medio vuelo de ida
      el.getAnimations().forEach((a) => a.cancel());
      el.animate([{ transform: actual === "none" ? "none" : actual }, { transform: t }], {
        duration: REGRESO_MS,
        easing: "cubic-bezier(.65,0,.25,1)",
        fill: "forwards",
      });
    }
    const fin = setTimeout(terminar, REGRESO_MS);
    return () => clearTimeout(fin);
  }, [fase, desde]);

  // éxito: tiempo mínimo para ver el slogan
  useEffect(() => {
    if (fase !== "exito") return;
    const t = setTimeout(() => setSloganVisto(true), EXITO_MIN_MS);
    return () => clearTimeout(t);
  }, [fase]);

  // tope de seguridad
  const activo = fase !== "off";
  useEffect(() => {
    if (!activo) return;
    const t = setTimeout(() => setFase((f) => (f === "regresando" ? f : "saliendo")), TOPE_MS);
    return () => clearTimeout(t);
  }, [activo]);

  // se va cuando ya navegó fuera del login y se vio el slogan
  const navego = rutaInicio !== null && pathname !== rutaInicio;
  useEffect(() => {
    if (fase === "exito" && sloganVisto && navego) setFase("saliendo");
  }, [fase, sloganVisto, navego]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = setTimeout(terminar, SALIDA_MS);
    return () => clearTimeout(t);
  }, [fase]);

  function terminar() {
    setFase("off");
    setRutaInicio(null);
    const logo = logoLogin(); // si el login sigue en pantalla, regresa su logo
    if (logo) logo.style.visibility = "";
  }

  if (fase === "off") return null;

  const pieza = styles.p;
  return (
    <div
      className={`${styles.overlay} ${movil ? styles.movil : ""} ${fase === "exito" || fase === "saliendo" ? styles.exito : ""} ${
        fase === "saliendo" ? styles.saliendo : ""
      } ${fase === "regresando" ? styles.regresando : ""}`}
      aria-hidden="true"
    >
      <div className={styles.fondo} />
      <div ref={vueloRef} className={styles.vuelo}>
        <svg
          ref={svgRef}
          className={styles.svg}
          // escritorio: slogan a la derecha; móvil: slogan abajo en una línea
          viewBox={movil ? "0 -176 2078 1180" : "-470 0 3018 828"}
          fillRule="evenodd"
        >
          <g className={styles.todo}>
            {(["c", "l", "a", "v", "e"] as const).map((id) => (
              <path key={id} d={LOGO_PATHS[id]} />
            ))}
            <path d={LOGO_PATHS.escudo} className={`${pieza} ${styles.escudo}`} />
            <path d={LOGO_PATHS.uno} className={`${pieza} ${styles.diez}`} />
            <path d={LOGO_PATHS.cero} className={`${pieza} ${styles.diez}`} style={{ animationDelay: "0.08s" }} />
            {movil ? (
              <>
                <rect x="889" y="905" width="300" height="14" rx="7" className={`${pieza} ${styles.raya}`} />
                <text
                  x="1039"
                  y="1100"
                  textAnchor="middle"
                  className={`${pieza} ${styles.slogan}`}
                  style={{ animationDelay: "0.5s" }}
                >
                  Operación segura.
                </text>
              </>
            ) : (
              <>
                <rect x="2140" y="235" width="14" height="330" rx="7" className={`${pieza} ${styles.raya}`} />
                <text x="2240" y="380" className={`${pieza} ${styles.slogan}`} style={{ animationDelay: "0.5s" }}>
                  Operación
                </text>
                <text x="2240" y="560" className={`${pieza} ${styles.slogan}`} style={{ animationDelay: "0.62s" }}>
                  segura.
                </text>
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
