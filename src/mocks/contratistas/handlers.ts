/* eslint-disable @typescript-eslint/no-explicit-any */
// Back simulado de contratistas: store en memoria (se reinicia al recargar)
// con las mismas reglas que piden las specs del modelo (clave10-sdk/specs):
// vista espejo de relaciones, estatus de contrato y documento, y un motor de
// cumplimiento simplificado. Solo para desarrollo del front.
import type {
  FilaMapeoInput,
  Ref,
  Sancion,
  Activo,
  Mantenimiento,
  Ambito,
  Contrato,
  CumplimientoFila,
  Documento,
  CeldaDocumental,
  CumplimientoDocumental,
  DocumentoBase,
  EstadoDocumental,
  PestanaPeriodica,
  PestanaPeriodo,
  PestanaVigencia,
  ResumenCumplimiento,
  EstadoIncumplimiento,
  FilaAsignacion,
  IncumplimientoRequerimiento,
  ResultadoNotificacion,
  EmpleadoContratista,
  Empresa,
  EstatusRepse,
  EstadoCumplimiento,
  EstatusContrato,
  EstatusDocumento,
  EventoContrato,
  Pagina,
  Participante,
  RecursoContrato,
  Relacion,
  RelacionFila,
  Requerimiento,
  Sesion,
} from "@/types/contratistas";
import { diasHasta, porcentajeCumplimiento } from "@/mappers/contratistas.mapper";
import * as seed from "./seed";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** Empresa activa del usuario en los mocks. */
const EMPRESA_ACTIVA = "emp-propia";
const AUTOR = "Usuario de prueba";
const LATENCIA_MS = 250;

const db = {
  empresas: clone(seed.EMPRESAS) as Empresa[],
  relaciones: clone(seed.RELACIONES) as Relacion[],
  requerimientos: clone(seed.REQUERIMIENTOS) as Requerimiento[],
  recursos: clone(seed.RECURSOS) as RecursoContrato[],
  empleados: clone(seed.EMPLEADOS) as EmpleadoContratista[],
  contratos: clone(seed.CONTRATOS) as Contrato[],
  historial: clone(seed.HISTORIAL) as EventoContrato[],
  documentos: clone(seed.DOCUMENTOS) as DocumentoBase[],
  activos: clone(seed.ACTIVOS) as Activo[],
  mantenimientos: clone(seed.MANTENIMIENTOS) as Mantenimiento[],
  sanciones: clone(seed.SANCIONES) as Sancion[],
  mapeos: {} as Record<string, FilaMapeoInput[]>,
  sesiones: clone(seed.SESIONES) as Sesion[],
  /** Estados fijados a mano (ccOv): id de fila -> estado y motivo. */
  manual: {} as Record<string, { estado: EstadoCumplimiento; motivo: string }>,
};

let consecutivo = 1000;
const nuevoId = (prefijo: string) => `${prefijo}-${++consecutivo}`;
const folio = (prefijo: string, n: number) => `${prefijo}-${String(n).padStart(4, "0")}`;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const ahora = () => new Date().toISOString().slice(0, 19).replace("T", " ");

class MockError extends Error {}
const noExiste = (que: string, id: unknown): never => {
  throw new MockError(`${que} ${String(id)} no existe`);
};
const buscar = <T extends { id: string }>(lista: T[], id: unknown, que: string): T =>
  lista.find((x) => x.id === id) ?? noExiste(que, id);

const paginar = <T>(items: T[], p: any): Pagina<T> => {
  const offset = Number(p.offset ?? 0);
  const limit = Number(p.limit ?? 25);
  return { items: items.slice(offset, offset + limit), total: items.length };
};

const coincide = (texto: string | undefined, search: unknown) =>
  !search || (texto ?? "").toLowerCase().includes(String(search).toLowerCase());

/* ---------------- Motor de cumplimiento (simplificado) ---------------- */

const MESES_PERIODO: Record<string, number> = {
  Mensual: 1, Bimestral: 2, Trimestral: 3, Cuatrimestral: 4, Semestral: 6, Anual: 12,
};
const LETRA_PERIODO: Record<number, string> = { 2: "B", 3: "T", 4: "C", 6: "S" };

/**
 * Periodos de un requerimiento dentro del año y de la vigencia del sujeto
 * (`desde`–`hasta`). Uno único (o por vigencia) se exige desde el alta.
 */
const periodosDelAnio = (r: Requerimiento, anio: number, desde: string, hasta: string) => {
  if (r.vigencia_modo !== "periodo" || r.periodicidad === "Única") {
    return [{ clave: "unico", inicio: desde, fin: hasta, vence: desde }];
  }
  const n = MESES_PERIODO[r.periodicidad ?? ""];
  if (!n) return [{ clave: "unico", inicio: desde, fin: hasta, vence: desde }];
  // Vence el día límite del mes siguiente al periodo (el back además respeta meses_periodo).
  return Array.from({ length: 12 / n }, (_, i) => {
    const mesIni = i * n + 1;
    const inicio = `${anio}-${String(mesIni).padStart(2, "0")}-01`;
    const fin = new Date(Date.UTC(anio, mesIni - 1 + n, 0)).toISOString().slice(0, 10);
    const vence = new Date(Date.UTC(anio, mesIni - 1 + n, r.dia_limite ?? 17)).toISOString().slice(0, 10);
    const clave = n === 1 ? `${anio}-${String(mesIni).padStart(2, "0")}` : n === 12 ? `${anio}` : `${anio}-${LETRA_PERIODO[n]}${i + 1}`;
    return { clave, inicio, fin, vence };
  }).filter((p) => p.fin >= desde && p.inicio <= hasta);
};

const estadoDe = (
  fila: Omit<CumplimientoFila, "estado" | "documento" | "id">,
  clienteId: string,
): { estado: EstadoCumplimiento; documento: string | null } => {
  const hoy = hoyISO();
  if (fila.periodo.inicio > hoy) return { estado: "Por transcurrir", documento: null };
  const doc = db.documentos.find(
    (d) =>
      d.requerimiento?.id === fila.requerimiento.id &&
      d.dueno.empresa.id === fila.sujeto.empresa.id &&
      (fila.sujeto.empleado ? d.dueno.empleado?.id === fila.sujeto.empleado.id : true) &&
      (fila.periodo.clave === "unico" || d.periodo?.clave === fila.periodo.clave) &&
      d.compartido_con.some((c) => c.id === clienteId),
  );
  if (!doc) {
    return { estado: fila.periodo.vence < hoy ? "Por subir" : "En plazo", documento: null };
  }
  const apr = doc.aprobaciones.find((a) => a.cliente.id === clienteId);
  if (apr?.decision === "Rechazado") return { estado: "Rechazado", documento: doc.id };
  if (apr?.decision === "Aprobado") {
    if (doc.vigencia_fin && doc.vigencia_fin < hoy) return { estado: "Vencido", documento: doc.id };
    return { estado: doc.en_ceros ? "En ceros" : "Cumplido", documento: doc.id };
  }
  return { estado: "Por revisar", documento: doc.id };
};

const filasDeContrato = (c: Contrato, anio: number): CumplimientoFila[] => {
  const rel = buscar(db.relaciones, c.relacion, "Relación");
  const reqById = (id: string) => db.requerimientos.find((r) => r.id === id);
  const recurso = (id: string) => db.recursos.find((r) => r.id === id);
  const empresa = { id: c.contratista.id, nombre: c.contratista.razon_social };
  const filas: CumplimientoFila[] = [];

  const agregar = (
    r: Requerimiento,
    sujeto: CumplimientoFila["sujeto"],
    llave: string,
    desde: string = c.inicio,
  ) => {
    for (const periodo of periodosDelAnio(r, anio, desde, c.fin)) {
      const base = {
        relacion: rel.id,
        contrato: c.id,
        requerimiento: { id: r.id, nombre: r.nombre },
        limitante: r.limitante,
        sujeto,
        periodo,
      };
      const id = `cum-${c.id}-${llave}-${r.id}-${periodo.clave}`;
      const calc = estadoDe(base, rel.cliente.id);
      const manual = db.manual[id];
      filas.push({
        ...base,
        id,
        documento: calc.documento,
        estado: manual?.estado ?? calc.estado,
        motivo_manual: manual?.motivo,
      });
    }
  };

  // Ámbito Empresa: de los servicios y de los asignados a la relación.
  const reqsEmpresa = new Set<string>(rel.requerimientos_asignados.map((r) => r.id));
  c.servicios.forEach((s) => recurso(s.id)?.requerimientos.forEach((r) => reqsEmpresa.add(r.id)));
  // ME-13: los homologados del mapeo se exigen como los de los servicios.
  const mapeados = (db.mapeos[c.id] ?? []).map((f) => f.requerimiento_id).filter((x): x is string => Boolean(x));
  mapeados.forEach((id) => reqsEmpresa.add(id));
  reqsEmpresa.forEach((id) => {
    const r = reqById(id);
    if (r?.ambito === "Empresa") agregar(r, { tipo: "Empresa", empresa }, "emp");
  });

  // Ámbito Persona: por empleado ligado, según su perfil en el contrato (+ homologados).
  c.empleados.forEach((e) => {
    const renglon = c.perfiles.find((p) => p.perfil.id === e.perfil.id);
    [...(recurso(e.perfil.id)?.requerimientos ?? []), ...mapeados.map((id) => ({ id }))].forEach(({ id }) => {
      const r = reqById(id);
      if (r?.ambito === "Persona" && !renglon?.requerimientos_excluidos.includes(id)) {
        agregar(r, { tipo: "Persona", empresa, empleado: e.empleado }, e.empleado.id, e.fecha_alta);
      }
    });
  });

  // Ámbito Equipo: un sujeto por renglón (los activos reales los define ME-08).
  c.equipos.forEach((q) => {
    recurso(q.equipo.id)?.requerimientos.forEach(({ id }) => {
      const r = reqById(id);
      if (r?.ambito === "Equipo" && !q.requerimientos_excluidos.includes(id)) {
        agregar(r, { tipo: "Equipo", empresa, equipo: q.equipo }, q.equipo.id);
      }
    });
  });
  return filas;
};

const todasLasFilas = (anio = new Date().getFullYear()) =>
  db.contratos.filter((c) => c.estatus !== "Cancelado").flatMap((c) => filasDeContrato(c, anio));

const estatusContrato = (c: Contrato, filas: CumplimientoFila[]): EstatusContrato => {
  if (c.estatus === "Cancelado" || c.estatus === "Pausado") return c.estatus;
  if (c.fin < hoyISO()) return "Vencido";
  if (filas.some((f) => f.limitante && f.estado !== "Cumplido" && f.estado !== "En ceros" && f.estado !== "No aplica" && f.estado !== "Por transcurrir" && f.estado !== "En plazo")) {
    return "En documentación";
  }
  if (diasHasta(c.fin) <= 30) return "Por vencer";
  return "Activo";
};

/** Recalcula estatus y % (lo que el back guarda) antes de responder. */
const recalcular = () => {
  const filas = todasLasFilas();
  for (const c of db.contratos) {
    const propias = filas.filter((f) => f.contrato === c.id);
    const pct = (tipo?: Ambito, periodicas?: boolean) =>
      porcentajeCumplimiento(
        propias
          .filter((f) => (tipo ? f.sujeto.tipo === tipo : true))
          .filter((f) => (periodicas === undefined ? true : periodicas === (f.periodo.clave !== "unico")))
          .map((f) => f.estado),
      );
    c.cumplimiento = {
      total: pct(),
      contrato: pct("Empresa", false),
      empleados: pct("Persona"),
      periodicos: pct(undefined, true),
    };
    c.estatus = estatusContrato(c, propias);
  }
  for (const r of db.relaciones) {
    const deRel = filas.filter((f) => f.relacion === r.id);
    r.num_contratos = db.contratos.filter((c) => c.relacion === r.id && c.estatus !== "Cancelado").length;
    r.cumplimiento_pct = porcentajeCumplimiento(deRel.map((f) => f.estado));
  }
  return filas;
};

const estatusDocumento = (d: DocumentoBase): EstatusDocumento => {
  if (d.aprobaciones.some((a) => a.decision === "Rechazado")) return "Rechazado";
  const aprobado = d.aprobaciones.length > 0 && d.aprobaciones.every((a) => a.decision === "Aprobado");
  if (aprobado) return d.vigencia_fin && d.vigencia_fin < hoyISO() ? "Vencido" : "Aceptado";
  return "Por revisar";
};

/** Como el back: agrega resumen "N de M" y la decisión de la empresa activa. */
const docOut = (d: DocumentoBase): Documento => {
  const decs = d.aprobaciones.map((a) => a.decision);
  const mia = d.aprobaciones.find((a) => a.cliente.id === EMPRESA_ACTIVA)?.decision;
  return {
    ...d,
    resumen_aprobacion: {
      aprobados: decs.filter((x) => x === "Aprobado").length,
      rechazados: decs.filter((x) => x === "Rechazado").length,
      pendientes: decs.filter((x) => x === "Pendiente").length,
      total: decs.length,
    },
    ...(mia ? { mi_decision: mia } : {}),
  };
};

/* ---------------- Relaciones ---------------- */

