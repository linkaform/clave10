"use client";
// ME-06 · Mi empresa → Documentos: lista en 3 vistas con filtros, panel con
// versiones, compartido con y comentarios (F0-13), subida con IA y duplicados
// (F0-10) y carga masiva. Ficha: lkf-claude, contratistas_me06_documentos.md.
// Diseño: plataforma.dc.html, dcTab (~2699–2767) y docVals (~7871–8008).
// Con `contratoId` es la misma lista dentro de un contrato: sin columna Contratos.
import { useMemo, useRef, useState, type DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Download, Eye, FileSearch, FileText, Plus, RotateCw, Sparkles, UserRound } from "lucide-react";
import {
  BarraSeleccion, Boton, BotonBarra, BotonFlotante, BotonIcono, Buscador, ChipEstado, ChipFolio, ChipKpi, ChipTipo, ColumnaLista,
  DatoLista, EstadoVacio, FilaDato, Paginacion, RejillaCards, SelectorVista, Tabla, TarjetaCompacta, TarjetaLista, tipoVacio,
  useTabla, useVista,
} from "@/components/contratistas/ui";
import { PANEL_OJO } from "@/components/contratistas/panel";
import { ConFiltros, FECHA_TODOS, FiltroChips, FiltroFecha, FiltroLista, FiltrosCabecera, coincide, enFecha, enLista, useFiltros } from "@/components/contratistas/filtros";
import { ModalRevisarDocumento, PanelDocumento, propietario, puedeRevisar } from "@/components/contratistas/documento";
import { fmtFecha } from "@/components/contratistas/documento/formato";
import { UploaderIA, type UploaderIAHandle } from "@/components/contratistas/uploader/UploaderIA";
import { useContratistasContexto } from "@/hooks/Contratistas/useContratistasContexto";
import { ESTATUS_DOCUMENTO_TONO } from "@/mappers/contratistas.mapper";
import { commentDocumento, getDocumento, listDocumentos, listEmpleados, listRequerimientos, uploadDocumento } from "@/services/contratistas";
import type { Documento, EmpresaRef, Id } from "@/types/contratistas";
import type { ResultadoUploader } from "@/types/contratistas/uploader";
import { CargaMasivaDocumentos } from "./CargaMasivaDocumentos";
import { ESTATUS, TIPO_DUENO, contratosDe, documentoInput, estatusDe, fechaCarga, subidoPor } from "./documentosEmpresa";

const Estatus = ({ d }: { d: Documento }) => <ChipEstado texto={estatusDe(d)} tono={ESTATUS_DOCUMENTO_TONO[estatusDe(d)]} />;
const vigencia = (d: Documento) => (d.vigencia_fin ? fmtFecha(d.vigencia_fin) : "Sin vigencia");
const esImagen = (d: Documento) => /\.(png|jpe?g|webp|gif)$/i.test(d.archivo.name);
const descargar = (d: Documento) => window.open(d.archivo.file_url, "_blank", "noopener");

