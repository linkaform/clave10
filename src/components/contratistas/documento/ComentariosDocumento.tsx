"use client";
// F0-13 · Hilo de comentarios del documento. Diseño: plataforma.dc.html, dcPComs (~3813, ~7910).
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentoBase } from "@/types/contratistas";
import { colorAvatar, fmtFechaHora, iniciales } from "./formato";
import { Contador, EncabezadoTarjeta, TarjetaDocumento } from "./piezas";

export function ComentariosDocumento({ comentarios }: { comentarios: DocumentoBase["comentarios"] }) {
  return (
    <TarjetaDocumento>
      <EncabezadoTarjeta icono={<MessageSquare />} titulo="Comentarios">
        <Contador>{comentarios.length}</Contador>
      </EncabezadoTarjeta>
      {comentarios.length === 0 ? (
        <span className="text-sm text-c10-faint">Sin comentarios</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {comentarios.map((c, i) => (
            <li key={`${c.fecha}-${i}`} className="flex min-w-0 gap-2.5">
              <span
                aria-hidden
                className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", colorAvatar(c.autor))}
              >
                {iniciales(c.autor)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[13px] font-semibold text-c10-title">{c.autor}</span>
                  <span className="text-[11px] tabular-nums text-c10-faint">{fmtFechaHora(c.fecha)}</span>
                </span>
                <span className="whitespace-pre-line text-sm leading-[1.45] text-c10-text [overflow-wrap:anywhere] [text-wrap:pretty]">{c.texto}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </TarjetaDocumento>
  );
}