/** Requerimientos activos de ámbito Empresa, por nombre (columnas de MX-05). */
const reqsEmpresa = () =>
  db.requerimientos
    .filter((q) => q.ambito === "Empresa" && q.estatus === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

/** Como el back: activos de Empresa, o ya asignados aunque se hayan desactivado. */
const asignar = (r: Relacion, ids: string[]) => {
  if (r.cliente.id !== EMPRESA_ACTIVA) throw new MockError("Solo el cliente asigna requerimientos al contratista.");
  const activos = reqsEmpresa();
  r.requerimientos_asignados = Array.from(new Set(ids)).map((id) => {
    const q = activos.find((x) => x.id === id) ?? r.requerimientos_asignados.find((x) => x.id === id);
    if (!q) throw new MockError(`El requerimiento ${id} no existe, está inactivo o no es de ámbito Empresa.`);
    return { id: q.id, nombre: q.nombre };
  });
};

const filaAsignacion = (r: Relacion): FilaAsignacion => {
  const activos = new Set(reqsEmpresa().map((q) => q.id));
  const asignados = r.requerimientos_asignados.map((q) => q.id);
  return {
    relacion_id: r.id,
    folio: r.folio,
    contratista: r.contratista,
    estatus: r.estatus,
    editable: r.estatus === "Activo",
    asignados,
    solicitados: { n: asignados.filter((id) => activos.has(id)).length, m: activos.size },
  };
};

const aFila = (r: Relacion, direccion: string): RelacionFila => {
  const ref = direccion === "clientes" ? r.cliente : r.contratista;
  const emp = buscar(db.empresas, ref.id, "Empresa");
  const rep = emp.contactos.find((c) => c.rol === "Representante legal");
  return {
    id: r.id,
    folio: r.folio,
    contraparte: { ...ref, logo: emp.logo },
    representante: rep ? { nombre: rep.nombre, email: rep.email } : undefined,
    repse: emp.repse
      ? { folio: emp.repse.folio, fin: emp.repse.fin, dias_restantes: diasHasta(emp.repse.fin), estatus: emp.repse.estatus }
      : undefined,
    num_contratos: r.num_contratos,
    cumplimiento_pct: r.cumplimiento_pct,
    estatus: r.estatus,
    ultima_notificacion: r.ultima_notificacion,
  };
};

/* MX-03: incumplimientos de una relación, como el back (Rechazado, Vencido, Por subir = No entregado). */
const INCUMPLE: Record<string, EstadoIncumplimiento> = { Rechazado: "Rechazado", Vencido: "Vencido", "Por subir": "No entregado" };

const incumplimientosDe = (relacionId: string, requerimientoId?: string): IncumplimientoRequerimiento[] => {
  const porReq = new Map<string, IncumplimientoRequerimiento>();
  recalcular()
    .filter((f) => f.relacion === relacionId && INCUMPLE[f.estado] && (!requerimientoId || f.requerimiento.id === requerimientoId))
    .forEach((f) => {
      const g = porReq.get(f.requerimiento.id) ?? { requerimiento: f.requerimiento, periodos: [] };
      const sujeto = f.sujeto.empleado?.nombre ?? f.sujeto.equipo?.nombre;
      g.periodos.push({ clave: f.periodo.clave, estado: INCUMPLE[f.estado], ...(sujeto ? { sujeto } : {}) });
      porReq.set(f.requerimiento.id, g);
    });
  return [...porReq.values()].sort((a, b) => a.requerimiento.nombre.localeCompare(b.requerimiento.nombre));
};

const destinatarioDe = (empresaId: string) => {
  const emp = buscar(db.empresas, empresaId, "Empresa");
  const con = emp.contactos.filter((c) => c.email);
  const c = con.find((x) => x.rol === "Representante legal") ?? con[0];
  return c ? { nombre: c.nombre, email: c.email!, rol: c.rol } : null;
};

const relacionDelCliente = (id: string) => {
  const r = buscar(db.relaciones, id, "Relación");
  if (r.cliente.id !== EMPRESA_ACTIVA) throw new MockError("Solo el cliente notifica incumplimientos a su contratista.");
  return r;
};

const empresaRef = (id: string) => {
  const e = buscar(db.empresas, id, "Empresa");
  return { id: e.id, razon_social: e.razon_social, rfc: e.rfc };
};

const registrarEvento = (contrato: string, evento: EventoContrato["evento"], detalle: string) =>
  db.historial.push({ id: nuevoId("ev"), contrato, evento, detalle, autor: AUTOR, fecha: ahora() });

/* ---------------- Mi Empresa (ME-01-B) ---------------- */

/** Como el back: contactos con índice, REPSE con días y % y suma de trabajadores. */
const empresaOut = (e: Empresa): Empresa => {
  const hoy = new Date(hoyISO()).getTime();
  const dia = 86400000;
  const repse = e.repse?.fin
    ? (() => {
        const dias = Math.round((new Date(e.repse!.fin).getTime() - hoy) / dia);
        const ini = e.repse!.inicio ? new Date(e.repse!.inicio).getTime() : 0;
        const fin = new Date(e.repse!.fin).getTime();
        return {
          ...e.repse!,
          estatus: (dias < 0 ? "Vencido" : dias <= 60 ? "Por vencer" : "Vigente") as EstatusRepse,
          dias_restantes: dias,
          ...(ini && fin > ini ? { transcurrido_pct: Math.max(0, Math.min(100, Math.round(((hoy - ini) * 100) / (fin - ini)))) } : {}),
        };
      })()
    : e.repse;
  const cargados = e.registros_patronales.filter((r) => r.trabajadores_registrados != null);
  return {
    ...e,
    repse,
    contactos: e.contactos.map((c, indice) => ({ ...c, indice })),
    trabajadores_registrados: cargados.length ? cargados.reduce((s, r) => s + (r.trabajadores_registrados ?? 0), 0) : null,
  };
};

/* ---------------- Empleados (ME-03-B) ---------------- */

/** Como el back: contratos no cancelados y % de las filas del motor. */
const empleadoOut = (e: EmpleadoContratista): EmpleadoContratista => {
  const contratos = db.contratos
    .filter((c) => c.estatus !== "Cancelado" && c.empleados.some((x) => x.empleado.id === e.id))
    .map((c) => ({ id: c.id, folio: c.folio, objeto: c.objeto }));
  const estados = recalcular()
    .filter((f) => f.sujeto.empleado?.id === e.id)
    .map((f) => f.estado)
    .filter((s) => !["No aplica", "Por transcurrir", "En plazo"].includes(s));
  const cumplimiento_pct = estados.length
    ? Math.round((estados.filter((s) => s === "Cumplido" || s === "En ceros").length * 100) / estados.length)
    : null;
  return { ...e, contratos, cumplimiento_pct };
};

const empleadoIn = (e: any): Partial<EmpleadoContratista> => {
  const { cuenta, perfiles, tipo_contrato, fecha_ingreso, ...resto } = e ?? {};
  const out: Partial<EmpleadoContratista> = { ...resto };
  if (tipo_contrato || fecha_ingreso)
    out.contratacion = { ...(tipo_contrato && { tipo_contrato }), ...(fecha_ingreso && { fecha_ingreso }) };
  if (perfiles) {
    out.perfiles = perfiles.map((p: any) => {
      const id = typeof p === "string" ? p : p.id;
      return { id, nombre: buscar(db.recursos, id, "Perfil").nombre };
    });
  }
  if (cuenta?.modo === "sin_cuenta") Object.assign(out, { usuario: undefined, usuario_id: undefined });
  if (cuenta?.modo === "crear" || cuenta?.modo === "ligar") {
    const id = cuenta.usuario_id ?? ++consecutivo;
    out.usuario = { id, username: cuenta.username ?? `usuario${id}`, email: cuenta.email ?? `usuario${id}@example.com` };
    out.usuario_id = id;
  }
  return out;
};

const validarEmpleado = (e: any, excepto?: string) => {
  const errores: string[] = [];
  if (!String(e.nombre ?? "").trim()) errores.push("El nombre es obligatorio.");
  if (!/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{5}[A-Z\d]\d$/.test(String(e.curp ?? "").toUpperCase()))
    errores.push("La CURP debe tener 18 caracteres válidos.");
  else if (db.empleados.some((x) => x.id !== excepto && x.curp.toUpperCase() === String(e.curp).toUpperCase()))
    errores.push("La CURP ya está registrada en otro empleado.");
  if (e.rfc && String(e.rfc).length !== 13) errores.push("El RFC debe tener 13 caracteres (persona física).");
  if (e.nss && !/^\d{11}$/.test(String(e.nss))) errores.push("El NSS debe tener 11 dígitos.");
  if (errores.length) throw new MockError(errores.join("\n"));
};

/** Archivo fijo de ejemplo: 2 válidos, 1 CURP ya registrada (se omite). */
const cargaMock = () => {
  const filas = [
    { nombre: "Ana Torres Garza", curp: "TOGA950505MNLRRN05", rfc: "", nss: "" },
    { nombre: "Raúl Medina Salas", curp: "MESR870909HNLDLL06", rfc: "", nss: "12345678906" },
    { nombre: "María López Hernández", curp: "LOHM900101MNLPRR01", rfc: "", nss: "" },
  ];
  const curps = new Set(db.empleados.map((e) => e.curp));
  const muestra = filas.filter((f) => !curps.has(f.curp));
  const omitidos = filas
    .map((f, i) => ({ fila: i + 2, curp: f.curp, motivo: "La CURP ya está registrada" }))
    .filter((f) => curps.has(f.curp));
  return {
    valido: muestra.length > 0,
    total: filas.length,
    por_cargar: muestra.length,
    omitidos,
    errores: [] as { fila: number; mensaje: string }[],
    muestra,
  };
};

/** QR de mentira (1×1 px). */
const QR_MOCK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

/** get_empleado: lo de la lista + generales, preferencias y QR. */
const empleadoDetalle = (e: EmpleadoContratista): EmpleadoContratista => {
  const base = empleadoOut(e);
  return {
    ...base,
    contratacion: { tipo_contrato: e.contratacion?.tipo_contrato ?? "Permanente", fecha_ingreso: e.contratacion?.fecha_ingreso ?? "2024-03-15", antiguedad: "2 años 8 meses", ...e.contratacion },
    cuenta: e.usuario ? { email: e.usuario.email, telefono: "8112345678" } : undefined,
    preferencias: {
      notificaciones_correo: true,
      checkin_foto: false,
      ...e.preferencias,
      acceso_app: Boolean(e.usuario) && (e.preferencias?.acceso_app ?? true),
      disponible_para_contratos: e.disponible_para_contratos,
    },
    qr_activo: e.estatus === "Activo" && !e.vetado,
    editable: (e.empresa?.id ?? EMPRESA_ACTIVA) === EMPRESA_ACTIVA,
    suspendido_hasta: suspendidoHasta(e.id),
  };
};

const URGENCIA = ["Rechazado", "Vencido", "Por subir", "Por revisar", "Aceptado"] as const;

/** Pestaña Documentos: requerimientos de perfiles + filas del motor, con su documento más reciente. */
const documentosEmpleado = (empleado_id: string, p: any) => {
  const e = buscar(db.empleados, empleado_id, "Empleado");
  const renglones = new Map<string, any>();
  const renglon = (req: { id: string; nombre: string }) => {
    if (!renglones.has(req.id)) {
      const r = db.requerimientos.find((x) => x.id === req.id);
      renglones.set(req.id, { requerimiento: { id: req.id, nombre: r?.nombre ?? req.nombre }, recurrencia: r?.periodicidad ?? "Única", limitante: r?.limitante ?? false, origenes: [], estado: null });
    }
    return renglones.get(req.id);
  };
  e.perfiles.forEach((perfil) => {
    db.recursos.find((x) => x.id === perfil.id)?.requerimientos.forEach((q: any) => {
      if (q.ambito === "Persona") renglon(q).origenes.push({ tipo: "Perfil", nombre: perfil.nombre });
    });
  });
  recalcular()
    .filter((f) => f.sujeto.empleado?.id === e.id)
    .forEach((f) => {
      const r = renglon(f.requerimiento);
      const c = f.contrato ? db.contratos.find((x) => x.id === f.contrato) : undefined;
      const o = c ? { tipo: "Contrato", nombre: c.folio, id: c.id } : { tipo: "Expediente base", nombre: "Asignado por el cliente" };
      if (!r.origenes.some((x: any) => x.nombre === o.nombre)) r.origenes.push(o);
      r.estado ??= f.estado;
    });
  const docs = db.documentos.filter((d) => d.dueno.empleado?.id === e.id);
  const items: any[] = [...renglones.values()].map((r) => {
    const d = docs.find((x) => x.requerimiento?.id === r.requerimiento.id);
    const motor: Record<string, string> = { Cumplido: "Aceptado", "En ceros": "Aceptado", Vencido: "Vencido", Rechazado: "Rechazado", "Por revisar": "Por revisar" };
    return {
      requerimiento: r.requerimiento,
      origen: r.origenes[0] ?? { tipo: "Carga", nombre: "Subido sin requerimiento ligado" },
      tambien_lo_requiere: r.origenes.slice(1),
      recurrencia: r.recurrencia,
      limitante: r.limitante,
      estatus: d?.estatus ?? motor[r.estado] ?? "Por subir",
      documento: d
        ? { id: d.id, folio: d.folio, nombre: d.nombre, archivo: d.archivo, vigencia_inicio: d.vigencia_inicio, vigencia_fin: d.vigencia_fin, versiones: d.versiones, comentario: d.comentarios.at(-1)?.texto ?? null }
        : null,
    };
  });
  const conteo = Object.fromEntries(URGENCIA.map((s) => [s, items.filter((i) => i.estatus === s).length]));
  const filtrados = items
    .filter((i) => (p.estatus ? [p.estatus].flat().includes(i.estatus) : true))
    .filter((i) => (p.origen ? [i.origen, ...i.tambien_lo_requiere].some((o: any) => o.tipo === p.origen) : true))
    .filter((i) => coincide(i.requerimiento?.nombre, p.search))
    .sort((a, b) => URGENCIA.indexOf(a.estatus) - URGENCIA.indexOf(b.estatus));
  return { ...paginar(filtrados, p), conteo, pendientes: conteo.Rechazado + conteo.Vencido + conteo["Por subir"] };
};

/* ---------------- Subcontratación (R-03) ---------------- */

/** Mismas reglas que el back al crear o reactivar una relación hija. */
const validarSubcontratacion = (padre: Relacion, clienteId: string, contratistaId: string) => {
  if (padre.estatus !== "Activo") throw new MockError("La relación padre está inactiva.");
  if (padre.contratista.id !== clienteId)
    throw new MockError("El cliente de la subcontratación debe ser el contratista de la relación padre.");
  if (padre.nivel + 1 > 3) throw new MockError("Se excede el nivel máximo de subcontratación (3).");
  for (let r: Relacion | undefined = padre; r; r = db.relaciones.find((x) => x.id === r!.relacion_padre)) {
    if (r.cliente.id === contratistaId || r.contratista.id === contratistaId)
      throw new MockError("No se puede subcontratar a una empresa que ya está en la cadena (se formaría un ciclo).");
  }
  const permite = db.contratos.some(
    (c) => c.relacion === padre.id && c.permite_subcontratacion && !["Pausado", "Cancelado", "Vencido"].includes(c.estatus),
  );
  if (!permite) throw new MockError("Ningún contrato vigente de la relación padre permite subcontratación.");
};

/* ---------------- Contratos del empleado (ME-05-B) ---------------- */

const NO_VIGENTE: string[] = ["Pausado", "Cancelado", "Vencido"];

/** Como el back: un renglón por perfil, conserva fecha de alta y suma perfiles nuevos al empleado. */
const renglonesEmpleado = (e: EmpleadoContratista, c: Contrato, perfiles: string[]) => {
  const del = new Map(c.perfiles.map((x) => [x.perfil.id, x.perfil]));
  const malos = perfiles.filter((id) => !del.has(id));
  if (malos.length) throw new MockError(`Perfiles que no pide el contrato ${c.folio}: ${malos.join(", ")}.`);
  const antes = new Map(c.empleados.filter((x) => x.empleado.id === e.id).map((x) => [x.perfil.id, x]));
  c.empleados = [
    ...c.empleados.filter((x) => x.empleado.id !== e.id),
    ...perfiles.map((id) => ({ ...antes.get(id), empleado: { id: e.id, nombre: e.nombre }, perfil: del.get(id)!, fecha_alta: antes.get(id)?.fecha_alta ?? hoyISO() })),
  ];
  const tiene = new Set(e.perfiles.map((x) => x.id));
  const perfiles_agregados = perfiles.filter((id) => !tiene.has(id)).map((id) => del.get(id)!);
  e.perfiles = [...e.perfiles, ...perfiles_agregados];
  return { contrato: { id: c.id, folio: c.folio }, perfiles_agregados, empleado: empleadoDetalle(e) };
};

/* ---------------- Sesiones (CF-03-B) ---------------- */

/** Como el back: modalidad deducida, estatus por fecha e inscritos. */
const sesionOut = (s: Sesion): Sesion => {
  const hoy = hoyISO();
  const fin = s.recurrencia?.repetir_hasta ?? s.fecha_fin;
  const estatus =
    s.estatus === "Cancelada" ? "Cancelada" : hoy < s.fecha_inicio ? "Programada" : hoy > fin ? "Finalizada" : "En curso";
  const modalidad = s.lugar && s.enlace ? "Híbrida" : s.enlace ? "Virtual" : "Presencial";
  return { ...s, estatus, modalidad, inscritos: s.participantes.length };
};

/* ---------------- Participantes (CF-04-B) ---------------- */

/** Días transcurridos de la sesión (sin recurrencias complejas en los mocks). */
const diasSesion = (s: Sesion): string[] => {
  const fin = [s.recurrencia?.repetir_hasta ?? s.fecha_fin, hoyISO()].sort()[0];
  const out: string[] = [];
  for (let d = new Date(s.fecha_inicio); d.toISOString().slice(0, 10) <= fin; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const otorgarMock = (s: Sesion, p: Participante) =>
  s.otorgados.forEach((otorga) => {
    const ya = db.documentos.some(
      (d) => d.origen === "Sesión" && d.requerimiento?.id === otorga.id && d.dueno.empleado?.id === p.empleado.id,
    );
    if (ya) return;
    const empl = buscar(db.empleados, p.empleado.id, "Empleado");
    const empresa = empl.empresa ? { id: empl.empresa.id, nombre: empl.empresa.razon_social } : { id: EMPRESA_ACTIVA, nombre: "" };
    const clientes = db.relaciones
      .filter((r) => r.contratista.id === empresa.id)
      .map((r) => ({ id: r.cliente.id, nombre: r.cliente.razon_social }));
    db.documentos.push({
      id: nuevoId("doc"),
      folio: folio("D", db.documentos.length + 1),
      nombre: `${s.nombre} · ${p.empleado.nombre}`,
      requerimiento: otorga,
      dueno: { tipo: "Persona", empresa, empleado: p.empleado },
      en_ceros: false,
      archivo: { name: "constancia.pdf", file_url: "https://example.com/mock/constancia.pdf" },
      estatus: "Aceptado",
      compartido_con: clientes,
      contratos: [],
      origen: "Sesión",
      versiones: [],
      comentarios: [],
      aprobaciones: clientes.map((cliente) => ({ cliente, decision: "Aprobado" as const, revisor: AUTOR, fecha: ahora() })),
    });
  });

/** Como el back: resultado (todos los exámenes ≥ 80, o asistencia completa) y otorga a los Aprobados. */
const guardarParticipantes = (s: Sesion) => {
  const dias = diasSesion(s);
  s.participantes.forEach((p) => {
    let res: Participante["resultado"];
    if (s.examenes.length) {
      const cal = p.calificaciones ?? {};
      if (s.examenes.every((x) => x.id in cal)) res = s.examenes.every((x) => cal[x.id] >= 80) ? "Aprobado" : "No aprobado";
    } else if (dias.length && dias.every((d) => p.asistencia[d])) {
      res = dias.every((d) => p.asistencia[d] === "Asistió") ? "Aprobado" : "No aprobado";
    }
    p.resultado = res;
    if (res === "Aprobado") otorgarMock(s, p);
  });
  return participantesOut(s);
};

const participantesOut = (s: Sesion) => {
  const dias = diasSesion(s);
  const participantes = s.participantes.map((p) => {
    const e = db.empleados.find((x) => x.id === p.empleado.id);
    const asistio = dias.filter((d) => p.asistencia[d] === "Asistió").length;
    return { ...p, puesto: e?.puesto, centro_trabajo: e?.centro_trabajo?.nombre,
      asistencia_resumen: { asistio, dias: dias.length, pct: dias.length ? Math.round((asistio * 100) / dias.length) : null } };
  });
  const total = participantes.reduce((n, p) => n + p.asistencia_resumen.asistio, 0);
  const o = sesionOut(s);
  return {
    sesion: { id: o.id, nombre: o.nombre, estatus: o.estatus, cupo: o.cupo, inscritos: o.inscritos, examenes: o.examenes, otorgados: o.otorgados },
    dias,
    examenes_minimas: Object.fromEntries(s.examenes.map((x) => [x.id, 80])),
    kpi: { inscritos: participantes.length, cupo: s.cupo ?? null, asistieron: participantes.filter((p) => p.asistencia_resumen.asistio).length,
      asistencia_pct: participantes.length && dias.length ? Math.round((total * 100) / (participantes.length * dias.length)) : null },
    participantes,
  };
};

/* ---------------- Opciones ---------------- */

type Handler = (p: any) => unknown;

/* ---------------- Cumplimiento documental (ME-07), como el back ---------------- */

const PESTANA_DE: Record<string, PestanaPeriodica> = {
  Mensual: "Mensuales", Bimestral: "Bimestrales", Trimestral: "Trimestrales",
  Cuatrimestral: "Cuatrimestrales", Semestral: "Semestrales", Anual: "Anuales",
};
const ORDEN_PESTANAS = [...Object.values(PESTANA_DE), "Por vigencia", "Sin vencimiento"];
const PENDIENTES_DOC: EstadoDocumental[] = ["Por subir", "No entregado", "Rechazado", "Vencido"];

const pctDoc = (estados: (EstadoDocumental | null)[], cuentaPorSubir = false) => {
  const fuera: (EstadoDocumental | null)[] = cuentaPorSubir ? [null, "No aplica"] : [null, "No aplica", "Por subir"];
  const ap = estados.filter((e) => !fuera.includes(e));
  return ap.length ? Math.round((ap.filter((e) => e === "Aceptado" || e === "En ceros").length * 100) / ap.length) : null;
};

const estadoDoc = (d: DocumentoBase): EstadoDocumental => {
  const e = estatusDocumento(d);
  return e === "Aceptado" && d.en_ceros ? "En ceros" : e;
};

const contextoDocumental = () => {
  const exigidos = new Set(
    recalcular()
      .filter((f) => f.sujeto.tipo === "Empresa" && f.sujeto.empresa.id === EMPRESA_ACTIVA)
      .map((f) => f.requerimiento.id),
  );
  const reqs = db.requerimientos
    .filter((q) => q.ambito === "Empresa" && q.estatus === "Activo" && (q.requiere_acuse || exigidos.has(q.id)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const docs = new Map<string, DocumentoBase>();
  db.documentos
    .filter((d) => d.dueno.empresa.id === EMPRESA_ACTIVA && d.dueno.tipo === "Empresa")
    .forEach((d) => docs.set(`${d.requerimiento?.id}|${d.periodo?.clave ?? "unico"}`, d));
  return { reqs, docs };
};

const acuseRef = (d: DocumentoBase) => ({
  id: d.id, folio: d.folio, archivo: d.archivo, en_ceros: d.en_ceros,
  vigencia_inicio: d.vigencia_inicio ?? null, vigencia_fin: d.vigencia_fin ?? null,
});

const obligacion = (q: Requerimiento) => ({
  id: q.id, nombre: q.nombre, descripcion: q.descripcion, tipo: q.tipo, plataforma: q.plataforma,
  plataforma_url: q.plataforma_url, periodicidad: q.periodicidad, vigencia: q.vigencia,
  requiere_acuse: q.requiere_acuse, limitante: q.limitante,
});

const matrizDocumental = (anio: number): CumplimientoDocumental => {
  const hoy = hoyISO();
  const { reqs, docs } = contextoDocumental();
  const tabs = new Map<string, PestanaPeriodo | PestanaVigencia>();
  reqs.forEach((q) => {
    const periodica = q.vigencia_modo === "periodo" && PESTANA_DE[q.periodicidad ?? ""];
    if (periodica) {
      const ps = periodosDelAnio(q, anio, `${anio}-01-01`, `${anio}-12-31`);
      const t = (tabs.get(periodica) as PestanaPeriodo) ?? {
        pestana: periodica, columnas: ps.map(({ clave, inicio, fin }) => ({ clave, inicio, fin })),
        filas: [], pie: [], cumplimiento_pct: null, pendientes: 0,
      };
      const celdas: CeldaDocumental[] = ps.map((p) => {
        if (p.inicio > hoy) return { clave: p.clave, vence: p.vence, estado: null, documento: null };
        const d = docs.get(`${q.id}|${p.clave}`);
        return {
          clave: p.clave, vence: p.vence,
          estado: d ? estadoDoc(d) : p.vence < hoy ? "No entregado" : "Por subir",
          documento: d ? acuseRef(d) : null,
        };
      });
      t.filas.push({ requerimiento: obligacion(q), celdas, cumplimiento_pct: pctDoc(celdas.map((c) => c.estado)) });
      tabs.set(periodica, t);
    } else {
      const nombre = q.vigencia ? "Por vigencia" : "Sin vencimiento";
      const t = (tabs.get(nombre) as PestanaVigencia) ?? { pestana: nombre, filas: [], cumplimiento_pct: null, pendientes: 0 };
      const d = docs.get(`${q.id}|unico`);
      t.filas.push({ requerimiento: obligacion(q), estado: d ? estadoDoc(d) : "Por subir", documento: d ? docOut(d) : null });
      tabs.set(nombre, t);
    }
  });
  const pestanas = ORDEN_PESTANAS.filter((n) => tabs.has(n)).map((n) => {
    const t = tabs.get(n)!;
    if ("columnas" in t) {
      t.pie = t.columnas.map((_, i) => pctDoc(t.filas.map((f) => f.celdas[i].estado)));
      const estados = t.filas.flatMap((f) => f.celdas.map((c) => c.estado));
      t.cumplimiento_pct = pctDoc(estados);
      t.pendientes = estados.filter((e) => e && PENDIENTES_DOC.includes(e)).length;
    } else {
      const estados = t.filas.map((f) => f.estado);
      t.cumplimiento_pct = pctDoc(estados, true);
      t.pendientes = estados.filter((e) => PENDIENTES_DOC.includes(e)).length;
    }
    return t;
  });
  return { anio, hoy, pestanas };
};

const reqPeriodo = (requerimiento_id: string, periodo_clave?: string) => {
  const q = buscar(db.requerimientos, requerimiento_id, "Requerimiento");
  if (q.ambito !== "Empresa") throw new MockError("Solo los requerimientos de ámbito Empresa van en el cumplimiento documental.");
  if (!periodo_clave || periodo_clave === "unico") return { q, p: { clave: "unico", inicio: "", fin: "", vence: "" } };
  const anio = Number(periodo_clave.slice(0, 4));
  const p = periodosDelAnio(q, anio, `${anio}-01-01`, `${anio}-12-31`).find((x) => x.clave === periodo_clave);
  if (!p) throw new MockError(`El periodo ${periodo_clave} no corresponde a la periodicidad de ${q.nombre}.`);
  return { q, p };
};

/* ---------------- Activos (ME-08), como el back ---------------- */

const activoMio = (id: string) => {
  const a = buscar(db.activos, id, "Activo");
  if (a.empresa && a.empresa.id !== EMPRESA_ACTIVA) throw new MockError("El activo no es de tu empresa.");
  return a;
};

const abiertos = (activoId: string) =>
  db.mantenimientos.filter((m) => m.activo.id === activoId && m.estatus !== "Cerrada").length;

const empleadoRef = (id: string) => {
  const e = buscar(db.empleados, id, "Empleado");
  return { id: e.id, nombre: e.nombre };
};

const aplicarActivo = (a: Activo, d: any, alta: boolean) => {
  if (alta || "nombre" in d) {
    if (!d.nombre?.trim()) throw new MockError("El nombre es obligatorio.");
    a.nombre = d.nombre.trim();
  }
  if (d.clase) a.clase = d.clase;
  if (alta || "costo" in d) {
    if (d.costo == null || d.costo < 0) throw new MockError("El costo es obligatorio y no puede ser negativo.");
    a.costo = Number(d.costo);
  }
  if (alta || "area" in d || "ubicacion" in d) {
    if (!d.ubicacion || !d.area) throw new MockError("Selecciona la ubicación y el área.");
    a.ubicacion = d.ubicacion;
    a.area = d.area;
  }
  if (alta || "foto" in d) {
    if (!d.foto?.file_url) throw new MockError("Falta la foto del activo (name y file_url).");
    a.foto = d.foto;
  }
  const inventario = alta || "inventario" in d ? d.inventario ?? "Único" : a.inventario;
  if (a.clase !== "Herramienta" && inventario === "Stock") throw new MockError("Vehículos y equipos son siempre Único.");
  a.inventario = inventario;
  if (inventario === "Stock") {
    const cant = Number("cantidad" in d ? d.cantidad : a.cantidad);
    if (!(cant > 0)) throw new MockError("Con inventario Stock la cantidad en existencia debe ser mayor a 0.");
    a.cantidad = cant;
  } else a.cantidad = null;
  ["marca", "modelo", "adquisicion", "ultimo_mantenimiento"].forEach((k) => {
    if (k in d) (a as any)[k] = d[k] || null;
  });
  if (a.clase === "Vehículo" && d.vehiculo) {
    const v = d.vehiculo;
    a.vehiculo = {
      tipo: v.tipo ?? a.vehiculo?.tipo ?? null,
      serie_chasis: v.serie_chasis ?? a.vehiculo?.serie_chasis ?? null,
      serie_motor1: v.serie_motor1 ?? a.vehiculo?.serie_motor1 ?? null,
      serie_motor2: v.serie_motor2 ?? a.vehiculo?.serie_motor2 ?? null,
      kilometraje: v.kilometraje ?? a.vehiculo?.kilometraje ?? { valor: null, fecha: null },
      horometro: v.horometro ?? a.vehiculo?.horometro ?? { valor: null, fecha: null },
      kilometraje2: v.kilometraje2 ?? a.vehiculo?.kilometraje2 ?? { valor: null, fecha: null },
      horometro2: v.horometro2 ?? a.vehiculo?.horometro2 ?? { valor: null, fecha: null },
    };
    if (v.marca) a.marca = v.marca;
    if (v.modelo) a.modelo = v.modelo;
  } else if (a.clase !== "Vehículo") delete a.vehiculo;
  if ("asignado_id" in d) {
    if (d.asignado_id && a.estado === "Inactivo") throw new MockError("Un activo inactivo no se puede asignar.");
    a.asignado = d.asignado_id ? empleadoRef(d.asignado_id) : null;
  }
};

/* ---------------- Sanciones (R-07 / ME-05), como el back ---------------- */

const MOTIVOS_SANCION = ["Retardos", "Falta injustificada", "No portar EPP", "Abandono de puesto",
  "Incumplimiento de procedimiento", "Conducta inapropiada", "Otro"];

const estatusSancion = (s: Sancion) => (s.sin_acceso && s.fin_suspension && s.fin_suspension >= hoyISO() ? "Vigente" : "Cumplida");

function suspendidoHasta(empleadoId: string) {
  const fines = db.sanciones
    .filter((s) => s.empleado?.id === empleadoId && s.sin_acceso && s.fin_suspension && s.fin_suspension >= hoyISO())
    .map((s) => s.fin_suspension as string);
  return fines.length ? fines.sort().at(-1)! : null;
}

const sancionOut = (s: Sancion): Sancion => ({
  ...s, estatus: estatusSancion(s), evidencias: s.comentarios.reduce((n, c) => n + c.evidencias.length, 0),
  editable: s.registra?.id === EMPRESA_ACTIVA,
});

const sancionVisible = (id: string) => {
  const s = buscar(db.sanciones, id, "Sanción");
  if (![s.registra?.id, s.empresa?.id].includes(EMPRESA_ACTIVA)) throw new MockError("No tienes acceso a esta sanción.");
  return s;
};

const datosSancion = (s: Sancion, d: any) => {
  if ("motivo" in d || !s.motivo) {
    if (!MOTIVOS_SANCION.includes(d.motivo)) throw new MockError("Elige el motivo.");
    s.motivo = d.motivo;
  }
  if ("motivo_otro" in d) s.motivo_otro = d.motivo_otro?.trim() || null;
  if (s.motivo === "Otro" && !s.motivo_otro) throw new MockError("Escribe el motivo.");
  if (s.motivo !== "Otro") s.motivo_otro = null;
  if ("fecha" in d || !s.fecha) s.fecha = d.fecha || hoyISO();
  if ("sin_acceso" in d || "dias_sin_acceso" in d || "inicio_suspension" in d) {
    const sin = d.sin_acceso ?? s.sin_acceso;
    if (sin && s.sujeto_tipo !== "Empleado") throw new MockError("Los días sin acceso son solo para empleados.");
    if (sin) {
      const dias = Number(d.dias_sin_acceso ?? s.dias_sin_acceso);
      if (!(dias >= 1 && dias <= 8)) throw new MockError("Los días sin acceso van de 1 a 8 (Ley Federal del Trabajo).");
      const ini = d.inicio_suspension ?? s.inicio_suspension;
      if (!ini) throw new MockError("Falta la fecha de inicio de la suspensión.");
      const fin = new Date(`${ini}T00:00:00Z`);
      fin.setUTCDate(fin.getUTCDate() + dias - 1);
      Object.assign(s, { sin_acceso: true, dias_sin_acceso: dias, inicio_suspension: ini, fin_suspension: fin.toISOString().slice(0, 10) });
    } else Object.assign(s, { sin_acceso: false, dias_sin_acceso: 0, inicio_suspension: null, fin_suspension: null });
  }
};

/* ---------------- Mapeo (ME-13), como el back ---------------- */

const normMapeo = (t: string) => t.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Dice sobre bigramas (0..1). */
const similitudMapeo = (a: string, b: string) => {
  const x = normMapeo(a), y = normMapeo(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;
  const cuenta = new Map<string, number>();
  for (let i = 0; i < y.length - 1; i++) cuenta.set(y.slice(i, i + 2), (cuenta.get(y.slice(i, i + 2)) ?? 0) + 1);
  let inter = 0;
  for (let i = 0; i < x.length - 1; i++) {
    const g = x.slice(i, i + 2);
    if (cuenta.get(g)) { inter++; cuenta.set(g, cuenta.get(g)! - 1); }
  }
  return (2 * inter) / (x.length - 1 + y.length - 1);
};

const catalogoMaestro = () =>
  db.requerimientos
    .filter((q) => q.estatus === "Activo")
    .map((q) => ({ id: q.id, nombre: q.nombre, codigo: q.codigo ?? null, nivel: q.ambito }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

const mejorMapeo = (origen: string, nivel?: string) => {
  const cat = catalogoMaestro();
  let mejor: { req: (typeof cat)[number] | null; s: number } = { req: null, s: 0 };
  for (const grupo of [nivel ? cat.filter((c) => c.nivel === nivel) : [], cat]) {
    grupo.forEach((c) => {
      const s = Math.max(similitudMapeo(origen, c.nombre), similitudMapeo(origen, c.codigo ?? ""));
      if (s > mejor.s) mejor = { req: c, s };
    });
    if (mejor.s >= 0.4) break;
  }
  return mejor;
};

const codigoSistema = (t: string) =>
  t.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24).replace(/_+$/, "");

const mapeoOut = (contratoId: string) => {
  const c = buscar(db.contratos, contratoId, "Contrato");
  const rel = buscar(db.relaciones, c.relacion, "Relación");
  if (![rel.cliente.id, rel.contratista.id].includes(EMPRESA_ACTIVA)) throw new MockError("No tienes acceso a este contrato.");
  const cat = catalogoMaestro();
  const filas = (db.mapeos[contratoId] ?? []).map((f) => ({
    origen: f.origen, nivel: f.nivel ?? "Persona",
    requerimiento: f.requerimiento_id ? cat.find((x) => x.id === f.requerimiento_id) ?? { id: f.requerimiento_id, nombre: "", codigo: null, nivel: null, inactivo: true } : null,
    similitud: f.similitud ?? null,
  }));
  return {
    contrato: { id: c.id, folio: c.folio }, catalogo: cat, filas, editable: rel.cliente.id === EMPRESA_ACTIVA,
    homologados: filas.filter((f) => f.requerimiento).length, total: filas.length, umbral_sugerir: 40, umbral_homologar: 60,
  };
};

const handlers: Record<string, Handler> = {
  /* Empresa y empleados */
  get_mi_empresa: () => empresaOut(buscar(db.empresas, EMPRESA_ACTIVA, "Empresa")),
  update_mi_empresa: ({ empresa }) => {
    const e = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa");
    const cambios: Partial<Empresa> = {};
    (["razon_social", "rfc", "objeto_social", "domicilio_fiscal"] as const).forEach((k) => {
      if (k in empresa) (cambios as any)[k] = empresa[k];
    });
    if (cambios.rfc) cambios.rfc = cambios.rfc.toUpperCase();
    if (cambios.razon_social !== undefined && !cambios.razon_social.trim())
      throw new MockError("La razón social es obligatoria.");
    return empresaOut(Object.assign(e, cambios));
  },
  get_empresa: ({ empresa_id }) => empresaOut(buscar(db.empresas, empresa_id, "Empresa")),
  save_contacto: ({ contacto, indice }) => {
    const e = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa");
    const errores: string[] = [];
    if (String(contacto.nombre ?? "").trim().length < 3) errores.push("El nombre completo debe tener al menos 3 caracteres.");
    if (String(contacto.telefono ?? "").replace(/\D/g, "").length < 10) errores.push("El teléfono debe tener al menos 10 dígitos.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(contacto.email ?? ""))) errores.push("El correo no es válido.");
    if (errores.length) throw new MockError(errores.join("\n"));
    const nuevo = { ...contacto, rol: contacto.rol ?? "Contacto", telefono: String(contacto.telefono).replace(/\D/g, "") };
    if (indice === undefined || indice === null) e.contactos.push(nuevo);
    else if (!e.contactos[indice]) throw new MockError("El contacto no existe.");
    else e.contactos[indice] = nuevo;
    return empresaOut(e);
  },
  delete_contacto: ({ indice }) => {
    const e = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa");
    if (!e.contactos[indice]) throw new MockError("El contacto no existe.");
    e.contactos.splice(indice, 1);
    return empresaOut(e);
  },

  list_empleados: (p) => {
    const empresa = p.empresa_id || EMPRESA_ACTIVA;
    const items = db.empleados
      .filter((e) => (e.empresa?.id ?? EMPRESA_ACTIVA) === empresa)
      .map(empleadoOut)
      .filter(
        (e) =>
          (p.estatus ? e.estatus === p.estatus : true) &&
          (p.usuario ? Boolean(e.usuario) === (p.usuario === "con") : true) &&
          (p.cumplimiento
            ? (e.cumplimiento_pct == null || e.cumplimiento_pct >= 100) === (p.cumplimiento === "Completo")
            : true) &&
          (p.perfil_id ? e.perfiles.some((x) => x.id === p.perfil_id) : true) &&
          (p.contrato_id === "libre"
            ? !e.contratos?.length
            : p.contrato_id
              ? e.contratos?.some((c) => c.id === p.contrato_id)
              : true) &&
          (coincide(e.nombre, p.search) || coincide(e.curp, p.search) || coincide(e.folio, p.search)),
      );
    return { ...paginar(items, p), editable: empresa === EMPRESA_ACTIVA };
  },
  get_empleado: ({ empleado_id }) => empleadoDetalle(buscar(db.empleados, empleado_id, "Empleado")),
  create_empleado: ({ empleado }) => {
    validarEmpleado(empleado);
    const empresa = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa");
    const nuevo: EmpleadoContratista = {
      perfiles: [],
      disponible_para_contratos: true,
      estatus: "Activo",
      ...empleadoIn(empleado),
      id: nuevoId("empl"),
      folio: folio("E", db.empleados.length + 1),
      empresa: { id: empresa.id, razon_social: empresa.razon_social },
    } as EmpleadoContratista;
    db.empleados.push(nuevo);
    return empleadoOut(nuevo);
  },
  update_empleado: ({ empleado_id, empleado }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    validarEmpleado({ ...e, ...empleado }, empleado_id);
    return empleadoDetalle(Object.assign(e, empleadoIn(empleado)));
  },
  change_status_empleado: ({ empleado_id, estatus }) =>
    empleadoDetalle(Object.assign(buscar(db.empleados, empleado_id, "Empleado"), { estatus })),
  analizar_documentos_empleado: ({ archivos }) => ({
    documentos: (archivos as { name: string; file_url: string }[]).map((a, i) => ({
      archivo: a,
      estado: "ok",
      tipo: ["INE", "CURP", "Constancia de situación fiscal"][i % 3],
      confianza: 95,
      datos: { nombre: "PEDRO PÉREZ DOMÍNGUEZ", curp: "PEDP900202HDFRNR01", ...(i % 3 === 2 ? { rfc: "PEDP900202QW3" } : {}) },
    })),
    sugerido: { nombre: "PEDRO PÉREZ DOMÍNGUEZ", curp: "PEDP900202HDFRNR01", rfc: "PEDP900202QW3" },
    inconsistencias: [],
    alertas: db.empleados.some((e) => e.curp === "PEDP900202HDFRNR01")
      ? ["La CURP ya está registrada en otro empleado."]
      : [],
  }),
  validar_carga_empleados: () => cargaMock(),
  cargar_empleados: () => {
    const v = cargaMock();
    if (v.errores.length) throw new MockError("El archivo tiene errores");
    const creados = v.muestra.map((m, i) => {
      const e = handlers.create_empleado({ empleado: { ...m } }) as EmpleadoContratista;
      return { fila: i + 2, id: e.id, folio: e.folio, nombre: e.nombre };
    });
    return { creados, omitidos: v.omitidos, fallidos: [] };
  },
  vetar_empleado: ({ empleado_id, motivo }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    if (!String(motivo ?? "").trim()) throw new MockError("Escribe el motivo del veto.");
    if (e.vetado) throw new MockError("El empleado ya está vetado.");
    e.vetado = { fecha: hoyISO(), motivo, por: AUTOR };
    e.disponible_para_contratos = false;
    return empleadoDetalle(e);
  },
  levantar_veto_empleado: ({ empleado_id }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    if (!e.vetado) throw new MockError("El empleado no está vetado.");
    delete e.vetado;
    e.disponible_para_contratos = true;
    return empleadoDetalle(e);
  },
  update_preferencias_empleado: ({ empleado_id, preferencias }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    if (preferencias.disponible_para_contratos && e.vetado)
      throw new MockError("Un empleado vetado no puede estar disponible para contratos.");
    if (preferencias.acceso_app && !e.usuario)
      throw new MockError("El acceso a la app móvil requiere que el empleado tenga cuenta.");
    const { disponible_para_contratos, ...resto } = preferencias;
    if (disponible_para_contratos !== undefined) e.disponible_para_contratos = disponible_para_contratos;
    e.preferencias = { ...empleadoDetalle(e).preferencias!, ...resto };
    return empleadoDetalle(e);
  },
  restaurar_password_empleado: ({ empleado_id }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    if (!e.usuario) throw new MockError("El empleado no tiene cuenta.");
    return { enviado: true, email: e.usuario.email };
  },
  get_qr_empleado: ({ empleado_id }) => {
    const e = empleadoDetalle(buscar(db.empleados, empleado_id, "Empleado"));
    return {
      contenido: e.id,
      activo: e.qr_activo,
      ...(e.qr_activo ? {} : { motivo_inactivo: e.vetado ? "Empleado vetado" : "Empleado desactivado" }),
      nombre: e.nombre,
      folio: e.folio,
      imagen: QR_MOCK,
    };
  },
  list_documentos_empleado: ({ empleado_id, ...p }) => documentosEmpleado(empleado_id, p),
  list_contratos_empleado: ({ empleado_id, ...p }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    const filas = recalcular();
    const items = db.contratos
      .filter((c) => c.empleados.some((x) => x.empleado.id === e.id))
      .map((c) => {
        const mios = c.empleados.filter((x) => x.empleado.id === e.id);
        const estados = filas
          .filter((f) => f.contrato === c.id && f.sujeto.empleado?.id === e.id)
          .map((f) => f.estado)
          .filter((s) => s !== "No aplica" && s !== "Por transcurrir");
        return {
          id: c.id, folio: c.folio, objeto: c.objeto, cliente: c.cliente, contratista: c.contratista,
          servicios: c.servicios, perfiles: mios.map((x) => x.perfil),
          fecha_alta: mios.map((x) => x.fecha_alta).sort()[0] ?? "",
          vigencia: { inicio: c.inicio, fin: c.fin }, estatus_contrato: c.estatus,
          estatus: NO_VIGENTE.includes(c.estatus) ? "Inactivo" : "Activo",
          requerimientos: { pendientes: estados.filter((s) => s !== "Cumplido" && s !== "En ceros").length, total: estados.length },
        };
      })
      .filter((i) => (p.estatus ? i.estatus === p.estatus : true) && coincide(`${i.folio} ${i.objeto}`, p.search));
    return paginar(items, p);
  },
  list_contratos_para_ligar: ({ empleado_id, ...p }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    const mios = new Set(e.perfiles.map((x) => x.id));
    const items = db.contratos
      .filter((c) => c.contratista.id === (e.empresa?.id ?? EMPRESA_ACTIVA) && !NO_VIGENTE.includes(c.estatus))
      .filter((c) => !c.empleados.some((x) => x.empleado.id === e.id))
      .map((c) => {
        const perfiles = c.perfiles.map((x) => ({
          ...x.perfil, cantidad: x.cantidad,
          asignados: c.empleados.filter((y) => y.perfil.id === x.perfil.id).length,
          ya_lo_tiene: mios.has(x.perfil.id),
        }));
        return { id: c.id, folio: c.folio, objeto: c.objeto, cliente: c.cliente, vigencia: { inicio: c.inicio, fin: c.fin },
          estatus_contrato: c.estatus, perfiles, coincide: perfiles.filter((x) => x.ya_lo_tiene) };
      })
      .filter((i) => (p.cliente_id ? i.cliente.id === p.cliente_id : true) &&
        (p.perfil_id ? i.perfiles.some((x) => x.id === p.perfil_id) : true) && coincide(`${i.folio} ${i.objeto}`, p.search))
      .sort((a, b) => Number(!a.coincide.length) - Number(!b.coincide.length));
    return { items, total: items.length };
  },
  ligar_contrato_empleado: ({ empleado_id, contrato_id, perfiles }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    if (e.estatus !== "Activo") throw new MockError("El empleado está desactivado.");
    if (e.vetado) throw new MockError("El empleado está vetado: no se puede ligar a contratos.");
    if (!e.disponible_para_contratos) throw new MockError("El empleado no está disponible para contratos.");
    const c = buscar(db.contratos, contrato_id, "Contrato");
    if (c.empleados.some((x) => x.empleado.id === e.id))
      throw new MockError("El empleado ya está ligado a ese contrato; edita sus perfiles.");
    if (!perfiles?.length) throw new MockError("Elige al menos un perfil del contrato.");
    return renglonesEmpleado(e, c, perfiles);
  },
  editar_perfiles_contrato_empleado: ({ empleado_id, contrato_id, perfiles }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    const c = buscar(db.contratos, contrato_id, "Contrato");
    if (!c.empleados.some((x) => x.empleado.id === e.id)) throw new MockError("El empleado no está ligado a ese contrato.");
    if (!perfiles?.length) throw new MockError("Elige al menos un perfil; para quitarlo del contrato usa Remover.");
    return renglonesEmpleado(e, c, perfiles);
  },
  remover_contrato_empleado: ({ empleado_id, contrato_id }) => {
    const e = buscar(db.empleados, empleado_id, "Empleado");
    const c = buscar(db.contratos, contrato_id, "Contrato");
    if (!c.empleados.some((x) => x.empleado.id === e.id)) throw new MockError("El empleado no está ligado a ese contrato.");
    return renglonesEmpleado(e, c, []);
  },

  /* Relaciones */
  list_relaciones: (p) => {
    recalcular();
    const lado = p.direccion === "clientes" ? "contratista" : "cliente";
    const filas = db.relaciones
      .filter((r) => r[lado].id === EMPRESA_ACTIVA && (p.estatus ? r.estatus === p.estatus : true))
      .map((r) => aFila(r, p.direccion))
      .filter((f) => coincide(f.contraparte.razon_social, p.search) || coincide(f.contraparte.rfc, p.search));
    return paginar(filas, p);
  },
  get_relacion: ({ relacion_id }) => {
    recalcular();
    return buscar(db.relaciones, relacion_id, "Relación");
  },
  create_relacion: ({ relacion }) => {
    const propia = empresaRef(EMPRESA_ACTIVA);
    const otra = empresaRef(relacion.contraparte_id);
    const [cliente, contratista] = relacion.direccion === "clientes" ? [otra, propia] : [propia, otra];
    const padre = relacion.relacion_padre ? buscar(db.relaciones, relacion.relacion_padre, "Relación") : null;
    if (padre) validarSubcontratacion(padre, cliente.id, contratista.id);
    const existente = db.relaciones.find(
      (r) => r.cliente.id === cliente.id && r.contratista.id === contratista.id && r.relacion_padre === (padre?.id ?? null),
    );
    if (existente) {
      existente.estatus = "Activo";
      return existente;
    }
    const nueva: Relacion = {
      id: nuevoId("rel"),
      folio: folio("R", db.relaciones.length + 1),
      cliente,
      contratista,
      relacion_padre: padre?.id ?? null,
      nivel: padre ? padre.nivel + 1 : 1,
      // Como el back (MX-05): por defecto los limitantes de empresa.
      requerimientos_asignados: reqsEmpresa()
        .filter((q) => q.limitante)
        .map((q) => ({ id: q.id, nombre: q.nombre })),
      estatus: "Activo",
      fecha_alta: hoyISO(),
      notas: relacion.notas,
      num_contratos: 0,
      cumplimiento_pct: 0,
      ultima_notificacion: null,
    };
    db.relaciones.push(nueva);
    return nueva;
  },
  update_relacion: ({ relacion_id, cambios }) => {
    const r = buscar(db.relaciones, relacion_id, "Relación");
    if (cambios.notas !== undefined) r.notas = cambios.notas;
    if (cambios.requerimientos_asignados) {
      asignar(r, cambios.requerimientos_asignados);
    }
    return r;
  },
  get_asignacion_requerimientos: (p) => {
    const reqs = reqsEmpresa();
    const mias = db.relaciones.filter((r) => r.cliente.id === EMPRESA_ACTIVA);
    const cuenta = (id: string) =>
      mias.filter((r) => r.estatus === "Activo" && r.requerimientos_asignados.some((q) => q.id === id)).length;
    const ids = p.requerimiento_ids?.length ? new Set<string>(p.requerimiento_ids) : null;
    const filas = mias
      .filter((r) => (p.estatus ? r.estatus === p.estatus : true))
      .filter((r) => {
        const e = db.empresas.find((x) => x.id === r.contratista.id);
        const correos = (e?.contactos ?? []).map((c) => c.email ?? "").join(" ");
        return [r.contratista.razon_social, r.contratista.rfc, r.folio, correos].some((t) => coincide(t, p.search));
      })
      .map(filaAsignacion)
      .sort((a, b) => Number(!a.editable) - Number(!b.editable) || a.contratista.razon_social.localeCompare(b.contratista.razon_social));
    return {
      requerimientos: reqs
        .filter((q) => (ids ? ids.has(q.id) : true))
        .map((q) => ({
          id: q.id, nombre: q.nombre, tipo: q.tipo, plataforma: q.plataforma, plataforma_url: q.plataforma_url,
          vigencia_modo: q.vigencia_modo, vigencia: q.vigencia, periodicidad: q.periodicidad, aviso: q.aviso,
          requiere_acuse: q.requiere_acuse, limitante: q.limitante, solicitados: cuenta(q.id),
        })),
      ...paginar(filas, p),
    };
  },
  save_asignacion_requerimientos: ({ asignaciones }) => {
    if (!Array.isArray(asignaciones) || !asignaciones.length) throw new MockError("Sin cambios que guardar");
    const rels = asignaciones.map((x: { relacion_id: string; requerimientos: string[] }) => {
      const r = buscar(db.relaciones, x.relacion_id, "Relación");
      if (r.cliente.id !== EMPRESA_ACTIVA) throw new MockError("Solo el cliente asigna requerimientos al contratista.");
      if (r.estatus !== "Activo") throw new MockError(`La relación ${r.folio} está inactiva.`);
      return [r, x.requerimientos] as const;
    });
    rels.forEach(([r, ids]) => asignar(r, ids));
    return { guardadas: rels.length, items: rels.map(([r]) => filaAsignacion(r)) };
  },
  change_status_relacion: ({ relacion_id, estatus }) => {
    const r = buscar(db.relaciones, relacion_id, "Relación");
    const activos = db.contratos.some(
      (c) => c.relacion === r.id && !["Pausado", "Cancelado", "Vencido"].includes(c.estatus),
    );
    if (estatus === "Inactivo" && db.relaciones.some((h) => h.relacion_padre === r.id && h.estatus === "Activo")) {
      throw new MockError("Desactiva primero las subcontrataciones de esta relación.");
    }
    if (estatus === "Activo" && r.relacion_padre) {
      validarSubcontratacion(buscar(db.relaciones, r.relacion_padre, "Relación"), r.cliente.id, r.contratista.id);
    }
    if (estatus === "Inactivo" && activos) {
      throw new MockError("Pausa o cancela los contratos activos antes de desactivar la relación");
    }
    r.estatus = estatus;
    return r;
  },
  get_arbol_relacion: ({ relacion_id }) => {
    const out: Relacion[] = [];
    const bajar = (id: string) =>
      db.relaciones.filter((r) => r.relacion_padre === id).forEach((r) => {
        out.push(r);
        bajar(r.id);
      });
    bajar(relacion_id);
    return out;
  },

  /* Contratos */
  list_contratos: (p) => {
    recalcular();
    return paginar(
      db.contratos.filter(
        (c) =>
          (c.cliente.id === EMPRESA_ACTIVA || c.contratista.id === EMPRESA_ACTIVA) &&
          (p.relacion_id ? c.relacion === p.relacion_id : true) &&
          (p.estatus?.length ? p.estatus.includes(c.estatus) : true) &&
          (p.fin_desde ? c.fin >= p.fin_desde : true) &&
          (p.fin_hasta ? c.fin <= p.fin_hasta : true) &&
          (coincide(c.objeto, p.search) || coincide(c.folio, p.search) || coincide(c.contratista.razon_social, p.search)),
      ),
      p,
    );
  },
  get_contrato: ({ contrato_id }) => {
    recalcular();
    return buscar(db.contratos, contrato_id, "Contrato");
  },
  create_contrato: ({ contrato }) => {
    const rel = buscar(db.relaciones, contrato.relacion, "Relación");
    if (contrato.fin < contrato.inicio) throw new MockError("La fecha de fin es anterior al inicio");
    const nuevo: Contrato = {
      ...contrato,
      id: nuevoId("cto"),
      folio: folio("C", db.contratos.length + 1),
      cliente: rel.cliente,
      contratista: rel.contratista,
      estatus: "En documentación",
      cumplimiento: { total: 0, contrato: 0, empleados: 0, periodicos: 0 },
    };
    db.contratos.push(nuevo);
    registrarEvento(nuevo.id, "Creación", "Contrato creado");
    recalcular();
    return nuevo;
  },
  update_contrato: ({ contrato_id, contrato }) => {
    const c = buscar(db.contratos, contrato_id, "Contrato");
    if (contrato.monto !== undefined && contrato.monto !== c.monto) {
      registrarEvento(c.id, "Monto", `Monto: ${c.monto ?? 0} → ${contrato.monto}`);
    }
    if (contrato.fin && contrato.fin !== c.fin) registrarEvento(c.id, "Vigencia", `Fin: ${c.fin} → ${contrato.fin}`);
    Object.assign(c, contrato);
    recalcular();
    return c;
  },
  change_status_contrato: ({ contrato_id, estatus_manual, motivo }) => {
    const c = buscar(db.contratos, contrato_id, "Contrato");
    if (!motivo) throw new MockError("El motivo es obligatorio");
    if (estatus_manual) {
      c.estatus = estatus_manual;
      registrarEvento(c.id, estatus_manual === "Pausado" ? "Pausa" : "Cancelación", motivo);
    } else {
      c.estatus = "Activo";
      registrarEvento(c.id, "Reanudación", motivo);
    }
    c.motivo_estatus = motivo;
    recalcular();
    return c;
  },
  get_historial_contrato: ({ contrato_id }) =>
    db.historial.filter((h) => h.contrato === contrato_id).sort((a, b) => b.fecha.localeCompare(a.fecha)),

  /* Configuración */
  list_recursos: (p) =>
    paginar(db.recursos.filter((r) => r.tipo === p.tipo && coincide(r.nombre, p.search)), p),
  save_recurso: ({ recurso, recurso_id }) => {
    const requerimientos = recurso.requerimientos.map((id: string) => {
      const r = buscar(db.requerimientos, id, "Requerimiento");
      const permitido = recurso.tipo === "Servicio" || (recurso.tipo === "Perfil" ? r.ambito === "Persona" : r.ambito === "Equipo");
      if (!permitido) throw new MockError(`${r.nombre} no aplica a un ${recurso.tipo}`);
      return { id: r.id, nombre: r.nombre };
    });
    if (recurso_id) return Object.assign(buscar(db.recursos, recurso_id, "Recurso"), recurso, { requerimientos });
    const nuevo = { ...recurso, requerimientos, id: nuevoId("rec") };
    db.recursos.push(nuevo);
    return nuevo;
  },
  get_recurso: ({ recurso_id }) => buscar(db.recursos, recurso_id, "Recurso"),
  get_aplicacion_recurso: ({ recurso_id }) => {
    const rec = buscar(db.recursos, recurso_id, "Recurso");
    return {
      requerimientos: rec.requerimientos
        .map((r) => db.requerimientos.find((q) => q.id === r.id))
        .filter((q): q is Requerimiento => Boolean(q)),
      contratos: db.contratos
        .filter((c) => [...c.servicios.map((x) => x.id), ...c.perfiles.map((x) => x.perfil.id), ...c.equipos.map((x) => x.equipo.id)].includes(rec.id))
        .map((c) => ({ id: c.id, folio: c.folio, objeto: c.objeto, contratista: c.contratista.razon_social, cumplimiento_pct: c.cumplimiento.total })),
    };
  },
  get_aplicacion_requerimiento: ({ requerimiento_id }) => {
    const filas = recalcular().filter((f) => f.requerimiento.id === requerimiento_id);
    const recursos = db.recursos.filter((r) => r.requerimientos.some((q) => q.id === requerimiento_id));
    return {
      exigencia: recursos.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo })),
      relaciones: db.relaciones
        .filter((r) => r.requerimientos_asignados.some((q) => q.id === requerimiento_id))
        .map((r) => ({ id: r.id, folio: r.folio, contratista: r.contratista.razon_social })),
      contratos: db.contratos
        .filter((c) => filas.some((f) => f.contrato === c.id))
        .map((c) => ({ id: c.id, folio: c.folio, contratista: c.contratista.razon_social })),
      sujetos: filas.map((f) => ({
        tipo: f.sujeto.tipo,
        sujeto: f.sujeto.empleado ?? f.sujeto.equipo ?? f.sujeto.empresa,
        empresa: f.sujeto.empresa,
        contrato: f.contrato,
        periodo: f.periodo.clave,
        estado: f.estado,
      })),
    };
  },
  list_requerimientos: (p) =>
    paginar(
      db.requerimientos.filter(
        (r) => (p.tipo ? r.tipo === p.tipo : true) && (p.ambito ? r.ambito === p.ambito : true) && coincide(r.nombre, p.search),
      ),
      p,
    ),
  get_requerimiento: ({ requerimiento_id }) => buscar(db.requerimientos, requerimiento_id, "Requerimiento"),
  save_requerimiento: ({ requerimiento, requerimiento_id }) => {
    if (requerimiento_id) return Object.assign(buscar(db.requerimientos, requerimiento_id, "Requerimiento"), requerimiento);
    const nuevo = { ...requerimiento, id: nuevoId("req") };
    db.requerimientos.push(nuevo);
    return nuevo;
  },
  list_sesiones: (p) => {
    const todas = db.sesiones.map(sesionOut).filter(
      (s) => (p.desde ? (s.recurrencia?.repetir_hasta ?? s.fecha_fin) >= p.desde : true) &&
        (p.hasta ? s.fecha_inicio <= p.hasta : true) && coincide(s.nombre, p.search),
    );
    const conteo = { tipo: {} as Record<string, number>, modalidad: {} as Record<string, number>, estatus: {} as Record<string, number> };
    todas.forEach((s) => (["tipo", "modalidad", "estatus"] as const).forEach((k) => (conteo[k][s[k]] = (conteo[k][s[k]] ?? 0) + 1)));
    const orden = ["En curso", "Programada", "Finalizada", "Cancelada"];
    const items = todas
      .filter((s) => (["tipo", "modalidad", "estatus"] as const).every((k) => !p[k] || [p[k]].flat().includes(s[k])))
      .sort((a, b) => orden.indexOf(a.estatus) - orden.indexOf(b.estatus));
    return { ...paginar(items, p), conteo };
  },
  get_sesion: ({ sesion_id }) => sesionOut(buscar(db.sesiones, sesion_id, "Sesión")),
  save_sesion: ({ sesion, sesion_id }) => {
    const errores: string[] = [];
    if (!String(sesion.nombre ?? "").trim()) errores.push("El nombre es obligatorio.");
    if (!["Curso", "Capacitación", "Plática", "Inducción"].includes(sesion.tipo)) errores.push("Tipo no válido.");
    if (!sesion.lugar && !sesion.enlace) errores.push("Indica el lugar, el enlace de la reunión o ambos.");
    if (sesion.tipo === "Curso" && !sesion.temario?.length) errores.push("Un curso necesita al menos una sección con una lección.");
    if (errores.length) throw new MockError(errores.join("\n"));
    const refs = (xs: any[] = []) => xs.map((x) => (typeof x === "string" ? { id: x, nombre: db.requerimientos.find((r) => r.id === x)?.nombre ?? x } : x));
    const datos = { ...sesion, examenes: refs(sesion.examenes), otorgados: refs(sesion.otorgados), recursos: sesion.recursos ?? [] };
    if (sesion_id) {
      const s = buscar(db.sesiones, sesion_id, "Sesión");
      if (s.estatus === "Cancelada") throw new MockError("Una sesión cancelada no se edita.");
      return sesionOut(Object.assign(s, datos));
    }
    const nueva: Sesion = { ...datos, id: nuevoId("ses"), modalidad: "Presencial", participantes: [], estatus: "Programada" };
    db.sesiones.push(nueva);
    return sesionOut(nueva);
  },
  cancel_sesion: ({ sesion_id, motivo }) => {
    const s = sesionOut(buscar(db.sesiones, sesion_id, "Sesión"));
    if (s.estatus !== "Programada") throw new MockError(`Solo se cancela una sesión Programada (esta está ${s.estatus}).`);
    if (!String(motivo ?? "").trim()) throw new MockError("El motivo de cancelación es obligatorio.");
    return sesionOut(Object.assign(buscar(db.sesiones, sesion_id, "Sesión"), { estatus: "Cancelada", motivo_cancelacion: motivo }));
  },
  get_participantes: ({ sesion_id }) => participantesOut(buscar(db.sesiones, sesion_id, "Sesión")),
  inscribir_participantes: ({ sesion_id, empleado_ids }) => {
    const s = buscar(db.sesiones, sesion_id, "Sesión");
    const est = sesionOut(s).estatus;
    if (est !== "Programada" && est !== "En curso") throw new MockError(`Solo se inscribe en una sesión Programada o En curso (esta está ${est}).`);
    const nuevos = [...new Set<string>(empleado_ids ?? [])].filter((id) => !s.participantes.some((p) => p.empleado.id === id));
    if (!nuevos.length) throw new MockError("Elige al menos un empleado que no esté inscrito.");
    if (s.cupo && s.participantes.length + nuevos.length > s.cupo)
      throw new MockError(`Se alcanzó el cupo de la sesión: quedan ${Math.max(s.cupo - s.participantes.length, 0)} lugares.`);
    nuevos.forEach((id) => {
      const e = buscar(db.empleados, id, "Empleado");
      if (e.estatus !== "Activo" || e.vetado) throw new MockError(`${e.nombre} está desactivado o vetado.`);
      s.participantes.push({ empleado: { id: e.id, nombre: e.nombre }, asistencia: {} });
    });
    return guardarParticipantes(s);
  },
  quitar_participante: ({ sesion_id, empleado_id }) => {
    const s = buscar(db.sesiones, sesion_id, "Sesión");
    if (sesionOut(s).estatus !== "Programada") throw new MockError("Solo se quita a un participante de una sesión Programada.");
    if (!s.participantes.some((p) => p.empleado.id === empleado_id)) throw new MockError("El empleado no está inscrito.");
    s.participantes = s.participantes.filter((p) => p.empleado.id !== empleado_id);
    return guardarParticipantes(s);
  },
  registrar_asistencia: ({ sesion_id, asistencias }) => {
    const s = buscar(db.sesiones, sesion_id, "Sesión");
    const est = sesionOut(s).estatus;
    if (est !== "En curso" && est !== "Finalizada") throw new MockError(`La asistencia se registra en una sesión En curso o Finalizada (esta está ${est}).`);
    const dias = diasSesion(s);
    (asistencias ?? []).forEach((x: any) => {
      const p = s.participantes.find((y) => y.empleado.id === x.empleado_id);
      if (!p) throw new MockError(`El empleado ${x.empleado_id} no está inscrito.`);
      if (!dias.includes(x.fecha)) throw new MockError(`${x.fecha} no es un día transcurrido de la sesión.`);
      if (x.estado) p.asistencia[x.fecha] = x.estado;
      else delete p.asistencia[x.fecha];
    });
    return guardarParticipantes(s);
  },
  calificar_participante: ({ sesion_id, empleado_id, calificaciones }) => {
    const s = buscar(db.sesiones, sesion_id, "Sesión");
    if (!s.examenes.length) throw new MockError("La sesión no tiene exámenes.");
    const p = s.participantes.find((y) => y.empleado.id === empleado_id);
    if (!p) throw new MockError("El empleado no está inscrito.");
    if (!Object.values(p.asistencia).includes("Asistió")) throw new MockError("Registra primero su asistencia: solo se califica a quien asistió.");
    const cal = { ...(p.calificaciones ?? {}) };
    Object.entries(calificaciones ?? {}).forEach(([k, v]: [string, any]) => {
      if (!s.examenes.some((x) => x.id === k)) throw new MockError(`El examen ${k} no es de esta sesión.`);
      if (v === null || v === "") delete cal[k];
      else if (Number(v) < 0 || Number(v) > 100) throw new MockError("La calificación va de 0 a 100.");
      else cal[k] = Number(v);
    });
    p.calificaciones = cal;
    p.calificacion = Object.values(cal).length ? Math.min(...Object.values(cal)) : undefined;
    return guardarParticipantes(s);
  },

  /* Documentos */
  list_documentos: (p) =>
    paginar(
      db.documentos.map(docOut).filter(
        (d) =>
          (p.dueno_tipo ? d.dueno.tipo === p.dueno_tipo : true) &&
          (p.empresa_id ? d.dueno.empresa.id === p.empresa_id : true) &&
          (p.empleado_id ? d.dueno.empleado?.id === p.empleado_id : true) &&
          (p.contrato_id ? d.contratos.some((c) => c.id === p.contrato_id) : true) &&
          (p.requerimiento_id ? d.requerimiento?.id === p.requerimiento_id : true) &&
          (p.estatus?.length ? p.estatus.includes(d.estatus) : true) &&
          coincide(d.nombre, p.search),
      ),
      p,
    ),
  get_documento: ({ documento_id }) => docOut(buscar(db.documentos, documento_id, "Documento")),
  upload_documento: ({ documento }) => {
    const version = (numero: number) => ({
      numero,
      archivo: documento.archivo,
      estatus: "Por revisar" as const,
      subido_por: AUTOR,
      fecha: ahora(),
    });
    if (documento.reemplaza_id) {
      const d = buscar(db.documentos, documento.reemplaza_id, "Documento");
      d.versiones.push(version(d.versiones.length + 1));
      d.archivo = documento.archivo;
      d.aprobaciones.forEach((a) => Object.assign(a, { decision: "Pendiente", revisor: undefined, fecha: undefined, motivo: undefined }));
      d.estatus = estatusDocumento(d);
      return docOut(d);
    }
    const empresa = buscar(db.empresas, documento.dueno.empresa_id, "Empresa");
    const empleado = documento.dueno.empleado_id ? buscar(db.empleados, documento.dueno.empleado_id, "Empleado") : undefined;
    const req = documento.requerimiento_id ? buscar(db.requerimientos, documento.requerimiento_id, "Requerimiento") : null;
    const compartido = (documento.compartido_con ?? []).map((id: string) => {
      const e = buscar(db.empresas, id, "Empresa");
      return { id: e.id, nombre: e.razon_social };
    });
    const nuevo: DocumentoBase = {
      id: nuevoId("doc"),
      folio: folio("D", db.documentos.length + 1),
      nombre: documento.nombre,
      categoria: documento.categoria,
      requerimiento: req ? { id: req.id, nombre: req.nombre } : null,
      dueno: {
        tipo: documento.dueno.tipo,
        empresa: { id: empresa.id, nombre: empresa.razon_social },
        empleado: empleado ? { id: empleado.id, nombre: empleado.nombre } : undefined,
      },
      periodo: documento.periodo,
      en_ceros: Boolean(documento.en_ceros),
      vigencia_inicio: documento.vigencia_inicio,
      vigencia_fin: documento.vigencia_fin,
      archivo: documento.archivo,
      estatus: "Por revisar",
      compartido_con: compartido,
      contratos: (documento.contratos ?? []).map((id: string) => {
        const c = buscar(db.contratos, id, "Contrato");
        return { id: c.id, nombre: c.folio };
      }),
      origen: "Carga",
      versiones: [version(1)],
      comentarios: [],
      aprobaciones: compartido.map((cliente: { id: string; nombre: string }) => ({ cliente, decision: "Pendiente" as const })),
    };
    db.documentos.push(nuevo);
    return docOut(nuevo);
  },
  review_documento: ({ documento_id, decision, motivo }) => {
    const d = buscar(db.documentos, documento_id, "Documento");
    if (decision === "Rechazado" && !motivo) throw new MockError("El motivo es obligatorio al rechazar");
    let apr = d.aprobaciones.find((a) => a.cliente.id === EMPRESA_ACTIVA);
    if (!apr) {
      apr = { cliente: { id: EMPRESA_ACTIVA, nombre: buscar(db.empresas, EMPRESA_ACTIVA, "Empresa").razon_social }, decision: "Pendiente" };
      d.aprobaciones.push(apr);
    }
    Object.assign(apr, { decision, motivo, revisor: AUTOR, fecha: ahora() });
    d.estatus = estatusDocumento(d);
    const actual = d.versiones[d.versiones.length - 1];
    if (actual) Object.assign(actual, { estatus: d.estatus, motivo_rechazo: decision === "Rechazado" ? motivo : undefined });
    return docOut(d);
  },
  update_compartido_documento: ({ documento_id, compartido_con }) => {
    const d = buscar(db.documentos, documento_id, "Documento");
    if (d.dueno.empresa.id !== EMPRESA_ACTIVA) throw new MockError("Solo el dueño del documento puede cambiar con quién se comparte");
    const activos = new Set(
      db.relaciones.filter((r) => r.contratista.id === EMPRESA_ACTIVA && r.estatus === "Activo").map((r) => r.cliente.id),
    );
    const ids: string[] = Array.from(new Set(compartido_con as string[]));
    if (ids.some((id) => !activos.has(id) && !d.compartido_con.some((c) => c.id === id))) {
      throw new MockError("Solo puedes compartir con tus clientes activos");
    }
    d.compartido_con = ids.map((id) => {
      const e = buscar(db.empresas, id, "Empresa");
      return { id: e.id, nombre: e.razon_social };
    });
    d.aprobaciones = d.compartido_con.map(
      (cliente) => d.aprobaciones.find((a) => a.cliente.id === cliente.id) ?? { cliente, decision: "Pendiente" as const },
    );
    d.estatus = estatusDocumento(d);
    const actual = d.versiones[d.versiones.length - 1];
    if (actual) actual.estatus = d.estatus;
    return docOut(d);
  },
  delete_documento: ({ documento_id }) => {
    const d = buscar(db.documentos, documento_id, "Documento");
    if (d.dueno.empresa.id !== EMPRESA_ACTIVA) throw new MockError("Solo el dueño del documento puede eliminarlo.");
    if (d.aprobaciones.some((a) => a.decision === "Aprobado")) {
      throw new MockError("Un cliente ya aprobó este documento: solo se puede reemplazar.");
    }
    db.documentos = db.documentos.filter((x) => x.id !== d.id);
    return { eliminado: d.id, folio: d.folio };
  },
  comment_documento: ({ documento_id, texto }) => {
    const d = buscar(db.documentos, documento_id, "Documento");
    d.comentarios.push({ autor: AUTOR, fecha: ahora(), texto });
    return docOut(d);
  },

  /* Cumplimiento */
  get_cumplimiento_documental: ({ anio }) => matrizDocumental(Number(anio) || new Date().getFullYear()),
  get_periodo_cumplimiento: ({ requerimiento_id, periodo_clave }) => {
    const { q, p } = reqPeriodo(requerimiento_id, periodo_clave);
    const m = matrizDocumental(p.clave === "unico" ? new Date().getFullYear() : Number(p.clave.slice(0, 4)));
    let estado: EstadoDocumental | null = null;
    let documento: Documento | null = null;
    m.pestanas.forEach((t) => t.filas.forEach((f) => {
      if (f.requerimiento.id !== q.id) return;
      if ("celdas" in f) {
        const c = f.celdas.find((x) => x.clave === p.clave);
        estado = c?.estado ?? null;
        const d = c?.documento ? db.documentos.find((x) => x.id === c.documento!.id) : undefined;
        documento = d ? docOut(d) : null;
      } else {
        estado = f.estado;
        documento = f.documento;
      }
    }));
    return { requerimiento: q, periodo: p, estado, documento };
  },
  subir_acuse: ({ acuse }) => {
    const { q, p } = reqPeriodo(acuse.requerimiento_id, acuse.periodo_clave);
    if (!acuse.fecha) throw new MockError("La fecha (emisión o presentación) es obligatoria, YYYY-MM-DD.");
    if (acuse.en_ceros && q.periodicidad !== "Cuatrimestral") {
      throw new MockError("La declaración en ceros solo aplica a obligaciones cuatrimestrales.");
    }
    const previo = contextoDocumental().docs.get(`${q.id}|${p.clave}`);
    const periodo = p.clave === "unico" ? undefined : { clave: p.clave, inicio: p.inicio, fin: p.fin };
    const base = { archivo: acuse.archivo, vigencia_inicio: acuse.fecha, en_ceros: Boolean(acuse.en_ceros), periodo };
    if (previo) {
      const doc = handlers.upload_documento({ documento: { ...base, reemplaza_id: previo.id } }) as Documento;
      Object.assign(buscar(db.documentos, previo.id, "Documento"), { en_ceros: base.en_ceros, vigencia_inicio: acuse.fecha, periodo });
      return { documento: { ...doc, en_ceros: base.en_ceros }, reemplazado: true };
    }
    const clientes = db.relaciones
      .filter((r) => r.contratista.id === EMPRESA_ACTIVA && r.estatus === "Activo")
      .map((r) => r.cliente.id);
    const doc = handlers.upload_documento({
      documento: {
        ...base,
        nombre: periodo ? `${q.nombre} ${p.clave}` : q.nombre,
        categoria: q.requiere_acuse ? "Acuse" : undefined,
        requerimiento_id: q.id,
        dueno: { tipo: "Empresa", empresa_id: EMPRESA_ACTIVA },
        compartido_con: acuse.compartido_con ?? clientes,
      },
    }) as Documento;
    Object.assign(buscar(db.documentos, doc.id, "Documento"), { en_ceros: base.en_ceros, periodo });
    return { documento: { ...doc, en_ceros: base.en_ceros, periodo }, reemplazado: false };
  },
  generar_cumplimiento: ({ requerimiento_id, periodo_clave }) => {
    const { q, p } = reqPeriodo(requerimiento_id, periodo_clave);
    if (p.clave === "unico") throw new MockError("Generar cumplimiento es por periodo.");
    const d = contextoDocumental().docs.get(`${q.id}|${p.clave}`);
    const contratos = d?.en_ceros ? [] : db.contratos.filter((c) => {
      const rel = db.relaciones.find((r) => r.id === c.relacion);
      return rel?.contratista.id === EMPRESA_ACTIVA && c.estatus !== "Cancelado" && c.inicio <= p.fin && (!c.fin || c.fin >= p.inicio);
    });
    const tag = q.nombre.normalize("NFKD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
    return {
      archivo: { name: `${tag}_XAXX010101000_${p.clave}.zip`, file_url: "https://example.com/mock/cumplimiento.zip" },
      en_ceros: Boolean(d?.en_ceros),
      contratos: contratos.length,
      trabajadores: contratos.reduce((n, c) => n + c.empleados.length, 0),
      plataforma: q.plataforma,
      plataforma_url: q.plataforma_url,
    };
  },
  descargar_cumplimiento: ({ anio, pestanas }) => {
    const m = matrizDocumental(Number(anio) || new Date().getFullYear());
    const tabs = m.pestanas.filter((t) => !pestanas?.length || pestanas.includes(t.pestana));
    const documentos = tabs.reduce(
      (n, t) => n + t.filas.reduce((k, f) => k + ("celdas" in f ? f.celdas.filter((c) => c.documento).length : f.documento ? 1 : 0), 0),
      0,
    );
    return { archivo: { name: `cumplimiento_XAXX010101000_${m.anio}.zip`, file_url: "https://example.com/mock/cumplimiento.zip" }, documentos, omitidos: [] };
  },
  get_resumen_cumplimiento: ({ limit }) => {
    const m = matrizDocumental(new Date().getFullYear());
    const empresa: (EstadoDocumental | null)[] = [];
    const acuses: (EstadoDocumental | null)[] = [];
    const pendientes: ResumenCumplimiento["pendientes"] = [];
    m.pestanas.forEach((t) => t.filas.forEach((f) => {
      const r = f.requerimiento;
      const destino = r.requiere_acuse ? acuses : empresa;
      const ref = { id: r.id, nombre: r.nombre };
      if ("celdas" in f) {
        f.celdas.forEach((c) => {
          destino.push(c.estado);
          if (c.estado && PENDIENTES_DOC.includes(c.estado)) {
            pendientes.push({ requerimiento: ref, requiere_acuse: r.requiere_acuse, periodo: c.clave, vence: c.vence, estado: c.estado });
          }
        });
      } else {
        destino.push(f.estado === "Por subir" ? "No entregado" : f.estado);
        if (PENDIENTES_DOC.includes(f.estado)) {
          pendientes.push({ requerimiento: ref, requiere_acuse: r.requiere_acuse, periodo: null, vence: f.documento?.vigencia_fin ?? null, estado: f.estado });
        }
      }
    }));
    const orden: Record<string, number> = { "No entregado": 0, Rechazado: 1, Vencido: 2, "Por subir": 3 };
    pendientes.sort((a, b) => (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9) || (a.vence ?? "9999").localeCompare(b.vence ?? "9999"));
    const personas = recalcular().filter((f) => f.sujeto.tipo === "Persona" && f.sujeto.empresa.id === EMPRESA_ACTIVA);
    return {
      anio: m.anio,
      empresa_pct: pctDoc(empresa),
      empleados_pct: porcentajeCumplimiento(personas.map((f) => f.estado)),
      acuses_pct: pctDoc(acuses),
      pendientes: pendientes.slice(0, Number(limit) || 50),
      total_pendientes: pendientes.length,
    };
  },
  /* Activos (ME-08) */
  get_opciones_activo: () => ({
    ubicaciones: [{ ubicacion: "Planta Monterrey", areas: ["Almacén", "Patio de maniobras", "Taller"] }],
    vehiculos: [
      { tipo: "Pick up", marcas: [{ marca: "Nissan", modelos: ["NP300", "Frontier"] }, { marca: "Toyota", modelos: ["Hilux"] }] },
      { tipo: "Montacargas", marcas: [{ marca: "Yale", modelos: ["GLP050"] }] },
    ],
    clases: ["Vehículo", "Equipo", "Herramienta"],
    inventarios: ["Único", "Stock"],
    prioridades: ["Alta", "Media", "Baja"],
  }),
  list_activos: (p) =>
    paginar(
      db.activos
        .filter((a) => !a.empresa || a.empresa.id === EMPRESA_ACTIVA)
        .map((a) => ({ ...a, mantenimientos_abiertos: abiertos(a.id) }))
        .filter(
          (a) =>
            (p.clase ? a.clase === p.clase : true) &&
            (p.disponible !== undefined && p.disponible !== "" ? a.disponible === (p.disponible === true || p.disponible === "true") : true) &&
            (p.estado ? a.estado === p.estado : true) &&
            (p.inventario ? a.inventario === p.inventario : true) &&
            (p.ubicacion ? a.ubicacion === p.ubicacion : true) &&
            (p.mantenimiento_desde ? (a.ultimo_mantenimiento ?? "") >= p.mantenimiento_desde : true) &&
            (p.mantenimiento_hasta ? !!a.ultimo_mantenimiento && a.ultimo_mantenimiento <= p.mantenimiento_hasta : true) &&
            [a.nombre, a.folio, a.marca ?? "", a.modelo ?? "", a.asignado?.nombre ?? ""].some((t) => coincide(t, p.search)),
        ),
      p,
    ),
  get_activo: ({ activo_id }) => ({ ...activoMio(activo_id), mantenimientos_abiertos: abiertos(activo_id) }),
  create_activo: ({ activo }) => {
    const a: Activo = {
      id: nuevoId("act"), folio: folio("A", db.activos.length + 1), nombre: "", clase: activo.clase ?? "Equipo",
      foto: null, marca: null, modelo: null, estado: "Activo", disponible: true, inventario: "Único", cantidad: null,
      ubicacion: null, area: null, asignado: null, adquisicion: null, costo: null, ultimo_mantenimiento: null,
      empresa: { id: EMPRESA_ACTIVA, nombre: buscar(db.empresas, EMPRESA_ACTIVA, "Empresa").razon_social },
    };
    if (!["Vehículo", "Equipo", "Herramienta"].includes(a.clase)) throw new MockError("Tipo de activo: Vehículo, Equipo o Herramienta.");
    aplicarActivo(a, activo, true);
    db.activos.push(a);
    return { ...a, mantenimientos_abiertos: 0 };
  },
  update_activo: ({ activo_id, cambios }) => {
    const a = activoMio(activo_id);
    const copia = JSON.parse(JSON.stringify(a)) as Activo;
    aplicarActivo(copia, cambios, false);
    if (!copia.asignado && copia.estado !== "Inactivo") throw new MockError("Selecciona a quién se asigna.");
    Object.assign(a, copia);
    return { ...a, mantenimientos_abiertos: abiertos(a.id) };
  },
  change_estado_activo: ({ activo_id, estado }) => {
    const a = activoMio(activo_id);
    a.estado = estado;
    a.disponible = estado === "Activo";
    return { ...a, mantenimientos_abiertos: abiertos(a.id) };
  },
  delete_activo: ({ activo_id }) => {
    const a = activoMio(activo_id);
    if (abiertos(a.id)) throw new MockError("El activo tiene mantenimientos abiertos.");
    db.activos = db.activos.filter((x) => x.id !== a.id);
    return { eliminado: a.id, folio: a.folio };
  },
  list_concesiones_activo: ({ activo_id }) =>
    activo_id === "act-2"
      ? [{ id: "cons-1", folio: "C-120", persona: "José Ramírez Cantú", estatus: "En préstamo", piezas: 1, fecha: "2026-11-18", devolucion: null }]
      : (activoMio(activo_id), []),
  analizar_foto_activo: ({ archivo }) => {
    if (!/\.(jpe?g|png)$/i.test(archivo?.name ?? archivo?.file_url ?? "")) throw new MockError("La foto debe ser JPG o PNG.");
    return {
      legible: true, identificado: "Taladro percutor", modelo_detectado: false,
      campos: { nombre: { valor: "Taladro percutor", confianza: 92 }, clase: { valor: "Herramienta", confianza: 95 }, marca: { valor: "Bosch", confianza: 80 } },
    };
  },
  list_mantenimientos: ({ activo_id }) => (activoMio(activo_id), db.mantenimientos.filter((m) => m.activo.id === activo_id)),
  save_mantenimiento: ({ mantenimiento, mantenimiento_id }) => {
    const d = mantenimiento ?? {};
    if (mantenimiento_id) {
      const m = buscar(db.mantenimientos, mantenimiento_id, "Mantenimiento");
      if (m.estatus === "Cerrada") throw new MockError("Un mantenimiento cerrado no se edita.");
      if ("asignado_id" in d) m.asignado = empleadoRef(d.asignado_id);
      if (d.prioridad) m.prioridad = d.prioridad;
      if (d.fecha_limite) m.fecha_limite = d.fecha_limite;
      if ("descripcion" in d) m.descripcion = d.descripcion ?? "";
      return m;
    }
    const a = activoMio(d.activo_id);
    if (a.estado === "Inactivo") throw new MockError("Un activo inactivo no se puede asignar.");
    if (!d.asignado_id) throw new MockError("Selecciona a quién se asigna el mantenimiento.");
    if (!["Alta", "Media", "Baja"].includes(d.prioridad)) throw new MockError("Prioridad: Alta, Media o Baja.");
    if (!d.fecha_limite) throw new MockError("La fecha límite es obligatoria (YYYY-MM-DD).");
    const m: Mantenimiento = {
      id: nuevoId("mant"), folio: folio("M", db.mantenimientos.length + 1), activo: { id: a.id, nombre: a.nombre },
      asignado: empleadoRef(d.asignado_id), prioridad: d.prioridad, fecha_limite: d.fecha_limite,
      descripcion: d.descripcion ?? "", estatus: "Abierta", fecha_cierre: null,
      historial: [{ estatus: "Abierta", comentario: d.comentario ?? "", evidencias: d.evidencias ?? [], autor: AUTOR, fecha: ahora() }],
    };
    db.mantenimientos.push(m);
    return m;
  },
  change_status_mantenimiento: ({ mantenimiento_id, estatus, comentario, evidencias }) => {
    if (!["Abierta", "En proceso", "Cerrada"].includes(estatus)) throw new MockError("Estatus: Abierta, En proceso o Cerrada.");
    const m = buscar(db.mantenimientos, mantenimiento_id, "Mantenimiento");
    m.estatus = estatus;
    m.historial.push({ estatus, comentario: comentario ?? "", evidencias: evidencias ?? [], autor: AUTOR, fecha: ahora() });
    m.fecha_cierre = estatus === "Cerrada" ? ahora() : null;
    if (estatus === "Cerrada") {
      const a = db.activos.find((x) => x.id === m.activo.id);
      if (a) a.ultimo_mantenimiento = hoyISO();
    }
    return m;
  },
  delete_mantenimiento: ({ mantenimiento_id }) => {
    buscar(db.mantenimientos, mantenimiento_id, "Mantenimiento");
    db.mantenimientos = db.mantenimientos.filter((m) => m.id !== mantenimiento_id);
    return { eliminado: mantenimiento_id };
  },

  /* Notificar incumplimientos (MX-03) */
  get_incumplimientos: ({ relacion_ids, requerimiento_id }) => {
    const anio = new Date().getFullYear();
    const cliente = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa").razon_social;
    const items = (relacion_ids as string[]).map((id) => {
      const r = relacionDelCliente(id);
      const inc = incumplimientosDe(r.id, requerimiento_id);
      const dest = destinatarioDe(r.contratista.id);
      const lista = inc.map((g) => `- ${g.requerimiento.nombre}: ${g.periodos.map((p) => `${p.clave === "unico" ? "vigente" : p.clave}${p.sujeto ? ` (${p.sujeto})` : ""}: ${p.estado}`).join(", ")}`);
      return {
        relacion_id: r.id, folio: r.folio, contratista: r.contratista, estatus: r.estatus, destinatario: dest,
        incumplimientos: inc, total: inc.reduce((n, g) => n + g.periodos.length, 0),
        mensaje_sugerido: inc.length
          ? [dest ? `Hola ${dest.nombre},` : "Hola,", "", `${cliente} te avisa que estas obligaciones no se cumplieron en ${anio}:`, "", ...lista, "", "Sube o corrige los documentos en tu portal de Clave 10 para regularizarte."].join("\n")
          : "",
        ultima_notificacion: r.ultima_notificacion,
      };
    });
    const con = items.filter((x) => x.total);
    return {
      items,
      con_incumplimientos: con.length,
      mensaje_sugerido: con.length === 1 ? con[0].mensaje_sugerido
        : `${cliente} te avisa que tienes obligaciones de cumplimiento pendientes en ${anio}. Revisa el detalle en tu portal de Clave 10 y sube o corrige los documentos para regularizarte.`,
    };
  },
  notificar_incumplimientos: ({ relacion_ids, motivo, requerimiento_id }) => {
    if (!String(motivo ?? "").trim()) throw new MockError("Escribe el motivo.");
    const rels = (relacion_ids as string[]).map(relacionDelCliente);
    const inactiva = rels.find((r) => r.estatus !== "Activo");
    if (inactiva) throw new MockError(`La relación ${inactiva.folio} está inactiva.`);
    const items: ResultadoNotificacion["items"] = [];
    const omitidas: ResultadoNotificacion["omitidas"] = [];
    rels.forEach((r) => {
      const inc = incumplimientosDe(r.id, requerimiento_id);
      if (!inc.length) {
        omitidas.push({ relacion_id: r.id, folio: r.folio, motivo: "Sin incumplimientos" });
        return;
      }
      const dest = destinatarioDe(r.contratista.id);
      const fecha = ahora();
      r.ultima_notificacion = { fecha, autor: AUTOR, correo_enviado: Boolean(dest), total: (r.ultima_notificacion?.total ?? 0) + 1 };
      items.push({
        relacion_id: r.id, folio: r.folio, contratista: r.contratista, correo: dest?.email ?? null,
        correo_enviado: Boolean(dest), ...(dest ? {} : { sin_correo: true }), portal: 1,
        incumplimientos: inc.reduce((n, g) => n + g.periodos.length, 0), fecha,
      });
    });
    return { enviadas: items.length, items, omitidas };
  },

  /* Sanciones (R-07 / ME-05) */
  get_opciones_sancion: () => ({ motivos: MOTIVOS_SANCION, max_dias_sin_acceso: 8, sujetos: ["Empleado", "Empresa"] }),
  list_sanciones: (p) =>
    paginar(
      db.sanciones
        .filter((s) => [s.registra?.id, s.empresa?.id].includes(EMPRESA_ACTIVA))
        .map(sancionOut)
        .filter(
          (s) =>
            (p.empleado_id ? s.empleado?.id === p.empleado_id : true) &&
            (p.relacion_id ? s.relacion?.id === p.relacion_id : true) &&
            (p.sujeto_tipo ? s.sujeto_tipo === p.sujeto_tipo : true) &&
            (p.estatus ? s.estatus === p.estatus : true) &&
            [s.folio, s.motivo, s.motivo_otro ?? "", s.empleado?.nombre ?? "", s.empresa?.nombre ?? "", s.registro].some((t) => coincide(t, p.search)),
        ),
      p,
    ),
  get_sancion: ({ sancion_id }) => sancionOut(sancionVisible(sancion_id)),
  save_sancion: ({ sancion, sancion_id }) => {
    const d = sancion ?? {};
    if (sancion_id) {
      const s = sancionVisible(sancion_id);
      if (s.registra?.id !== EMPRESA_ACTIVA) throw new MockError("Solo quien registró la sanción la edita.");
      const copia = JSON.parse(JSON.stringify(s)) as Sancion;
      datosSancion(copia, d);
      Object.assign(s, copia);
      return sancionOut(s);
    }
    const tipo = d.sujeto_tipo ?? (d.empleado_id ? "Empleado" : "Empresa");
    let empleado: Ref | null = null;
    let empresaId: string;
    let rel: Relacion | undefined;
    if (tipo === "Empleado") {
      const e = buscar(db.empleados, d.empleado_id, "Empleado");
      empleado = { id: e.id, nombre: e.nombre };
      empresaId = e.empresa?.id ?? EMPRESA_ACTIVA;
      if (empresaId !== EMPRESA_ACTIVA) {
        rel = db.relaciones.find((r) => r.cliente.id === EMPRESA_ACTIVA && r.contratista.id === empresaId && r.estatus === "Activo");
        if (!rel) throw new MockError("Solo sancionas a tus empleados o a los de un contratista tuyo con relación activa.");
      }
    } else {
      rel = buscar(db.relaciones, d.relacion_id, "Relación");
      if (rel.cliente.id !== EMPRESA_ACTIVA) throw new MockError("Solo el cliente sanciona a su contratista.");
      if (rel.estatus !== "Activo") throw new MockError("La relación está inactiva.");
      empresaId = rel.contratista.id;
    }
    const s: Sancion = {
      id: nuevoId("san"), folio: folio("S", db.sanciones.length + 1), sujeto_tipo: tipo, empleado,
      empresa: { id: empresaId, nombre: buscar(db.empresas, empresaId, "Empresa").razon_social },
      registra: { id: EMPRESA_ACTIVA, nombre: buscar(db.empresas, EMPRESA_ACTIVA, "Empresa").razon_social },
      relacion: rel ? { id: rel.id, nombre: rel.folio } : null, contrato: null,
      motivo: "Otro", motivo_otro: null, fecha: null, sin_acceso: false, dias_sin_acceso: 0,
      inicio_suspension: null, fin_suspension: null, registro: AUTOR, acta: null,
      comentarios: d.comentario || d.evidencias?.length
        ? [{ autor: AUTOR, fecha: ahora(), texto: d.comentario ?? "", evidencias: d.evidencias ?? [] }] : [],
      evidencias: 0, estatus: "Cumplida",
    };
    datosSancion(s, { ...d, motivo: d.motivo, sin_acceso: d.sin_acceso ?? false });
    db.sanciones.push(s);
    return sancionOut(s);
  },
  comment_sancion: ({ sancion_id, texto, evidencias }) => {
    const s = sancionVisible(sancion_id);
    if (!String(texto ?? "").trim() && !evidencias?.length) throw new MockError("Escribe un comentario o agrega una evidencia.");
    s.comentarios.push({ autor: AUTOR, fecha: ahora(), texto: texto ?? "", evidencias: evidencias ?? [] });
    return sancionOut(s);
  },
  delete_sancion: ({ sancion_id }) => {
    const s = sancionVisible(sancion_id);
    if (s.registra?.id !== EMPRESA_ACTIVA) throw new MockError("Solo quien registró la sanción la elimina.");
    db.sanciones = db.sanciones.filter((x) => x.id !== s.id);
    return { eliminado: s.id, folio: s.folio };
  },
  imprimir_acta: ({ sancion_id }) => {
    const s = sancionVisible(sancion_id);
    if (s.registra?.id !== EMPRESA_ACTIVA) throw new MockError("Solo quien registró la sanción imprime el acta.");
    s.acta = { name: `acta_${s.folio}.pdf`, file_url: "https://example.com/mock/acta.pdf" };
    return { acta: s.acta, sancion: sancionOut(s) };
  },

  /* Mapeo (ME-13) */
  get_mapeo_contrato: ({ contrato_id }) => mapeoOut(contrato_id),
  sugerir_mapeo: ({ filas, solo_sin_match }) => {
    const cat = catalogoMaestro();
    const out = (filas as FilaMapeoInput[]).map((f) => {
      const actual = cat.find((c) => c.id === f.requerimiento_id);
      if (actual && solo_sin_match) {
        return { origen: f.origen, nivel: f.nivel ?? actual.nivel, requerimiento: actual, similitud: f.similitud ?? null, sugerido: false, homologa: true };
      }
      const { req, s } = mejorMapeo(f.origen, f.nivel);
      const sug = s >= 0.4 ? req : null;
      return { origen: f.origen, nivel: sug?.nivel ?? f.nivel ?? "Persona", requerimiento: sug, similitud: sug ? Math.round(s * 100) : null, sugerido: Boolean(sug), homologa: s >= 0.6 };
    });
    return { filas: out, homologados: out.filter((f) => f.requerimiento).length, total: out.length };
  },
  save_mapeo_contrato: ({ contrato_id, filas }) => {
    if (!mapeoOut(contrato_id).editable) throw new MockError("Solo el cliente del contrato edita su mapeo de requerimientos.");
    const cat = catalogoMaestro();
    db.mapeos[contrato_id] = (filas as FilaMapeoInput[]).map((f) => {
      if (!f.origen?.trim()) throw new MockError("Cada fila necesita el texto del cliente.");
      const req = f.requerimiento_id ? cat.find((c) => c.id === f.requerimiento_id) : undefined;
      if (f.requerimiento_id && !req) throw new MockError(`El requerimiento ${f.requerimiento_id} no existe o está inactivo.`);
      const sim = f.similitud ?? (req ? Math.round(Math.max(similitudMapeo(f.origen, req.nombre), similitudMapeo(f.origen, req.codigo ?? "")) * 100) : null);
      return { origen: f.origen.trim(), nivel: f.nivel ?? "Persona", requerimiento_id: req?.id ?? null, similitud: sim };
    });
    return mapeoOut(contrato_id);
  },
  crear_en_catalogo: ({ requerimiento }) => {
    if (!requerimiento?.nombre?.trim()) throw new MockError("El nombre canónico es obligatorio.");
    if (!["Empresa", "Persona", "Equipo"].includes(requerimiento.nivel)) throw new MockError("Nivel: Empresa, Persona o Equipo.");
    const codigo = codigoSistema(requerimiento.codigo || requerimiento.nombre);
    if (db.requerimientos.some((q) => q.estatus === "Activo" && q.codigo === codigo)) {
      throw new MockError(`Ya hay un requerimiento activo con el código ${codigo}.`);
    }
    const q: Requerimiento = {
      id: nuevoId("req"), nombre: requerimiento.nombre.trim(), descripcion: requerimiento.descripcion, tipo: "Documento",
      ambito: requerimiento.nivel, plataforma: "Sin plataforma", vigencia_modo: "vigencia", vigencia: null,
      requiere_acuse: false, limitante: false, criterios: [], estatus: "Activo", codigo,
    };
    db.requerimientos.push(q);
    return q;
  },

  list_cumplimiento: (p) =>
    recalcular().filter(
      (f) =>
        (p.anio ? f.periodo.inicio.startsWith(String(p.anio)) || f.periodo.clave === "unico" : true) &&
        (p.relacion_id ? f.relacion === p.relacion_id : true) &&
        (p.contrato_id ? f.contrato === p.contrato_id : true) &&
        (p.sujeto_tipo ? f.sujeto.tipo === p.sujeto_tipo : true) &&
        (p.empleado_id ? f.sujeto.empleado?.id === p.empleado_id : true),
    ),
  set_estado_cumplimiento: ({ cumplimiento_id, estado, motivo }) => {
    if (!motivo) throw new MockError("El motivo es obligatorio");
    if (estado) db.manual[cumplimiento_id] = { estado, motivo };
    else delete db.manual[cumplimiento_id];
    return recalcular().find((f) => f.id === cumplimiento_id) ?? noExiste("Fila de cumplimiento", cumplimiento_id);
  },
};

/** Punto de entrada que usa `callContratistas` cuando los mocks están prendidos. */
export async function handleMock<T>(option: string, params: Record<string, unknown>): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCIA_MS));
  const handler = handlers[option];
  if (!handler) throw new MockError(`Mock sin implementar: ${option}`);
  // Clon para que el front no mute el store por referencia.
  return clone(handler(params)) as T;
}

/** Opciones que existen en los mocks (útil para comprobar que los services coinciden). */
export const MOCK_OPTIONS = Object.keys(handlers);
