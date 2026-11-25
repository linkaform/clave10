"use client";
// F0-13 · Panel lateral del documento: Generales (archivo, datos, compartido con y
// comentarios) y Versiones, con "Revisar Documento" cuando le toca al cliente activo.
// Diseño: plataforma.dc.html, dcPOpen (~3779–3825) y su lógica (~7898–7932).
// Va sobre PanelDetalle (F0-07); lo montan ME-06, ME-07, ME-11 y MX-01.
//
//   <PanelDocumento abierto={!!sel} documento={sel} onCerrar={() => setSel(null)}
//     onCambio={(doc) => { setSel(doc); refrescarLista(); }} />
import { useEffect, useState } from "react";
import { Building2, Download, ExternalLink, FileSearch, FileText, Share2 } from "lucide-react";
import { Boton, BotonIcono, ChipEstado, ChipFolio, ChipTipo, avisar, type Tono } from "@/components/contratistas/ui";
import { Dato, Datos, PanelDetalle, TarjetaPanel } from "@/components/contratistas/panel";
import { ESTATUS_DOCUMENTO_TONO } from "@/mappers/contratistas.mapper";
import { abrirVisor } from "@/lib/contratistas/visor";
import { subirArchivo } from "@/services/contratistas/analisis";
import { uploadDocumento } from "@/services/contratistas/documentos";
import type { DecisionAprobacion, Documento } from "@/types/contratistas";
import { ComentariosDocumento } from "./ComentariosDocumento";
import { ModalRevisarDocumento } from "./ModalRevisarDocumento";
import { VersionesDocumento } from "./VersionesDocumento";
import { extension, fmtFecha, fmtFechaHora, fmtPeso, iniciales, propietario, puedeRevisar, versionActual } from "./formato";
import { Contador, EncabezadoTarjeta, TarjetaDocumento } from "./piezas";

const TABS = [
  { k: "generales", etiqueta: "Generales" },
  { k: "versiones", etiqueta: "Versiones" },
];

const DECISION_TONO: Record<DecisionAprobacion, Tono> = { Aprobado: "success", Rechazado: "danger", Pendiente: "info" };

export interface PanelDocumentoProps {
  abierto: boolean;
  onCerrar: () => void;
  /** null mientras carga (con `abierto`, muestra el skeleton). */
  documento: Documento | null;
  cargando?: boolean;
  /** Etiquetas del modal de revisión (ver ModalRevisarDocumento). */
  variante?: "documento" | "cumplimiento";
  /** Desde una vista de tabla: sin velo y cierra con clic fuera (PanelDetalle). */
  enTabla?: boolean;
  soloLectura?: boolean;
  /**
   * "Subir Nueva Versión". Por defecto solo el dueño (sin `mi_decision`, que solo
   * traen los clientes con quien se compartió).
   */
  puedeSubirVersion?: boolean;
  /** Tras revisar o subir versión, con el documento actualizado. */
  onCambio?: (doc: Documento) => void;
}

