"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp, Info, Loader2, Pencil, Search, ShieldAlert } from "lucide-react";
import { useCatalogoIncidenciasPlano } from "@/hooks/useCatalogoIncidenciasPlano";
import { normalizeText } from "@/lib/utils";
import {
  asignarIconos,
  categoriasConIconos,
} from "../modals/add-incidencia";

export type TipoIncidencia = { categoria: string; sub_categoria: string; incidente: string };

// Tipo que no está en el catálogo ("Usar Otro y especificar"): se guarda con
// esta categoría para que el supervisor lo encuentre y lo clasifique.
export const CATEGORIA_OTRO = "Sin clasificar";

// Frecuentes fijos en el front por ahora (después pueden venir del back).
// Deben existir tal cual en el catálogo de incidencias para guardarse bien.
// El catálogo ya no tiene subcategoría: va vacía.
const FRECUENTES: TipoIncidencia[] = [
  { categoria: "Intrusión y seguridad", sub_categoria: "", incidente: "Ingreso no autorizado" },
  { categoria: "Intrusión y seguridad", sub_categoria: "", incidente: "Intento de intrusión" },
  { categoria: "Intrusión y seguridad", sub_categoria: "", incidente: "Persona sospechosa" },
  { categoria: "Incidentes de tránsito", sub_categoria: "", incidente: "Choque" },
  { categoria: "Daños y fallas operativas", sub_categoria: "", incidente: "Falla energía eléctrica" },
];

interface SelectorTipoIncidenciaProps {
  value: TipoIncidencia | null;
  onChange: (tipo: TipoIncidencia | null) => void;
  /** Habilita la consulta del catálogo (p. ej. solo con el modal abierto). */
  enabled?: boolean;
}

// Minúsculas y sin acentos conservando el largo (para resaltar la coincidencia).
const plano = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Resalta en negritas la parte del nombre que coincide con la búsqueda.
const Resaltado = ({ texto, busqueda }: { texto: string; busqueda: string }) => {
  const q = plano(busqueda.trim());
  const i = q ? plano(texto).indexOf(q) : -1;
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <span className="rounded-sm bg-blue-50 font-semibold text-gray-900">{texto.slice(i, i + q.length)}</span>
      {texto.slice(i + q.length)}
    </>
  );
};

// Tipo de incidencia: buscador con menú desplegable sobre todo el catálogo
// (catalogo_incidencias_plano: cada tipo ya trae su categoría/subcategoría)
// + frecuentes + "Otro". El menú sale cerrado: se abre con clic o al escribir.
export const SelectorTipoIncidencia = ({ value, onChange, enabled = true }: SelectorTipoIncidenciaProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { tiposIncidencia, isLoadingTipos } = useCatalogoIncidenciasPlano(enabled);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  // Busca en el nombre, la categoría y la subcategoría.
  const opciones = useMemo(() => {
    const q = normalizeText(busqueda);
    const lista = q
      ? tiposIncidencia.filter((t) =>
          [t.incidente, t.categoria, t.sub_categoria].some((x) => normalizeText(x).includes(q)),
        )
      : tiposIncidencia;
    const iconos = asignarIconos(lista.map((t) => t.categoria), categoriasConIconos);
    return lista.map((t, idx) => ({ ...t, icon: iconos[idx]?.icon }));
  }, [tiposIncidencia, busqueda]);

  const reiniciar = () => {
    setBusqueda("");
    setAbierto(false);
  };

  const elegir = (tipo: TipoIncidencia) => {
    onChange({ categoria: tipo.categoria, sub_categoria: tipo.sub_categoria, incidente: tipo.incidente });
    reiniciar();
  };

  // "Otro": lo escrito en el buscador es el nombre; si no hay, se pide en la tarjeta.
  const usarOtro = () => {
    const nombre = busqueda.trim();
    onChange({ categoria: CATEGORIA_OTRO, sub_categoria: "", incidente: nombre });
    setEditandoNombre(!nombre);
    reiniciar();
  };

  if (value && value.categoria === CATEGORIA_OTRO) {
    const editando = editandoNombre || !value.incidente.trim();
    return (
      <div className="rounded-xl border-2 border-blue-500 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CircleHelp className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            {editando ? (
              <input
                autoFocus
                value={value.incidente}
                onChange={(e) => onChange({ ...value, incidente: e.target.value })}
                onBlur={() => value.incidente.trim() && setEditandoNombre(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (value.incidente.trim()) setEditandoNombre(false);
                  }
                }}
                placeholder="Especifica el tipo de incidencia"
                className="w-full border-b-2 border-blue-500 bg-transparent pb-0.5 text-base font-bold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-bold text-gray-900">{value.incidente}</p>
                <button
                  type="button"
                  onClick={() => setEditandoNombre(true)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Editar nombre">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setEditandoNombre(false);
                onChange(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800">
              Cambiar
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
          Categoría: <span className="font-semibold text-gray-900">{CATEGORIA_OTRO}</span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5" />
          El supervisor lo clasificará en el catálogo.
        </p>
      </div>
    );
  }

  if (value) {
    const icono = asignarIconos([value.categoria || ""], categoriasConIconos)[0]?.icon;
    const subcategoria = value.sub_categoria && value.sub_categoria !== "General" ? value.sub_categoria : "";
    return (
      <div className="rounded-xl border-2 border-blue-500 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 [&_svg]:h-6 [&_svg]:w-6">
            {icono}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">{value.incidente}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-blue-600 hover:text-blue-800">
              Cambiar
            </button>
          </div>
        </div>
        {value.categoria && (
          <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            Categoría: <span className="font-semibold text-gray-900">{value.categoria}</span>
            {subcategoria && (
              <>
                {" · "}Subcategoría: <span className="font-semibold text-gray-900">{subcategoria}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setAbierto(true);
          }}
          onClick={() => setAbierto(true)}
          onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
          placeholder="Busca el tipo de incidencia"
          className="h-11 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {abierto && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {isLoadingTipos ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : opciones.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">Sin resultados.</p>
            ) : (
              <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
                {opciones.map((o) => (
                  <button
                    key={`${o.categoria}|${o.sub_categoria}|${o.incidente}`}
                    type="button"
                    onClick={() => elegir(o)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-blue-600">
                    {o.icon}
                    <span className="min-w-0 flex-1 truncate">
                      <Resaltado texto={o.incidente} busqueda={busqueda} />
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">{o.categoria}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={usarOtro}
              className="block w-full border-t border-gray-100 bg-gray-50 px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-100">
              {busqueda.trim() ? `Usar "Otro": ${busqueda.trim()}` : 'Usar "Otro" y especificar'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Frecuentes:</span>
        {FRECUENTES.map((f) => (
          <button
            key={f.incidente}
            type="button"
            onClick={() => onChange(f)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
            {f.incidente}
          </button>
        ))}
      </div>
    </div>
  );
};
