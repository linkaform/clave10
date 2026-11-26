"use client";
// F0-05 · Muestra del UI kit para revisarlo: todas las piezas juntas, con los tres
// acentos (propio, contratista, cliente). No está en el menú; se abre por URL.
import { useState, type ReactNode } from "react";
import { Download, FileText, Files, Pencil, Trash2, Eye, FileCheck2, UserPlus, Users, Upload, Wrench } from "lucide-react";
import {
  AreaTexto, Boton, BotonIcono, Buscador, Campo, Casilla, ChipEstado, ChipFiltro, ChipFolio, ChipKpi,
  ChipPrioridad, ChipTipo, Consejo, Entrada, Modal, ModalConfirmar, PREFIJO_FOLIO, Selector, VerMas,
  avisar, folio, type EntidadFolio,
} from "@/components/contratistas/ui";
import type { Acento } from "@/lib/contratistas/contexto";
import { MuestraDocumento } from "./MuestraDocumento";
import { MuestraFiltros } from "./MuestraFiltros";
import { MuestraLigar } from "./MuestraLigar";
import { MuestraPanel } from "./MuestraPanel";
import { MuestraTabla } from "./MuestraTabla";

const ACENTOS: { k: Acento; l: string }[] = [
  { k: "propio", l: "Mi empresa" },
  { k: "ctr", l: "Contratistas" },
  { k: "cli", l: "Clientes" },
];

const TIPOS = [
  { valor: "mensual", etiqueta: "Mensual" },
  { valor: "cuatrimestral", etiqueta: "Cuatrimestral" },
  { valor: "permanente", etiqueta: "Permanente" },
];

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
      <h2 className="m-0 text-base font-semibold text-c10-title">{titulo}</h2>
      {children}
    </section>
  );
}

const Fila = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-2">{children}</div>;

