"use client";

import * as React from "react";
import { Clock, DoorOpen, FileText, Image as ImageIcon, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import LoadImage from "@/components/upload-Image";
import LoadFile from "@/components/upload-file";
import { useConfigSeguridadUbicacion } from "@/hooks/Ubicaciones/useConfigSeguridadUbicacion";
import {
  ArchivoConfig,
  ConfigSeguridadUbicacion,
  diffConfigSeguridad,
  OPCIONES_CONFIG_SEGURIDAD,
} from "@/lib/ubicaciones";

interface OpcionesAvanzadasUbicacionProps {
  ubicacion: string;
}

type ListaKey = keyof typeof OPCIONES_CONFIG_SEGURIDAD;
type NumeroKey = "tolerancia_de_entrada_previa" | "tolerancia_de_entrada_posterior" | "prefijo_telefonico";

// Mismo estilo que el tab "Configuración" (EditarUbicacionForm).
const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const chipActivo = "border-blue-300 bg-blue-50 text-blue-700";
const checkClass = "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600";

// Sección: título con icono (igual que en Configuración) y sus filas dentro
// de una tarjeta gris, como el detalle del contacto en SelectorContacto.
function Seccion({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof Ticket;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600">
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">{children}</div>
    </section>
  );
}

// Fila: etiqueta (y ayuda) a la izquierda, control a la derecha; en móvil se apila.
// textoAncho: la etiqueta ocupa todo el ancho y el control (un switch) queda
// pegado a la derecha, en vez de la columna fija que alinea los demás controles.
function Fila({
  titulo,
  ayuda,
  htmlFor,
  textoAncho = false,
  children,
}: {
  titulo: string;
  ayuda?: string;
  htmlFor?: string;
  textoAncho?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
      <div className={`flex flex-col gap-1 ${textoAncho ? "sm:flex-1" : "sm:w-52 sm:shrink-0"}`}>
        <Label htmlFor={htmlFor} className={labelClass}>
          {titulo}
        </Label>
        {ayuda && <span className="text-xs text-slate-400">{ayuda}</span>}
      </div>
      <div className={textoAncho ? "shrink-0" : "flex-1 min-w-0"}>{children}</div>
    </div>
  );
}

// Tab "Opciones avanzadas" del detalle: configuración del módulo de seguridad
// de ESTA ubicación (su fila del grupo "Requisitos de Accesos"). Al guardar
// solo viajan los campos que cambiaron; ver updateConfigSeguridadUbicacionSdk.
export function OpcionesAvanzadasUbicacion({ ubicacion }: OpcionesAvanzadasUbicacionProps) {
  const { config, isLoading, isPlaceholderData, error, handleUpdateConfig } = useConfigSeguridadUbicacion(ubicacion);
  const [form, setForm] = React.useState<ConfigSeguridadUbicacion | null>(null);
  const [subiendo, setSubiendo] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Al guardar se vuelve a pedir la config y el formulario toma lo guardado.
  React.useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const cambios = React.useMemo(
    () => (config && form ? diffConfigSeguridad(config, form) : {}),
    [config, form],
  );
  const hayCambios = Object.keys(cambios).length > 0;

  if (isLoading || (!form && !error)) {
    return <div className="flex items-center justify-center h-24 text-sm text-gray-400">Cargando opciones avanzadas...</div>;
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-red-400 text-center">
        No se pudieron cargar las opciones avanzadas de esta ubicación.
      </div>
    );
  }

  const set = <K extends keyof ConfigSeguridadUbicacion>(key: K, value: ConfigSeguridadUbicacion[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const toggle = (key: ListaKey, value: string, checked: boolean) => {
    const actual = form[key];
    set(key, checked ? [...actual.filter((v) => v !== value), value] : actual.filter((v) => v !== value));
  };

  // LoadImage / LoadFile esperan un setState de arreglo; se adapta al campo.
  const setArchivos =
    (key: "logo_por_ubicacion" | "doc_condiciones_servicio") =>
    (updater: React.SetStateAction<ArchivoConfig[]>) =>
      setForm((prev) =>
        prev ? { ...prev, [key]: typeof updater === "function" ? updater(prev[key]) : updater } : prev,
      );

  // Las opciones se muestran tal cual vienen del back. Un campo con datos se
  // ve aunque su opción no esté marcada (pases lo muestra por contenido); se
  // usa lo cargado, no lo que se escribe, para que no desaparezca al borrar.
  const condiciones = form.opcion_condiciones_servicio;
  const verCondicion = {
    descripcion: condiciones.includes("descripción") || !!config?.desc_condiciones_servicio,
    video: condiciones.includes("vídeo") || !!config?.url_condiciones_servicio,
    documento: condiciones.includes("documento") || !!config?.doc_condiciones_servicio.length,
  };

  const handleSubmit = async () => {
    if (!hayCambios || isSubmitting || subiendo || isPlaceholderData) return;
    setIsSubmitting(true);
    try {
      await handleUpdateConfig(cambios);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opciones de un checkbox de la forma, como casillas del mismo ancho.
  const opciones = (key: ListaKey) => (
    <div className="grid grid-cols-2 gap-2">
      {OPCIONES_CONFIG_SEGURIDAD[key].map((opcion) => {
        const id = `avanzadas-${key}-${opcion.value}`;
        const checked = form[key].includes(opcion.value);
        return (
          <label
            key={opcion.value}
            htmlFor={id}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
              checked ? chipActivo : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Checkbox
              id={id}
              className={checkClass}
              checked={checked}
              onCheckedChange={(value) => toggle(key, opcion.value, value === true)}
            />
            {opcion.label}
          </label>
        );
      })}
    </div>
  );

  const switchSiNo = (key: "auto_activacion" | "acompanantes_requeridos") => (
    <div className="flex sm:justify-end">
      <Switch
        id={`avanzadas-${key}`}
        className="data-[state=checked]:bg-blue-600"
        checked={form[key] === "sí"}
        onCheckedChange={(checked) => set(key, checked ? "sí" : "no")}
      />
    </div>
  );

  const numero = (key: NumeroKey, placeholder: string, sufijo?: string) => (
    <div className="relative w-32">
      <Input
        id={`avanzadas-${key}`}
        inputMode="numeric"
        placeholder={placeholder}
        value={form[key] ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          set(key, raw === "" ? null : Number(raw));
        }}
        className={`bg-white border-gray-200 ${sufijo ? "pr-12" : ""}`}
      />
      {sufijo && (
        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400`}>
          {sufijo}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-1">
      {isPlaceholderData && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Actualizando la configuración de esta ubicación...
        </div>
      )}

      {/* Con datos de la caché del menú el formulario es solo de lectura. */}
      <fieldset disabled={isPlaceholderData} className="flex flex-col gap-6 min-w-0">
        <Seccion icon={Ticket} titulo="Pases de entrada">
          <Fila titulo="Datos requeridos" ayuda="Lo que se pide al visitante.">
            {opciones("datos_requeridos")}
          </Fila>
          <Fila titulo="Se envía el pase por">{opciones("envio_por")}</Fila>
          <Fila
            titulo="Auto activación"
            ayuda={'Ofrece "Activar pase por defecto" al crear un pase.'}
            htmlFor="avanzadas-auto_activacion"
            textoAncho
          >
            {switchSiNo("auto_activacion")}
          </Fila>
          <Fila
            titulo="Acompañantes requeridos"
            ayuda="El pase pide capturar a los acompañantes."
            htmlFor="avanzadas-acompanantes_requeridos"
            textoAncho
          >
            {switchSiNo("acompanantes_requeridos")}
          </Fila>
        </Seccion>

        <Seccion icon={DoorOpen} titulo="Acceso">
          <Fila titulo="Configuración de accesos">{opciones("configuracion_de_accesos")}</Fila>
        </Seccion>

        <Seccion icon={Clock} titulo="Tolerancias y teléfono">
          <Fila
            titulo="Entrada previa"
            ayuda="Minutos antes de la cita. Vacío = 15."
            htmlFor="avanzadas-tolerancia_de_entrada_previa"
          >
            {numero("tolerancia_de_entrada_previa", "15", "min")}
          </Fila>
          <Fila
            titulo="Entrada posterior"
            ayuda="Minutos después de la cita. Vacío = 15."
            htmlFor="avanzadas-tolerancia_de_entrada_posterior"
          >
            {numero("tolerancia_de_entrada_posterior", "15", "min")}
          </Fila>
          <Fila titulo="Prefijo telefónico" ayuda="Código de país, sin el +." htmlFor="avanzadas-prefijo_telefonico">
            {numero("prefijo_telefonico", "52")}
          </Fila>
        </Seccion>

        <Seccion icon={FileText} titulo="Condiciones de servicio">
          <Fila titulo="Se muestran como">{opciones("opcion_condiciones_servicio")}</Fila>
          {verCondicion.descripcion && (
            <Fila titulo="Descripción" htmlFor="avanzadas-desc-condiciones">
              <Textarea
                id="avanzadas-desc-condiciones"
                rows={4}
                className="bg-white border-gray-200"
                value={form.desc_condiciones_servicio}
                onChange={(e) => set("desc_condiciones_servicio", e.target.value)}
              />
            </Fila>
          )}
          {verCondicion.video && (
            <Fila titulo="Url del vídeo" htmlFor="avanzadas-url-condiciones">
              <Input
                id="avanzadas-url-condiciones"
                type="url"
                placeholder="https://"
                className="bg-white border-gray-200"
                value={form.url_condiciones_servicio}
                onChange={(e) => set("url_condiciones_servicio", e.target.value)}
              />
            </Fila>
          )}
          {verCondicion.documento && (
            <Fila titulo="Documento">
              <LoadFile
                id="avanzadas-doc-condiciones"
                titulo="Documento"
                docArray={form.doc_condiciones_servicio}
                setDocs={setArchivos("doc_condiciones_servicio")}
                limit={1}
              />
            </Fila>
          )}
        </Seccion>

        <Seccion icon={ImageIcon} titulo="Logo en el pase">
          <Fila titulo="Logo de la ubicación" ayuda="Si se deja vacío, se usa el logotipo general de la cuenta.">
            <LoadImage
              id="avanzadas-logo"
              titulo="Logo"
              imgArray={form.logo_por_ubicacion}
              setImg={setArchivos("logo_por_ubicacion")}
              showWebcamOption={false}
              facingMode="environment"
              limit={1}
              onLoadingChange={setSubiendo}
            />
          </Fila>
        </Seccion>
      </fieldset>

      <div className="flex gap-3">
        <Button
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          onClick={() => config && setForm(config)}
          disabled={!hayCambios || isSubmitting}
        >
          Descartar cambios
        </Button>
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
          onClick={handleSubmit}
          disabled={!hayCambios || isSubmitting || subiendo || isPlaceholderData}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
