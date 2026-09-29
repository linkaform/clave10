"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Camera, LayoutGrid, ListChecks, Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadImage, { Imagen } from "@/components/upload-Image";
import { useCreateArea } from "@/hooks/Areas/useCreateArea";
import { AREA_USOS, AreaUso, AreaStatus } from "@/lib/areas-sdk";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import type { PuntoGeo } from "./MapaSelectorPunto";
import { SelectorDireccion } from "./SelectorDireccion";
import { TagIdInput } from "./TagIdInput";
import { claseError, validarAreaForm } from "@/lib/areas-schema";
import { cn } from "@/lib/utils";

const MapaSelectorPunto = dynamic(() => import("./MapaSelectorPunto"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />,
});

const capitalizar = (texto: string) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto);

interface NuevaAreaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Alta de un área desde el explorador de Áreas. A diferencia de
// Ubicaciones/AreaCreateModal (que recibe la ubicación fija desde su
// detalle), aquí se elige la ubicación. La edición vive en EditarAreaForm
// (tab "Configuración" del detalle).
export function NuevaAreaModal({ open, onOpenChange }: NuevaAreaModalProps) {
  const { tiposDeArea, disponibilidadOptions, handleCreateArea, isCreating } = useCreateArea();
  const { locations } = useAreasLocationStore();
  const { selectedLocations } = useSelectedLocationsStore();

  const [nombre, setNombre] = React.useState("");
  const [ubicacion, setUbicacion] = React.useState("");
  const [tipoDeArea, setTipoDeArea] = React.useState("");
  const [disponibilidad, setDisponibilidad] = React.useState<AreaStatus>("disponible");
  const [geolocalizacion, setGeolocalizacion] = React.useState<PuntoGeo | null>(null);
  const [direccion, setDireccion] = React.useState("");
  const [tagId, setTagId] = React.useState("");
  const [usos, setUsos] = React.useState<AreaUso[]>([]);
  const [foto, setFoto] = React.useState<Imagen[]>([]);
  const [multipleUbicacion, setMultipleUbicacion] = React.useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);
  // Los errores se pintan después del primer intento de guardar, y de ahí en vivo.
  const [intentoGuardar, setIntentoGuardar] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setNombre("");
    // Si en el header hay una sola ubicación seleccionada, se propone esa.
    setUbicacion(selectedLocations.length === 1 ? selectedLocations[0] : "");
    setTipoDeArea("");
    setDisponibilidad("disponible");
    setGeolocalizacion(null);
    setDireccion("");
    setTagId("");
    setUsos([]);
    setFoto([]);
    setMultipleUbicacion(false);
    setIntentoGuardar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleUso = (value: AreaUso) =>
    setUsos((prev) => (prev.includes(value) ? prev.filter((u) => u !== value) : [...prev, value]));

  const isUploading = isUploadingFoto;
  const erroresValidacion = validarAreaForm({ nombre, ubicacion, tipo_de_area: tipoDeArea, geolocalizacion });
  const errores = intentoGuardar ? erroresValidacion : {};
  const esValido = Object.keys(erroresValidacion).length === 0;

  const handleSubmit = async () => {
    setIntentoGuardar(true);
    if (!esValido || isUploading) return;
    const ok = await handleCreateArea({
      nombre,
      ubicacion,
      tipo_de_area: tipoDeArea,
      area_status: disponibilidad,
      // El estado (activa/inactiva) no se elige al crear: siempre nace activa.
      area_state: "activa",
      tag_id: tagId,
      direccion,
      geolocalizacion,
      usos,
      foto_area: foto,
      multiple_ubicacion: multipleUbicacion ? "si" : "no",
    });
    if (ok) onOpenChange(false);
  };

  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
  const inputClass = "bg-white border-gray-200";
  const opcionesDisponibilidad =
    disponibilidadOptions.length > 0 ? disponibilidadOptions : [{ value: "disponible", label: "disponible" }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">Nueva área</DialogTitle>
          <p className="text-center text-sm text-gray-400">Completa la información para registrar el área</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información general</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="area-nombre" className={labelClass}>Nombre del área *</Label>
                <Input
                  id="area-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Bodega Norte"
                  className={cn(inputClass, claseError(errores.nombre))}
                  aria-invalid={!!errores.nombre}
                />
                {errores.nombre && <p className="text-xs text-red-500">{errores.nombre}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Ubicación *</Label>
                <Select value={ubicacion || undefined} onValueChange={setUbicacion}>
                  <SelectTrigger className={cn("w-full", inputClass, claseError(errores.ubicacion))} aria-invalid={!!errores.ubicacion}>
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.ubicacion && <p className="text-xs text-red-500">{errores.ubicacion}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Tipo de área *</Label>
                <Select value={tipoDeArea || undefined} onValueChange={setTipoDeArea}>
                  <SelectTrigger className={cn("w-full", inputClass, claseError(errores.tipo_de_area))} aria-invalid={!!errores.tipo_de_area}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDeArea.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.tipo_de_area && <p className="text-xs text-red-500">{errores.tipo_de_area}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Estatus del área</Label>
                <Select value={disponibilidad} onValueChange={setDisponibilidad}>
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
                <Label htmlFor="area-tag-id" className={labelClass}>Tag ID</Label>
                <TagIdInput id="area-tag-id" value={tagId} onChange={setTagId} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="area-multiple-ubicacion" className={labelClass}>Múltiple ubicación</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id="area-multiple-ubicacion"
                    checked={multipleUbicacion}
                    onCheckedChange={setMultipleUbicacion}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="text-sm text-gray-600">{multipleUbicacion ? "Sí" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Geolocalización</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Dirección</Label>
              <SelectorDireccion value={direccion} onChange={setDireccion} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Geolocalización del área</Label>
              <MapaSelectorPunto value={geolocalizacion} onChange={setGeolocalizacion} />
              {errores.geolocalizacion && <p className="text-xs text-red-500">{errores.geolocalizacion}</p>}
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <ListChecks className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Utilizar área en</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AREA_USOS.map((uso) => (
                <label
                  key={uso.value}
                  htmlFor={`uso-${uso.value}`}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <Checkbox
                    id={`uso-${uso.value}`}
                    checked={usos.includes(uso.value)}
                    onCheckedChange={() => toggleUso(uso.value)}
                  />
                  {uso.label}
                </label>
              ))}
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Foto del área</h3>
            </div>
            <LoadImage
              id="foto-area"
              titulo="Foto del área"
              setImg={setFoto}
              showWebcamOption={true}
              facingMode="environment"
              imgArray={foto}
              limit={1}
              onLoadingChange={setIsUploadingFoto}
            />
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            onClick={handleSubmit}
            disabled={isCreating || isUploading}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creando...
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Subiendo foto...
              </>
            ) : (
              "Crear área"
            )}
          </Button>
        </div>
        {intentoGuardar && !esValido && !isCreating && (
          <p className="flex-shrink-0 bg-white px-6 pb-3 -mt-2 text-right text-xs text-red-500">
            Revisa los campos marcados en rojo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
