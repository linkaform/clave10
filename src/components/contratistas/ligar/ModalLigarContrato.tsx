"use client";
// F0-15 · Ligar un empleado a un contrato, en dos pasos: contrato y perfiles. También
// "Editar perfiles" de un contrato ya ligado (solo el paso 2). Diseño: plataforma.dc.html,
// edLink (~4005, ~4026–4058) y su lógica (~8347–8355). Contenido y reglas: ME-05.
import { useState } from "react";
import { Check, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton, CLASE_CHIP, ChipFolio, Modal } from "../ui";
import { TONO } from "../ui/tonos";
import { coincide } from "../filtros";
import { BarraBusqueda, BotonTodos, MensajeVacio, Pasos, TarjetaOpcion, type FiltrosSeleccion } from "./piezas";
import { alternarUno, alternarVarios, cuantos, estadoDe, useAlAbrir, useGuardar } from "./seleccion";

export interface ContratoLigar {
  folio: string;
  cliente: string;
  servicio: string;
  /** Objeto o nombre del contrato. */
  nombre: string;
  /** Perfiles que pide el contrato. */
  perfiles: string[];
}

export interface LigarContratoResultado {
  folio: string;
  /** Perfiles con los que cubrirá el contrato. */
  perfiles: string[];
  /** Los que el empleado no tenía: se le agregan al asignarlo. */
  nuevos: string[];
}

export interface ModalLigarContratoProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Contratos activos en los que todavía no está. */
  contratos: ContratoLigar[];
  /** Perfiles que ya tiene el empleado. */
  perfilesEmpleado: string[];
  onLigar: (r: LigarContratoResultado) => unknown;
  /** "Editar perfiles": salta al paso 2 con este contrato y estos perfiles marcados. */
  editar?: { contrato: ContratoLigar; perfiles: string[] };
  filtros?: FiltrosSeleccion;
}

const PASOS = ["Contrato", "Perfiles"];

