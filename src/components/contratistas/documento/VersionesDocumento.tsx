"use client";
// F0-13 · Historial de versiones del documento. Diseño: plataforma.dc.html, dcPVers
// (~3817, ~7922) y "Subir Nueva Versión" dcPNewVer / dcVerOnPick (~7923).
import { useRef } from "react";
import { ExternalLink, History, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotonIcono, ChipEstado } from "@/components/contratistas/ui";
import { ESTATUS_DOCUMENTO_TONO } from "@/mappers/contratistas.mapper";
import { abrirVisor } from "@/lib/contratistas/visor";
import type { DocumentoBase } from "@/types/contratistas";
import { extension, fmtFechaHora, fmtPeso } from "./formato";
import { Contador, EncabezadoTarjeta, TarjetaDocumento } from "./piezas";

export interface VersionesDocumentoProps {
  versiones: DocumentoBase["versiones"];
  /** Sin esto no aparece "Subir Nueva Versión" (solo el dueño sube versiones). */
  onSubirVersion?: (file: File) => void;
  subiendo?: boolean;
}

export function VersionesDocumento({ versiones, onSubirVersion, subiendo }: VersionesDocumentoProps) {
  const input = useRef<HTMLInputElement>(null);
  const orden = [...versiones].sort((a, b) => b.numero - a.numero);
  const actual = orden[0]?.numero;

  return (
    <TarjetaDocumento>
      <EncabezadoTarjeta icono={<History />} titulo="Versiones">
        <Contador>
          {versiones.length} {versiones.length === 1 ? "registro" : "registros"}
        </Contador>
        <span className="flex-1" />
        {onSubirVersion && (
          <>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={subiendo}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-c10-acc hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {subiendo ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              Subir Nueva Versión
            </button>
            <input
              ref={input}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onSubirVersion(f);
              }}
            />
          </>
        )}
      </EncabezadoTarjeta>

      {orden.length === 0 ? (
        <span className="text-sm text-c10-faint">Sin versiones</span>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {orden.map((v, k) => {
            const esActual = v.numero === actual;
            const meta = [v.subido_por, fmtFechaHora(v.fecha), extension(v.archivo.name), fmtPeso(v.archivo.size)].filter(Boolean).join(" · ");
            return (
              <li key={v.numero} className={cn("flex min-w-0 items-start gap-3 py-3", k > 0 && "border-t border-c10-sunken")}>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                    esActual ? "bg-c10-acc text-white" : "bg-c10-sunken text-c10-label",
                  )}
                >
                  v{v.numero}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="min-w-0 truncate text-sm font-medium text-c10-title">{v.archivo.name}</span>
                    <ChipEstado texto={v.estatus} tono={ESTATUS_DOCUMENTO_TONO[v.estatus]} className="shrink-0" />
                    {esActual && (
                      <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-c10-acc-l px-[9px] text-[11px] font-semibold text-c10-acc-h">
                        Actual
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-c10-secondary">{meta}</span>
                  {v.motivo_rechazo && (
                    <span className="text-[13px] leading-[1.45] text-c10-label [text-wrap:pretty]">Motivo del rechazo: {v.motivo_rechazo}</span>
                  )}
                </div>
                <BotonIcono titulo="Abrir versión" sinFondo icono={<ExternalLink />}onClick={() => abrirVisor(v.archivo.file_url)} />
              </li>
            );
          })}
        </ul>
      )}
    </TarjetaDocumento>
  );
}
