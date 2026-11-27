"use client";
// ME-12 · Modal "Confirmar contrato": resumen de todo antes de guardar.
// Diseño: nuevo-contrato.dc.html 3237–3320 (nResAbierto) y nRes* (~4320).
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Boton, Modal } from "@/components/contratistas/ui";
import { fmtFecha } from "@/components/contratistas/documento/formato";
import { resumenContrato } from "@/components/contratistas/vigencia";
import type { RecursoContrato, RelacionFila } from "@/types/contratistas";
import { montoNumero, reqsActivos, type Catalogos, type NuevoContratoEd } from "./nuevoContrato";

export function ModalConfirmarContrato({ ed, cat, relacion, guardando, onCerrar, onConfirmar }: {
  ed: NuevoContratoEd;
  cat: Catalogos;
  relacion: RelacionFila | undefined;
  guardando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
}) {
  const d = ed.datos;
  const monto = montoNumero(d.monto);
  const datos: [string, string | undefined][] = [
    ["Folio del contrato", d.numero_contrato],
    ["Contratista", relacion?.contraparte.razon_social],
    ["Objeto del contrato", d.objeto],
    ["Monto total", monto === null ? undefined : `$${monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`],
    ["Fecha de inicio", d.inicio && fmtFecha(d.inicio)],
    ["Fecha fin", d.fin && fmtFecha(d.fin)],
    ["Subcontratación", ed.subcontratacion ? "Permitida" : "No permitida"],
  ];
  const nombre = (lista: RecursoContrato[], id: string | null) => lista.find((r) => r.id === id);
  const perfiles = ed.perfiles.map((f) => ({ key: f.key, r: nombre(cat.perfiles, f.perfil), f }));
  const equipos = ed.equipos.map((f) => ({ key: f.key, r: nombre(cat.equipos, f.equipo), f }));

  return (
    <Modal
      abierto onCerrar={guardando ? () => {} : onCerrar} ancho={640} titulo="Confirmar contrato"
      descripcion="Revisa la información antes de guardar el contrato."
      pie={
        <div className="flex justify-end gap-2.5 border-t border-c10-sunken px-6 py-4">
          <Boton variante="cancelar" disabled={guardando} onClick={onCerrar}>Regresar a editar</Boton>
          <Boton disabled={guardando} onClick={onConfirmar}>
            {guardando && <Loader2 className="animate-spin" />}Confirmar y guardar
          </Boton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Bloque titulo="Datos del contrato" primero>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5 gap-y-3">
            {datos.filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] uppercase text-c10-faint">{k}</span>
                <span className="text-sm font-semibold text-c10-title [text-wrap:pretty]">{v}</span>
              </span>
            ))}
          </div>
          {d.descripcion && (
            <span className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase text-c10-faint">Descripción</span>
              <span className="text-sm leading-normal text-c10-label [text-wrap:pretty]">{d.descripcion}</span>
            </span>
          )}
        </Bloque>

        <Bloque titulo="Servicios especializados">
          <Chips lista={ed.servicios.map((id) => nombre(cat.servicios, id)?.nombre ?? id)} vacio="Sin servicios" azul />
        </Bloque>

        <Bloque titulo="Recurrencia">
          <span className="text-sm text-c10-title [text-wrap:pretty]">{resumenContrato(ed.recurrencia, d.inicio)}</span>
        </Bloque>

        <Bloque titulo="Recursos asignados">
          {!perfiles.length && !equipos.length && <span className="text-sm text-c10-faint">Sin recursos asignados</span>}
          {!!perfiles.length && (
            <TablaRecursos titulo="Perfiles" filas={perfiles.map(({ key, r, f }) => ({ key, nombre: r?.nombre ?? "", cant: f.cantidad, reqs: reqsActivos(r, f.excluidos) }))} />
          )}
          {!!equipos.length && (
            <TablaRecursos titulo="Equipo" filas={equipos.map(({ key, r, f }) => ({ key, nombre: `${r?.nombre ?? ""} (${f.clase})`, cant: f.cantidad, reqs: reqsActivos(r, f.excluidos) }))} />
          )}
        </Bloque>

        <Bloque titulo="Centros de trabajo">
          <Chips lista={ed.ubicaciones.map((u) => u.nombre)} vacio="Sin centros de trabajo" />
        </Bloque>
      </div>
    </Modal>
  );
}

function Bloque({ titulo, primero, children }: { titulo: string; primero?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 ${primero ? "" : "border-t border-c10-sunken pt-4"}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[.05em] text-c10-meta">{titulo}</span>
      {children}
    </div>
  );
}

function Chips({ lista, vacio, azul }: { lista: string[]; vacio: string; azul?: boolean }) {
  if (!lista.length) return <span className="text-sm text-c10-faint">{vacio}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map((x) => (
        <span key={x} className={`rounded-full px-2.5 py-[3px] text-[13px] font-semibold ring-1 ${azul ? "bg-c10-acc-l text-c10-acc-h ring-blue-200" : "bg-c10-sunken text-c10-label ring-c10-line"}`}>
          {x}
        </span>
      ))}
    </div>
  );
}

function TablaRecursos({ titulo, filas }: { titulo: string; filas: { key: string; nombre: string; cant: string; reqs: number }[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg ring-1 ring-c10-line">
      <span className="bg-c10-acc-l px-3 py-2 text-xs font-bold text-c10-acc-h">{titulo}</span>
      {filas.map((f) => (
        <span key={f.key} className="flex items-center gap-3 border-t border-c10-sunken px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate text-c10-title">{f.nombre}</span>
          <span className="text-xs text-c10-meta">{f.reqs} req.</span>
          <span className="font-bold tabular-nums text-c10-title">× {f.cant}</span>
        </span>
      ))}
    </div>
  );
}
