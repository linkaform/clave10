"use client";
// CF-01 · Configuraciones → Requerimientos: lista con búsqueda y filtros, asistente de
// alta/edición en 2 pasos y panel de detalle (Generales / Aplicación).
// Ficha: lkf-claude, contratistas_cf01_requerimientos.md.
// Diseño: plataforma.dc.html, ecIsReq (~1852–1867), rqDetOpen (~1972), rqEdOpen (~2324)
// y rqVals (~7154–7320). Back: CF-01-B (configuracion_sdk.py).
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Briefcase, Eye, FileSignature, IdCard, Pencil, RotateCw, Trash2, Truck, Users } from "lucide-react";
import {
  Boton, BotonFlotante, BotonIcono, Buscador, ChipKpi, EstadoVacio, ModalConfirmar, Paginacion, Tabla, avisar, tipoVacio, useTabla,
} from "@/components/contratistas/ui";
import { PANEL_OJO } from "@/components/contratistas/panel";
import { ConFiltros, FiltroChips, FiltrosCabecera, coincide, enLista, useFiltros } from "@/components/contratistas/filtros";
import { ChipAmbito, ChipTipoRequerimiento } from "@/components/contratistas/ligar";
import { CabeceraConfig } from "@/components/contratistas/configuracion/CabeceraConfig";
import { getAplicacionRequerimiento, listRequerimientos, saveRequerimiento } from "@/services/contratistas";
import type { Requerimiento } from "@/types/contratistas";
import { DetalleRequerimiento } from "./DetalleRequerimiento";
import { ChipLimitante } from "./piezas";
import { EditorRequerimiento } from "./EditorRequerimiento";
import {
  CLAVES_FILTRO, CLAVE_LISTA, type AbrirEditorReq, CLAVE_REQUERIMIENTOS, FILTROS_REQ, SUJETOS_AMBITO, requerimientoInactivo, textoVigencia, todasLasPaginas,
} from "./requerimientos";

