"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Camera, LayoutGrid, ListChecks, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadImage, { Imagen } from "@/components/upload-Image";
import { useCreateArea } from "@/hooks/Areas/useCreateArea";
import { useUpdateArea } from "@/hooks/Areas/useUpdateArea";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { NormalizedArea } from "@/lib/areas";
import { AREA_USOS, AreaState, AreaStatus, AreaUso, UpdateFullAreaData } from "@/lib/areas-sdk";
import type { PuntoGeo } from "./MapaSelectorPunto";
import { SelectorDireccion } from "./SelectorDireccion";
import { TagIdInput } from "./TagIdInput";
import { claseError, validarAreaForm } from "@/lib/areas-schema";
import { cn } from "@/lib/utils";

const MapaSelectorPunto = dynamic(() => import("./MapaSelectorPunto"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />,
});

const sinGuion = (value: string) => (value === "-" ? "" : value);

const capitalizar = (texto: string) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto);

const ESTADOS: { value: AreaState; label: string }[] = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
];

interface ValoresArea {
  nombre: string;
  ubicacion: string;
  direccion: string;
  tipoDeArea: string;
  disponibilidad: AreaStatus;
  estado: AreaState;
  tagId: string;
  multipleUbicacion: boolean;
  usos: AreaUso[];
  geolocalizacion: PuntoGeo | null;
  foto: Imagen[];
}

