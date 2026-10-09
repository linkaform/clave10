"use client";

import * as React from "react";
import { Building2, MapPin, Phone } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogoEstados } from "@/lib/utils";
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";

interface UbicacionFormFieldsProps {
  form: UbicacionFormData;
  setForm: React.Dispatch<React.SetStateAction<UbicacionFormData>>;
  /** Placeholder del nombre (ubicación o contacto). */
  nombrePlaceholder?: string;
  /** Prefijo de los id de los inputs, para que no choquen entre formularios. */
  idPrefix?: string;
}

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputClass = "bg-white border-gray-200";

// Campos de nombre + dirección + contacto, compartidos por el modal de nueva
// ubicación y el de nuevo contacto (botón "+" del selector de dirección).
export function UbicacionFormFields({
  form,
  setForm,
  nombrePlaceholder = "Ej. Planta Monterrey",
  idPrefix = "ubicacion",
}: UbicacionFormFieldsProps) {
  const setField = (key: keyof UbicacionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="text-blue-500 w-5 h-5" />
        <h3 className="font-semibold text-gray-700">Información general</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-nombre`} className={labelClass}>Nombre *</Label>
        <Input
          id={`${idPrefix}-nombre`}
          value={form.nombre}
          onChange={setField("nombre")}
          placeholder={nombrePlaceholder}
          className={inputClass}
        />
      </div>
    </div>

    <div className="p-5 pt-0 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="text-blue-500 w-5 h-5" />
        <h3 className="font-semibold text-gray-700">Dirección</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-direccion`} className={labelClass}>Dirección</Label>
          <Input id={`${idPrefix}-direccion`} value={form.direccion} onChange={setField("direccion")} placeholder="Calle y número" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-colonia`} className={labelClass}>Colonia</Label>
          <Input id={`${idPrefix}-colonia`} value={form.colonia} onChange={setField("colonia")} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-ciudad`} className={labelClass}>Ciudad</Label>
          <Input id={`${idPrefix}-ciudad`} value={form.ciudad} onChange={setField("ciudad")} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={labelClass}>Estado</Label>
          <Select
            value={form.estado || undefined}
            onValueChange={(value) => setForm((prev) => ({ ...prev, estado: value }))}
          >
            <SelectTrigger className={`w-full ${inputClass}`}>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {catalogoEstados().map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-pais`} className={labelClass}>País</Label>
          <Input id={`${idPrefix}-pais`} value={form.pais} onChange={setField("pais")} placeholder="México" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-cp`} className={labelClass}>Código Postal</Label>
          <Input id={`${idPrefix}-cp`} value={form.codigo_postal} onChange={setField("codigo_postal")} className={inputClass} />
        </div>
      </div>
    </div>

    <div className="p-5 pt-0 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Phone className="text-blue-500 w-5 h-5" />
        <h3 className="font-semibold text-gray-700">Contacto</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-telefono`} className={labelClass}>Teléfono</Label>
          <PhoneInput
            id={`${idPrefix}-telefono`}
            limitMaxLength
            value={form.telefono}
            onChange={(value) => setForm((prev) => ({ ...prev, telefono: value || "" }))}
            placeholder="Teléfono"
            defaultCountry="MX"
            containerComponentProps={{
              className:
                "flex h-10 w-full rounded-md border border-gray-200 bg-white pl-3 py-0 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 md:text-sm",
            }}
            numberInputProps={{
              className: "pl-3 bg-transparent outline-none h-full flex-1",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-email`} className={labelClass}>Email</Label>
          <Input id={`${idPrefix}-email`} type="email" value={form.email} onChange={setField("email")} placeholder="correo@empresa.com" className={inputClass} />
        </div>
      </div>
    </div>
    </>
  );
}
