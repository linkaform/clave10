"use client";
// CF-03 · Configuraciones → Sesiones: tabla y calendario, editor (Programar / Editar)
// y panel de detalle. Ficha: lkf-claude, contratistas_cf03_sesiones.md.
// Diseño: plataforma.dc.html, ecIsSes (~1881–1971), ssnDetOpen (~2111), ssnEdOpen (~2160)
// y ssnVals (~7336–7639). Participantes, asistencia y cancelar con motivo son de CF-04.
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Eye, Pencil, RotateCw, Table2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Boton, BotonFlotante, BotonIcono, Buscador, ChipKpi, EstadoVacio, ModalConfirmar, Paginacion, Tabla, avisar, tipoVacio, useTabla,
} from "@/components/contratistas/ui";
import { PANEL_OJO } from "@/components/contratistas/panel";
import { ConFiltros, FiltroChips, FiltrosCabecera, coincide, enLista, useFiltros } from "@/components/contratistas/filtros";
import { CabeceraConfig } from "@/components/contratistas/configuracion/CabeceraConfig";
import { cancelSesion, listSesiones } from "@/services/contratistas";
import type { Sesion } from "@/types/contratistas";
import { isoLocal } from "@/components/contratistas/vigencia";
import { CalendarioSesiones } from "./CalendarioSesiones";
import { DetalleSesion } from "./DetalleSesion";
import { EditorSesion } from "./EditorSesion";
import { ChipEstatusSesion, ChipModalidad, ChipTipoSesion, Ocupacion } from "./piezas";
import { ESTATUS_SESION, MODALIDADES, TIPOS_SESION, horario, rangoFechas, sesionEditor, sesionNueva, CLAVE_SESIONES, type AbrirEditor, type SesionEd } from "./sesiones";

type Vista = "tabla" | "calendario";

