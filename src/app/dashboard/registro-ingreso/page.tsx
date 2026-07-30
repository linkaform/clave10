"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getConfSeguridad } from "@/lib/get-configuracion-seguridad";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import {
  EntryPassModalCreate,
  NuevoPaseWalkinData,
} from "@/components/modals/add-pass-create-modal";
import LoadImage from "@/components/upload-Image";
import { Car, Laptop, X, MapPin, DoorOpen, Loader2, ArrowLeft } from "lucide-react";
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule";
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo";
import Image from "next/image";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import AvisoPrivacidad from "@/components/modals/aviso-priv-eng";
import FirmaReglasAcceso, { FirmaValue } from "@/components/reglas-de-acceso";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TODO: quitar estos tres fallbacks una vez que get_config_modulo_seguridad
// regrese condiciones_servicio (doc/video/desc) de forma consistente. Solo
// sirven para poder ver/probar la pantalla de "Reglas de acceso" mientras el
// servicio la regresa vacía.
const FALLBACK_DOC_CONDICIONES_SERVICIO =
  "https://f001.backblazeb2.com/file/app-linkaform/public-client-30335/150601/6a4c673722f825e7b3e46469/6a4fdfd02ae21bb51b53b609.pdf";
const FALLBACK_VIDEO_CONDICIONES_SERVICIO =
  "https://www.youtube.com/watch?v=hIyW8Rg5ka4&themeRefresh=1";
const FALLBACK_DESC_CONDICIONES_SERVICIO = `Términos y Condiciones de Servicio

Última actualización: [FECHA]

Bienvenido/a a [NOMBRE DE LA EMPRESA/PRODUCTO] ("nosotros", "nuestro" o "la Empresa"). Estos Términos y Condiciones de Servicio ("Términos") regulan el acceso y uso de [nombre del sitio web, aplicación o servicio] (el "Servicio"). Al acceder o utilizar el Servicio, aceptas quedar vinculado/a por estos Términos. Si no estás de acuerdo, no debes utilizar el Servicio.

1. Aceptación de los Términos

Al registrarte, acceder o utilizar el Servicio, confirmas que:

Tienes al menos 18 años de edad, o cuentas con el consentimiento de un padre, madre o tutor legal.
Tienes la capacidad legal para celebrar un contrato vinculante.
Cumplirás con estos Términos y con todas las leyes y regulaciones aplicables.

2. Descripción del Servicio

[NOMBRE DE LA EMPRESA] ofrece [breve descripción del producto o servicio: por ejemplo, "una plataforma de gestión de proyectos en línea" o "una aplicación móvil para el seguimiento de hábitos"]. Nos reservamos el derecho de modificar, suspender o discontinuar el Servicio, total o parcialmente, en cualquier momento y sin previo aviso.

3. Cuentas de Usuario

3.1. Para utilizar ciertas funciones del Servicio, deberás crear una cuenta proporcionando información veraz, completa y actualizada.

3.2. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.

3.3. Debes notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.

3.4. Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos Términos.

4. Uso Aceptable

Al utilizar el Servicio, te comprometes a NO:

Violar leyes o regulaciones aplicables.
Publicar contenido difamatorio, obsceno, discriminatorio o que infrinja derechos de terceros.
Intentar acceder sin autorización a sistemas, servidores o cuentas de otros usuarios.
Distribuir virus, malware o cualquier código malicioso.
Utilizar el Servicio para enviar spam o comunicaciones no solicitadas.
Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del Servicio.

El incumplimiento de esta sección puede resultar en la suspensión o terminación inmediata de tu cuenta.

5. Contenido del Usuario

5.1. Mantienes la propiedad de cualquier contenido que subas, publiques o compartas a través del Servicio ("Contenido de Usuario").

5.2. Al publicar Contenido de Usuario, nos otorgas una licencia no exclusiva, mundial, libre de regalías, para usar, almacenar, reproducir y mostrar dicho contenido con el único fin de operar y mejorar el Servicio.

5.3. Eres el único responsable de tu Contenido de Usuario y garantizas que tienes los derechos necesarios para compartirlo.

6. Propiedad Intelectual

Todo el contenido, marcas, logotipos, software y materiales del Servicio (excluyendo el Contenido de Usuario) son propiedad de [NOMBRE DE LA EMPRESA] o de sus licenciantes, y están protegidos por leyes de propiedad intelectual. No se concede ninguna licencia ni derecho sobre dicho contenido salvo lo expresamente indicado en estos Términos.

7. Pagos y Suscripciones (si aplica)

7.1. Algunos servicios pueden requerir el pago de una tarifa. Los precios se indicarán claramente antes de la compra.

7.2. Las suscripciones se renuevan automáticamente al final de cada periodo, salvo que se cancelen antes de la fecha de renovación.

7.3. Salvo que la ley exija lo contrario, los pagos realizados no son reembolsables.

7.4. Nos reservamos el derecho de modificar los precios, notificando con [30] días de anticipación.

8. Privacidad

El uso del Servicio también se rige por nuestra [Política de Privacidad], la cual describe cómo recopilamos, usamos y protegemos tu información personal. Al usar el Servicio, aceptas dicha política.

9. Terminación

9.1. Puedes dejar de usar el Servicio y cancelar tu cuenta en cualquier momento.

9.2. Podemos suspender o terminar tu acceso al Servicio, con o sin previo aviso, si consideramos que has incumplido estos Términos o por cualquier otra razón a nuestra discreción.

9.3. Las disposiciones que por su naturaleza deban sobrevivir a la terminación (propiedad intelectual, limitación de responsabilidad, ley aplicable, etc.) permanecerán vigentes.

10. Exclusión de Garantías

El Servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluyendo, entre otras, garantías de comerciabilidad, idoneidad para un propósito particular o no infracción. No garantizamos que el Servicio será ininterrumpido, seguro o libre de errores.

11. Limitación de Responsabilidad

En la máxima medida permitida por la ley, [NOMBRE DE LA EMPRESA] no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por pérdida de beneficios, datos o uso, derivados del uso o la imposibilidad de uso del Servicio, incluso si se nos ha advertido de la posibilidad de dichos daños.

12. Indemnización

Aceptas indemnizar y mantener indemne a [NOMBRE DE LA EMPRESA], sus directivos, empleados y afiliados, frente a cualquier reclamo, daño, pérdida o gasto (incluidos honorarios legales razonables) derivado de tu uso del Servicio o de tu incumplimiento de estos Términos.

13. Modificaciones a los Términos

Podemos actualizar estos Términos periódicamente. Notificaremos los cambios significativos publicando la nueva versión en el Servicio y actualizando la fecha de "Última actualización". El uso continuado del Servicio tras dichos cambios constituye tu aceptación de los nuevos Términos.`;

