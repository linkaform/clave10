"use client";
// ME-10 · Detalle del contrato, pestaña Generales: datos, beneficiario, contratista
// (REPSE y actividades STPS), recursos, ubicaciones; rail con cumplimiento documental
// e historial; pausar / reanudar y cancelar. Ficha: lkf-claude,
// contratistas_me10_contrato_generales.md. Diseño: plataforma.dc.html, ctoGenTab
// (~2929), ctoVals (~5550). Datos: ME-14 (contrato e historial) y ME-01 (empresas).
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Ban, Banknote, Boxes, Building2, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink,
  FilePlus, FileSignature, HardHat, ListChecks, MapPin, Pause, Play, Power, RefreshCw, ShieldCheck, Truck, UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Boton, BotonCopiar, BotonIcono, ChipEstado, CLASE_CHIP, TONO } from "@/components/contratistas/ui";
import { colorAvatar, fmtFecha, fmtFechaHora, iniciales } from "@/components/contratistas/documento/formato";
import { useContratistasContexto } from "@/hooks/Contratistas/useContratistasContexto";
import { hrefPestana } from "@/lib/contratistas/contexto";
import { cn } from "@/lib/utils";
import { getEmpresa, getHistorialContrato, listCumplimiento } from "@/services/contratistas";
import type { Contrato, Empresa, EmpresaRef, EventoContrato, EventoContratoTipo } from "@/types/contratistas";
import { plural } from "./contratosLista";
import {
  ESTATUS_REPSE, ESTATUS_UBICACION_TONO, TITULO_EVENTO, chipVigencia, diasAlFin, empleadosConPendientes, fmtDomicilio,
  fmtMonto, resumenUbicaciones, subtextoUbicacion, tarjetasRecursos, type TarjetaRecurso, type UbicacionResumen,
} from "./contratoGenerales";
import { ModalEstatusContrato, type AccionEstatus } from "./ModalEstatusContrato";