export function RequerimientosConfig({ pestanas }: { pestanas: ReactNode }) {
  const qc = useQueryClient();
  const reqsQ = useQuery({
    queryKey: CLAVE_LISTA,
    queryFn: () => todasLasPaginas((offset, limit) => listRequerimientos({ estatus: "Activo", offset, limit })),
  });

  const [q, setQ] = useState("");
  const [detalle, setDetalle] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ r?: Requerimiento } | null>(null);
  const [eliminar, setEliminar] = useState<Requerimiento | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Los sub-ítems Documentos, Exámenes e Inspecciones del menú abren la lista ya filtrada
  // con ?tipo=Documento (useFiltros lee los atajos de la URL).
  const f = useFiltros({
    tipo: [] as string[],
    ambito: [] as string[], vigencia: [] as string[], avisos: [] as string[], acuse: [] as string[], limitante: [] as string[],
  });
  const v = f.valores;

  const base = useMemo(() => (reqsQ.data ?? []).filter((r) => r.estatus !== "Inactivo"), [reqsQ.data]);
  const datos = useMemo(
    () => base.filter((r) => coincide(q, r.nombre, r.descripcion) && CLAVES_FILTRO.every((k) => enLista(v[k], FILTROS_REQ[k].de(r)))),
    [base, q, v],
  );

  const controles = (
    <>
      {CLAVES_FILTRO.map((k) => {
        const def = FILTROS_REQ[k];
        return (
          <FiltroChips
            key={k} titulo={def.titulo} valor={v[k]} onCambio={(x) => f.poner(k, x)}
            opciones={def.opciones.map((o) => ({ valor: o, cuenta: base.filter((r) => def.de(r) === o).length }))}
          />
        );
      })}
    </>
  );

  const abrirEditor: AbrirEditorReq = (r) => {
    setDetalle(null);
    setEditor({ r });
  };

  const columnas = useMemo<ColumnDef<Requerimiento, unknown>[]>(
    () => [
      {
        id: "nombre", header: "Requerimiento", accessorFn: (r) => r.nombre, meta: { principal: true },
        sortingFn: (a, b) => a.original.nombre.localeCompare(b.original.nombre, "es", { sensitivity: "base" }),
        cell: ({ row: { original: r } }) => <span className="font-semibold leading-snug text-c10-title [text-wrap:pretty]">{r.nombre}</span>,
      },
      {
        id: "descripcion", header: "Descripción", enableSorting: false, meta: { minimo: 240 },
        cell: ({ row: { original: r } }) => (
          <span className={cn("line-clamp-2 text-[13px] leading-[1.45]", r.descripcion ? "text-c10-secondary" : "text-c10-faint")} title={r.descripcion}>
            {r.descripcion || "---"}
          </span>
        ),
      },
      { id: "tipo", header: "Tipo", enableSorting: false, meta: { minimo: 136 }, cell: ({ row }) => <ChipTipoRequerimiento tipo={row.original.tipo} /> },
      {
        id: "vigencia", header: "Vigencia", enableSorting: false, meta: { minimo: 220 },
        cell: ({ row }) => <span className="font-medium text-c10-title">{textoVigencia(row.original)}</span>,
      },
      { id: "ambito", header: "Ámbito", enableSorting: false, meta: { minimo: 128 }, cell: ({ row }) => <ChipAmbito ambito={row.original.ambito} /> },
      { id: "limitante", header: "Limitante", enableSorting: false, meta: { minimo: 112 }, cell: ({ row }) => <ChipLimitante si={row.original.limitante} /> },
    ],
    [],
  );

  const tabla = useTabla({ datos, columnas, getId: (r) => r.id });

  const vacio = (
    <EstadoVacio
      tipo={tipoVacio({ error: reqsQ.error, filtrando: !!q.trim() || f.activos })}
      accion={reqsQ.error ? <Boton variante="contorno" tam="sm" icono={<RotateCw />} onClick={() => reqsQ.refetch()}>Reintentar</Boton> : undefined}
    />
  );

  const refrescar = () => qc.invalidateQueries({ queryKey: CLAVE_REQUERIMIENTOS });

  // "Se usa en" del confirmar: dónde lo exigen y a quién (pestaña Aplicación).
  const usoQ = useQuery({
    queryKey: [...CLAVE_REQUERIMIENTOS, "aplicacion", eliminar?.id],
    queryFn: () => getAplicacionRequerimiento(eliminar!.id),
    enabled: !!eliminar,
  });
  const seUsaEn = useMemo(() => {
    const a = usoQ.data;
    if (!a || !eliminar) return [];
    const n = (t: string) => a.exigencia.filter((x) => x.tipo === t).length;
    const sujetos = new Set(a.sujetos.map((s) => s.sujeto.id)).size;
    const s = SUJETOS_AMBITO[eliminar.ambito];
    return [
      { icono: <Briefcase />, etiqueta: "Servicios", n: n("Servicio") },
      { icono: <IdCard />, etiqueta: "Perfiles", n: n("Perfil") },
      { icono: <Truck />, etiqueta: "Equipos", n: n("Equipo") },
      { icono: <FileSignature />, etiqueta: "Contratos", n: a.contratos.length },
      { icono: <Users />, etiqueta: s.pestana, n: sujetos },
    ].filter((u) => u.n > 0);
  }, [usoQ.data, eliminar]);

  const confirmarEliminar = async () => {
    if (!eliminar) return;
    setEliminando(true);
    try {
      await saveRequerimiento(requerimientoInactivo(eliminar), eliminar.id);
      avisar("Se eliminó el requerimiento");
      if (detalle === eliminar.id) setDetalle(null);
      setEliminar(null);
      refrescar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo eliminar el requerimiento", "error");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <CabeceraConfig titulo="Requerimientos" kpi={<ChipKpi n={datos.length} />}>
        <FiltrosCabecera angosto vista="tabla" cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
        <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar requerimiento" className="w-[260px]" />
        {pestanas}
      </CabeceraConfig>

      <ConFiltros conCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} vista="tabla" tope="96px">
        <div className="flex flex-col gap-4">
          <Tabla
            tabla={tabla} fijarPrincipal claveAncho="config-requerimientos" cargando={reqsQ.isLoading} vacio={vacio}
            nombreFila={(r) => r.nombre} filaActiva={detalle}
            acciones={(r) => (
              <>
                <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla onClick={() => setDetalle(detalle === r.id ? null : r.id)} {...PANEL_OJO} />
                <BotonIcono titulo="Editar" icono={<Pencil />} enTabla onClick={() => abrirEditor(r)} />
                <BotonIcono titulo="Eliminar" icono={<Trash2 />} enTabla peligro onClick={() => setEliminar(r)} />
              </>
            )}
          />
          <Paginacion tabla={tabla} />
        </div>
      </ConFiltros>

      {!detalle && <BotonFlotante etiqueta="Nuevo Requerimiento" onClick={() => abrirEditor()} />}

      <DetalleRequerimiento id={detalle} onCerrar={() => setDetalle(null)} onEditar={abrirEditor} onEliminar={setEliminar} />

      {editor && <EditorRequerimiento requerimiento={editor.r} onCerrar={() => setEditor(null)} onGuardado={refrescar} />}

      <ModalConfirmar
        abierto={!!eliminar} onCancelar={() => setEliminar(null)} onConfirmar={confirmarEliminar} cargando={eliminando || usoQ.isLoading}
        titulo="¿Eliminar requerimiento?" etiqueta="Eliminar" peligro icono={<Trash2 />} ancho={480}
        elemento={eliminar?.nombre}
        seUsaEn={seUsaEn}
        descripcion={
          usoQ.isLoading
            ? "Revisando dónde se usa…"
            : seUsaEn.length
              ? "Se quitará de todos los lugares donde se usa. Esta acción no se puede deshacer."
              : "No se usa en ningún servicio, perfil ni contrato. Esta acción no se puede deshacer."
        }
      />
    </>
  );
}
