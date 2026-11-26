"use client";
// F0-15 · Ligar requerimientos a un servicio, perfil o equipo, y la misma lista dentro
// del alta (con filtros por ámbito y tipo). Diseño: plataforma.dc.html, svLk (~2096, ~7698)
// y svEd (~2303, ~7708). Qué se hace al ligar es de CF-02.
import { useMemo, useState } from "react";
import { Campo } from "../ui";
import { FiltroChips, coincide, enLista, useFiltros } from "../filtros";
import { ModalSeleccion } from "./ModalSeleccion";
import { BarraBusqueda, ChipSeleccionados } from "./piezas";
import { useAlAbrir } from "./seleccion";
import { TablaRequerimientos, type RequerimientoLigar } from "./TablaRequerimientos";

export const AMBITOS = ["Empresa", "Persona", "Equipo"];
export const TIPOS_REQUERIMIENTO = ["Documento", "Examen", "Inspección"];

export interface ModalLigarRequerimientosProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Completa "…para agregarlos a {destino}": "el servicio Limpieza industrial". */
  destino: string;
  /** Todo el catálogo; los ya ligados se quitan con `ligados`. */
  requerimientos: RequerimientoLigar[];
  ligados: string[];
  onLigar: (ids: string[]) => void | Promise<unknown>;
  /** Con todo ligado: "Todos los requerimientos ya están ligados a este servicio". */
  mensajeTodoLigado?: string;
  agruparPor?: "ambito" | "tipo";
}

export function ModalLigarRequerimientos({
  abierto, onCerrar, destino, requerimientos, ligados, onLigar, agruparPor = "ambito",
  mensajeTodoLigado = "Todos los requerimientos ya están ligados",
}: ModalLigarRequerimientosProps) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  useAlAbrir(abierto, () => {
    setQ("");
    setSel([]);
  });
  const libres = useMemo(() => requerimientos.filter((r) => !ligados.includes(r.id)), [requerimientos, ligados]);
  const filas = libres.filter((r) => coincide(q, r.nombre));
  const n = sel.length;

  return (
    <ModalSeleccion
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Ligar requerimientos"
      descripcion={`Selecciona uno o más requerimientos registrados para agregarlos a ${destino}.`}
      busqueda={q}
      onBusqueda={setQ}
      placeholder="Buscar requerimiento"
      junto={<ChipSeleccionados n={n} />}
      seleccionados={n}
      etiqueta={() => "Ligar Requerimientos"}
      exito={(k) => (k === 1 ? "Se ligó el requerimiento" : `Se ligaron ${k} requerimientos`)}
      onLigar={() => onLigar(sel)}
      ancho={720}
      alto={720}
      claseCuerpo="px-6 py-5"
    >
      <TablaRequerimientos
        filas={filas}
        sel={sel}
        onSel={setSel}
        conAmbito
        agruparPor={agruparPor}
        ordenGrupos={agruparPor === "ambito" ? AMBITOS : TIPOS_REQUERIMIENTO}
        vacio={libres.length ? "No se encontraron registros" : mensajeTodoLigado}
      />
    </ModalSeleccion>
  );
}

export interface ListaRequerimientosProps {
  requerimientos: RequerimientoLigar[];
  valor: string[];
  onCambio: (ids: string[]) => void;
  /** "Selecciona al menos un requerimiento" al intentar guardar sin ninguno. */
  error?: string;
  /** Columna y filtro de ámbito (en un perfil todos son de persona: se quitan). */
  conAmbito?: boolean;
  agruparPor?: "ambito" | "tipo";
  titulo?: string;
}

/**
 * Lista de requerimientos dentro de un formulario (alta de servicio, perfil o equipo):
 * título con "N seleccionados", filtros por ámbito y tipo, buscador y la tabla.
 */
export function ListaRequerimientos({
  requerimientos, valor, onCambio, error, conAmbito = true, agruparPor, titulo = "Requerimientos",
}: ListaRequerimientosProps) {
  const [q, setQ] = useState("");
  const f = useFiltros({ ambito: [] as string[], tipo: [] as string[] }, { url: false });
  const cuenta = (k: "ambito" | "tipo", v: string) => requerimientos.filter((r) => r[k] === v).length;
  const filas = requerimientos.filter(
    (r) => coincide(q, r.nombre) && enLista(f.valores.ambito, r.ambito) && enLista(f.valores.tipo, r.tipo),
  );
  const tipos = [...new Set([...TIPOS_REQUERIMIENTO, ...requerimientos.map((r) => r.tipo)])].filter((t) => cuenta("tipo", t));

  const controles = (
    <>
      {conAmbito && (
        <FiltroChips
          titulo="Ámbito"
          opciones={AMBITOS.filter((a) => cuenta("ambito", a)).map((a) => ({ valor: a, cuenta: cuenta("ambito", a) }))}
          valor={f.valores.ambito}
          onCambio={(v) => f.poner("ambito", v)}
        />
      )}
      <FiltroChips
        titulo="Tipo"
        opciones={tipos.map((t) => ({ valor: t, cuenta: cuenta("tipo", t) }))}
        valor={f.valores.tipo}
        onCambio={(v) => f.poner("tipo", v)}
      />
    </>
  );

  return (
    <Campo
      etiqueta={titulo}
      obligatorio
      error={error}
      extra={<ChipSeleccionados n={valor.length} />}
      className="min-h-[220px] flex-auto"
    >
      <BarraBusqueda
        valor={q}
        onCambio={setQ}
        placeholder="Buscar requerimiento"
        filtros={{ cuenta: f.cuenta, onLimpiar: f.limpiar, controles }}
      />
      <TablaRequerimientos
        filas={filas}
        sel={valor}
        onSel={onCambio}
        conAmbito={conAmbito}
        agruparPor={agruparPor}
        ordenGrupos={agruparPor === "tipo" ? TIPOS_REQUERIMIENTO : AMBITOS}
        invalida={!!error}
      />
    </Campo>
  );
}
