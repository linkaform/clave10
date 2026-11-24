/* eslint-disable @typescript-eslint/no-explicit-any */
// Back simulado de contratistas: store en memoria (se reinicia al recargar)
// con las mismas reglas que piden las specs del modelo (clave10-sdk/specs):
// vista espejo de relaciones, estatus de contrato y documento, y un motor de
// cumplimiento simplificado. Solo para desarrollo del front.
import type {
  Ambito,
  Contrato,
  CumplimientoFila,
  Documento,
  EmpleadoContratista,
  Empresa,
  EstadoCumplimiento,
  EstatusContrato,
  EstatusDocumento,
  EventoContrato,
  Pagina,
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
  documentos: clone(seed.DOCUMENTOS) as Documento[],
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

/**
 * Periodos de un requerimiento dentro del año y de la vigencia del sujeto
 * (`desde`–`hasta`). Uno único (o por vigencia) se exige desde el alta.
 */
const periodosDelAnio = (r: Requerimiento, anio: number, desde: string, hasta: string) => {
  if (r.vigencia_modo !== "periodo" || r.periodicidad === "Única") {
    return [{ clave: "unico", inicio: desde, fin: hasta, vence: desde }];
  }
  // Mocks: solo periodos mensuales; el back real cubre todas las periodicidades.
  return Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, "0");
    const finMes = new Date(Date.UTC(anio, i + 1, 0)).toISOString().slice(0, 10);
    const sig = new Date(Date.UTC(anio, i + 1, r.dia_limite ?? 17)).toISOString().slice(0, 10);
    return { clave: `${anio}-${mes}`, inicio: `${anio}-${mes}-01`, fin: finMes, vence: sig };
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
      (fila.periodo.clave === "unico" || d.periodo?.clave === fila.periodo.clave),
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
  reqsEmpresa.forEach((id) => {
    const r = reqById(id);
    if (r?.ambito === "Empresa") agregar(r, { tipo: "Empresa", empresa }, "emp");
  });

  // Ámbito Persona: por empleado ligado, según su perfil en el contrato.
  c.empleados.forEach((e) => {
    const renglon = c.perfiles.find((p) => p.perfil.id === e.perfil.id);
    recurso(e.perfil.id)?.requerimientos.forEach(({ id }) => {
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

const estatusDocumento = (d: Documento): EstatusDocumento => {
  if (d.aprobaciones.some((a) => a.decision === "Rechazado")) return "Rechazado";
  const aprobado = d.aprobaciones.length > 0 && d.aprobaciones.every((a) => a.decision === "Aprobado");
  if (aprobado) return d.vigencia_fin && d.vigencia_fin < hoyISO() ? "Vencido" : "Aceptado";
  return "Por revisar";
};

/* ---------------- Relaciones ---------------- */

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
  };
};

const empresaRef = (id: string) => {
  const e = buscar(db.empresas, id, "Empresa");
  return { id: e.id, razon_social: e.razon_social, rfc: e.rfc };
};

const registrarEvento = (contrato: string, evento: EventoContrato["evento"], detalle: string) =>
  db.historial.push({ id: nuevoId("ev"), contrato, evento, detalle, autor: AUTOR, fecha: ahora() });

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

/* ---------------- Opciones ---------------- */

type Handler = (p: any) => unknown;

const handlers: Record<string, Handler> = {
  /* Empresa y empleados */
  get_mi_empresa: () => buscar(db.empresas, EMPRESA_ACTIVA, "Empresa"),
  update_mi_empresa: ({ empresa }) => {
    const e = buscar(db.empresas, EMPRESA_ACTIVA, "Empresa");
    Object.assign(e, empresa);
    return e;
  },
  get_empresa: ({ empresa_id }) => buscar(db.empresas, empresa_id, "Empresa"),

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
    if (padre && padre.contratista.id !== cliente.id) {
      throw new MockError("El cliente de la subcontratación debe ser el contratista de la relación padre");
    }
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
      requerimientos_asignados: [],
      estatus: "Activo",
      fecha_alta: hoyISO(),
      notas: relacion.notas,
      num_contratos: 0,
      cumplimiento_pct: 0,
    };
    if (nueva.nivel > 3) throw new MockError("Se excede el nivel máximo de subcontratación (3)");
    db.relaciones.push(nueva);
    return nueva;
  },
  update_relacion: ({ relacion_id, cambios }) => {
    const r = buscar(db.relaciones, relacion_id, "Relación");
    if (cambios.notas !== undefined) r.notas = cambios.notas;
    if (cambios.requerimientos_asignados) {
      r.requerimientos_asignados = cambios.requerimientos_asignados.map((id: string) => {
        const q = buscar(db.requerimientos, id, "Requerimiento");
        return { id: q.id, nombre: q.nombre };
      });
    }
    return r;
  },
  change_status_relacion: ({ relacion_id, estatus }) => {
    const r = buscar(db.relaciones, relacion_id, "Relación");
    const activos = db.contratos.some(
      (c) => c.relacion === r.id && !["Pausado", "Cancelado", "Vencido"].includes(c.estatus),
    );
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
  list_sesiones: (p) =>
    paginar(
      db.sesiones.filter(
        (s) =>
          (p.estatus ? s.estatus === p.estatus : true) &&
          (p.desde ? s.fecha_fin >= p.desde : true) &&
          (p.hasta ? s.fecha_inicio <= p.hasta : true) &&
          coincide(s.nombre, p.search),
      ),
      p,
    ),
  get_sesion: ({ sesion_id }) => buscar(db.sesiones, sesion_id, "Sesión"),
  save_sesion: ({ sesion, sesion_id }) => {
    const modalidad = sesion.lugar && sesion.enlace ? "Híbrida" : sesion.enlace ? "Virtual" : "Presencial";
    if (sesion_id) return Object.assign(buscar(db.sesiones, sesion_id, "Sesión"), sesion, { modalidad });
    const nueva: Sesion = { ...sesion, id: nuevoId("ses"), modalidad, participantes: [], estatus: "Programada" };
    db.sesiones.push(nueva);
    return nueva;
  },
  cancel_sesion: ({ sesion_id }) => Object.assign(buscar(db.sesiones, sesion_id, "Sesión"), { estatus: "Cancelada" }),
  save_participantes: ({ sesion_id, participantes }) => {
    const s = buscar(db.sesiones, sesion_id, "Sesión");
    s.participantes = participantes;
    // Aprobado → documento ya Aceptado del requerimiento que otorga la sesión.
    participantes
      .filter((p: any) => p.resultado === "Aprobado" && s.otorga)
      .forEach((p: any) => {
        const ya = db.documentos.some(
          (d) => d.origen === "Sesión" && d.requerimiento?.id === s.otorga!.id && d.dueno.empleado?.id === p.empleado.id,
        );
        if (ya) return;
        const empl = buscar(db.empleados, p.empleado.id, "Empleado");
        const empresa = empl.empresa ? { id: empl.empresa.id, nombre: empl.empresa.razon_social } : { id: EMPRESA_ACTIVA, nombre: "" };
        db.documentos.push({
          id: nuevoId("doc"),
          folio: folio("D", db.documentos.length + 1),
          nombre: `${s.nombre} · ${p.empleado.nombre}`,
          requerimiento: s.otorga,
          dueno: { tipo: "Persona", empresa, empleado: p.empleado },
          en_ceros: false,
          archivo: { name: "constancia.pdf", file_url: "https://example.com/mock/constancia.pdf" },
          estatus: "Aceptado",
          compartido_con: [],
          contratos: [],
          origen: "Sesión",
          versiones: [],
          comentarios: [],
          aprobaciones: db.relaciones
            .filter((r) => r.contratista.id === empresa.id)
            .map((r) => ({ cliente: { id: r.cliente.id, nombre: r.cliente.razon_social }, decision: "Aprobado" as const, revisor: AUTOR, fecha: ahora() })),
        });
      });
    return s;
  },

  /* Documentos */
  list_documentos: (p) =>
    paginar(
      db.documentos.filter(
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
  get_documento: ({ documento_id }) => buscar(db.documentos, documento_id, "Documento"),
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
      return d;
    }
    const empresa = buscar(db.empresas, documento.dueno.empresa_id, "Empresa");
    const empleado = documento.dueno.empleado_id ? buscar(db.empleados, documento.dueno.empleado_id, "Empleado") : undefined;
    const req = documento.requerimiento_id ? buscar(db.requerimientos, documento.requerimiento_id, "Requerimiento") : null;
    const compartido = (documento.compartido_con ?? []).map((id: string) => {
      const e = buscar(db.empresas, id, "Empresa");
      return { id: e.id, nombre: e.razon_social };
    });
    const nuevo: Documento = {
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
    return nuevo;
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
    return d;
  },
  comment_documento: ({ documento_id, texto }) => {
    const d = buscar(db.documentos, documento_id, "Documento");
    d.comentarios.push({ autor: AUTOR, fecha: ahora(), texto });
    return d;
  },

  /* Cumplimiento */
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
