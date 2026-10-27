"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateUsers, useUserOptions } from "@/hooks/Users/useUsers";
import {
  ParsedUserRow,
  USER_IMPORT_REQUIRED_COLUMNS,
  downloadUsersTemplate,
  parseUsersFromExcel,
} from "@/lib/users-import";
import { UserCreateResult } from "@/lib/users-sdk";

const PREVIEW_ROWS = 8;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Alta masiva de usuarios nuevos desde un Excel. El archivo se lee aquí y sanic da
// de alta cada fila por lotes (usuario en LinkaForm + correo de activación).
export function UserImportModal({ open, onOpenChange }: Props) {
  const createUsers = useCreateUsers();
  const { data: options } = useUserOptions();
  const [fileName, setFileName] = React.useState("");
  const [rows, setRows] = React.useState<ParsedUserRow[] | null>(null);
  const [parseError, setParseError] = React.useState("");
  const [createEmployee, setCreateEmployee] = React.useState(false);
  const [progress, setProgress] = React.useState<{
    done: number;
    total: number;
  } | null>(null);
  const [result, setResult] = React.useState<UserCreateResult | null>(null);

  const running = createUsers.isPending;
  const reset = () => {
    setFileName("");
    setRows(null);
    setParseError("");
    setCreateEmployee(false);
    setProgress(null);
    setResult(null);
    createUsers.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (running) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setFileName(file.name);
    setRows(null);
    setParseError("");
    setResult(null);
    try {
      setRows(await parseUsersFromExcel(file));
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "No se pudo leer el archivo.",
      );
    }
  };

  const handleCreate = () => {
    if (!rows) return;
    // excelRow es solo para mostrar; sanic no lo necesita.
    const payload = rows.map((r) => ({
      name: r.name,
      username: r.username,
      email: r.email,
      phone: r.phone,
      role: r.role,
      timezone: r.timezone,
      language: r.language,
    }));
    setProgress({ done: 0, total: payload.length });
    createUsers.mutate(
      {
        rows: payload,
        createEmployee,
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSuccess: (res) => {
          setResult(res);
          if (res.created > 0)
            toast.success(`${res.created} usuario(s) creado(s)`);
        },
        onError: (e) =>
          toast.error((e as Error).message || "No se pudo procesar el archivo"),
      },
    );
  };

  // sanic numera las filas por lo enviado; se muestran con el número de la hoja.
  const excelRowOf = (row: number) => rows?.[row - 1]?.excelRow ?? row;
  const incomplete = rows
    ? rows.filter(
        (r) => !(r.name && r.username && r.email && r.phone && r.role),
      ).length
    : 0;
  const defaultTz = options?.defaults.timezone ?? "";
  const defaultLang =
    options?.languages.find((l) => l.value === options.defaults.language)
      ?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className="w-full max-w-4xl px-4 py-6 overflow-y-auto max-h-[90vh]"
        aria-describedby=""
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Alta masiva de usuarios
          </DialogTitle>
          <DialogDescription className="text-center">
            Crea usuarios nuevos desde un Excel. Cada usuario recibe un correo
            para activar su cuenta.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>
                <strong>{result.created}</strong> usuario(s) creado(s)
                {result.rejected.length > 0 && (
                  <>
                    , <strong>{result.rejected.length}</strong> rechazado(s)
                  </>
                )}
                .
              </span>
            </div>

            {result.rejected.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Rechazados</p>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rejected.map((r, i) => (
                        <TableRow key={`${r.row}-${i}`}>
                          <TableCell>{excelRowOf(r.row)}</TableCell>
                          <TableCell>{r.username || "—"}</TableCell>
                          <TableCell>{r.msg}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Columnas obligatorias:{" "}
                <strong>{USER_IMPORT_REQUIRED_COLUMNS.join(", ")}</strong>. Uso
                Horario e Idioma son opcionales
                {defaultTz && (
                  <>
                    : vacíos toman {defaultTz} y {defaultLang}
                  </>
                )}
                .
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadUsersTemplate(options)}
              >
                <Download size={14} className="mr-1" /> Descargar plantilla
              </Button>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-slate-50 text-center">
              <Upload size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileName || "Selecciona un archivo .xlsx"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFile}
                disabled={running}
              />
            </label>

            {parseError && <p className="text-sm text-red-600">{parseError}</p>}

            {rows && (
              <>
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle
                    size={18}
                    className="shrink-0 mt-0.5 text-amber-600"
                  />
                  <div>
                    Se crearán hasta <strong>{rows.length}</strong> usuario(s) y
                    se enviarán hasta <strong>{rows.length}</strong> correo(s)
                    de activación. Si un username ya existe, esa fila se rechaza
                    y las demás siguen.
                    {incomplete > 0 && (
                      <>
                        {" "}
                        <strong>{incomplete}</strong> fila(s) tienen datos
                        obligatorios vacíos y serán rechazadas.
                      </>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={createEmployee}
                    disabled={running}
                    onCheckedChange={(checked) =>
                      setCreateEmployee(checked === true)
                    }
                  />
                  Crear empleado para todos los usuarios
                </label>

                <div className="border rounded-md overflow-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Uso Horario</TableHead>
                        <TableHead>Idioma</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, PREVIEW_ROWS).map((r) => (
                        <TableRow key={r.excelRow}>
                          <TableCell>{r.excelRow}</TableCell>
                          {[r.name, r.username, r.email, r.phone, r.role].map(
                            (v, i) => (
                              <TableCell
                                key={i}
                                className={v ? "" : "text-red-600"}
                              >
                                {v || "—"}
                              </TableCell>
                            ),
                          )}
                          <TableCell
                            className={
                              r.timezone ? "" : "text-muted-foreground"
                            }
                          >
                            {r.timezone || defaultTz || "—"}
                          </TableCell>
                          <TableCell
                            className={
                              r.language ? "" : "text-muted-foreground"
                            }
                          >
                            {r.language || defaultLang || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {rows.length > PREVIEW_ROWS && (
                  <p className="text-xs text-muted-foreground -mt-2">
                    y {rows.length - PREVIEW_ROWS} fila(s) más…
                  </p>
                )}
              </>
            )}

            {running && progress && (
              <div className="flex flex-col gap-1">
                <Progress value={(progress.done / progress.total) * 100} />
                <p className="text-xs text-muted-foreground text-center">
                  Procesando {progress.done} de {progress.total}...
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={running}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                disabled={!rows || running}
                onClick={handleCreate}
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creando...
                  </>
                ) : (
                  `Crear${rows ? ` ${rows.length} usuario(s)` : ""}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
