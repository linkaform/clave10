"use client";
// RG-02 · Pasos 1 y 2 del registro: tipo de perfil y tipo de persona.
// Diseño: registro.dc.html 68–98.
import { Consejo } from "../ui";
import { OpcionIcono } from "./OpcionIcono";
import { PERFILES, PERSONAS, type DatosRegistro } from "./pasos";

export interface PasoProps {
  datos: DatosRegistro;
  /** Mezcla cambios; con función, a partir del valor más reciente (p. ej. al terminar una lectura). */
  set: (p: Partial<DatosRegistro> | ((d: DatosRegistro) => Partial<DatosRegistro>)) => void;
  /** Pasa al siguiente paso sin revisar si está listo ("Omitir por ahora"). */
  avanzar: () => void;
}

/** Cliente, Contratista, Visitante o Transportista (2×2). */
export function PasoPerfil({ datos, set }: PasoProps) {
  return (
    <div role="radiogroup" aria-label="Tipo de perfil" className="grid grid-cols-2 gap-3.5">
      {PERFILES.map((p) => (
        <OpcionIcono key={p.valor} Icono={p.Icono} etiqueta={p.etiqueta} marcada={datos.perfil === p.valor} onElegir={() => set({ perfil: p.valor })} />
      ))}
    </div>
  );
}

/** Persona moral o física, con su detalle y la nota de que se puede corregir después. */
export function PasoPersona({ datos, set }: PasoProps) {
  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Tipo de persona" className="grid gap-3.5 sm:grid-cols-2">
        {PERSONAS.map((p) => (
          <OpcionIcono
            key={p.valor}
            Icono={p.Icono}
            etiqueta={p.etiqueta}
            detalle={p.detalle}
            marcada={datos.persona === p.valor}
            onElegir={() => set({ persona: p.valor })}
          />
        ))}
      </div>
      <Consejo>
        <strong className="font-semibold">Nota:</strong> El tipo de persona determina los datos fiscales que te pediremos. Podrás
        corregirlo desde configuraciones mientras tu perfil no tenga contratos activos.
      </Consejo>
    </div>
  );
}
