// Plantilla por caseta que regresa get_plantilla (asistencia_report.py)
// A = con entrada, R = entrada con retardo, F = sin entrada, PL = por llegar (hoy), PE = programado (futuro)
export type PlazaStatus = "A" | "R" | "F" | "PL" | "PE";

export type Plaza = {
  rol: string;
  guardia_programado: string;
  guardia_programado_id?: number | null;
  status: PlazaStatus;
  guardia: string;
  employee_id?: number | null;
  suplente: boolean;
  // Cubrió la plaza pero su check-in no trae rol
  sin_rol?: boolean;
  hora?: string | null;
  folio?: string | null;
};

export type PlantillaDia = {
  fecha: string;
  plazas: Plaza[];
  // Check-ins que no cupieron en ninguna plaza (p. ej. otro rol)
  extras: { guardia: string; hora: string; employee_id: number; roles?: string[] }[];
};

export type PlantillaRow = {
  ubicacion: string;
  caseta: string;
  horario: string;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_retardo: number;
  dias: PlantillaDia[];
};

export type PlazasSelection = {
  title: string;
  subtitle: string;
  fecha: string;
  // Si hay más de una caseta (Total de la ubicación) se agrupan
  rows: PlantillaRow[];
};

const hhmm = (v?: string) => v?.substring(0, 5) ?? "";

export const turnoKey = (r: Pick<PlantillaRow, "horario" | "hora_entrada">) => `${r.horario}|${r.hora_entrada}`;
export const plantillaTurnoLabel = (r: Pick<PlantillaRow, "horario" | "hora_entrada" | "hora_salida">) =>
  r.hora_entrada ? `${r.horario} · ${hhmm(r.hora_entrada)}–${hhmm(r.hora_salida)}` : r.horario;

export const plazasDe = (rows: PlantillaRow[], fecha: string) =>
  rows.flatMap(r => r.dias.find(d => d.fecha === fecha)?.plazas ?? []);

// "Por llegar" agrupa también lo programado
export const plazaQuickKey = (p: Plaza) => (p.status === "PE" ? "PL" : p.status);

export const resumenPlazas = (plazas: Plaza[]) => {
  const n = (k: PlazaStatus) => plazas.filter(p => p.status === k).length;
  return { total: plazas.length, entradas: n("A") + n("R"), sinEntrada: n("F"), porLlegar: n("PL") + n("PE") };
};

// Turno en curso a esta hora (incluye los que cruzan la medianoche); si no hay, el primero
export const turnoActual = (rows: PlantillaRow[], now = new Date()) => {
  const min = now.getHours() * 60 + now.getMinutes();
  const toMin = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const turnos = Array.from(new Map(rows.map(r => [turnoKey(r), r])).values())
    .sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada));
  const cur = turnos.find(t => {
    if (!t.hora_entrada || !t.hora_salida) return false;
    const s = toMin(t.hora_entrada);
    const e = toMin(t.hora_salida);
    return s <= e ? min >= s && min < e : min >= s || min < e;
  });
  return cur ?? turnos[0];
};

// Orden de las plazas: con entrada, retardo, sin entrada, por llegar, programado
const ORD: Record<PlazaStatus, number> = { A: 0, R: 1, F: 2, PL: 3, PE: 4 };
export const ordenPlazas = (plazas: Plaza[]) => plazas.slice().sort((a, b) => ORD[a.status] - ORD[b.status]);
