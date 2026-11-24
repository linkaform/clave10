"use client";
// F0-07 · Ejemplo del panel de detalle para la página de muestra: abierto desde cards
// (con velo) y desde una tabla (sin velo; el ojo cambia de fila sin cerrar).
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, ExternalLink, Eye, FileText, Pencil, Trash2 } from "lucide-react";
import { Boton, BotonIcono, ChipEstado, ChipFolio, ChipTipo, ModalConfirmar, Tabla, avisar, useTabla } from "@/components/contratistas/ui";
import { Dato, Datos, PANEL_OJO, PanelDetalle, TarjetaPanel } from "@/components/contratistas/panel";

interface Empleado {
  folio: string;
  nombre: string;
  puesto: string;
  activo: boolean;
  curp: string;
  nss: string;
  rfc: string;
  alta: string;
  telefono?: string;
  docs: { nombre: string; estatus: "Aceptado" | "Por revisar" | "Vencido"; vence: string }[];
  contratos: { folio: string; cliente: string }[];
}

const EMPLEADOS: Empleado[] = [
  {
    folio: "E-101", nombre: "Juan Pérez Ramírez", puesto: "Supervisor de seguridad", activo: true,
    curp: "PERJ850312HNLRMN04", nss: "43148512345", rfc: "PERJ850312AB1", alta: "24-03-11", telefono: "81 1234 5678",
    docs: [
      { nombre: "Constancia DC-3", estatus: "Aceptado", vence: "27-03-11" },
      { nombre: "Examen médico", estatus: "Por revisar", vence: "26-12-01" },
      { nombre: "Alta IMSS", estatus: "Vencido", vence: "26-10-30" },
    ],
    contratos: [{ folio: "C-142", cliente: "Ternium México" }, { folio: "C-156", cliente: "Cemex" }],
  },
  {
    folio: "E-138", nombre: "María Fernanda López Treviño", puesto: "Guardia", activo: true,
    curp: "LOTM920705MNLPRR08", nss: "43169212345", rfc: "LOTM920705QW2", alta: "25-01-20",
    docs: [{ nombre: "Constancia DC-3", estatus: "Aceptado", vence: "27-01-20" }],
    contratos: [{ folio: "C-142", cliente: "Ternium México" }],
  },
  {
    folio: "E-175", nombre: "Ricardo Salinas Garza", puesto: "Técnico de mantenimiento", activo: false,
    curp: "SAGR780930HNLLRC01", nss: "43107812345", rfc: "SAGR780930KM5", alta: "22-06-02", telefono: "81 8765 4321",
    docs: [],
    contratos: [],
  },
];

const TONO_DOC = { Aceptado: "success", "Por revisar": "info", Vencido: "danger" } as const;

