"use client";
// F0-15 · Ligar empleados a un contrato. Diseño: plataforma.dc.html, clkVals (~5528), template ~3388.
// Qué pasa al ligar (reglas de perfiles, límites) es de ME-11 / ME-05: aquí solo se elige.
import { useMemo, useState } from "react";
import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_CHIP, ChipFolio, ChipTipo } from "../ui";
import { TONO } from "../ui/tonos";
import { FiltroChips, coincide, useFiltros } from "../filtros";
import { ModalSeleccion } from "./ModalSeleccion";
import { Avatar, BarraTodos, ChipMas, FilaSeleccion } from "./piezas";
import { alternarUno, alternarVarios, cuantos, estadoDe, useAlAbrir } from "./seleccion";

export interface EmpleadoLigar {
  id: string;
  nombre: string;
  nss?: string;
  perfiles: string[];
  /** Folios de los otros contratos en los que ya está. */
  contratos: string[];
  /** Ya está en este contrato: sale gris con "Ya ligado" y no se puede elegir. */
  ligado?: boolean;
}

export interface ModalLigarEmpleadosProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Objeto del contrato, bajo el título. */
  objeto: string;
  folio: string;
  /** Solo empleados activos: la pantalla filtra antes. */
  empleados: EmpleadoLigar[];
  onLigar: (ids: string[]) => void | Promise<unknown>;
  aviso?: string;
}

const CON = "Con contrato";
const SIN = "Sin contrato";
const grupo = (e: EmpleadoLigar) => (e.contratos.length ? CON : SIN);

export function ModalLigarEmpleados({
  abierto, onCerrar, objeto, folio, empleados, onLigar,
  aviso = "Solo puedes ligar empleados activos registrados. Un empleado puede estar en varios contratos.",
}: ModalLigarEmpleadosProps) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const f = useFiltros({ contrato: [] as string[] }, { url: false });
  useAlAbrir(abierto, () => {
    setQ("");
    setSel([]);
    f.limpiar();
  });

  const filas = useMemo(
    () =>
      empleados
        .filter(
          (e) =>
            coincide(q, e.nombre, e.nss, ...e.perfiles) &&
            // Los ya ligados no se esconden con el filtro: se ven abajo, en gris
            (e.ligado || !f.valores.contrato.length || f.valores.contrato.includes(grupo(e))),
        )
        .sort((a, b) => Number(!!a.ligado) - Number(!!b.ligado)),
    [empleados, q, f.valores.contrato],
  );
  const disponibles = filas.filter((e) => !e.ligado).map((e) => e.id);
  const n = sel.length;

  const libres = empleados.filter((e) => !e.ligado);
  const controles = (
    <FiltroChips
      titulo="Contrato"
      opciones={[CON, SIN].map((v) => ({ valor: v, cuenta: libres.filter((e) => grupo(e) === v).length }))}
      valor={f.valores.contrato}
      onCambio={(v) => f.poner("contrato", v)}
    />
  );

  return (
    <ModalSeleccion
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Ligar empleados"
      descripcion={
        <span className="flex flex-wrap items-center gap-2 text-[13px] text-c10-meta">
          {objeto}
          <ChipFolio folio={folio} />
        </span>
      }
      aviso={aviso}
      busqueda={q}
      onBusqueda={setQ}
      placeholder="Buscar por nombre, perfil o NSS"
      filtros={{ cuenta: f.cuenta, onLimpiar: f.limpiar, controles }}
      barra={
        <BarraTodos
          estado={estadoDe(disponibles, sel)}
          onAlternar={() => setSel((s) => alternarVarios(s, disponibles))}
          texto={`${cuantos(disponibles.length, "empleado")} ${disponibles.length === 1 ? "disponible" : "disponibles"}`}
          seleccionados={n}
          deshabilitada={!disponibles.length}
        />
      }
      vacio={!filas.length && "No se encontraron empleados activos"}
      seleccionados={n}
      etiqueta={(k) => (k ? `Ligar ${cuantos(k, "empleado")}` : "Ligar empleados")}
      exito={(k) => (k === 1 ? "Se ligó 1 empleado al contrato" : `Se ligaron ${k} empleados al contrato`)}
      onLigar={() => onLigar(sel)}
    >
      {filas.map((e) => {
        const marcada = sel.includes(e.id);
        const perfiles = e.perfiles.length ? e.perfiles : ["Sin perfil"];
        return (
          <FilaSeleccion
            key={e.id}
            etiqueta={e.nombre}
            marcada={marcada}
            bloqueada={e.ligado}
            tituloBloqueada="Ya está ligado a este contrato"
            onAlternar={() => setSel((s) => alternarUno(s, e.id))}
          >
            <Avatar nombre={e.nombre} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-semibold text-c10-title">{e.nombre}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                {perfiles.slice(0, 3).map((p) => (
                  <ChipTipo key={p} className={marcada ? "bg-c10-surface" : undefined}>
                    {p}
                  </ChipTipo>
                ))}
                {perfiles.length > 3 && <ChipMas titulo="Perfiles" lista={perfiles.slice(3)} icono={<HardHat />} />}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              {e.nss && (
                <span className="whitespace-nowrap text-xs tabular-nums text-c10-secondary">
                  <span className="text-[11px] font-medium tracking-[.05em] text-c10-faint">NSS </span>
                  {e.nss}
                </span>
              )}
              <ChipContratos ligado={e.ligado} contratos={e.contratos} />
            </span>
          </FilaSeleccion>
        );
      })}
    </ModalSeleccion>
  );
}

function ChipContratos({ ligado, contratos }: { ligado?: boolean; contratos: string[] }) {
  const [texto, clase] = ligado
    ? ["Ya ligado", TONO.success.chip]
    : contratos.length
      ? [contratos.length === 1 ? `En ${contratos[0]}` : `En ${contratos.length} contratos`, "bg-c10-acc-l text-c10-acc-h"]
      : ["Sin contrato", TONO.neutral.chip];
  return <span className={cn(CLASE_CHIP, clase)}>{texto}</span>;
}
