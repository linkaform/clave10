"use client";
// ME-09 · Contratos: lista con filtros de estatus y fecha. Es el mismo componente en
// Mi empresa, en Contratistas / Clientes (pestaña Contratos) y en el detalle de una
// relación (solo sus contratos). Ficha: lkf-claude, contratistas_me09_contratos.md.
// Diseño: plataforma.dc.html, ctTab (~2770) y ctVals (~6020). Datos: ME-14.
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, MapPin, RotateCw, UsersRound, Wrench } from "lucide-react";
import {
  BarraCumplimiento, Boton, BotonCopiar, BotonFlotante, BotonIcono, Buscador, ChipEstado, ChipKpi, ChipTipo, EstadoVacio, Paginacion, Tabla,
  tipoVacio, useTabla,
} from "@/components/contratistas/ui";
import { ConFiltros, FECHA_TODOS, FiltroChips, FiltroFecha, FiltrosCabecera, enLista, useFiltros } from "@/components/contratistas/filtros";
import { Avatar, ChipMas } from "@/components/contratistas/ligar";
import { fmtFecha } from "@/components/contratistas/documento/formato";
import { useContratistasContexto } from "@/hooks/Contratistas/useContratistasContexto";
import { BASE, hrefPestana } from "@/lib/contratistas/contexto";
import { ESTATUS_CONTRATO_TONO } from "@/mappers/contratistas.mapper";
import { listContratos } from "@/services/contratistas";
import type { Contrato } from "@/types/contratistas";
import {
  ESTATUS, contraparte, delLado, enBusqueda, enVigencia, numEmpleados, numEquipos, plural, ubicacionesDe,
} from "./contratosLista";

const COLOR_FIN: Partial<Record<Contrato["estatus"], string>> = { Vencido: "text-red-600", "Por vencer": "text-amber-700" };