export function MuestraPanel() {
  const [sel, setSel] = useState<Empleado | null>(null);
  const [enTabla, setEnTabla] = useState(false);
  const [tab, setTab] = useState("generales");
  const [eliminar, setEliminar] = useState(false);

  const columnas = useMemo<ColumnDef<Empleado, unknown>[]>(
    () => [
      {
        id: "nombre",
        header: "Empleado",
        accessorFn: (e) => e.nombre,
        meta: { principal: true },
        cell: ({ row: { original: e } }) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-semibold text-c10-title">{e.nombre}</span>
            <span className="text-xs tabular-nums text-c10-faint">#{e.folio}</span>
          </span>
        ),
      },
      { id: "puesto", header: "Puesto", accessorFn: (e) => e.puesto },
      {
        id: "estatus",
        header: "Estatus",
        accessorFn: (e) => (e.activo ? 0 : 1),
        cell: ({ row: { original: e } }) => <ChipEstado texto={e.activo ? "Activo" : "Inactivo"} tono={e.activo ? "success" : "neutral"} />,
      },
    ],
    [],
  );
  const tabla = useTabla({ datos: EMPLEADOS, columnas, getId: (e) => e.folio });

  const abrir = (e: Empleado, desdeTabla: boolean) => {
    if (sel?.folio !== e.folio) setTab("generales");
    setEnTabla(desdeTabla);
    setSel(e);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm text-c10-meta">
          Desde cards: el velo bloquea y un clic en él cierra. Desde la tabla: sin velo, el ojo cambia de empleado sin cerrar y un clic fuera cierra.
          El ancho se arrastra del borde izquierdo y se recuerda.
        </p>
        <div className="flex flex-wrap gap-3">
          {EMPLEADOS.map((e) => (
            <button
              key={e.folio}
              type="button"
              onClick={() => abrir(e, false)}
              className="flex w-[220px] flex-col items-start gap-1.5 rounded-xl bg-c10-surface p-4 text-left shadow-[0_0_0_1px_var(--c10-line-card),0_1px_2px_rgba(15,23,42,.05)] transition-[box-shadow,transform] duration-200 hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--c10-line-card),0_12px_28px_rgba(15,23,42,.12)]"
            >
              <span className="text-sm font-semibold text-c10-title">{e.nombre}</span>
              <span className="text-xs text-c10-meta">{e.puesto}</span>
              <ChipEstado texto={e.activo ? "Activo" : "Inactivo"} tono={e.activo ? "success" : "neutral"} />
            </button>
          ))}
        </div>
        <Tabla
          tabla={tabla}
          acciones={(e) => <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla onClick={() => abrir(e, true)} {...PANEL_OJO} />}
          filaActiva={enTabla ? sel?.folio : null}
        />
      </div>

      <PanelDetalle
        abierto={!!sel}
        onCerrar={() => setSel(null)}
        enTabla={enTabla}
        etiqueta="Detalle del empleado"
        titulo={sel?.nombre}
        chips={
          sel && (
            <>
              <ChipFolio folio={sel.folio} />
              <ChipEstado texto={sel.activo ? "Activo" : "Inactivo"} tono={sel.activo ? "success" : "neutral"} />
              <ChipTipo>{sel.puesto}</ChipTipo>
            </>
          )
        }
        acciones={
          <>
            <BotonIcono titulo="Abrir en una pestaña nueva" icono={<ExternalLink />} onClick={() => avisar("Abriendo el expediente", "info")} />
            <BotonIcono titulo="Descargar expediente" icono={<Download />} onClick={() => avisar("Se inició la descarga del expediente", "info")} />
            <BotonIcono titulo="Eliminar empleado" icono={<Trash2 />} peligro onClick={() => setEliminar(true)} />
          </>
        }
        tabs={[
          { k: "generales", etiqueta: "Generales" },
          { k: "documentos", etiqueta: "Documentos", cuenta: sel?.docs.length ?? 0 },
          { k: "contratos", etiqueta: "Contratos", cuenta: sel?.contratos.length ?? 0 },
        ]}
        tab={tab}
        onTab={setTab}
        accionPrincipal={
          <Boton icono={<Pencil />} className="w-[180px]" onClick={() => avisar("Aquí abre el modal de editar (ME-04)", "info")}>
            Editar Empleado
          </Boton>
        }
      >
        {sel && tab === "generales" && (
          <TarjetaPanel>
            <Datos>
              <Dato nombre="CURP">{sel.curp}</Dato>
              <Dato nombre="NSS">{sel.nss}</Dato>
              <Dato nombre="RFC">{sel.rfc}</Dato>
              <Dato nombre="Puesto">{sel.puesto}</Dato>
              <Dato nombre="Fecha de alta">{sel.alta}</Dato>
              <Dato nombre="Teléfono">{sel.telefono}</Dato>
            </Datos>
          </TarjetaPanel>
        )}
        {sel && tab === "documentos" && (
          <TarjetaPanel titulo="Documentos">
            {sel.docs.length ? (
              sel.docs.map((d) => (
                <div key={d.nombre} className="flex items-center gap-3 border-t border-c10-sunken pt-3 first:border-0 first:pt-0">
                  <FileText className="size-4 shrink-0 text-c10-meta" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-c10-title">{d.nombre}</span>
                  <span className="text-xs tabular-nums text-c10-meta">Vence {d.vence}</span>
                  <ChipEstado texto={d.estatus} tono={TONO_DOC[d.estatus]} />
                </div>
              ))
            ) : (
              <p className="m-0 text-sm text-c10-meta">No hay documentos cargados.</p>
            )}
          </TarjetaPanel>
        )}
        {sel && tab === "contratos" && (
          <TarjetaPanel titulo="Contratos">
            {sel.contratos.length ? (
              <Datos>
                {sel.contratos.map((c) => (
                  <Dato key={c.folio} nombre={c.cliente}>
                    <ChipFolio folio={c.folio} />
                  </Dato>
                ))}
              </Datos>
            ) : (
              <p className="m-0 text-sm text-c10-meta">No está asignado a ningún contrato.</p>
            )}
          </TarjetaPanel>
        )}
      </PanelDetalle>

      <ModalConfirmar
        abierto={eliminar}
        onCancelar={() => setEliminar(false)}
        onConfirmar={() => {
          setEliminar(false);
          setSel(null);
          avisar("Se eliminó el empleado");
        }}
        titulo="Eliminar empleado"
        descripcion="El empleado dejará de aparecer en Mi empresa y en sus contratos."
        elemento={sel ? `#${sel.folio} · ${sel.nombre}` : undefined}
        etiqueta="Eliminar"
        icono={<Trash2 />}
        peligro
      />
    </>
  );
}