export function SesionesConfig({ pestanas }: { pestanas: ReactNode }) {
  const qc = useQueryClient();
  const sesionesQ = useQuery({ queryKey: CLAVE_SESIONES, queryFn: () => listSesiones({ limit: 1000 }) });

  const [vista, setVista] = useState<Vista>("tabla");
  const [q, setQ] = useState("");
  const [detalle, setDetalle] = useState<{ id: string; enTabla: boolean } | null>(null);
  const [editor, setEditor] = useState<{ sesion?: Sesion; inicial: SesionEd } | null>(null);
  const [eliminar, setEliminar] = useState<Sesion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const f = useFiltros({ tipo: [] as string[], modalidad: [] as string[], estatus: [] as string[] });
  const v = f.valores;

  const base = useMemo(() => sesionesQ.data?.items ?? [], [sesionesQ.data]);
  const datos = useMemo(
    () =>
      base.filter(
        (s) =>
          coincide(q, s.nombre, s.descripcion, s.instructor, s.lugar) &&
          enLista(v.tipo, s.tipo) && enLista(v.modalidad, s.modalidad) && enLista(v.estatus, s.estatus),
      ),
    [base, q, v],
  );
  const cuenta = (k: "tipo" | "modalidad" | "estatus", x: string) => base.filter((s) => s[k] === x).length;

  const controles = (
    <>
      <FiltroChips titulo="Tipo" opciones={TIPOS_SESION.map((t) => ({ valor: t, cuenta: cuenta("tipo", t) }))} valor={v.tipo} onCambio={(x) => f.poner("tipo", x)} />
      <FiltroChips titulo="Modalidad" opciones={MODALIDADES.map((m) => ({ valor: m, cuenta: cuenta("modalidad", m) }))} valor={v.modalidad} onCambio={(x) => f.poner("modalidad", x)} />
      <FiltroChips titulo="Estatus" opciones={ESTATUS_SESION.map((e) => ({ valor: e, cuenta: cuenta("estatus", e) }))} valor={v.estatus} onCambio={(x) => f.poner("estatus", x)} />
    </>
  );

  const abrirEditor: AbrirEditor = (sesion, inicial) => {
    setDetalle(null);
    setEditor({ sesion, inicial: inicial ?? (sesion ? sesionEditor(sesion) : sesionNueva(isoLocal(new Date()))) });
  };
  const pedirEliminar = (s: Sesion) => setEliminar(s);

  const columnas = useMemo<ColumnDef<Sesion, unknown>[]>(
    () => [
      {
        id: "nombre", header: "Sesión", accessorFn: (s) => s.nombre, meta: { principal: true },
        cell: ({ row: { original: s } }) => <span className="truncate font-semibold text-c10-title" title={s.nombre}>{s.nombre}</span>,
      },
      {
        id: "descripcion", header: "Descripción", accessorFn: (s) => s.descripcion ?? "", enableSorting: false, meta: { minimo: 220 },
        cell: ({ row: { original: s } }) => (
          <span className="line-clamp-2 text-c10-secondary" title={s.descripcion}>{s.descripcion || "---"}</span>
        ),
      },
      {
        id: "fecha", header: "Fecha y hora", accessorFn: (s) => `${s.fecha_inicio} ${s.hora_inicio ?? ""}`, meta: { minimo: 170 },
        cell: ({ row: { original: s } }) => (
          <span className="flex flex-col gap-px whitespace-nowrap">
            <span className="text-c10-title">{rangoFechas(s)}</span>
            <span className="text-xs tabular-nums text-c10-meta">{horario(s)}{s.recurrencia ? " · se repite" : ""}</span>
          </span>
        ),
      },
      { id: "modalidad", header: "Modalidad", accessorFn: (s) => s.modalidad, cell: ({ row }) => <ChipModalidad modalidad={row.original.modalidad} /> },
      { id: "tipo", header: "Tipo de sesión", accessorFn: (s) => s.tipo, cell: ({ row }) => <ChipTipoSesion tipo={row.original.tipo} /> },
      {
        id: "estatus", header: "Estatus", accessorFn: (s) => ESTATUS_SESION.indexOf(s.estatus),
        cell: ({ row }) => <ChipEstatusSesion estatus={row.original.estatus} />,
      },
      {
        id: "participantes", header: "Participantes", accessorFn: (s) => s.inscritos ?? 0, meta: { minimo: 130 },
        cell: ({ row: { original: s } }) => <Ocupacion inscritos={s.inscritos ?? 0} cupo={s.cupo} />,
      },
    ],
    [],
  );

  const tabla = useTabla({ datos, columnas, getId: (s) => s.id });

  const vacio = (
    <EstadoVacio
      tipo={tipoVacio({ error: sesionesQ.error, filtrando: !!q.trim() || f.activos })}
      accion={sesionesQ.error ? <Boton variante="contorno" tam="sm" icono={<RotateCw />} onClick={() => sesionesQ.refetch()}>Reintentar</Boton> : undefined}
    />
  );

  const refrescar = () => qc.invalidateQueries({ queryKey: CLAVE_SESIONES });

  const confirmarEliminar = async () => {
    if (!eliminar) return;
    setEliminando(true);
    try {
      await cancelSesion(eliminar.id, "Sesión eliminada desde Configuraciones");
      avisar("Se eliminó la sesión");
      if (detalle?.id === eliminar.id) setDetalle(null);
      setEliminar(null);
      refrescar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo eliminar la sesión", "error");
    } finally {
      setEliminando(false);
    }
  };

  const inscritosEliminar = eliminar?.inscritos ?? 0;

  return (
    <>
      <CabeceraConfig titulo="Sesiones" kpi={<ChipKpi n={datos.length} />}>
        <FiltrosCabecera angosto vista="tabla" cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
        <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar sesión" className="w-[240px]" />
        {pestanas}
        <SelectorVistaSesiones vista={vista} onCambio={setVista} />
      </CabeceraConfig>

      <ConFiltros conCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} vista="tabla" tope="96px">
        {vista === "tabla" ? (
          <div className="flex flex-col gap-4">
            <Tabla
              tabla={tabla} fijarPrincipal claveAncho="config-sesiones" cargando={sesionesQ.isLoading} vacio={vacio}
              nombreFila={(s) => s.nombre} filaActiva={detalle?.enTabla ? detalle.id : null}
              acciones={(s) => (
                <>
                  <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla onClick={() => setDetalle({ id: s.id, enTabla: true })} {...PANEL_OJO} />
                  <BotonIcono titulo="Editar" icono={<Pencil />} enTabla disabled={s.estatus === "Cancelada"} onClick={() => abrirEditor(s)} />
                  <BotonIcono
                    titulo={s.estatus === "Programada" ? "Eliminar" : "Solo se elimina una sesión Programada"}
                    icono={<Trash2 />} enTabla peligro disabled={s.estatus !== "Programada"} onClick={() => pedirEliminar(s)}
                  />
                </>
              )}
            />
            <Paginacion tabla={tabla} />
          </div>
        ) : (
          <CalendarioSesiones
            sesiones={datos} cargando={sesionesQ.isLoading}
            onVer={(s) => setDetalle({ id: s.id, enTabla: false })} onEditar={abrirEditor} onEliminar={pedirEliminar}
          />
        )}
      </ConFiltros>

      <BotonFlotante etiqueta="Programar Sesión" onClick={() => abrirEditor()} />

      <DetalleSesion
        id={detalle?.id ?? null} enTabla={detalle?.enTabla} onCerrar={() => setDetalle(null)}
        onEditar={abrirEditor} onEliminar={pedirEliminar}
      />

      {editor && (
        <EditorSesion sesion={editor.sesion} inicial={editor.inicial} onCerrar={() => setEditor(null)} onGuardado={refrescar} />
      )}

      <ModalConfirmar
        abierto={!!eliminar} onCancelar={() => setEliminar(null)} onConfirmar={confirmarEliminar} cargando={eliminando}
        titulo="¿Eliminar sesión?" etiqueta="Eliminar Sesión" peligro icono={<Trash2 />}
        elemento={eliminar?.nombre}
        descripcion={
          inscritosEliminar
            ? `Se notificará a ${inscritosEliminar} ${inscritosEliminar === 1 ? "participante inscrito" : "participantes inscritos"}. Esta acción no se puede deshacer.`
            : "Se eliminará la sesión y su lista de participantes. Esta acción no se puede deshacer."
        }
      />
    </>
  );
}

/** Tabla / Calendario: botones de ícono unidos, como el selector de vistas del UI kit. */
function SelectorVistaSesiones({ vista, onCambio }: { vista: Vista; onCambio: (v: Vista) => void }) {
  const opciones: { k: Vista; titulo: string; Icono: typeof Table2 }[] = [
    { k: "tabla", titulo: "Tabla", Icono: Table2 },
    { k: "calendario", titulo: "Calendario", Icono: CalendarDays },
  ];
  return (
    <div role="tablist" aria-label="Vista" className="flex overflow-hidden rounded-lg bg-c10-surface ring-1 ring-c10-line">
      {opciones.map(({ k, titulo, Icono }, i) => {
        const on = vista === k;
        return (
          <button
            key={k} type="button" role="tab" aria-selected={on} title={titulo} aria-label={titulo} onClick={() => onCambio(k)}
            className={cn(
              "flex size-10 items-center justify-center transition-colors duration-150 [&_svg]:size-4",
              i > 0 && "border-l border-c10-line",
              on ? "bg-c10-acc text-white" : "text-c10-secondary hover:text-c10-acc",
            )}
          >
            <Icono />
          </button>
        );
      })}
    </div>
  );
}
