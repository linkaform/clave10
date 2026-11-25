"use client";
// F0-06 · Ejemplo de filtros en la cabecera, como Empleados: buscador, botón de filtros con
// popover (interruptor "Usuario", estatus, perfil con muchas opciones y fecha) y el resultado.
// El panel lateral y la pastilla se ven en el bloque "Tabla, lista y cards". Datos inventados.
import { useMemo, useState } from "react";
import { Buscador, ChipEstado, ChipKpi, ChipTipo, EstadoVacio, tipoVacio } from "@/components/contratistas/ui";
import {
  FECHA_TODOS, FiltroChips, FiltroFecha, FiltroInterruptor, FiltroLista, FiltrosCabecera, coincide, enFecha, enLista, useFiltros,
} from "@/components/contratistas/filtros";

const PERFILES = [
  "Soldador", "Electricista", "Pintor", "Supervisor", "Operador de grúa", "Montacarguista", "Almacenista", "Ayudante general",
  "Plomero", "Andamiero", "Topógrafo", "Guardia", "Chofer", "Técnico en refrigeración",
];
const NOMBRES = [
  "Ana Cantú", "Luis Villarreal", "Sofía Elizondo", "Carlos Salinas", "Diana Rocha", "Jorge Treviño", "Laura Garza", "Pedro Ayala",
  "María Leal", "Raúl Benavides", "Karla Montemayor", "Héctor Garza", "Paola Zambrano", "Iván Cavazos", "Elena Tamez", "Óscar Guerra",
];
const ESTATUS = ["Activo", "Inactivo", "Baja"] as const;

const hoy = new Date();
const haceDias = (n: number) => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const EMPLEADOS = NOMBRES.map((nombre, i) => ({
  id: `e${i}`,
  folio: `E-${120 + i * 3}`,
  nombre,
  perfil: PERFILES[(i * 5) % PERFILES.length],
  estatus: ESTATUS[i % 7 === 3 ? 2 : i % 4 === 1 ? 1 : 0],
  usuario: i % 3 !== 2,
  alta: haceDias((i * 23) % 400),
}));

const TONO_ESTATUS = { Activo: "success", Inactivo: "neutral", Baja: "danger" } as const;

export function MuestraFiltros() {
  const [q, setQ] = useState("");
  const f = useFiltros({ usuario: false, estatus: [] as string[], perfil: [] as string[], alta: FECHA_TODOS }, { url: false });
  const v = f.valores;
  const cuantos = (fn: (e: (typeof EMPLEADOS)[number]) => boolean) => EMPLEADOS.filter(fn).length;

  const filas = useMemo(
    () =>
      EMPLEADOS.filter(
        (e) =>
          coincide(q, e.nombre, e.folio, e.perfil) &&
          (!v.usuario || e.usuario) &&
          enLista(v.estatus, e.estatus) &&
          enLista(v.perfil, e.perfil) &&
          enFecha(e.alta, v.alta),
      ),
    [q, v],
  );

  const controles = (
    <>
      <FiltroInterruptor titulo="Usuario" descripcion="Con usuario de Clave 10" valor={v.usuario} onCambio={(x) => f.poner("usuario", x)} />
      <FiltroChips
        titulo="Estatus"
        opciones={ESTATUS.map((e) => ({ valor: e, cuenta: cuantos((x) => x.estatus === e) }))}
        valor={v.estatus}
        onCambio={(x) => f.poner("estatus", x)}
      />
      <FiltroLista
        titulo="Perfil"
        placeholder="Selecciona un perfil"
        opciones={[...PERFILES].sort().map((p) => ({ valor: p, cuenta: cuantos((x) => x.perfil === p) }))}
        valor={v.perfil}
        onCambio={(x) => f.poner("perfil", x)}
      />
      <FiltroFecha titulo="Fecha de alta" valor={v.alta} onCambio={(x) => f.poner("alta", x)} />
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-c10-title">Empleados</h3>
          <ChipKpi n={filas.length} />
        </div>
        <div className="flex items-center gap-2">
          <FiltrosCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
          <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empleado" className="w-[240px]" />
        </div>
      </div>

      {filas.length ? (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2 p-0">
          {filas.map((e) => (
            <li key={e.id} className="flex flex-col gap-1.5 rounded-xl bg-c10-surface px-3.5 py-3 shadow-[0_0_0_1px_var(--c10-line-card)]">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold text-c10-title">{e.nombre}</span>
                <ChipEstado texto={e.estatus} tono={TONO_ESTATUS[e.estatus]} />
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-c10-meta">
                <ChipTipo>{e.perfil}</ChipTipo>
                {e.usuario && <ChipTipo>Con usuario</ChipTipo>}
                <span className="tabular-nums">Alta {e.alta}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)]">
          <EstadoVacio tipo={tipoVacio({ filtrando: !!q.trim() || f.activos })} />
        </div>
      )}
    </div>
  );
}
