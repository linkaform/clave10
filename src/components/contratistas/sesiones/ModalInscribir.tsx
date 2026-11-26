"use client";
// CF-04 · Inscribir empleados a una sesión (Programada o En curso). Usa el marco de
// selección de F0-15. Diseño: plataforma.dc.html, ssnInsOpen (~2290–2302).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChipTipo, avisar } from "@/components/contratistas/ui";
import { Avatar, BarraTodos, FilaSeleccion, ModalSeleccion, alternarVarios, cuantos, estadoDe, useAlAbrir } from "@/components/contratistas/ligar";
import { coincide } from "@/components/contratistas/filtros";
import { listEmpleados } from "@/services/contratistas";
import type { Id, Sesion } from "@/types/contratistas";

export function ModalInscribir({
  abierto, onCerrar, sesion, inscritos, restantes, onInscribir,
}: {
  abierto: boolean;
  onCerrar: () => void;
  sesion: Sesion;
  inscritos: Id[];
  /** Lugares libres; null = sin cupo. */
  restantes: number | null;
  onInscribir: (ids: Id[]) => Promise<unknown>;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Id[]>([]);
  useAlAbrir(abierto, () => { setQ(""); setSel([]); });

  const empleadosQ = useQuery({
    queryKey: ["contratistas", "empleados", "activos"],
    queryFn: () => listEmpleados({ estatus: "Activo", limit: 1000 }),
    enabled: abierto,
  });
  const empleados = useMemo(() => (empleadosQ.data?.items ?? []).filter((e) => !e.vetado), [empleadosQ.data]);
  const filas = useMemo(
    () =>
      empleados
        .filter((e) => coincide(q, e.nombre, e.puesto, e.centro_trabajo?.nombre))
        .sort((a, b) => Number(inscritos.includes(a.id)) - Number(inscritos.includes(b.id))),
    [empleados, q, inscritos],
  );
  const disponibles = filas.filter((e) => !inscritos.includes(e.id)).map((e) => e.id);
  const todosInscritos = !!empleados.length && empleados.every((e) => inscritos.includes(e.id));

  /** No deja pasar del cupo. */
  const alternar = (ids: Id[]) => {
    const nuevo = alternarVarios(sel, ids);
    if (restantes != null && nuevo.length > restantes) {
      avisar(restantes ? `Solo quedan ${cuantos(restantes, "lugar", "lugares")} en la sesión` : "Se alcanzó el cupo de la sesión", "error");
      setSel(nuevo.slice(0, restantes));
      return;
    }
    setSel(nuevo);
  };

  return (
    <ModalSeleccion
      abierto={abierto} onCerrar={onCerrar}
      titulo="Inscribir empleados"
      descripcion={<span className="text-[13px] text-c10-meta">{sesion.nombre}</span>}
      aviso={restantes != null ? `Quedan ${cuantos(restantes, "lugar disponible", "lugares disponibles")}.` : "Solo se inscriben empleados activos y sin veto."}
      busqueda={q} onBusqueda={setQ} placeholder="Buscar por nombre, puesto o centro"
      barra={
        <BarraTodos
          estado={estadoDe(disponibles, sel)} onAlternar={() => alternar(disponibles)}
          texto={`${cuantos(disponibles.length, "empleado")} ${disponibles.length === 1 ? "disponible" : "disponibles"}`}
          seleccionados={sel.length} deshabilitada={!disponibles.length}
        />
      }
      vacio={
        empleadosQ.isLoading ? "Cargando empleados…"
          : todosInscritos ? "Todos los empleados ya están inscritos"
            : !filas.length && "No se encontraron empleados activos"
      }
      seleccionados={sel.length}
      etiqueta={(n) => (n ? `Inscribir ${cuantos(n, "empleado")}` : "Inscribir empleados")}
      exito={(n) => (n === 1 ? "Se inscribió 1 empleado" : `Se inscribieron ${n} empleados`)}
      onLigar={() => onInscribir(sel)}
    >
      {filas.map((e) => {
        const ya = inscritos.includes(e.id);
        return (
          <FilaSeleccion
            key={e.id} etiqueta={e.nombre} marcada={sel.includes(e.id)} bloqueada={ya} tituloBloqueada="Ya está inscrito"
            onAlternar={() => alternar([e.id])}
          >
            <Avatar nombre={e.nombre} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-c10-title">{e.nombre}</span>
              <span className="truncate text-xs text-c10-meta">{[e.puesto, e.centro_trabajo?.nombre].filter(Boolean).join(" · ") || "Sin puesto"}</span>
            </span>
            {ya && <ChipTipo>Inscrito</ChipTipo>}
          </FilaSeleccion>
        );
      })}
    </ModalSeleccion>
  );
}