export function ModalLigarContrato({
  abierto, onCerrar, contratos, perfilesEmpleado: P, onLigar, editar, filtros,
}: ModalLigarContratoProps) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [folio, setFolio] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [qP, setQP] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const g = useGuardar(onCerrar);
  useAlAbrir(abierto, () => {
    setPaso(editar ? 2 : 1);
    setFolio(editar?.contrato.folio ?? null);
    setQ("");
    setQP("");
    setSel(editar?.perfiles ?? []);
  });

  const K = editar?.contrato ?? contratos.find((c) => c.folio === folio) ?? null;
  const tiene = (p: string) => P.includes(p);
  const opciones = contratos
    .filter((c) => coincide(q, c.cliente, c.nombre, c.servicio, c.folio))
    .map((c) => ({ c, coinciden: c.perfiles.filter(tiene) }))
    .sort((a, b) => Number(b.coinciden.length > 0) - Number(a.coinciden.length > 0));
  const visP = (K?.perfiles ?? []).filter((p) => coincide(qP, p));
  const puede = paso === 1 ? !!K : sel.length > 0;

  const siguiente = () => {
    if (!puede || !K) return;
    if (paso === 1) {
      setPaso(2);
      setQP("");
      setSel(K.perfiles.filter(tiene));
      return;
    }
    const nuevos = sel.filter((p) => !tiene(p));
    g.guardar(
      () => onLigar({ folio: K.folio, perfiles: sel, nuevos }),
      editar
        ? `Se actualizaron los perfiles del contrato #${K.folio}`
        : `Se ligó al contrato #${K.folio}${nuevos.length ? ` y se agregó ${cuantos(nuevos.length, "perfil", "perfiles")}` : ""}`,
    );
  };
  const atras = () => (paso === 1 || editar ? g.cerrar() : setPaso(1));

  const cabecera =
    paso === 1 ? (
      <>
        {!editar && <Pasos pasos={PASOS} actual={1} />}
        <BarraBusqueda valor={q} onCambio={setQ} placeholder="Buscar contratista, objeto o folio" etiqueta="Buscar contrato" filtros={filtros} />
        <span className="text-[13px] text-c10-meta">{cuantos(contratos.length, "contrato activo", "contratos activos")}</span>
      </>
    ) : (
      <>
        {!editar && <Pasos pasos={PASOS} actual={2} />}
        {K && <ResumenContrato c={K} />}
        <BarraBusqueda
          valor={qP}
          onCambio={setQP}
          placeholder="Buscar perfil"
          antes={
            <BotonTodos
              estado={estadoDe(visP, sel)}
              onAlternar={() => setSel((s) => alternarVarios(s, visP))}
              deshabilitado={!visP.length}
              tam={20}
              className="size-10 shrink-0 justify-center rounded-lg hover:bg-c10-panel"
            />
          }
        />
        <span className="text-[13px] tabular-nums text-c10-meta">
          {sel.length} de {cuantos(K?.perfiles.length ?? 0, "perfil seleccionado", "perfiles seleccionados")}
        </span>
      </>
    );

  return (
    <Modal
      abierto={abierto}
      onCerrar={g.cerrar}
      titulo={editar ? "Editar perfiles" : "Ligar a un contrato"}
      descripcion={
        paso === 1 ? "Elige el contrato activo al que se ligará el empleado." : "Selecciona los perfiles del contrato que cubrirá el empleado."
      }
      ancho={640}
      alto={680}
      cabecera={cabecera}
      claseCuerpo="gap-2 px-6 py-4"
      pie={
        <>
          <Boton variante="cancelar" flex onClick={atras} disabled={g.guardando}>
            {paso === 1 || editar ? "Cancelar" : "Atrás"}
          </Boton>
          <Boton flex onClick={siguiente} disabled={!puede || g.guardando}>
            {g.guardando && <Loader2 className="animate-spin" />}
            {editar ? "Guardar" : paso === 1 ? "Siguiente" : "Ligar Contrato"}
          </Boton>
        </>
      }
    >
      {paso === 1 ? (
        opciones.length ? (
          <div role="radiogroup" aria-label="Contratos activos" className="flex flex-col gap-2">
            {opciones.map(({ c, coinciden }) => (
              <TarjetaOpcion key={c.folio} tipo="radio" marcada={folio === c.folio} onAlternar={() => setFolio(c.folio)}>
                <span className="flex flex-col gap-0.5">
                  <TituloContrato c={c} />
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-c10-meta">Perfiles requeridos:</span>
                  {c.perfiles.map((p) => (
                    <span key={p} className={cn(CLASE_CHIP, "gap-1", tiene(p) ? TONO.success.chip : TONO.neutral.chip)}>
                      {tiene(p) && <Check className="size-3" strokeWidth={3} aria-hidden />}
                      {p}
                    </span>
                  ))}
                </span>
                {coinciden.length > 0 && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <Check className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />
                    Coincide con sus perfiles: {coinciden.join(", ")}
                  </span>
                )}
              </TarjetaOpcion>
            ))}
          </div>
        ) : (
          <MensajeVacio>No hay contratos activos que coincidan con la búsqueda o los filtros.</MensajeVacio>
        )
      ) : visP.length ? (
        <div role="group" aria-label="Perfiles del contrato" className="flex flex-col gap-2">
          {visP.map((p) => (
            <TarjetaOpcion key={p} tipo="checkbox" fondo="panel" marcada={sel.includes(p)} onAlternar={() => setSel((s) => alternarUno(s, p))}>
              <span className="text-sm font-semibold text-c10-title">{p}</span>
              {tiene(p) ? (
                <span className="text-xs font-medium text-green-700">Ya está en sus perfiles</span>
              ) : (
                <span className="flex items-start gap-1.5 text-xs text-c10-acc-h">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  No está en sus perfiles: se agregará al asignarlo.
                </span>
              )}
            </TarjetaOpcion>
          ))}
        </div>
      ) : (
        <MensajeVacio>No hay perfiles que coincidan con la búsqueda.</MensajeVacio>
      )}
    </Modal>
  );
}

/** Cliente con folio y "servicio · contrato": en la tarjeta del paso 1 y en el resumen del paso 2. */
function TituloContrato({ c }: { c: ContratoLigar }) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-c10-title">{c.cliente}</span>
        <ChipFolio folio={c.folio} />
      </span>
      <span className="text-[13px] text-c10-secondary">
        {c.servicio} · {c.nombre}
      </span>
    </>
  );
}

function ResumenContrato({ c }: { c: ContratoLigar }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-c10-panel px-3.5 py-3">
      <TituloContrato c={c} />
    </div>
  );
}
