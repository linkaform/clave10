import * as XLSX from "xlsx";
import { UserOptions, UserCreateRow } from "./users-sdk";

// Alta masiva de usuarios nuevos (spec 02): el Excel se lee en el navegador y las
// filas se mandan por lotes a sanic, que corre el alta completa de cada una.

/** Fila leída del Excel; `excelRow` es el número que ve el usuario en la hoja. */
export type ParsedUserRow = UserCreateRow & { excelRow: number };

/** Columnas del archivo y los encabezados que se aceptan para cada una. */
const COLUMNS: {
  key: keyof UserCreateRow;
  label: string;
  required: boolean;
  aliases: string[];
}[] = [
  { key: "name", label: "Nombre", required: true, aliases: ["nombre"] },
  {
    key: "username",
    label: "Username",
    required: true,
    aliases: ["username", "usuario"],
  },
  {
    key: "email",
    label: "Email",
    required: true,
    aliases: ["email", "correo"],
  },
  { key: "phone", label: "Teléfono", required: true, aliases: ["telefono"] },
  { key: "role", label: "Rol", required: true, aliases: ["rol", "puesto"] },
  {
    key: "timezone",
    label: "Uso Horario",
    required: false,
    aliases: ["uso horario", "zona horaria", "timezone"],
  },
  {
    key: "language",
    label: "Idioma",
    required: false,
    aliases: ["idioma", "lenguaje", "language"],
  },
];

export const USER_IMPORT_REQUIRED_COLUMNS = COLUMNS.filter(
  (c) => c.required,
).map((c) => c.label);

const SHEET_USERS = "Usuarios";

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const str = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

/**
 * Lee un .xlsx con las columnas del alta (hoja "Usuarios", o la primera si no
 * existe). Falla si falta una columna obligatoria. Las filas con datos faltantes o
 * inválidos NO se descartan aquí: sanic las rechaza con su motivo. Solo se ignoran
 * las filas totalmente vacías.
 */
export async function parseUsersFromExcel(
  file: Pick<File, "arrayBuffer">,
): Promise<ParsedUserRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet =
    workbook.Sheets[SHEET_USERS] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  // Sin filas con datos sheet_to_json no trae encabezados: se leen de la primera fila.
  const headers = rows.length
    ? Object.keys(rows[0])
    : ((XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] ??
        []) as string[]);

  const found = COLUMNS.map((c) => ({
    ...c,
    header: headers.find(
      (h) =>
        c.aliases.includes(normalize(h)) || normalize(h) === normalize(c.label),
    ),
  }));
  const missing = found
    .filter((c) => c.required && !c.header)
    .map((c) => c.label);
  if (missing.length > 0)
    throw new Error(`Faltan columnas obligatorias: ${missing.join(", ")}.`);

  const parsed: ParsedUserRow[] = [];
  rows.forEach((row, index) => {
    const values = Object.fromEntries(
      found.map((c) => [c.key, c.header ? str(row[c.header]) : ""]),
    ) as unknown as UserCreateRow;
    if (Object.values(values).every((v) => v === "")) return;
    parsed.push({ ...values, excelRow: index + 2 }); // +2: encabezado y base 1
  });

  if (parsed.length === 0)
    throw new Error("El archivo no tiene filas con datos.");
  return parsed;
}

/**
 * Libro de la plantilla: "Usuarios" solo con encabezados (nada que borrar antes de
 * subirlo), "Ejemplo" con filas de muestra y "Valores válidos" con las listas.
 */
export function buildUsersTemplate(options?: UserOptions): XLSX.WorkBook {
  const headers = COLUMNS.map((c) => c.label);
  const defaults = options?.defaults ?? {
    timezone: "America/Mexico_City",
    language: "es_MX",
  };
  const languages = options?.languages ?? [
    { value: "es_MX", label: "Español" },
    { value: "en_US", label: "English" },
  ];
  const languageName = (code: string) =>
    languages.find((l) => l.value === code)?.label ?? code;

  const users = XLSX.utils.aoa_to_sheet([headers]);
  users["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

  const example = XLSX.utils.aoa_to_sheet([
    headers,
    [
      "Ana Pérez",
      "ana.perez",
      "ana.perez@empresa.com",
      "8112345678",
      "Guardia",
      defaults.timezone,
      languageName(defaults.language),
    ],
    [
      "John Smith",
      "john.smith",
      "john.smith@empresa.com",
      "8187654321",
      "Supervisor",
      "America/Tijuana",
      languages[1]?.label ?? "English",
    ],
    [
      "Luis Ramos",
      "luis.ramos",
      "luis.ramos@empresa.com",
      "8100001111",
      "Recepción",
      "",
      "",
    ],
  ]);
  example["!cols"] = users["!cols"];

  const timezones = options?.timezones ?? [defaults.timezone];
  const valid = XLSX.utils.aoa_to_sheet([
    ["Idioma", "Uso Horario"],
    ...Array.from(
      { length: Math.max(languages.length, timezones.length) },
      (_, i) => [languages[i]?.label ?? "", timezones[i] ?? ""],
    ),
    [],
    [
      `Uso Horario e Idioma son opcionales: vacíos toman ${defaults.timezone} y ${languageName(defaults.language)}.`,
    ],
  ]);
  valid["!cols"] = [{ wch: 16 }, { wch: 40 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, users, SHEET_USERS);
  XLSX.utils.book_append_sheet(workbook, example, "Ejemplo");
  XLSX.utils.book_append_sheet(workbook, valid, "Valores válidos");
  return workbook;
}

export function downloadUsersTemplate(options?: UserOptions) {
  XLSX.writeFile(buildUsersTemplate(options), "plantilla_usuarios.xlsx");
}
