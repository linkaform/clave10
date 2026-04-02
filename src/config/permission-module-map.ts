export const PERMISSION_MODULE_MAP: Record<string, string[]> = {
  accesos: [
    "entradas-salidas",
    "vehiculos",
    // "vehiculos-config",
    "equipos",
    // "equipos-config",
    // "gafetes-lockers",
    // "gafetes-config",
  ],
  pases: ["pases-de-entrada"],
  reportes: ["pases-reportes", "turno-reportes"],
  turnos: [
    "turnos",
    // "turno-configuracion"
  ],
  notas: ["turno-notas"],
  rondines: [
    "rondines",
    // "configuracion-rondines"
  ],
  incidencias: [
    "incidencias",
    // "configuracion-incidentes"
  ],
  bitacoras: [
    "fallas",
    // "configuracion-fallas"
  ],
  articulos: [
    "paqueteria",
    // "paqueteria-configuracion",
    "articulos-perdidos",
    // "articulos-perdidos-configuracion",
    "articulos-concesionados",
    // "articulos-concesionados-configuracion",
  ],
  empleados: [
    "usuarios",
    "departamentos-y-puestos",
    "configuracion-departamentos-y-puestos",
  ],
  ubicaciones: [
    "ubicaciones",
    "configuracion-ubicaciones",
    "areas",
    "configuracion-de-areas",
  ],
};