export default function UiKitPage() {
  const [acento, setAcento] = useState<Acento>("propio");
  const [modal, setModal] = useState<null | "crear" | "confirmar" | "eliminar" | "eliminarUso" | "invitar">(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [errores, setErrores] = useState<{ nombre?: string; tipo?: string }>({});
  const [guardando, setGuardando] = useState(false);
  const [sel, setSel] = useState<Record<string, boolean>>({ a: true, b: false, c: false });
  const [filtro, setFiltro] = useState<string[]>(["vigente"]);
  const [verMas, setVerMas] = useState(false);

  const marcadas = Object.values(sel).filter(Boolean).length;
  const todas = marcadas === 3;

  const abrirCrear = () => {
    setNombre("");
    setTipo(null);
    setDesc("");
    setErrores({});
    setModal("crear");
  };

  const guardar = () => {
    const e = { nombre: nombre.trim() ? undefined : "Escribe el nombre", tipo: tipo ? undefined : "Selecciona el tipo" };
    setErrores(e);
    if (e.nombre || e.tipo) return;
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setModal(null);
      avisar("Se guardó el requerimiento");
    }, 900);
  };

  const alternarFiltro = (k: string) => setFiltro((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  return (
    <div data-c10-acc={acento} className="min-h-[calc(100vh-var(--c10-header-h,65px))] bg-c10-canvas font-[Arial,Helvetica,sans-serif]">
      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 pb-20 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-c10-title">UI kit de Contratistas (f0-05)</h1>
            <ChipKpi n={7} singular="sección" plural="secciones" />
          </div>
          <div role="tablist" aria-label="Acento" className="flex overflow-hidden rounded-lg bg-c10-surface ring-1 ring-c10-line">
            {ACENTOS.map((a, i) => (
              <button
                key={a.k}
                type="button"
                role="tab"
                aria-selected={acento === a.k}
                onClick={() => setAcento(a.k)}
                className={`h-10 px-4 text-sm transition-colors ${i ? "border-l border-c10-line" : ""} ${
                  acento === a.k ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-secondary hover:text-c10-acc"
                }`}
              >
                {a.l}
              </button>
            ))}
          </div>
        </div>
        <p className="m-0 text-sm text-c10-meta">
          F0-05, entrega 1. El acento cambia el azul de botones, folios, foco y selección; crear siempre es verde y destruir, rojo.
        </p>

        <Bloque titulo="Botones">
          <Fila>
            <Boton>Guardar Cambios</Boton>
            <Boton variante="crear">Nuevo Contrato</Boton>
            <Boton variante="peligro" icono={<Trash2 />}>Eliminar</Boton>
            <Boton variante="cancelar">Cancelar</Boton>
            <Boton variante="contorno" icono={<Download />}>Descargar</Boton>
            <Boton variante="texto" icono={<Pencil />}>Editar</Boton>
          </Fila>
          <Fila>
            <Boton tam="sm">Compacto 36px</Boton>
            <Boton variante="crear" tam="sm">Nuevo</Boton>
            <Boton disabled>Deshabilitado</Boton>
            <Boton variante="crear" disabled>Nuevo Pase</Boton>
          </Fila>
          <div className="flex max-w-md gap-2">
            <Boton variante="cancelar" flex>Cerrar</Boton>
            <Boton flex>Guardar Requerimiento</Boton>
          </div>
        </Bloque>

        <Bloque titulo="Botones de ícono">
          <Fila>
            <span className="w-24 text-xs text-c10-meta">Fuera de tabla</span>
            <BotonIcono titulo="Ver detalle" icono={<Eye />} />
            <BotonIcono titulo="Editar" icono={<Pencil />} />
            <BotonIcono titulo="Eliminar" icono={<Trash2 />} peligro />
          </Fila>
          <Fila>
            <span className="w-24 text-xs text-c10-meta">En tabla</span>
            <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla />
            <BotonIcono titulo="Descargar" icono={<Download />} enTabla />
            <BotonIcono titulo="Eliminar" icono={<Trash2 />} enTabla peligro />
          </Fila>
          <Fila>
            <span className="w-24 text-xs text-c10-meta">Dentro de card</span>
            <BotonIcono titulo="Editar" icono={<Pencil />} sinFondo />
            <BotonIcono titulo="Eliminar" icono={<Trash2 />} sinFondo peligro />
          </Fila>
          <div className="max-w-md overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--c10-line-card)]">
            <div className="px-4 py-3 text-sm text-c10-text">Último registro de la lista</div>
            {verMas && <div className="border-t border-c10-sunken px-4 py-3 text-sm text-c10-text">Registro extra</div>}
            <VerMas abierto={verMas} onClick={() => setVerMas((v) => !v)} />
          </div>
        </Bloque>

        <Bloque titulo="Campos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" obligatorio>
              <Entrada placeholder="Nombre del requerimiento" />
            </Campo>
            <Campo etiqueta="Nombre" obligatorio error="Escribe el nombre">
              <Entrada placeholder="Con error" />
            </Campo>
            <Campo etiqueta="Periodicidad" obligatorio>
              <Selector opciones={TIPOS} valor={tipo} onCambio={setTipo} placeholder="Selecciona la periodicidad" />
            </Campo>
            <Campo etiqueta="Periodicidad" obligatorio error="Selecciona el tipo">
              <Selector opciones={TIPOS} valor={null} onCambio={() => {}} placeholder="Con error" />
            </Campo>
            <Campo etiqueta="Buscar" ayuda="El buscador ignora acentos.">
              <Buscador placeholder="Buscar contrato" />
            </Campo>
            <Campo etiqueta="Deshabilitado">
              <Entrada value="No se puede editar" disabled readOnly />
            </Campo>
            <Campo etiqueta="Descripción" className="sm:col-span-2">
              <AreaTexto placeholder="Describe el requerimiento" />
            </Campo>
          </div>
          <Consejo>El consejo mide lo que ocupa su texto, no todo el ancho.</Consejo>
          <Fila>
            <Casilla marcada={todas} mixto={marcadas > 0 && !todas} titulo="Seleccionar todos" onCambio={(v) => setSel({ a: v, b: v, c: v })} />
            <span className="mr-4 text-sm text-c10-text">Seleccionar todos ({marcadas}/3)</span>
            {(["a", "b", "c"] as const).map((k) => (
              <Casilla key={k} marcada={sel[k]} titulo={`Seleccionar ${k}`} onCambio={(v) => setSel((s) => ({ ...s, [k]: v }))} />
            ))}
            <Casilla marcada={false} titulo="Deshabilitada" deshabilitada onCambio={() => {}} />
          </Fila>
        </Bloque>

        <Bloque titulo="Chips">
          <Fila>
            <ChipEstado texto="Activo" tono="success" />
            <ChipEstado texto="En proceso" tono="info" />
            <ChipEstado texto="Por vencer" tono="warning" />
            <ChipEstado texto="Vencido" tono="danger" />
            <ChipEstado texto="Inactivo" tono="neutral" />
          </Fila>
          <Fila>
            <ChipPrioridad prioridad="Alta" />
            <ChipPrioridad prioridad="Media" />
            <ChipPrioridad prioridad="Baja" />
            <ChipTipo icono={<Wrench />}>Mantenimiento</ChipTipo>
            <ChipTipo>Permanente</ChipTipo>
          </Fila>
          <Fila>
            <ChipFolio folio="C-142" />
            <ChipKpi n={1} />
            <ChipKpi n={1284} />
          </Fila>
          <Fila>
            {[
              { k: "vigente", l: "Vigentes", n: 12 },
              { k: "porvencer", l: "Por vencer", n: 3 },
              { k: "vencido", l: "Vencidos", n: 0 },
            ].map((f) => (
              <ChipFiltro key={f.k} activo={filtro.includes(f.k)} cuenta={f.n} onClick={() => alternarFiltro(f.k)}>
                {f.l}
              </ChipFiltro>
            ))}
            <ChipFiltro activo={filtro.includes("todos")} onClick={() => alternarFiltro("todos")}>Sin contador</ChipFiltro>
          </Fila>
        </Bloque>

        <Bloque titulo="Modales y toast">
          <Fila>
            <Boton variante="crear" onClick={abrirCrear}>Nuevo Requerimiento</Boton>
            <Boton variante="contorno" onClick={() => setModal("confirmar")}>Confirmar (normal)</Boton>
            <Boton variante="peligro" icono={<Trash2 />} onClick={() => setModal("eliminar")}>Confirmar (eliminar)</Boton>
            <Boton variante="contorno" onClick={() => setModal("invitar")}>Modal de elegir (ej. Invitar)</Boton>
            <Boton variante="contorno" onClick={() => setModal("eliminarUso")}>Eliminar con aviso y &quot;Se usa en&quot;</Boton>
          </Fila>
          <Fila>
            <Boton variante="contorno" onClick={() => avisar("Se guardó el registro")}>Toast de éxito</Boton>
            <Boton variante="contorno" onClick={() => avisar("No se pudo guardar el registro")}>Toast de error</Boton>
            <Boton variante="contorno" onClick={() => avisar("Se inició la descarga de 3 documentos; te avisaremos cuando termine.", "info")}>
              Toast de info
            </Boton>
          </Fila>
        </Bloque>

        <Bloque titulo="Tabla, lista y cards">
          <MuestraTabla />
        </Bloque>

        <Bloque titulo="Filtros en la cabecera (F0-06)">
          <MuestraFiltros />
        </Bloque>

        <Bloque titulo="Panel de detalle (F0-07)">
          <MuestraPanel />
        </Bloque>

        <Bloque titulo="Revisar documento (F0-13)">
          <MuestraDocumento />
        </Bloque>

        <Bloque titulo="Ligar y notificar (F0-15)">
          <MuestraLigar />
        </Bloque>

        <Bloque titulo="Folios">
          <Fila>
            {(Object.keys(PREFIJO_FOLIO) as EntidadFolio[]).map((e, i) => (
              <span key={e} className="flex items-center gap-1.5 text-sm text-c10-text">
                <ChipFolio folio={folio(e, 12 + i * 37)} />
                {e}
              </span>
            ))}
          </Fila>
        </Bloque>
      </main>

      <Modal
        abierto={modal === "crear"}
        onCerrar={() => setModal(null)}
        titulo="Nuevo Requerimiento"
        onGuardar={guardar}
        etiquetaGuardar="Guardar Requerimiento"
        guardando={guardando}
      >
        <Campo etiqueta="Nombre" obligatorio error={errores.nombre}>
          <Entrada
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrores((x) => ({ ...x, nombre: undefined }));
            }}
            placeholder="Ej. Opinión de cumplimiento del IMSS"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Periodicidad" obligatorio error={errores.tipo}>
          <Selector
            opciones={TIPOS}
            valor={tipo}
            onCambio={(v) => {
              setTipo(v);
              setErrores((x) => ({ ...x, tipo: undefined }));
            }}
            placeholder="Selecciona la periodicidad"
          />
        </Campo>
        <Campo etiqueta="Descripción">
          <AreaTexto value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Qué debe entregar el contratista" />
        </Campo>
        <Consejo>Los campos con * son obligatorios.</Consejo>
      </Modal>

      <ModalConfirmar
        abierto={modal === "confirmar"}
        onCancelar={() => setModal(null)}
        onConfirmar={() => {
          setModal(null);
          avisar("Se activó el contrato");
        }}
        titulo="Activar contrato"
        descripcion="El contrato pasará a Activo y el contratista podrá registrar accesos."
        elemento="#C-142 · Ternium México"
        etiqueta="Activar Contrato"
        icono={<FileCheck2 />}
      />

      {/* Ejemplo de modal sin pie, con descripción: el real lo construye R-02 */}
      <Modal
        abierto={modal === "invitar"}
        onCerrar={() => setModal(null)}
        titulo="Invitar contratista"
        descripcion="Elige cómo quieres enviar la invitación."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { k: "individual", icono: <UserPlus />, t: "Invitación individual", d: "Captura los datos de contacto de un contratista y envíale la invitación por correo." },
            { k: "masiva", icono: <Files />, t: "Invitación masiva", d: "Carga un archivo Excel o CSV para invitar a varios contratistas a la vez." },
          ].map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => {
                setModal(null);
                avisar(`Aquí sigue la ${o.t.toLowerCase()} (R-02)`, "info");
              }}
              className="flex flex-col items-start gap-3 rounded-xl bg-c10-surface p-5 text-left shadow-[0_0_0_1px_var(--c10-line-card),0_1px_2px_rgba(15,23,42,.05)] transition-[box-shadow,transform] duration-200 hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--c10-line-card),0_12px_28px_rgba(15,23,42,.12)] active:translate-y-0 active:shadow-[0_0_0_2px_var(--c10-acc)]"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-c10-acc-l text-c10-acc [&_svg]:size-5">{o.icono}</span>
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-c10-title">{o.t}</span>
                <span className="text-[13px] leading-[1.45] text-c10-secondary">{o.d}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Igual al diseño: ¿Eliminar contratista? (CT, eliminar) */}
      <ModalConfirmar
        abierto={modal === "eliminar"}
        onCancelar={() => setModal(null)}
        onConfirmar={() => {
          setModal(null);
          avisar("Se eliminó el contratista");
        }}
        titulo="¿Eliminar contratista?"
        descripcion="Esta acción no se puede deshacer. Sus contratos, empleados y activos quedarán sin contratista."
        elemento="Vitro, S.A.B. de C.V. · VIT360707PL4"
        etiqueta="Eliminar"
        peligro
      />

      {/* Con todo lo opcional: aviso azul, lista "Se usa en" e ícono en el botón */}
      <ModalConfirmar
        abierto={modal === "eliminarUso"}
        onCancelar={() => setModal(null)}
        onConfirmar={() => {
          setModal(null);
          avisar("Se eliminó el requerimiento");
        }}
        titulo="Eliminar requerimiento"
        descripcion="Esta acción no se puede deshacer."
        consejo="Los documentos ya entregados se conservan en el historial."
        seUsaEn={[
          { icono: <Users />, etiqueta: "Contratistas", n: 8 },
          { icono: <FileText />, etiqueta: "Contratos", n: 3 },
          { icono: <Upload />, etiqueta: "Documentos entregados", n: 41 },
        ]}
        etiqueta="Eliminar"
        icono={<Trash2 />}
        peligro
      />
    </div>
  );
}