const valoresDeArea = (area: NormalizedArea): ValoresArea => {
  const coords = area.raw.geolocalizacion_area_ubicacion?.[0];
  const raw = area.raw as NormalizedArea["raw"] & {
    multiple_ubicacion?: string | string[];
    direccion?: string | string[];
    usos?: AreaUso[] | AreaUso;
  };
  const multiple = Array.isArray(raw.multiple_ubicacion) ? raw.multiple_ubicacion[0] : raw.multiple_ubicacion;
  return {
    nombre: sinGuion(area.nombre),
    ubicacion: sinGuion(area.ubicacion),
    direccion: (Array.isArray(raw.direccion) ? raw.direccion[0] : raw.direccion) || "",
    tipoDeArea: sinGuion(area.tipo),
    disponibilidad: (area.disponibilidad || "disponible") as AreaStatus,
    estado: (area.estado?.toLowerCase() === "inactiva" ? "inactiva" : "activa") as AreaState,
    tagId: area.tagId || "",
    multipleUbicacion: multiple === "si",
    usos: Array.isArray(raw.usos) ? raw.usos : raw.usos ? [raw.usos] : [],
    geolocalizacion: coords && (coords.latitude !== 0 || coords.longitude !== 0) ? coords : null,
    foto: (Array.isArray(area.raw.foto_area) ? area.raw.foto_area : [])
      .filter((f: Imagen) => /^https?:\/\//.test(f?.file_url || ""))
      .slice(0, 1)
      .map((f: Imagen) => ({ file_name: f.file_name, file_url: f.file_url })),
  };
};

const mismoPunto = (a: PuntoGeo | null, b: PuntoGeo | null) =>
  a?.latitude === b?.latitude && a?.longitude === b?.longitude;

// Solo las llaves que cambiaron: update_full_area parcha esas y deja lo demás.
const cambiosDe = (recordId: string, inicial: ValoresArea, v: ValoresArea): UpdateFullAreaData => {
  const cambios: UpdateFullAreaData = { record_id: recordId };
  if (v.nombre.trim() !== inicial.nombre) cambios.nombre = v.nombre.trim();
  if (v.ubicacion !== inicial.ubicacion) cambios.ubicacion = v.ubicacion;
  if (v.direccion && v.direccion !== inicial.direccion) cambios.direccion = v.direccion;
  if (v.tipoDeArea !== inicial.tipoDeArea) cambios.tipo_de_area = v.tipoDeArea;
  if (v.disponibilidad !== inicial.disponibilidad) cambios.area_status = v.disponibilidad;
  if (v.estado !== inicial.estado) cambios.area_state = v.estado;
  if (v.tagId.trim() !== inicial.tagId) cambios.qr_area = v.tagId.trim();
  if (v.multipleUbicacion !== inicial.multipleUbicacion) cambios.multiple_ubicacion = v.multipleUbicacion ? "si" : "no";
  if ([...v.usos].sort().join() !== [...inicial.usos].sort().join()) cambios.usos = v.usos;
  if (!mismoPunto(v.geolocalizacion, inicial.geolocalizacion)) cambios.geolocalizacion = v.geolocalizacion;
  if ((v.foto[0]?.file_url ?? "") !== (inicial.foto[0]?.file_url ?? "")) cambios.foto_area = v.foto;
  return cambios;
};

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputClass = "bg-white border-gray-200";

interface EditarAreaFormProps {
  area: NormalizedArea;
  onSaved?: () => void;
  onCancel?: () => void;
  /** Clases del contenedor del contenido (el modal lo hace scrolleable). */
  bodyClassName?: string;
  /** Clases del pie con los botones (el modal lo deja fijo abajo). */
  footerClassName?: string;
}

// Edición de todos los campos del área con update_full_area. Vive en el tab
// "Configuración" del detalle (panel lateral); el lápiz abre ahí directo.
export function EditarAreaForm({
  area,
  onSaved,
  onCancel,
  bodyClassName = "",
  footerClassName = "pt-4",
}: EditarAreaFormProps) {
  const { handleUpdateArea, isUpdating } = useUpdateArea();
  // Mismas opciones de tipo y estatus que el modal de creación.
  const { tiposDeArea, disponibilidadOptions } = useCreateArea();
  const { locations } = useAreasLocationStore();

  const inicial = React.useMemo(() => valoresDeArea(area), [area]);
  const [valores, setValores] = React.useState<ValoresArea>(inicial);
  const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);

  // Si el área se vuelve a pedir después de guardar, el form toma los datos nuevos.
  React.useEffect(() => setValores(inicial), [inicial]);

  const set = <K extends keyof ValoresArea>(key: K) => (value: ValoresArea[K]) =>
    setValores((prev) => ({ ...prev, [key]: value }));
  const toggleUso = (uso: AreaUso) =>
    setValores((prev) => ({
      ...prev,
      usos: prev.usos.includes(uso) ? prev.usos.filter((u) => u !== uso) : [...prev.usos, uso],
    }));
  // LoadImage llama a setImg con valor o con updater, como un setState.
  const setFoto: React.Dispatch<React.SetStateAction<Imagen[]>> = (value) =>
    setValores((prev) => ({ ...prev, foto: typeof value === "function" ? value(prev.foto) : value }));

  const cambios = cambiosDe(area.recordId, inicial, valores);
  const hayCambios = Object.keys(cambios).length > 1;
  // Al editar los valores ya vienen llenos: los errores se muestran en vivo.
  const errores = validarAreaForm({
    nombre: valores.nombre,
    ubicacion: valores.ubicacion,
    tipo_de_area: valores.tipoDeArea,
    geolocalizacion: valores.geolocalizacion,
  });
  const esValido = Object.keys(errores).length === 0;
  const puedeGuardar = hayCambios && esValido && !isUploadingFoto && !isUpdating;

  // Si el valor actual no viene en el catálogo, se agrega para que el select no quede vacío.
  const conActual = (opciones: { value: string; label: string }[], actual: string) =>
    actual && !opciones.some((o) => o.value === actual) ? [{ value: actual, label: actual }, ...opciones] : opciones;
  const opcionesUbicacion = conActual(locations.map((loc) => ({ value: loc, label: loc })), valores.ubicacion);
  const opcionesTipo = conActual(tiposDeArea, valores.tipoDeArea);
  const opcionesDisponibilidad = conActual(
    disponibilidadOptions.length > 0 ? disponibilidadOptions : [{ value: "disponible", label: "disponible" }],
    valores.disponibilidad,
  );

  const handleSubmit = async () => {
    if (!puedeGuardar) return;
    const ok = await handleUpdateArea(cambios);
    if (ok) onSaved?.();
  };

  return (
    <>
      <div className={`flex flex-col gap-6 ${bodyClassName}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="text-blue-500 w-5 h-5" />
            <h3 className="font-semibold text-gray-700">Información general</h3>
            {area.folio && <span className="text-xs font-semibold text-blue-600"># {area.folio}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor={`editar-nombre-${area.recordId}`} className={labelClass}>Nombre del área *</Label>
              <Input
                id={`editar-nombre-${area.recordId}`}
                value={valores.nombre}
                onChange={(e) => set("nombre")(e.target.value)}
                placeholder="Ej. Bodega Norte"
                className={cn(inputClass, claseError(errores.nombre))}
                aria-invalid={!!errores.nombre}
              />
              {errores.nombre && <p className="text-xs text-red-500">{errores.nombre}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Ubicación *</Label>
              <Select value={valores.ubicacion || undefined} onValueChange={set("ubicacion")}>
                <SelectTrigger className={cn("w-full", inputClass, claseError(errores.ubicacion))} aria-invalid={!!errores.ubicacion}>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesUbicacion.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errores.ubicacion && <p className="text-xs text-red-500">{errores.ubicacion}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Tipo de área *</Label>
              <Select value={valores.tipoDeArea || undefined} onValueChange={set("tipoDeArea")}>
                <SelectTrigger className={cn("w-full", inputClass, claseError(errores.tipo_de_area))} aria-invalid={!!errores.tipo_de_area}>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesTipo.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errores.tipo_de_area && <p className="text-xs text-red-500">{errores.tipo_de_area}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Estatus del área</Label>
              <Select value={valores.disponibilidad} onValueChange={set("disponibilidad")}>
                <SelectTrigger className={`w-full ${inputClass}`}>
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesDisponibilidad.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {capitalizar(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Estado</Label>
              <Select value={valores.estado} onValueChange={(v) => set("estado")(v as AreaState)}>
                <SelectTrigger className={`w-full ${inputClass}`}>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`editar-tag-${area.recordId}`} className={labelClass}>Tag ID</Label>
              <TagIdInput
                id={`editar-tag-${area.recordId}`}
                value={valores.tagId}
                onChange={set("tagId")}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`editar-multiple-${area.recordId}`} className={labelClass}>Múltiple ubicación</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  id={`editar-multiple-${area.recordId}`}
                  checked={valores.multipleUbicacion}
                  onCheckedChange={set("multipleUbicacion")}
                  className="data-[state=checked]:bg-blue-600"
                />
                <span className="text-sm text-gray-600">{valores.multipleUbicacion ? "Sí" : "No"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="text-blue-500 w-5 h-5" />
            <h3 className="font-semibold text-gray-700">Geolocalización</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Dirección</Label>
            <SelectorDireccion value={valores.direccion} onChange={set("direccion")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Geolocalización del área</Label>
            <MapaSelectorPunto value={valores.geolocalizacion} onChange={set("geolocalizacion")} />
            {errores.geolocalizacion && <p className="text-xs text-red-500">{errores.geolocalizacion}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ListChecks className="text-blue-500 w-5 h-5" />
            <h3 className="font-semibold text-gray-700">Utilizar área en</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AREA_USOS.map((uso) => (
              <label
                key={uso.value}
                htmlFor={`editar-uso-${area.recordId}-${uso.value}`}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <Checkbox
                  id={`editar-uso-${area.recordId}-${uso.value}`}
                  checked={valores.usos.includes(uso.value)}
                  onCheckedChange={() => toggleUso(uso.value)}
                />
                {uso.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="text-blue-500 w-5 h-5" />
            <h3 className="font-semibold text-gray-700">Foto del área</h3>
          </div>
          <LoadImage
            id={`editar-foto-${area.recordId}`}
            titulo="Foto del área"
            setImg={setFoto}
            showWebcamOption={true}
            facingMode="environment"
            imgArray={valores.foto}
            limit={1}
            onLoadingChange={setIsUploadingFoto}
          />
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${footerClassName}`}>
        <div className="flex gap-3">
          {onCancel && (
            <Button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              onClick={onCancel}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
          )}
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            onClick={handleSubmit}
            disabled={!puedeGuardar}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : isUploadingFoto ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Subiendo foto...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
        {!esValido && !isUpdating && (
          <p className="text-right text-xs text-red-500">Revisa los campos marcados en rojo.</p>
        )}
      </div>
    </>
  );
}
