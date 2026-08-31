export interface Miembro {
  // Id real del pase de este acompañante (viene de qr_code). Es el
  // identificador que se usa para sincronizar la selección entre las
  // distintas vistas (carrusel, modal de listado, modal de confirmación),
  // y el que se expone hacia afuera en selected_passes.
  id: string;
  nombre: string;
  foto?: string;
  identificacion?: string;
  email?: string;
  telefono?: string;
  estatus?: string;
  link?: string;
  es_padre?: boolean;
  /** Lo que el propio acompañante declaró que trae ("vehiculo"/"equipo"), solo informativo. */
  equipoVehiculo?: string[];
}

interface AcompananteRaw {
  nombre_acompanante?: string;
  email_acompanante?: string;
  telefono_acompanante?: string;
  foto?: { file_name?: string; file_url?: string }[];
  identificacion?: { file_name?: string; file_url?: string }[];
  link?: string;
  estatus?: string;
  /** Id real del pase de este acompañante. */
  qr_code?: string;
  _id?: string;
  /** Presente cuando este elemento en realidad es el registro completo del pase padre. */
  es_padre?: boolean;
  /** Declarado por el acompañante en su propio pase ("vehiculo"/"equipo"), inyectado por _hidratar_acompanantes. */
  equipo_vehiculo?: string[];
  [key: string]: any;
}

export interface AcompanantesSearchPass {
  /** Miembros del grupo cuando ESTE pase es el pase padre. */
  acompanantes_grupo?: AcompananteRaw[];
  /**
   * Cuando ESTE pase es un pase hijo, el backend regresa aquí un arreglo que
   * incluye el registro completo del pase padre (con es_padre: true) más el
   * resto de los acompañantes del grupo.
   */
  acompanantes_pases?: AcompananteRaw[];
  /** Alternativa: a veces el pase padre viene anidado aquí con su propio acompanantes_grupo. */
  pase_padre?: {
    acompanantes_grupo?: AcompananteRaw[];
    [key: string]: any;
  };
  /** Link interno (no público) al registro del padre. */
  url_padre?: string;
  link_padre?: string;
  status_pase?: string;
}

// Convierte el shape "crudo" del backend al shape que usan el carrusel/modales.
// El elemento del padre viene con otro shape (nombre, email, telefono en vez
// de nombre_acompanante, email_acompanante, telefono_acompanante), así que
// hacemos fallback a esos campos cuando los "_acompanante" no existen.
// `id` se resuelve a partir de qr_code (o _id como respaldo, o el índice
// como último recurso si no viniera ninguno) — es el id real del pase de
// ese acompañante, y es lo que se usa para la selección compartida.
const mapAcompanantes = (acompanantes: AcompananteRaw[] = []): Miembro[] =>
  acompanantes.map((a, i) => ({
    id: a?.qr_code || a?._id || String(i),
    nombre: a?.nombre_acompanante || a?.nombre || "Sin nombre",
    foto: Array.isArray(a?.foto) && a.foto.length > 0 ? a.foto[0].file_url : undefined,
    identificacion:
      Array.isArray(a?.identificacion) && a.identificacion.length > 0
        ? a.identificacion[0].file_url
        : undefined,
    email: a?.email_acompanante || a?.email || "",
    telefono: a?.telefono_acompanante || a?.telefono || "",
    link: a?.link || "",
    estatus:
      a?.estatus === "activo" ? "Activo" : a?.estatus === "proceso" ? "En proceso" : a?.estatus,
    es_padre: !!a?.es_padre,
    equipoVehiculo: Array.isArray(a?.equipo_vehiculo) ? a.equipo_vehiculo : [],
  }));

// Deriva la lista de acompañantes y las reglas de selección a partir del
// shape crudo que regresa el servicio de búsqueda de pase. Centralizado
// acá para que el carrusel embebido (siempre visible) y el modal de
// confirmación de ingreso/salida apliquen exactamente las mismas reglas de
// "quién se puede seleccionar" sin duplicar la lógica.
export function useAcompanantesPase(searchPass?: AcompanantesSearchPass | null) {
  const grupoRaw = searchPass?.acompanantes_grupo;
  const pasesRaw = searchPass?.acompanantes_pases;
  const padreGrupoRaw = searchPass?.pase_padre?.acompanantes_grupo;
  const urlPadre = searchPass?.url_padre;
  const statusPase = searchPass?.status_pase;

  // Pase hijo: no es su propio grupo, apunta a uno con url_padre.
  const esPaseHijo = !!urlPadre;

  // Si es pase padre, los miembros vienen en acompanantes_grupo.
  // Si es pase hijo, el backend regresa acompanantes_pases: un arreglo que
  // incluye el registro completo del pase padre (es_padre: true) más el
  // resto de los acompañantes. Si por algún motivo no viene, usamos
  // pase_padre.acompanantes_grupo como respaldo (mismo dato, distinta forma
  // de llegar).
  let acompanantesRaw: AcompananteRaw[] | undefined;
  if (esPaseHijo) {
    acompanantesRaw = Array.isArray(pasesRaw) && pasesRaw.length > 0 ? pasesRaw : padreGrupoRaw;
  } else {
    acompanantesRaw = grupoRaw;
  }

  const tieneAcompanantes = Array.isArray(acompanantesRaw) && acompanantesRaw.length > 0;
  const isActivo = statusPase?.toLowerCase() === "activo";
  // Mientras el pase que se está viendo esté "en proceso", no se puede
  // seleccionar miembros para ingreso/salida — en ninguna de las vistas.
  const paseEnProceso = (statusPase ?? "").toLowerCase().includes("proceso");

  const data = tieneAcompanantes ? mapAcompanantes(acompanantesRaw!) : [];

  // Un miembro solo se puede seleccionar si el pase principal no está en
  // proceso Y ese acompañante en particular ya tiene su propio pase
  // "Activo" — no tiene sentido dar ingreso/salida a alguien cuyo pase
  // individual sigue en proceso.
  const esSeleccionable = (miembro: Miembro) =>
    !paseEnProceso && (miembro.estatus ?? "").toLowerCase() === "activo";

  return { data, tieneAcompanantes, esPaseHijo, paseEnProceso, isActivo, statusPase, esSeleccionable };
}
