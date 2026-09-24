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

const MapaSelectorPunto = dynamic(() => import("./MapaSelectorPunto"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />,
});

// TODO: reemplazar por el catálogo de direcciones cuando exista el servicio.
// La dirección elegida es la que da la geolocalización del área.
const DIRECCIONES_PROVISIONALES = ["Planta Monterrey"];

const capitalizar = (texto: string) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto);

interface NuevaAreaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Alta de un área desde el explorador de Áreas. A diferencia de
// Ubicaciones/AreaCreateModal (que recibe la ubicación fija desde su
// detalle), aquí se elige la ubicación.
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
  const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleUso = (value: AreaUso) =>
    setUsos((prev) => (prev.includes(value) ? prev.filter((u) => u !== value) : [...prev, value]));

  const isUploading = isUploadingFoto;
  const puedeGuardar = !!nombre.trim() && !!ubicacion && !!tipoDeArea && !isUploading;

  const handleSubmit = async () => {
    if (!puedeGuardar) return;
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
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Ubicación *</Label>
                <Select value={ubicacion || undefined} onValueChange={setUbicacion}>
                  <SelectTrigger className={`w-full ${inputClass}`}>
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
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Tipo de área *</Label>
                <Select value={tipoDeArea || undefined} onValueChange={setTipoDeArea}>
                  <SelectTrigger className={`w-full ${inputClass}`}>
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
                <Input
                  id="area-tag-id"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="Ej. 698653701b7735a0a164b4e0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Geolocalización</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Selecciona el punto en el mapa</Label>
              <MapaSelectorPunto value={geolocalizacion} onChange={setGeolocalizacion} />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {geolocalizacion ? (
                  <>
                    <span>
                      {geolocalizacion.latitude.toFixed(6)}, {geolocalizacion.longitude.toFixed(6)}
                    </span>
                    <button
                      type="button"
                      className="text-red-500 hover:underline"
                      onClick={() => setGeolocalizacion(null)}
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <span>Haz clic en el mapa para colocar el punto; puedes arrastrarlo para ajustarlo.</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Dirección</Label>
              <Select value={direccion || undefined} onValueChange={setDireccion}>
                <SelectTrigger className={`w-full ${inputClass}`}>
                  <SelectValue placeholder="Selecciona una dirección" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECCIONES_PROVISIONALES.map((dir) => (
                    <SelectItem key={dir} value={dir}>
                      {dir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            disabled={isCreating || !puedeGuardar}
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
      </DialogContent>
    </Dialog>
  );
}