export function DocumentosEmpresa({ contratoId }: { contratoId?: Id }) {
  const { empresa: miEmpresa, editable } = useContratistasContexto();
  const qc = useQueryClient();
  const empresa: EmpresaRef | null = miEmpresa && { id: miEmpresa.id, razon_social: miEmpresa.razon_social, rfc: miEmpresa.rfc };
  const clave = ["contratistas", "documentos", empresa?.id, contratoId];

  const docsQ = useQuery({
    queryKey: clave,
    queryFn: () => listDocumentos({ empresa_id: empresa!.id, contrato_id: contratoId, limit: 1000 }),
    enabled: !!empresa,
  });
  const empleadosQ = useQuery({ queryKey: ["contratistas", "empleados", "activos"], queryFn: () => listEmpleados({ estatus: "Activo", limit: 1000 }), enabled: editable });
  const reqsQ = useQuery({ queryKey: ["contratistas", "requerimientos", "activos"], queryFn: () => listRequerimientos({ estatus: "Activo", limit: 1000 }), enabled: editable });

  const [q, setQ] = useState("");
  const [vista, setVista] = useVista(contratoId ? "contrato-documentos" : "empresa-documentos", "cards");
  const [abierto, setAbierto] = useState<{ d: Documento; enTabla: boolean } | null>(null);
  const [revisar, setRevisar] = useState<Documento | null>(null);
  const [masiva, setMasiva] = useState<File[] | null>(null);
  const uploader = useRef<UploaderIAHandle>(null);
  const input = useRef<HTMLInputElement>(null);
  const conContratos = !contratoId;

  const f = useFiltros({
    estatus: [] as string[], categoria: [] as string[], propietario: [] as string[], tipo: [] as string[], contrato: [] as string[],
    vigencia: FECHA_TODOS, carga: FECHA_TODOS,
  });
  const v = f.valores;

  const base = useMemo(() => docsQ.data?.items ?? [], [docsQ.data]);
  const datos = useMemo(
    () =>
      base.filter(
        (d) =>
          coincide(q, d.nombre, d.folio, propietario(d)) &&
          enLista(v.estatus, estatusDe(d)) &&
          enLista(v.categoria, d.categoria ?? "") &&
          enLista(v.propietario, propietario(d)) &&
          enLista(v.tipo, TIPO_DUENO[d.dueno.tipo]) &&
          (!v.contrato.length || contratosDe(d).some((c) => v.contrato.includes(c))) &&
          enFecha(d.vigencia_fin, v.vigencia) &&
          enFecha(fechaCarga(d), v.carga),
      ),
    [base, q, v],
  );

  // Opciones con contador, sacadas de lo que hay antes de filtrar
  const opciones = (de: (d: Documento) => string[]) => {
    const n = new Map<string, number>();
    base.forEach((d) => de(d).forEach((x) => x && n.set(x, (n.get(x) ?? 0) + 1)));
    return [...n].sort(([a], [b]) => a.localeCompare(b)).map(([valor, cuenta]) => ({ valor, cuenta }));
  };
  const cuantos = (e: string) => base.filter((d) => estatusDe(d) === e).length;

  const controles = (
    <>
      <FiltroChips titulo="Estatus" opciones={ESTATUS.map((e) => ({ valor: e, cuenta: cuantos(e) }))} valor={v.estatus} onCambio={(x) => f.poner("estatus", x)} />
      <FiltroChips titulo="Categoría" opciones={opciones((d) => [d.categoria ?? ""])} valor={v.categoria} onCambio={(x) => f.poner("categoria", x)} />
      <FiltroChips titulo="Tipo de propietario" opciones={opciones((d) => [TIPO_DUENO[d.dueno.tipo]])} valor={v.tipo} onCambio={(x) => f.poner("tipo", x)} />
      <FiltroLista titulo="Propietario" placeholder="Selecciona un propietario" opciones={opciones((d) => [propietario(d)])} valor={v.propietario} onCambio={(x) => f.poner("propietario", x)} />
      {conContratos && <FiltroLista titulo="Contrato" placeholder="Selecciona un contrato" opciones={opciones(contratosDe)} valor={v.contrato} onCambio={(x) => f.poner("contrato", x)} />}
      <FiltroFecha titulo="Vigencia" valor={v.vigencia} onCambio={(x) => f.poner("vigencia", x)} />
      <FiltroFecha titulo="Fecha de carga" valor={v.carga} onCambio={(x) => f.poner("carga", x)} />
    </>
  );

  const columnas = useMemo<ColumnDef<Documento, unknown>[]>(
    () => [
      {
        id: "nombre", header: "Documento", accessorFn: (d) => d.nombre, meta: { principal: true },
        cell: ({ row: { original: d } }) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-semibold text-c10-title" title={d.nombre}>{d.nombre}</span>
            <span className="text-xs tabular-nums text-c10-faint">{d.folio}</span>
          </span>
        ),
      },
      { id: "estatus", header: "Estatus", accessorFn: (d) => estatusDe(d), cell: ({ row }) => <Estatus d={row.original} /> },
      { id: "categoria", header: "Categoría", accessorFn: (d) => d.categoria ?? "---" },
      { id: "propietario", header: "Propietario", accessorFn: (d) => propietario(d), meta: { minimo: 180 },
        cell: ({ row: { original: d } }) => <span className="flex flex-col"><span className="truncate">{propietario(d)}</span><span className="text-xs text-c10-meta">{TIPO_DUENO[d.dueno.tipo]}</span></span> },
      ...(conContratos ? [{ id: "contratos", header: "Contratos", accessorFn: (d: Documento) => contratosDe(d).join(", "), meta: { minimo: 150 } }] : []),
      { id: "vigencia", header: "Vigencia", accessorFn: (d) => d.vigencia_fin ?? "", cell: ({ row }) => vigencia(row.original) },
      { id: "carga", header: "Fecha de carga", accessorFn: (d) => fechaCarga(d) ?? "", cell: ({ row }) => fmtFecha(fechaCarga(row.original)) },
      { id: "subido", header: "Subido por", accessorFn: subidoPor, meta: { minimo: 150 } },
      { id: "ia", header: "Lectura con IA", accessorFn: (d) => (d.lectura_ia ? "Sí" : "No") },
    ],
    [conContratos],
  );

  const tabla = useTabla({ datos, columnas, getId: (d) => d.id });
  const filasPagina = tabla.getRowModel().rows;

  const refrescar = () => qc.invalidateQueries({ queryKey: clave });
  const alCambiar = (doc: Documento) => {
    setAbierto((a) => (a && a.d.id === doc.id ? { ...a, d: doc } : a));
    refrescar();
  };
  const abrir = (d: Documento, enTabla: boolean) => {
    setAbierto({ d, enTabla });
    getDocumento(d.id).then((doc) => setAbierto((a) => (a?.d.id === doc.id ? { ...a, d: doc } : a))).catch(() => {});
  };

  /* ---------- Subir ---------- */

  const elegir = (files: FileList | null) => {
    const lista = Array.from(files ?? []);
    if (!lista.length || !empresa) return;
    if (lista.length === 1) uploader.current?.abrir(lista[0]);
    else setMasiva(lista);
  };

  const guardar = async (r: ResultadoUploader) => {
    if (!empresa) return;
    const doc = await uploadDocumento(documentoInput(empresa, r, { contratos: contratoId && !r.reemplaza_id ? [contratoId] : undefined }));
    for (const texto of r.comentarios) await commentDocumento(doc.id, texto);
    refrescar();
  };

  const empleados = empleadosQ.data?.items ?? [];
  const opcionesPropietario = useMemo(
    () => (empresa ? [{ id: empresa.id, nombre: empresa.razon_social, sub: "Empresa" }, ...empleados.map((e) => ({ id: e.id, nombre: e.nombre, sub: "Empleado" }))] : []),
    [empresa?.id, empleados], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const opcionesMapeo = useMemo(() => (reqsQ.data?.items ?? []).map((r) => ({ id: r.id, nombre: r.nombre })), [reqsQ.data]);
  const existentes = useMemo(() => base.map((d) => ({ id: d.id, folio: d.folio, nombre: d.nombre, archivo_nombre: d.archivo.name })), [base]);

  /* ---------- Vista ---------- */

  const vacio = (
    <EstadoVacio
      tipo={tipoVacio({ error: docsQ.error, filtrando: !!q.trim() || f.activos })}
      accion={docsQ.error ? <Boton variante="contorno" tam="sm" icono={<RotateCw />} onClick={() => docsQ.refetch()}>Reintentar</Boton> : undefined}
    />
  );

  const AccionesCard = ({ d }: { d: Documento }) => (
    <>
      <BotonIcono titulo={puedeRevisar(d) ? "Revisar documento" : "Solo el cliente revisa documentos Por revisar"} icono={<FileSearch />} disabled={!puedeRevisar(d)} onClick={() => setRevisar(d)} />
      <BotonIcono titulo="Descargar" icono={<Download />} onClick={() => descargar(d)} />
    </>
  );
  const imagen = (d: Documento) => (esImagen(d) ? <img src={d.archivo.file_url} alt="" className="size-full object-cover" /> : undefined); // eslint-disable-line @next/next/no-img-element
  const seleccion = (r: (typeof filasPagina)[number]) => ({ marcada: r.getIsSelected(), onCambio: (x: boolean) => r.toggleSelected(x), titulo: `Seleccionar ${r.original.nombre}` });

  // Arrastrar archivos sobre la lista: uno abre el uploader, varios la carga masiva
  const soltar = editable && empresa ? {
    onDragOver: (e: DragEvent) => e.dataTransfer.types.includes("Files") && e.preventDefault(),
    onDrop: (e: DragEvent) => { e.preventDefault(); elegir(e.dataTransfer.files); },
  } : {};

  return (
    <div className="flex flex-col gap-4" {...soltar}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-c10-title">Documentos</h2>
          <ChipKpi n={datos.length} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltrosCabecera angosto vista={vista} cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
          <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar documento" className="w-[260px]" />
          <SelectorVista vista={vista} onCambio={setVista} />
        </div>
      </div>

      <ConFiltros conCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} vista={vista} tope="96px">
        <div className="flex flex-col gap-4">
          {vista === "tabla" && (
            <Tabla
              tabla={tabla} seleccion fijarPrincipal claveAncho="empresa-documentos" cargando={docsQ.isLoading} vacio={vacio}
              nombreFila={(d) => d.nombre} filaActiva={abierto?.enTabla ? abierto.d.id : null}
              acciones={(d) => (
                <>
                  <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla onClick={() => abrir(d, true)} {...PANEL_OJO} />
                  {puedeRevisar(d) && <BotonIcono titulo="Revisar documento" icono={<FileSearch />} enTabla onClick={() => setRevisar(d)} />}
                  <BotonIcono titulo="Descargar" icono={<Download />} enTabla onClick={() => descargar(d)} />
                </>
              )}
            />
          )}

          {vista !== "tabla" && !filasPagina.length && !docsQ.isLoading && <div className="rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)]">{vacio}</div>}

          {vista === "cards" && !!filasPagina.length && (
            <RejillaCards>
              {filasPagina.map((r) => {
                const d = r.original;
                return (
                  <TarjetaCompacta
                    key={r.id} etiqueta={`Ver detalle de ${d.nombre}`} onAbrir={() => abrir(d, false)} seleccion={seleccion(r)}
                    imagen={imagen(d)} textoSinImagen="Vista previa del documento" titulo={d.nombre} acciones={<AccionesCard d={d} />}
                  >
                    <div className="mb-1 flex flex-wrap gap-1.5"><Estatus d={d} />{d.categoria && <ChipTipo>{d.categoria}</ChipTipo>}</div>
                    <FilaDato icono={<UserRound />} etiqueta="Propietario">{propietario(d)}</FilaDato>
                    <FilaDato icono={<CalendarDays />} etiqueta="Vigencia">{vigencia(d)}</FilaDato>
                    {conContratos && <FilaDato icono={<FileText />} etiqueta="Contratos">{contratosDe(d).join(", ")}</FilaDato>}
                  </TarjetaCompacta>
                );
              })}
            </RejillaCards>
          )}

          {vista === "lista" && !!filasPagina.length && (
            <ColumnaLista>
              {filasPagina.map((r) => {
                const d = r.original;
                const ultimo = d.comentarios[d.comentarios.length - 1];
                return (
                  <TarjetaLista
                    key={r.id} etiqueta={`Ver detalle de ${d.nombre}`} onAbrir={() => abrir(d, false)} seleccion={seleccion(r)}
                    imagen={imagen(d)} textoSinImagen="Vista previa del documento" titulo={d.nombre}
                    chips={<><Estatus d={d} /><ChipFolio folio={d.folio} /></>} acciones={<AccionesCard d={d} />}
                  >
                    <DatoLista nombre="Categoría">{d.categoria}</DatoLista>
                    <DatoLista nombre={`Propietario · ${TIPO_DUENO[d.dueno.tipo]}`}>{propietario(d)}</DatoLista>
                    <DatoLista nombre="Vigencia">{vigencia(d)}</DatoLista>
                    <DatoLista nombre="Fecha de carga">{fmtFecha(fechaCarga(d))}</DatoLista>
                    <DatoLista nombre="Subido por">{subidoPor(d)}</DatoLista>
                    {conContratos && <DatoLista nombre="Contratos">{contratosDe(d).join(", ")}</DatoLista>}
                    <DatoLista nombre="Lectura con IA">{d.lectura_ia ? <span className="inline-flex items-center gap-1"><Sparkles className="size-3.5 text-c10-acc" />Sí</span> : "No"}</DatoLista>
                    <DatoLista nombre={`Comentarios (${d.comentarios.length})`}>{ultimo ? `${ultimo.autor}: ${ultimo.texto}` : undefined}</DatoLista>
                  </TarjetaLista>
                );
              })}
            </ColumnaLista>
          )}

          <Paginacion tabla={tabla} />
        </div>
      </ConFiltros>

      <BarraSeleccion tabla={tabla}>
        <BotonBarra blanco icono={<Download />} onClick={() => tabla.getSelectedRowModel().rows.forEach((r) => descargar(r.original))}>
          Descargar
        </BotonBarra>
      </BarraSeleccion>

      {editable && empresa && (
        <>
          <BotonFlotante etiqueta="Subir documentos" icono={<Plus />} onClick={() => input.current?.click()} />
          <input ref={input} type="file" multiple hidden accept=".pdf,image/*" onChange={(e) => { elegir(e.target.files); e.target.value = ""; }} />
          <UploaderIA ref={uploader} existentes={existentes} opcionesMapeo={opcionesMapeo} opcionesPropietario={opcionesPropietario} onSubmit={guardar} />
          {masiva && (
            <CargaMasivaDocumentos
              archivos={masiva} empresa={empresa} contratoId={contratoId} propietarios={new Set(opcionesPropietario.map((o) => o.id))}
              onCerrar={() => setMasiva(null)} onTermino={refrescar}
            />
          )}
        </>
      )}

      <PanelDocumento
        abierto={!!abierto} onCerrar={() => setAbierto(null)} documento={abierto?.d ?? null} enTabla={abierto?.enTabla}
        soloLectura={!editable} onCambio={alCambiar}
      />
      <ModalRevisarDocumento abierto={!!revisar} onCerrar={() => setRevisar(null)} documento={revisar} onRevisado={alCambiar} />
    </div>
  );
}