const createSchema = (requireFoto: boolean, requireIden: boolean) =>
  z
    .object({
      nombre: z.string().min(1, "Campo requerido"),
      empresa: z.string().min(1, "Campo requerido"),
      email: z.string().optional().default(""),
      telefono: z.string().optional().default(""),
      visita_nombre: z.string().optional().default(""),
      visita_email: z.string().optional().default(""),
      visita_telefono: z.string().optional().default(""),
      motivo: z.string().min(1, "Campo requerido"),
      walkin_fotografia: z
        .array(z.object({ file_url: z.string(), file_name: z.string() }))
        .default([]),
      walkin_identificacion: z
        .array(z.object({ file_url: z.string(), file_name: z.string() }))
        .default([]),
      acepto_aviso_privacidad: z.boolean().refine((val) => val === true, {
        message: "Debes aceptar el aviso de privacidad",
      }),
    })
    .superRefine((data, ctx) => {
      if (data.email && !emailRegex.test(data.email)) {
        ctx.addIssue({
          path: ["email"],
          message: "Correo inválido",
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.visita_email && !emailRegex.test(data.visita_email)) {
        ctx.addIssue({
          path: ["visita_email"],
          message: "Correo inválido",
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.telefono && !isValidPhoneNumber(data.telefono)) {
        ctx.addIssue({
          path: ["telefono"],
          message: "Teléfono inválido",
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.visita_telefono && !isValidPhoneNumber(data.visita_telefono)) {
        ctx.addIssue({
          path: ["visita_telefono"],
          message: "Teléfono inválido",
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.visita_nombre && !data.visita_email && !data.visita_telefono) {
        ctx.addIssue({
          path: ["visita_nombre"],
          message: "Debes llenar al menos uno: Nombre, Email o Teléfono",
          code: z.ZodIssueCode.custom,
        });
      }
      if (requireFoto && data.walkin_fotografia.length === 0) {
        ctx.addIssue({
          path: ["walkin_fotografia"],
          message: "La fotografía es obligatoria",
          code: z.ZodIssueCode.custom,
        });
      }
      if (requireIden && data.walkin_identificacion.length === 0) {
        ctx.addIssue({
          path: ["walkin_identificacion"],
          message: "La identificación es obligatoria",
          code: z.ZodIssueCode.custom,
        });
      }
    });

const RegistroIngresoPage = () => {
  const [ubicacion, setUbicacion] = useState("");
  const [caseta, setCaseta] = useState("");
  const [accountId, setAccountId] = useState<number>(0);

  // Trae la config completa de la ubicación (requerimientos de foto/id, y
  // las condiciones de servicio/reglas de acceso: video, documento y texto).
  // No se usa el hook compartido useGetConfSeguridad porque ese ya devuelve
  // solo `.requerimientos` (lo consume otra pantalla del dashboard); aquí
  // necesitamos el objeto completo, así que se llama directo al mismo lib.
  const { data: confData, isLoading: loadingConfig, isError: errorConfig } = useQuery<any>({
    queryKey: ["getConfSeguridadFull", ubicacion, accountId],
    enabled: !!ubicacion,
    queryFn: async () => {
      const res = await getConfSeguridad(ubicacion ? [ubicacion] : [], accountId || undefined);
      return res.response?.data ?? null;
    },
  });
  // Hasta que esto no sea true no se sabe con certeza si la ubicación trae
  // reglas de acceso configuradas — el botón "Continuar" se bloquea hasta
  // entonces para no saltarse ese paso por una condición de carrera.
  const configResuelta = confData !== undefined || errorConfig;
  // TODO: quitar este fallback una vez que get_config_modulo_seguridad
  // regrese requerimientos de forma consistente — por ahora siempre pide
  // foto e identificación para poder probar esa parte del formulario.
  const requireFoto = true;
  const requireIden = true;

  // Reglas de acceso (mismo patrón que pase-update): documento + video +
  // texto de condiciones de servicio. Si la ubicación no trae nada de esto,
  // el paso de firma se salta por completo.
  const reglasAccesoPdfUrl =
    confData?.condiciones_servicio?.doc_condiciones_servicio?.[0]?.file_url ||
    FALLBACK_DOC_CONDICIONES_SERVICIO;
  const hoyFormateado = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reglasAccesoDescripcion = (
    confData?.condiciones_servicio?.desc_condiciones_servicio || FALLBACK_DESC_CONDICIONES_SERVICIO
  ).replace(/\[FECHA\]/gi, hoyFormateado);

  const getDocumentViewerUrl = (url: string): string => {
    if (!url) return url;
    const isPdf = url.toLowerCase().split("?")[0].endsWith(".pdf");
    if (isPdf) return url;
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  };
  const reglasAccesoPdfViewerUrl = getDocumentViewerUrl(reglasAccesoPdfUrl);
  const reglasAccesoVideoUrlRaw =
    confData?.condiciones_servicio?.url_condiciones_servicio ||
    FALLBACK_VIDEO_CONDICIONES_SERVICIO;

  const getYoutubeEmbedUrl = (url: string): string => {
    try {
      const u = new URL(url);
      let videoId = "";
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else if (u.hostname.includes("youtube.com")) {
        videoId = u.searchParams.get("v") || "";
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };
  const reglasAccesoVideoUrl = reglasAccesoVideoUrlRaw
    ? getYoutubeEmbedUrl(reglasAccesoVideoUrlRaw)
    : "";
  const tieneReglasDeAcceso = Boolean(
    reglasAccesoPdfUrl || reglasAccesoVideoUrl || reglasAccesoDescripcion,
  );

  const [vehicles, setVehiculos] = useState<Vehiculo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [modalData, setModalData] = useState<NuevoPaseWalkinData | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Aviso de privacidad: mismo componente y manejo de historial que
  // pase-update, para que "atrás" del navegador cierre el overlay en vez de
  // salir de la página.
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [radioSelected, setRadioSelected] = useState("3 meses");

  // Paso intermedio de "Reglas de acceso + Firma": se muestra al dar
  // "Siguiente" en el formulario, solo si la ubicación trae condiciones de
  // servicio configuradas. El botón "Siguiente" de ese paso queda
  // deshabilitado hasta que exista una firma válida.
  const [mostrarFirmaReglas, setMostrarFirmaReglas] = useState(false);
  const [pendingFormattedData, setPendingFormattedData] = useState<NuevoPaseWalkinData | null>(null);
  const [firmaReglasAcceso, setFirmaReglasAcceso] = useState<FirmaValue>({
    file_url: "",
    file_name: "",
  });

  useEffect(() => {
    const handlePopState = () => {
      setMostrarAviso(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openAviso = () => {
    window.history.pushState({ modal: "aviso-privacidad" }, "");
    setMostrarAviso(true);
  };

  const closeAviso = () => {
    window.history.back();
  };

  const setMostrarAvisoConHistory: Dispatch<SetStateAction<boolean>> = (value) => {
    const next = typeof value === "function"
      ? (value as (prev: boolean) => boolean)(mostrarAviso)
      : value;
    if (next) {
      openAviso();
    } else {
      closeAviso();
    }
  };

  const formSchema = useMemo(
    () => createSchema(requireFoto, requireIden),
    [requireFoto, requireIden],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      visita_nombre: "",
      visita_email: "",
      visita_telefono: "",
      motivo: "",
      walkin_fotografia: [],
      walkin_identificacion: [],
      acepto_aviso_privacidad: false,
    },
  });

  useEffect(() => {
    form.trigger();
  }, [form, requireFoto, requireIden]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ub = (params.get("ubicacion") ?? "").replace(/"/g, "");
      const ca = (params.get("caseta") ?? "").replace(/"/g, "");
      const acc = parseInt(params.get("acc_id") ?? "", 10) || 0;
      setUbicacion(ub);
      setCaseta(ca);
      setAccountId(acc);
    }
  }, []);

  useEffect(() => {
    if (form.formState.errors) {
      console.log("error", form.formState.errors);
    }
  }, [form.formState.errors]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formattedData: NuevoPaseWalkinData = {
      nombre: data.nombre,
      empresa: data.empresa,
      email: data.email || "",
      telefono: data.telefono || "",
      ubicacion,
      caseta,
      visita_nombre: data.visita_nombre || "",
      visita_email: data.visita_email || "",
      visita_telefono: data.visita_telefono || "",
      motivo: data.motivo,
      walkin_fotografia: data.walkin_fotografia,
      walkin_identificacion: data.walkin_identificacion,
      equipos,
      vehiculos: vehicles,
      acepto_aviso_privacidad: data.acepto_aviso_privacidad,
      conservar_datos_por: radioSelected,
    };

    if (tieneReglasDeAcceso) {
      setPendingFormattedData(formattedData);
      setFirmaReglasAcceso({ file_url: "", file_name: "" });
      setMostrarFirmaReglas(true);
      return;
    }

    setModalData(formattedData);
    setIsSuccess(true);
  };

  // Se ejecuta al dar "Siguiente" en el paso de Reglas de acceso + Firma,
  // una vez que la firma ya está lista. Toma el payload que se dejó
  // pendiente en el primer paso, le agrega firma_reglas_de_acceso, y recién
  // ahí abre el modal de confirmación.
  const handleContinuarConFirma = () => {
    if (!firmaReglasAcceso.file_url || !pendingFormattedData) return;
    setModalData({
      ...pendingFormattedData,
      firma_reglas_de_acceso: firmaReglasAcceso,
      acepto_reglas_ingreso: true,
    });
    setMostrarFirmaReglas(false);
    setIsSuccess(true);
  };

  const closeModal = () => {
    setIsSuccess(false);
  };

  const handleRemoveVehicle = (index: number) => {
    setVehiculos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveEquipo = (index: number) => {
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (form.formState.isSubmitted && !form.formState.isValid) {
      toast.error("Por favor completa los campos obligatorios correctamente.", {
        style: { background: "#dc2626", color: "#fff", border: "none" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.submitCount]);

  if (mostrarAviso) {
    return (
      <AvisoPrivacidad
        setMostrarAviso={setMostrarAvisoConHistory}
        radioSelected={radioSelected}
        setRadioSelected={setRadioSelected}
      />
    );
  }

  if (mostrarFirmaReglas) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center">
        <div className="w-full flex-1 overflow-y-auto px-4 py-6 pb-28 flex justify-center">
          <div className="w-full max-w-3xl text-left mx-auto">
            <button
              type="button"
              onClick={() => setMostrarFirmaReglas(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>

            <div className="mb-2 text-left">
              <h1 className="font-bold text-2xl text-slate-800 text-center">Reglas de acceso</h1>
              <p className="text-sm text-slate-500 mt-1 text-left">
                Debes leer y firmar el documento para poder continuar.
              </p>
            </div>

            {reglasAccesoDescripcion && (
              <p className="text-sm text-slate-600 mt-4 mb-4 whitespace-pre-line text-left">
                {reglasAccesoDescripcion}
              </p>
            )}

            <div className="flex flex-col gap-6 mt-6 mb-6">
              {reglasAccesoPdfUrl && (
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2 text-left">Documento</p>
                  <div className="w-full h-[60vh] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <iframe
                      src={reglasAccesoPdfViewerUrl}
                      className="w-full h-full"
                      title="Documento de reglas de acceso"
                    />
                  </div>
                </div>
              )}

              {reglasAccesoVideoUrl && (
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2 text-left">Video</p>
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm">
                    <iframe
                      src={reglasAccesoVideoUrl}
                      className="w-full h-full"
                      title="Video de reglas de acceso"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <FirmaReglasAcceso onFirmaChange={setFirmaReglasAcceso} />
            </div>
          </div>
        </div>

        <div className="w-full sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-center">
          <div className="w-full max-w-3xl flex justify-center mx-auto">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-1/2 disabled:opacity-40 disabled:cursor-not-allowed"
              variant="secondary"
              type="button"
              disabled={!firmaReglasAcceso.file_url}
              onClick={handleContinuarConFirma}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <EntryPassModalCreate
        title="Confirmación"
        data={modalData}
        isSuccess={isSuccess}
        setIsSuccess={setIsSuccess}
        onClose={closeModal}
        account_id={accountId}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pt-0">
        <h1 className="font-bold text-2xl text-center text-slate-800">
          Registro de Ingreso
        </h1>

        <div className="flex justify-evenly items-center bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Ubicación</div>
              <div className="font-semibold text-gray-800">{ubicacion || "-"}</div>
            </div>
          </div>

          <div className="w-px h-10 bg-blue-200" />

          <div className="flex items-center gap-3">
            <DoorOpen className="w-7 h-7 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Caseta</div>
              <div className="font-semibold text-gray-800">{caseta || "-"}</div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h5 className="font-bold text-lg text-slate-800 border-b-2 border-blue-600 pb-2">
            Información Personal
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <input
                {...form.register("nombre")}
                placeholder="Nombre completo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {form.formState.errors.nombre && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Empresa *
              </label>
              <input
                {...form.register("empresa")}
                placeholder="Nombre de la empresa"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {form.formState.errors.empresa && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.empresa.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...form.register("email")}
                placeholder="correo@ejemplo.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Teléfono
              </label>
              <Controller
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-300">
                    <PhoneInput
                      defaultCountry="MX"
                      international
                      value={field.value}
                      onChange={(value) => field.onChange(value || "")}
                      className="w-full [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:w-full"
                    />
                  </div>
                )}
              />
              {form.formState.errors.telefono && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.telefono.message}
                </p>
              )}
            </div>
          </div>

          {loadingConfig ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-500 text-sm">Cargando configuración...</span>
            </div>
          ) : (
            (requireFoto || requireIden) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {requireFoto && (
                  <Controller
                    control={form.control}
                    name="walkin_fotografia"
                    render={({ field, fieldState }) => (
                      <div className="flex gap-1">
                        <span className="text-red-500 mt-1">*</span>
                        <div className="w-full">
                          <LoadImage
                            id="fotografia"
                            titulo="Fotografía"
                            showWebcamOption={true}
                            imgArray={field.value || []}
                            setImg={field.onChange}
                            facingMode="user"
                            tipoOcr="persona"
                            accountId={accountId || undefined}
                          />
                          {fieldState.error && form.formState.isSubmitted && (
                            <span className="text-red-500 text-xs mt-1 block">
                              {fieldState.error.message}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}

                {requireIden && (
                  <Controller
                    control={form.control}
                    name="walkin_identificacion"
                    render={({ field, fieldState }) => (
                      <div className="flex gap-1">
                        <span className="text-red-500 mt-1">*</span>
                        <div className="w-full">
                          <LoadImage
                            id="identificacion"
                            titulo="Identificación"
                            imgArray={field.value || []}
                            setImg={field.onChange}
                            showWebcamOption={true}
                            facingMode="environment"
                            tipoOcr="id"
                            accountId={accountId || undefined}
                          />
                          {fieldState.error && form.formState.isSubmitted && (
                            <span className="text-red-500 text-xs mt-1 block">
                              {fieldState.error.message}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}
              </div>
            )
          )}

          <h5 className="font-bold text-lg text-slate-800 border-b-2 border-blue-600 pb-2 mt-8">
            Información de Visita
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Nombre <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                {...form.register("visita_nombre")}
                placeholder="Nombre completo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Email <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                {...form.register("visita_email")}
                placeholder="correo@ejemplo.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {form.formState.errors.visita_email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.visita_email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-slate-700 mb-1">
                Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <Controller
                control={form.control}
                name="visita_telefono"
                render={({ field }) => (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-300">
                    <PhoneInput
                      defaultCountry="MX"
                      international
                      value={field.value}
                      onChange={(value) => field.onChange(value || "")}
                      className="w-full [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:w-full"
                    />
                  </div>
                )}
              />
              {form.formState.errors.visita_telefono && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.visita_telefono.message}
                </p>
              )}
            </div>
          </div>
          {form.formState.errors.visita_nombre && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.visita_nombre.message}
            </p>
          )}

          <div>
            <label className="block font-semibold text-sm text-slate-700 mb-1">
              Especifica el motivo *
            </label>
            <input
              {...form.register("motivo")}
              placeholder="Escribe el motivo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {form.formState.errors.motivo && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.motivo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Vehículos <span className="text-gray-400 font-normal text-sm">(Opcional)</span>
              </span>
              <VehicleLocalPassModal
                title="Nuevo Vehiculo"
                vehicles={vehicles}
                setVehiculos={setVehiculos}
                isAccesos={false}
                fetch={false}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Car size={15} />
                  <span className="hidden sm:block">Agregar</span>
                  <span className="sm:hidden font-bold">+</span>
                </button>
              </VehicleLocalPassModal>
            </div>

            <AccordionPrimitive.Root type="multiple" className="w-full">
              {vehicles.map((vehiculo, index) => (
                <AccordionPrimitive.Item
                  key={index}
                  value={`vehiculo-${index}`}
                  className="border-b border-gray-100 my-2"
                >
                  <div className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                    <AccordionPrimitive.Trigger className="flex items-center gap-2 text-sm font-medium text-slate-700 flex-1 text-left">
                      <Car size={14} className="text-blue-400 shrink-0" />
                      <span>{vehiculo.tipo || "Vehículo sin tipo"}</span>
                    </AccordionPrimitive.Trigger>
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(index)}
                      className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
                      title="Eliminar"
                    >
                      <X size={11} className="text-red-600" />
                    </button>
                  </div>
                  <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="px-3 pt-1 pb-3 text-xs text-slate-600">
                      {(vehiculo.foto_vehiculo?.length ?? 0) > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p><strong>Tipo:</strong> {vehiculo.tipo}</p>
                            <p><strong>Marca:</strong> {vehiculo.marca}</p>
                            <p><strong>Modelo:</strong> {vehiculo.modelo}</p>
                            <p><strong>Placas:</strong> {vehiculo.placas}</p>
                            <p><strong>Estado:</strong> {vehiculo.estado}</p>
                            <p><strong>Color:</strong> {vehiculo.color}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center border rounded-md p-1 bg-white">
                            <Image
                              src={vehiculo.foto_vehiculo?.[0]?.file_url || "/nouser.svg"}
                              alt="Foto vehículo"
                              width={100}
                              height={100}
                              className="rounded-sm object-cover max-h-[80px] w-auto"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <p><strong>Tipo:</strong> {vehiculo.tipo}</p>
                          <p><strong>Marca:</strong> {vehiculo.marca}</p>
                          <p><strong>Modelo:</strong> {vehiculo.modelo}</p>
                          <p><strong>Placas:</strong> {vehiculo.placas}</p>
                          <p><strong>Estado:</strong> {vehiculo.estado}</p>
                          <p><strong>Color:</strong> {vehiculo.color}</p>
                        </div>
                      )}
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
              {vehicles.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No se han agregado vehículos.</p>
              )}
            </AccordionPrimitive.Root>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Equipos <span className="text-gray-400 font-normal text-sm">(Opcional)</span>
              </span>
              <EqipmentLocalPassModal
                title="Nuevo Equipo"
                equipos={equipos}
                setEquipos={setEquipos}
                isAccesos={false}
                userId={accountId}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Laptop size={15} />
                  <span className="hidden sm:block">Agregar</span>
                  <span className="sm:hidden font-bold">+</span>
                </button>
              </EqipmentLocalPassModal>
            </div>

            <AccordionPrimitive.Root type="multiple" className="w-full">
              {equipos.map((equipo, index) => (
                <AccordionPrimitive.Item
                  key={index}
                  value={`equipo-${index}`}
                  className="border-b border-gray-100 my-2"
                >
                  <div className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                    <AccordionPrimitive.Trigger className="flex items-center gap-2 text-sm font-medium text-slate-700 flex-1 text-left">
                      <Laptop size={14} className="text-blue-400 shrink-0" />
                      <span>{equipo.tipo || "Equipo sin tipo"}</span>
                    </AccordionPrimitive.Trigger>
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipo(index)}
                      className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
                      title="Eliminar"
                    >
                      <X size={11} className="text-red-600" />
                    </button>
                  </div>
                  <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="px-3 pt-1 pb-3 text-xs text-slate-600">
                      {(equipo.foto_equipo?.length ?? 0) > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p><strong>Tipo:</strong> {equipo.tipo}</p>
                            <p><strong>Nombre:</strong> {equipo.nombre}</p>
                            <p><strong>Marca:</strong> {equipo.marca}</p>
                            <p><strong>Modelo:</strong> {equipo.modelo}</p>
                            <p><strong>No. Serie:</strong> {equipo.serie}</p>
                            <p><strong>Color:</strong> {equipo.color}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center border rounded-md p-1 bg-white">
                            <Image
                              src={equipo.foto_equipo?.[0]?.file_url || "/nouser.svg"}
                              alt="Foto equipo"
                              width={100}
                              height={100}
                              className="rounded-sm object-cover max-h-[80px] w-auto"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <p><strong>Tipo:</strong> {equipo.tipo}</p>
                          <p><strong>Nombre:</strong> {equipo.nombre}</p>
                          <p><strong>Marca:</strong> {equipo.marca}</p>
                          <p><strong>Modelo:</strong> {equipo.modelo}</p>
                          <p><strong>No. Serie:</strong> {equipo.serie}</p>
                          <p><strong>Color:</strong> {equipo.color}</p>
                        </div>
                      )}
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
              {equipos.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No se han agregado equipos.</p>
              )}
            </AccordionPrimitive.Root>
          </div>

          <Controller
            control={form.control}
            name="acepto_aviso_privacidad"
            render={({ field, fieldState }) => (
              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="aviso"
                  />
                  <Label htmlFor="aviso" className="text-sm text-slate-500">
                    <span className="text-red-500 mr-1">*</span>
                    He leído y acepto el{" "}
                    <button
                      type="button"
                      onClick={openAviso}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      aviso de privacidad
                    </button>
                  </Label>
                </div>
                {fieldState.error && form.formState.isSubmitted && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {fieldState.error.message}
                  </span>
                )}
              </div>
            )}
          />

          <div className="text-center pt-4">
            <Button
              type="submit"
              disabled={!configResuelta}
              className="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold px-10 py-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {configResuelta ? (
                "Continuar"
              ) : (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Cargando configuración...</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroIngresoPage;