export function ContratosLista() {
  const { modo, lado, relacionId, empresa, etiquetas } = useContratistasContexto();
  const router = useRouter();
  const pathname = usePathname();
  const miEmpresa = empresa?.id;

  const q0 = useQuery({
    queryKey: ["contratistas", "contratos", relacionId],
    // El back topa en 200 por página; el filtrado fino es local, como en el diseño.
    queryFn: () => listContratos({ relacion_id: relacionId ?? undefined, limit: 200 }),
  });

  const [q, setQ] = useState("");
  const f = useFiltros({ estatus: [] as string[], fecha: FECHA_TODOS });
  const v = f.valores;

  const base = useMemo(
    () => (q0.data?.items ?? []).filter((c) => delLado(c, modo, lado, miEmpresa)),
    [q0.data, modo, lado, miEmpresa],
  );
  const datos = useMemo(
    () =>
      base.filter(
        (c) => enBusqueda(q, c, contraparte(c, miEmpresa)) && enLista(v.estatus, c.estatus) && enVigencia(c, v.fecha),
      ),
    [base, q, v, miEmpresa],
  );

  const cuantos = (e: string) => base.filter((c) => c.estatus === e).length;
  const controles = (
    <>
      <FiltroChips titulo="Estatus" opciones={ESTATUS.map((e) => ({ valor: e, cuenta: cuantos(e) }))} valor={v.estatus} onCambio={(x) => f.poner("estatus", x)} />
      <FiltroFecha titulo="Fecha" valor={v.fecha} onCambio={(x) => f.poner("fecha", x)} />
    </>
  );

  const columnas = useMemo<ColumnDef<Contrato, unknown>[]>(
    () => [
      {
        id: "objeto", header: "Objeto del contrato", accessorFn: (c) => c.objeto, meta: { principal: true },
        cell: ({ row: { original: c } }) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-semibold text-c10-title" title={c.objeto}>{c.objeto}</span>
            <span className="text-xs tabular-nums text-c10-faint">#{c.folio}{c.numero_contrato ? ` · ${c.numero_contrato}` : ""}</span>
          </span>
        ),
      },
      {
        id: "contraparte", header: etiquetas.kSg, enableSorting: false, meta: { minimo: 280 },
        cell: ({ row: { original: c } }) => {
          const o = contraparte(c, miEmpresa);
          return (
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar nombre={o.razon_social} tam={32} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-c10-title" title={o.razon_social}>{o.razon_social}</span>
                <span className="flex items-center gap-1 text-xs tabular-nums text-c10-meta">
                  {o.rfc}
                  {o.rfc && <BotonCopiar valor={o.rfc} etiqueta="RFC" />}
                </span>
              </span>
            </span>
          );
        },
      },
      {
        id: "vigencia", header: "Vigencia", enableSorting: false, meta: { minimo: 170 },
        cell: ({ row: { original: c } }) => (
          <span className="flex flex-col whitespace-nowrap tabular-nums">
            <span>{fmtFecha(c.inicio)}</span>
            <span className={`text-xs ${COLOR_FIN[c.estatus] ?? "text-c10-meta"}`}>hasta {fmtFecha(c.fin)}</span>
          </span>
        ),
      },
      {
        id: "ubicacion", header: "Ubicación", enableSorting: false, meta: { minimo: 180 },
        cell: ({ row: { original: c } }) => {
          const [primera, ...resto] = ubicacionesDe(c);
          if (!primera) return <span className="text-c10-faint">---</span>;
          return (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate" title={primera}>{primera}</span>
              {!!resto.length && <ChipMas titulo="Otras ubicaciones" lista={resto} icono={<MapPin />} />}
            </span>
          );
        },
      },
      {
        id: "recursos", header: "Recursos", enableSorting: false, meta: { minimo: 190 },
        cell: ({ row: { original: c } }) => (
          <span className="flex flex-wrap gap-1.5">
            <ChipTipo icono={<UsersRound />}>{plural(numEmpleados(c), "empleado", "empleados")}</ChipTipo>
            <ChipTipo icono={<Wrench />}>{plural(numEquipos(c), "equipo", "equipos")}</ChipTipo>
          </span>
        ),
      },
      {
        id: "cumplimiento", header: "Cumplimiento", enableSorting: false, meta: { minimo: 160 },
        cell: ({ row: { original: c } }) => <BarraCumplimiento pct={Math.round(c.cumplimiento?.total ?? 0)} />,
      },
      {
        id: "estatus", header: "Estatus", enableSorting: false,
        cell: ({ row: { original: c } }) => <ChipEstado texto={c.estatus} tono={ESTATUS_CONTRATO_TONO[c.estatus]} />,
      },
    ],
    [etiquetas.kSg, miEmpresa],
  );

  const tabla = useTabla({ datos, columnas, getId: (c) => c.id, porPagina: 25 });

  // El detalle (ME-10) regresa a esta misma pestaña con sus filtros de URL limpios.
  const abrir = (c: Contrato) => {
    const desde = hrefPestana(pathname, "contratos");
    router.push(`${BASE}/contratos/${c.id}?desde=${encodeURIComponent(desde)}`);
  };
  // ME-12: alta solo donde la empresa activa es el cliente (Mi empresa y lado Contratistas).
  const puedeCrear = modo === "propio" || (modo === "lista" && lado === "ctr");
  const nuevo = () => {
    const desde = hrefPestana(pathname, "contratos");
    router.push(`${BASE}/contratos/nuevo?desde=${encodeURIComponent(desde)}`);
  };
  const descargar = (c: Contrato) => c.contrato_firmado && window.open(c.contrato_firmado.file_url, "_blank", "noopener");

  const vacio = (
    <EstadoVacio
      tipo={tipoVacio({ error: q0.error, filtrando: !!q.trim() || f.activos })}
      accion={q0.error ? <Boton variante="contorno" tam="sm" icono={<RotateCw />} onClick={() => q0.refetch()}>Reintentar</Boton> : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-c10-title">Contratos</h2>
          <ChipKpi n={datos.length} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltrosCabecera angosto vista="tabla" cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
          <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar contrato" className="w-[260px]" />
        </div>
      </div>

      <ConFiltros conCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} vista="tabla" tope="96px">
        <div className="flex flex-col gap-4">
          <Tabla
            tabla={tabla} fijarPrincipal claveAncho="contratos" cargando={q0.isLoading} vacio={vacio} nombreFila={(c) => c.objeto}
            acciones={(c) => (
              <>
                <BotonIcono titulo="Visualizar" icono={<Eye />} enTabla onClick={() => abrir(c)} />
                <BotonIcono
                  titulo={c.contrato_firmado ? "Descargar contrato" : "Sin contrato firmado"} icono={<Download />} enTabla
                  disabled={!c.contrato_firmado} onClick={() => descargar(c)}
                />
              </>
            )}
          />
          <Paginacion tabla={tabla} />
        </div>
      </ConFiltros>
      {puedeCrear && <BotonFlotante etiqueta="Nuevo contrato" onClick={nuevo} />}
    </div>
  );
}