export function PanelDocumento({
  abierto, onCerrar, documento, cargando, variante = "documento", enTabla, soloLectura, puedeSubirVersion, onCambio,
}: PanelDocumentoProps) {
  const [tab, setTab] = useState("generales");
  const [revisando, setRevisando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Otro documento: vuelve a Generales
  useEffect(() => setTab("generales"), [documento?.id]);

  const doc = documento;
  const revisable = !soloLectura && puedeRevisar(doc);
  const subeVersion = !soloLectura && !!doc && (puedeSubirVersion ?? doc.mi_decision === undefined);
  const actual = doc ? versionActual(doc) : undefined;

  const descargar = () => {
    if (!doc) return;
    const a = document.createElement("a");
    a.href = doc.archivo.file_url;
    a.download = doc.archivo.name;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  };

  const subirVersion = async (file: File) => {
    if (!doc || subiendo) return;
    setSubiendo(true);
    try {
      const archivo = await subirArchivo(file, () => {}, new AbortController().signal);
      const nuevo = await uploadDocumento({
        nombre: doc.nombre,
        categoria: doc.categoria,
        requerimiento_id: doc.requerimiento?.id ?? null,
        dueno: {
          tipo: doc.dueno.tipo,
          empresa_id: doc.dueno.empresa.id,
          empleado_id: doc.dueno.empleado?.id,
          equipo_id: doc.dueno.equipo?.id,
        },
        archivo,
        reemplaza_id: doc.id,
      });
      const n = versionActual(nuevo)?.numero ?? doc.versiones.length + 1;
      avisar(`Se subió la versión ${n}. Liga los contratos cuando la apruebes.`, "exito");
      onCambio?.(nuevo);
    } catch (e) {
      avisar(`No se pudo subir la versión: ${(e as Error).message}`, "error");
    } finally {
      setSubiendo(false);
    }
  };

  const botonRevisar = (
    <Boton onClick={() => setRevisando(true)} icono={<FileSearch />}>
      Revisar Documento
    </Boton>
  );

  return (
    <>
      <PanelDetalle
        abierto={abierto}
        onCerrar={onCerrar}
        etiqueta="Detalle del documento"
        titulo={doc?.nombre ?? ""}
        chips={
          doc && (
            <>
              <ChipFolio folio={doc.folio} />
              <ChipEstado texto={doc.estatus} tono={ESTATUS_DOCUMENTO_TONO[doc.estatus]} />
              {actual && <ChipTipo>v{actual.numero}</ChipTipo>}
            </>
          )
        }
        acciones={
          doc && (
            <>
              <BotonIcono titulo="Abrir documento" icono={<ExternalLink />} onClick={() => abrirVisor(doc.archivo.file_url)} />
              <BotonIcono titulo="Descargar" icono={<Download />} onClick={descargar} />
              {revisable && <BotonIcono titulo="Revisar documento" icono={<FileSearch />} onClick={() => setRevisando(true)} />}
            </>
          )
        }
        tabs={TABS.map((t) => (t.k === "versiones" && doc ? { ...t, cuenta: doc.versiones.length } : t))}
        tab={tab}
        onTab={setTab}
        accionPrincipal={revisable ? botonRevisar : undefined}
        enTabla={enTabla}
        cargando={cargando || (abierto && !doc)}
        soloLectura={soloLectura}
      >
        {doc && tab === "generales" && (
          <>
            <button
              type="button"
              onClick={() => abrirVisor(doc.archivo.file_url)}
              aria-label="Abrir documento en una pestaña nueva"
              className="flex min-w-0 items-center gap-3 rounded-xl bg-c10-surface p-4 text-left shadow-[0_0_0_1px_var(--c10-line-card)] transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--c10-acc)] active:shadow-[0_0_0_2px_var(--c10-acc)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-c10-acc-l text-c10-acc">
                <FileText className="size-5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-c10-title">{doc.archivo.name}</span>
                <span className="truncate text-xs text-c10-secondary">
                  {[extension(doc.archivo.name), fmtPeso(doc.archivo.size)].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-c10-acc">
                <ExternalLink className="size-4" aria-hidden />
                Abrir Documento
              </span>
            </button>

            <TarjetaPanel>
              <Datos>
                <Dato nombre="Propietario">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-c10-sunken text-[10px] font-bold text-c10-label">
                      {doc.dueno.tipo === "Empresa" ? <Building2 className="size-3.5" aria-hidden /> : iniciales(propietario(doc))}
                    </span>
                    {propietario(doc)}
                  </span>
                </Dato>
                <Dato nombre="Categoría">{doc.categoria}</Dato>
                <Dato nombre="Vigencia">{vigencia(doc)}</Dato>
                <Dato nombre="Subido por">{actual?.subido_por}</Dato>
                <Dato nombre="Fecha de carga">{actual ? fmtFechaHora(actual.fecha) : undefined}</Dato>
                <Dato nombre="Origen">{doc.origen}</Dato>
              </Datos>
            </TarjetaPanel>

            <TarjetaDocumento>
              <EncabezadoTarjeta icono={<Share2 />} titulo="Compartido con">
                <Contador>{doc.compartido_con.length}</Contador>
              </EncabezadoTarjeta>
              {doc.compartido_con.length === 0 ? (
                <span className="text-sm text-c10-faint">No se ha compartido</span>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {doc.compartido_con.map((c) => {
                    const apr = doc.aprobaciones.find((a) => a.cliente.id === c.id);
                    const decision = apr?.decision ?? "Pendiente";
                    return (
                      <li key={c.id} className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-c10-sunken text-c10-label">
                          <Building2 className="size-4" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-c10-title">{c.nombre}</span>
                          {apr?.revisor && (
                            <span className="truncate text-xs text-c10-secondary">
                              {apr.revisor}
                              {apr.fecha && ` · ${fmtFechaHora(apr.fecha)}`}
                            </span>
                          )}
                        </span>
                        <ChipEstado texto={decision} tono={DECISION_TONO[decision]} className="shrink-0" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </TarjetaDocumento>

            <ComentariosDocumento comentarios={doc.comentarios} />
          </>
        )}
        {doc && tab === "versiones" && (
          <VersionesDocumento versiones={doc.versiones} onSubirVersion={subeVersion ? subirVersion : undefined} subiendo={subiendo} />
        )}
      </PanelDetalle>

      <ModalRevisarDocumento
        abierto={revisando}
        onCerrar={() => setRevisando(false)}
        documento={doc}
        variante={variante}
        onRevisado={onCambio}
      />
    </>
  );
}

function vigencia(doc: Documento) {
  if (doc.periodo) return `${fmtFecha(doc.periodo.inicio)} – ${fmtFecha(doc.periodo.fin)}`;
  if (doc.vigencia_fin) return doc.vigencia_inicio ? `${fmtFecha(doc.vigencia_inicio)} – ${fmtFecha(doc.vigencia_fin)}` : `Vence ${fmtFecha(doc.vigencia_fin)}`;
  return "Sin vigencia";
}