export function ContratoGenerales() {
  const { contrato } = useContratistasContexto();
  const [accion, setAccion] = useState<AccionEstatus | null>(null);
  const [railCerrado, setRailCerrado] = useState(false);
  if (!contrato) return <Esqueleto />;

  return (
    <div
      className={cn(
        "grid items-start gap-4",
        railCerrado ? "min-[1100px]:grid-cols-[minmax(0,1fr)_56px]" : "min-[1100px]:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <InformacionContrato c={contrato} onAccion={setAccion} />
      {railCerrado ? <RailCerrado c={contrato} onAbrir={() => setRailCerrado(false)} /> : <Rail c={contrato} onCerrar={() => setRailCerrado(true)} />}
      {accion && <ModalEstatusContrato contrato={contrato} accion={accion} onCerrar={() => setAccion(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- cuerpo */

function InformacionContrato({ c, onAccion }: { c: Contrato; onAccion: (a: AccionEstatus) => void }) {
  return (
    // En < 1100 px el rail baja arriba (diseño: "en < 1100 px baja arriba").
    <section className="order-2 flex min-w-0 flex-col gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)] min-[1100px]:order-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="m-0 text-base font-semibold text-c10-title">Información del contrato</h2>
        <span className={cn(CLASE_CHIP, "bg-c10-acc-l tabular-nums text-c10-acc-h")}>#{c.folio}</span>
        <div className="ml-auto flex items-center gap-2">
          <Boton
            variante="contorno" tam="sm" icono={<ExternalLink />} disabled={!c.contrato_firmado}
            title={c.contrato_firmado ? "Ver contrato firmado" : "Sin contrato firmado"}
            onClick={() => c.contrato_firmado && window.open(c.contrato_firmado.file_url, "_blank", "noopener")}
          >
            Ver contrato
          </Boton>
          <MenuEstatus c={c} onAccion={onAccion} />
        </div>
      </div>

      <DatosContrato c={c} />
      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <Beneficiario parte={c.cliente} />
        <Contratista parte={c.contratista} />
      </div>
      <Recursos c={c} />
      <Ubicaciones c={c} />
    </section>
  );
}

/** Botón power con el menú "Cambiar estatus"; deshabilitado si el contrato está cancelado. */
function MenuEstatus({ c, onAccion }: { c: Contrato; onAccion: (a: AccionEstatus) => void }) {
  const [abierto, setAbierto] = useState(false);
  const cancelado = c.estatus === "Cancelado";
  const pausado = c.estatus === "Pausado";
  const elegir = (a: AccionEstatus) => {
    setAbierto(false);
    onAccion(a);
  };
  const opcion = "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors [&_svg]:size-4";
  return (
    <Popover open={abierto && !cancelado} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <BotonIcono
          titulo={cancelado ? "El contrato está cancelado" : "Cambiar estatus"} icono={<Power />} disabled={cancelado}
          aria-label="Cambiar estatus" className={cn(abierto && "bg-c10-acc-l text-c10-acc")}
        />
      </PopoverTrigger>
      <PopoverContent align="end" role="menu" className="flex w-56 flex-col gap-0.5 rounded-xl border-c10-line bg-c10-surface p-1.5">
        <span className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[.04em] text-c10-meta">Cambiar estatus</span>
        <button type="button" role="menuitem" className={cn(opcion, "text-c10-label hover:bg-c10-sunken")} onClick={() => elegir(pausado ? "reanudar" : "pausar")}>
          {pausado ? <Play /> : <Pause />}
          {pausado ? "Reanudar contrato" : "Pausar contrato"}
        </button>
        <button type="button" role="menuitem" className={cn(opcion, "text-red-600 hover:bg-red-50")} onClick={() => elegir("cancelar")}>
          <Ban />
          Cancelar contrato
        </button>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------------------------------------- bloques */

function Bloque({ icono, titulo, extra, children }: { icono: ReactNode; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-xl p-4 shadow-[0_0_0_1px_var(--c10-line)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-c10-acc-l text-c10-acc [&_svg]:size-4" aria-hidden>
          {icono}
        </span>
        <h3 className="m-0 truncate text-sm font-semibold text-c10-title">{titulo}</h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Campo({ nombre, children, completo, className }: { nombre: string; children: ReactNode; completo?: boolean; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", completo && "col-span-full", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[.04em] text-c10-meta">{nombre}</span>
      <div className="min-w-0 text-sm text-c10-title [text-wrap:pretty]">{children}</div>
    </div>
  );
}

const Vacio = () => <span className="text-c10-faint">---</span>;

function ConCopiar({ valor, etiqueta }: { valor?: string | null; etiqueta: string }) {
  if (!valor) return <Vacio />;
  return (
    <span className="flex items-center gap-1 tabular-nums">
      {valor}
      <BotonCopiar valor={valor} etiqueta={etiqueta} />
    </span>
  );
}

const TONO_VIGENCIA = {
  acento: "bg-c10-acc-l text-c10-acc-h",
  warning: TONO.warning.chip,
  danger: TONO.danger.chip,
};

function DatosContrato({ c }: { c: Contrato }) {
  const dias = diasAlFin(c.fin);
  const chip = dias === null ? null : chipVigencia(dias);
  return (
    <Bloque icono={<FileSignature />} titulo="Datos del contrato">
      <div className="grid gap-4 min-[700px]:grid-cols-3">
        <Campo nombre="Número de contrato">{c.numero_contrato || <Vacio />}</Campo>
        <Campo nombre="Monto del contrato"><span className="tabular-nums">{fmtMonto(c.monto)}</span></Campo>
        <Campo nombre="Vigencia">
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">
              {fmtFecha(c.inicio)} <span className="text-c10-faint">–</span>{" "}
              <span className={cn(dias !== null && dias < 0 ? "text-red-600" : dias !== null && dias <= 30 && "text-amber-700")}>{fmtFecha(c.fin)}</span>
            </span>
            {chip && <span className={cn(CLASE_CHIP, "tabular-nums", TONO_VIGENCIA[chip.tono])}>{chip.texto}</span>}
          </span>
        </Campo>
        <Campo nombre="Descripción detallada del servicio" completo>
          <span className="whitespace-pre-line leading-relaxed text-c10-label">{c.descripcion || c.objeto}</span>
        </Campo>
      </div>
    </Bloque>
  );
}

/** Empresa completa de una parte (REPSE, STPS, registro patronal, domicilio); la ref del contrato mientras carga. */
function useEmpresa(parte: EmpresaRef) {
  return useQuery<Empresa>({
    queryKey: ["contratistas", "empresa", parte.id],
    queryFn: () => getEmpresa(parte.id),
    enabled: !!parte.id,
    staleTime: 5 * 60 * 1000,
  });
}

function Beneficiario({ parte }: { parte: EmpresaRef }) {
  const { data: e, isLoading } = useEmpresa(parte);
  const rp = e?.registros_patronales[0]?.nrp;
  const dir = fmtDomicilio(e?.domicilio_fiscal);
  return (
    <Bloque icono={<Building2 />} titulo="Beneficiario">
      <div className="grid gap-4 min-[500px]:grid-cols-2">
        <Campo nombre="Razón social" completo>{e?.razon_social || parte.razon_social || <Vacio />}</Campo>
        <Campo nombre="RFC"><ConCopiar valor={e?.rfc || parte.rfc} etiqueta="RFC" /></Campo>
        <Campo nombre="Registro patronal">{isLoading ? <Cargando /> : <ConCopiar valor={rp} etiqueta="registro patronal" />}</Campo>
        <Campo nombre="Dirección" completo>{isLoading ? <Cargando /> : dir || <Vacio />}</Campo>
      </div>
    </Bloque>
  );
}

function Contratista({ parte }: { parte: EmpresaRef }) {
  const { data: e, isLoading } = useEmpresa(parte);
  const repse = e?.repse;
  const est = ESTATUS_REPSE[repse?.estatus ?? "Sin REPSE"];
  const acts = e?.actividades_stps ?? [];
  return (
    <Bloque
      icono={<ShieldCheck />} titulo="Contratista"
      extra={e && <ChipEstado texto={est.texto} tono={est.tono} className="ml-auto" />}
    >
      <div className="grid gap-4 min-[500px]:grid-cols-2">
        <Campo nombre="Razón social" completo>{e?.razon_social || parte.razon_social || <Vacio />}</Campo>
        <Campo nombre="RFC"><ConCopiar valor={e?.rfc || parte.rfc} etiqueta="RFC" /></Campo>
        <Campo nombre="Registro REPSE">
          {isLoading ? (
            <Cargando />
          ) : repse?.folio ? (
            <span className="flex flex-col gap-0.5">
              <ConCopiar valor={repse.folio} etiqueta="registro REPSE" />
              {repse.fin && (
                <span title={est.texto} className={cn("text-xs tabular-nums", est.tono === "danger" ? "text-red-600" : est.tono === "warning" ? "text-amber-700" : "text-c10-meta")}>
                  Hasta {fmtFecha(repse.fin)}
                </span>
              )}
            </span>
          ) : (
            <Vacio />
          )}
        </Campo>
        <Campo nombre="Actividades autorizadas ante la STPS" completo>
          {isLoading ? (
            <Cargando />
          ) : acts.length ? (
            <span className="flex flex-col gap-1.5">
              {acts.map((a) => (
                <span key={a.clave + a.descripcion} className="flex items-start justify-between gap-3 rounded-lg bg-c10-panel px-3 py-2">
                  <span className="min-w-0 text-c10-label">{a.descripcion}</span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-c10-meta">{a.clave}</span>
                </span>
              ))}
            </span>
          ) : (
            <Vacio />
          )}
        </Campo>
      </div>
    </Bloque>
  );
}

const ICONO_RECURSO: Record<TarjetaRecurso["clave"], LucideIcon> = {
  perfiles: HardHat,
  servicios: ClipboardCheck,
  Vehículo: Truck,
  Equipo: Boxes,
  Herramienta: Boxes,
};

const COLOR_RECURSO = (k: TarjetaRecurso["clave"]) =>
  k === "perfiles" ? "bg-c10-acc-l text-c10-acc" : k === "servicios" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-800";

function Recursos({ c }: { c: Contrato }) {
  const tarjetas = tarjetasRecursos(c);
  return (
    <Bloque icono={<Boxes />} titulo="Recursos del contrato">
      <div className="grid gap-3 min-[700px]:grid-cols-2 min-[1400px]:grid-cols-3">
        {tarjetas.map((t) => {
          const Icono = ICONO_RECURSO[t.clave];
          return (
            <div key={t.clave} className="flex min-w-0 flex-col gap-2.5 rounded-xl bg-c10-panel p-3.5">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", COLOR_RECURSO(t.clave))} aria-hidden>
                  <Icono />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-c10-title">{t.titulo}</span>
                  <span className="text-xs text-c10-meta">{t.subtitulo}</span>
                </span>
                <span className="ml-auto text-lg font-semibold tabular-nums text-c10-title">{t.total}</span>
              </div>
              {t.items.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {t.items.map((x, i) => (
                    <span
                      key={`${x.nombre}-${i}`}
                      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-c10-surface pl-2.5 pr-1 text-xs text-c10-label shadow-[0_0_0_1px_var(--c10-line)]"
                    >
                      <span className="truncate">{x.nombre}</span>
                      {x.cantidad !== undefined ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-c10-sunken px-1.5 text-[11px] font-semibold tabular-nums text-c10-title">
                          {x.cantidad}
                        </span>
                      ) : (
                        <span className="w-1.5" />
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-c10-faint">Sin {t.titulo.toLowerCase()}</span>
              )}
            </div>
          );
        })}
      </div>
    </Bloque>
  );
}

function Ubicaciones({ c }: { c: Contrato }) {
  // El subtexto de expedientes sale del motor de cumplimiento (ME-15); si falla, solo no se pinta.
  const cum = useQuery({
    queryKey: ["contratistas", "cumplimiento", { contrato_id: c.id, sujeto_tipo: "Persona" }],
    queryFn: () => listCumplimiento({ contrato_id: c.id, sujeto_tipo: "Persona" }),
    enabled: c.empleados.length > 0,
    staleTime: 60 * 1000,
  });
  const pend = cum.data ? empleadosConPendientes(cum.data) : null;
  const ubs = resumenUbicaciones(c, pend);
  return (
    <Bloque
      icono={<MapPin />} titulo="Ubicaciones"
      extra={<span className={cn(CLASE_CHIP, "bg-c10-acc-l tabular-nums text-c10-acc-h")}>{ubs.length}</span>}
    >
      {ubs.length ? (
        <div className="flex flex-col overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--c10-line)]">
          {ubs.map((u, i) => <FilaUbicacion key={u.id || i} u={u} primera={i === 0} />)}
        </div>
      ) : (
        <span className="text-sm text-c10-faint">El contrato no tiene ubicaciones.</span>
      )}
    </Bloque>
  );
}

function FilaUbicacion({ u, primera }: { u: UbicacionResumen; primera: boolean }) {
  const sub = subtextoUbicacion(u);
  const visibles = u.empleados.slice(0, 3);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3", !primera && "border-t border-c10-sunken")}>
      <span className="min-w-[180px] flex-1 truncate text-sm font-medium text-c10-title" title={u.nombre}>{u.nombre}</span>
      <span className="flex items-center gap-3">
        <span className="flex items-center pl-1.5">
          {visibles.map((n, k) => (
            <span
              key={`${n}-${k}`} title={n}
              className={cn("-ml-1.5 flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-c10-surface", colorAvatar(n))}
            >
              {iniciales(n)}
            </span>
          ))}
          {u.empleados.length > 3 && (
            <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-c10-sunken text-[10px] font-semibold tabular-nums text-c10-label ring-2 ring-c10-surface">
              +{u.empleados.length - 3}
            </span>
          )}
          {!u.empleados.length && (
            <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-c10-sunken text-c10-faint [&_svg]:size-3.5">
              <UsersRound />
            </span>
          )}
        </span>
        <span className="flex w-[150px] flex-col">
          <span className="text-sm tabular-nums text-c10-title">
            {u.empleados.length ? plural(u.empleados.length, "empleado", "empleados") : "Sin empleados"}
          </span>
          {sub && <span className={cn("text-xs", u.pendientes ? "text-amber-700" : "text-c10-meta")}>{sub}</span>}
        </span>
        <ChipEstado texto={u.estatus} tono={ESTATUS_UBICACION_TONO[u.estatus]} />
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- rail */

const ANILLOS = [
  { k: "contrato", nombre: "Contrato", color: "var(--c10-acc)" },
  { k: "empleados", nombre: "Empleados", color: "var(--c10-acc-m)" },
  { k: "periodicos", nombre: "Periódicos", color: "var(--c10-acc-b)" },
] as const;

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));

/** Un anillo partido en tres tramos (Contrato, Empleados, Periódicos), cada uno lleno según su %. */
function Dona({ c }: { c: Contrato }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const tramo = C / ANILLOS.length;
  return (
    <svg viewBox="0 0 100 100" width={112} height={112} className="-rotate-90" aria-hidden>
      <circle cx={50} cy={50} r={R} fill="none" stroke="var(--c10-sunken)" strokeWidth={12} />
      {ANILLOS.map((a, i) => {
        const p = pct(c.cumplimiento[a.k]);
        const lleno = Math.max(0, (tramo - 2) * (p / 100));
        return (
          <circle
            key={a.k} cx={50} cy={50} r={R} fill="none" stroke={a.color} strokeWidth={12}
            strokeDasharray={`${lleno.toFixed(2)} ${(C - lleno).toFixed(2)}`} strokeDashoffset={(-tramo * i).toFixed(2)}
          >
            <title>{`${a.nombre}: ${p}%`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

function Rail({ c, onCerrar }: { c: Contrato; onCerrar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { desde } = useContratistasContexto();
  const hist = useQuery<EventoContrato[]>({
    queryKey: ["contratistas", "contrato-historial", c.id],
    queryFn: () => getHistorialContrato(c.id),
  });
  const eventos = hist.data ?? [];
  return (
    <aside
      className={cn(
        "order-1 flex min-w-0 flex-col overflow-hidden rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)] min-[1100px]:order-2",
        "min-[1100px]:sticky min-[1100px]:top-[calc(var(--c10-header-h,65px)+112px)] min-[1100px]:max-h-[calc(100vh-var(--c10-header-h,65px)-136px)]",
      )}
    >
      <div className="flex flex-col gap-4 border-b border-c10-sunken p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold text-c10-title">Cumplimiento documental</h3>
          <BotonIcono titulo="Colapsar" icono={<ChevronRight className="max-[1099px]:rotate-[-90deg]" />} onClick={onCerrar} />
        </div>
        <div className="flex items-center gap-5">
          <div className="relative flex shrink-0 items-center justify-center">
            <Dona c={c} />
            <span className="absolute flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-[.04em] text-c10-meta">Cumplimiento</span>
              <span className="text-xl font-semibold tabular-nums text-c10-title">{pct(c.cumplimiento.total)}%</span>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {ANILLOS.map((a) => (
              <div key={a.k} className="flex items-center gap-2 text-sm" title={`${a.nombre}: ${pct(c.cumplimiento[a.k])}%`}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
                <span className="flex-1 text-c10-label">{a.nombre}</span>
                <span className="font-semibold tabular-nums text-c10-title">{pct(c.cumplimiento[a.k])}%</span>
              </div>
            ))}
          </div>
        </div>
        <Boton variante="contorno" tam="sm" icono={<ListChecks />} onClick={() => router.push(hrefPestana(pathname, "requerimientos", desde), { scroll: false })}>
          Ver requerimientos
        </Boton>
      </div>

      <div className="flex items-center gap-2 px-5 pb-2 pt-4">
        <h3 className="m-0 text-sm font-semibold text-c10-title">Historial de modificaciones</h3>
        <span className={cn(CLASE_CHIP, "bg-c10-acc-l tabular-nums text-c10-acc-h")}>{eventos.length}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4 pt-1 max-[1099px]:max-h-[420px]">
        {hist.isLoading ? (
          <Cargando />
        ) : hist.error ? (
          <span className="text-sm text-red-600">No se pudo cargar el historial.</span>
        ) : eventos.length ? (
          eventos.map((h, k) => <Evento key={h.id} h={h} primero={k === 0} ultimo={k === eventos.length - 1} />)
        ) : (
          <span className="text-sm text-c10-faint">Sin modificaciones.</span>
        )}
      </div>
    </aside>
  );
}

const ICONO_EVENTO: Record<EventoContratoTipo, LucideIcon> = {
  Creación: FilePlus,
  Ubicaciones: MapPin,
  Perfiles: HardHat,
  Equipos: Truck,
  Servicios: ClipboardCheck,
  Empleados: UsersRound,
  Monto: Banknote,
  Vigencia: CalendarPlus,
  Estatus: RefreshCw,
  Pausa: Pause,
  Reanudación: Play,
  Cancelación: Ban,
  Modificatorio: FileSignature,
};

function Evento({ h, primero, ultimo }: { h: EventoContrato; primero: boolean; ultimo: boolean }) {
  const Icono = ICONO_EVENTO[h.evento] ?? RefreshCw;
  return (
    <div className="relative flex gap-3 pb-[18px]">
      {!ultimo && <span className="absolute bottom-0.5 left-[15px] top-[34px] w-0.5 rounded bg-c10-line" aria-hidden />}
      <span
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-[15px]",
          primero ? "bg-c10-acc text-white" : "bg-c10-acc-subtle text-c10-acc",
        )}
        aria-hidden
      >
        <Icono />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] pt-[5px]">
        <span className="text-sm font-semibold leading-snug text-c10-title">{TITULO_EVENTO[h.evento] ?? h.evento}</span>
        {h.detalle && <span className="text-[13px] leading-normal tabular-nums text-c10-secondary [text-wrap:pretty]">{h.detalle}</span>}
        {h.documento && (
          <a href={h.documento.file_url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-c10-acc hover:underline">
            {h.documento.name || "Convenio modificatorio"}
          </a>
        )}
        <span className="text-xs tabular-nums text-c10-faint">{[fmtFechaHora(h.fecha), h.autor].filter(Boolean).join(" · ")}</span>
      </div>
    </div>
  );
}

/** Rail colapsado: tira de 56 px (horizontal en < 1100 px) con el % y la flecha para abrir. */
function RailCerrado({ c, onAbrir }: { c: Contrato; onAbrir: () => void }) {
  return (
    <button
      type="button" onClick={onAbrir} title="Ver cumplimiento e historial" aria-label="Ver cumplimiento e historial"
      className={cn(
        "order-1 flex items-center gap-3 rounded-xl bg-c10-surface px-4 py-3 text-c10-label shadow-[0_0_0_1px_var(--c10-line-card)] transition-colors hover:text-c10-acc min-[1100px]:order-2",
        "min-[1100px]:sticky min-[1100px]:top-[calc(var(--c10-header-h,65px)+112px)] min-[1100px]:flex-col min-[1100px]:px-0 min-[1100px]:py-3.5",
      )}
    >
      <span className="text-sm font-semibold tabular-nums text-c10-title">{pct(c.cumplimiento.total)}%</span>
      <span className="text-xs font-medium min-[1100px]:[writing-mode:vertical-rl]">Cumplimiento</span>
      <span className="ml-auto flex [&_svg]:size-4 min-[1100px]:ml-0 min-[1100px]:mt-auto">
        <ChevronDown className="min-[1100px]:hidden" />
        <ChevronLeft className="max-[1099px]:hidden" />
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- carga */

const Cargando = () => <span className="inline-block h-4 w-24 animate-pulse rounded bg-c10-skeleton align-middle" />;

function Esqueleto() {
  return (
    <div className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
      <div className="h-[640px] animate-pulse rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)]" />
      <div className="h-[420px] animate-pulse rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)]" />
    </div>
  );
}
