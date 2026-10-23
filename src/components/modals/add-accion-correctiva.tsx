"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface AccionCorrectiva {
  tipo: "Tarea" | "Correctiva" | "Preventiva";
  accion: string;
  causa: string;
  responsable_tipo: "Empleado" | "Área" | "Rol";
  responsable: string;
  estatus: string;
}

interface AccionCorrectivaModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setAcciones: Dispatch<SetStateAction<AccionCorrectiva[]>>;
  /** Índice de la acción a editar; null = nueva. */
  indice: number | null;
  seleccionada: AccionCorrectiva | null;
  empleados: string[];
  areas: string[];
}

const TIPOS = [
  { value: "Tarea", ayuda: "Algo que hay que hacer por esta incidencia." },
  { value: "Correctiva", ayuda: "Elimina la causa de esta incidencia." },
  { value: "Preventiva", ayuda: "Evita que algo similar vuelva a ocurrir." },
] as const;
// Color de la etiqueta de cada tipo, para las tablas y el detalle.
export const CLASE_TIPO_TAREA: Record<string, string> = {
  tarea: "bg-gray-100 text-gray-700",
  correctiva: "bg-blue-50 text-blue-700",
  preventiva: "bg-purple-50 text-purple-700",
};
const TIPOS_RESPONSABLE = ["Empleado", "Área", "Rol"] as const;
// Estatus de la forma. Al crear siempre es Abierta: se cambia al editar o con
// la palomita de la tabla.
export const ESTATUS_TAREA = ["Abierta", "Cerrada", "Cancelada"] as const;
// Los registros viejos traen Pendiente/Completada (el back ya los traduce).
export const estatusTarea = (estatus?: string) => {
  const e = (estatus || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!e || e === "pendiente" || e === "en proceso") return "Abierta";
  if (e === "completada") return "Cerrada";
  return ESTATUS_TAREA.find((x) => x.toLowerCase() === e) ?? "Abierta";
};

const label = "text-[11px] font-bold uppercase tracking-wide text-gray-600";

// Captura de una tarea de la incidencia (grupo "Tareas" de la forma; antes
// "Acciones correctivas"): tarea, correctiva o preventiva.
export const AccionCorrectivaModal = ({
  open,
  setOpen,
  setAcciones,
  indice,
  seleccionada,
  empleados,
  areas,
}: AccionCorrectivaModalProps) => {
  const [tipo, setTipo] = useState<AccionCorrectiva["tipo"]>("Tarea");
  const [accion, setAccion] = useState("");
  const [causa, setCausa] = useState("");
  const [mostrarCausa, setMostrarCausa] = useState(false);
  const [responsableTipo, setResponsableTipo] = useState<AccionCorrectiva["responsable_tipo"]>("Empleado");
  const [responsable, setResponsable] = useState("");
  const [estatus, setEstatus] = useState<string>("Abierta");

  useEffect(() => {
    if (!open) return;
    setTipo(seleccionada?.tipo ?? "Tarea");
    setAccion(seleccionada?.accion ?? "");
    setCausa(seleccionada?.causa ?? "");
    setMostrarCausa(!!seleccionada?.causa);
    setResponsableTipo(seleccionada?.responsable_tipo ?? "Empleado");
    setResponsable(seleccionada?.responsable ?? "");
    setEstatus(estatusTarea(seleccionada?.estatus));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const puedeGuardar = !!accion.trim() && !!responsable.trim();

  const handleGuardar = () => {
    if (!puedeGuardar) return;
    const data: AccionCorrectiva = {
      tipo,
      accion: accion.trim(),
      causa: mostrarCausa ? causa.trim() : "",
      responsable_tipo: responsableTipo,
      responsable: responsable.trim(),
      estatus: indice !== null ? estatus : "Abierta",
    };
    if (indice !== null) {
      setAcciones((prev) => prev.map((item, i) => (i === indice ? data : item)));
      toast.success("Tarea editada correctamente.");
    } else {
      setAcciones((prev) => [...prev, data]);
      toast.success("Tarea agregada correctamente.");
    }
    setOpen(false);
  };

  const opcionesResponsable = responsableTipo === "Empleado" ? empleados : responsableTipo === "Área" ? areas : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby="">
        <DialogTitle className="text-xl font-bold text-gray-900">
          {indice !== null ? "Editar tarea" : "Nueva tarea"}
        </DialogTitle>
        <p className="mt-1 text-sm text-gray-500">Qué se hará y quién es responsable.</p>

        <div className="mt-5 space-y-5">
          <div>
            <p className={label}>
              Tipo <span className="text-red-500">*</span>
            </p>
            <div className="mt-1.5 grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-gray-200">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
                    tipo === t.value ? "bg-blue-500 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {t.value}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{TIPOS.find((t) => t.value === tipo)?.ayuda}</p>
          </div>

          <div>
            <p className={label}>
              {tipo === "Tarea" ? "Tarea" : `Acción ${tipo.toLowerCase()}`} <span className="text-red-500">*</span>
            </p>
            <Textarea
              className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
              rows={4}
              placeholder="Ej. Reemplazar la barra de pánico e instalar sensor de apertura."
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
            />
          </div>

          {mostrarCausa ? (
            <div>
              <div className="flex items-center justify-between">
                <p className={label}>¿Qué la causó?</p>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCausa(false);
                    setCausa("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Quitar causa">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
                rows={3}
                placeholder="Ej. La barra estaba dañada desde hace semanas y no se reportó."
                value={causa}
                onChange={(e) => setCausa(e.target.value)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMostrarCausa(true)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
              <CirclePlus className="h-4 w-4" />
              Agregar qué la causó
              <span className="font-normal text-gray-500">· Opcional</span>
            </button>
          )}

          <div>
            <p className={label}>
              Responsable <span className="text-red-500">*</span>
            </p>
            <div className="mt-1.5 grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr]">
              <div className="grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-gray-200 md:w-64">
                {TIPOS_RESPONSABLE.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setResponsableTipo(t);
                      setResponsable("");
                    }}
                    className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
                      responsableTipo === t ? "bg-blue-500 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              {responsableTipo === "Rol" ? (
                <Input
                  className="h-11"
                  placeholder="Ej. Supervisor de turno"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                />
              ) : (
                <Select value={responsable || undefined} onValueChange={setResponsable}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder={responsableTipo === "Empleado" ? "Selecciona al empleado" : "Selecciona el área"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {opcionesResponsable.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Sin opciones disponibles.</div>
                    ) : (
                      opcionesResponsable.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {indice !== null && (
            <div>
              <p className={label}>Estatus</p>
              <div className="mt-1.5 grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-gray-200 md:w-96">
                {ESTATUS_TAREA.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEstatus(e)}
                    className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
                      estatus === e ? "bg-blue-500 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={handleGuardar} disabled={!puedeGuardar}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
