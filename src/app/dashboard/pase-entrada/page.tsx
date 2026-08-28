//eslint-disable react-hooks/exhaustive-deps
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import Multiselect from "multiselect-react-dropdown";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EntryPassModal } from "@/components/modals/add-pass-modal";
import { List, UserRound, CalendarDays, Layers, Car, Camera, IdCard } from "lucide-react";
import { formatDateToString, formatFecha, isExcluded, prefijoToCountry } from "@/lib/utils";
import { Areas } from "@/hooks/useCreateAccessPass";
import { MisContactosModal } from "@/components/modals/user-contacts";
import Image from "next/image";
import { Contacto } from "@/lib/get-user-contacts";
import { usePaseEntrada } from "@/hooks/usePaseEntrada";
import { useGetAreasByLocations } from "@/hooks/useCatalogoPaseAreaLocation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AreasList from "@/components/areas-list";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useAssetsByLocations } from "@/hooks/assetsQueries";
import DateTimePicker from "@/components/dateTimerPicker";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MiembrosPase, { Miembro } from "@/components/miembros-del-pase";

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const getDiasSemanaEnRango = (desdeStr?: string, hastaStr?: string) => {
  if (!desdeStr || !hastaStr) return [];
  const desde = new Date(desdeStr + "T00:00:00");
  const hasta = new Date(hastaStr + "T00:00:00");
  if (isNaN(desde.getTime()) || isNaN(hasta.getTime()) || desde > hasta) {
    return [];
  }
  const dias = new Set<string>();
  const cursor = new Date(desde);
  let iteraciones = 0;
  while (cursor <= hasta && iteraciones < 3660) {
    dias.add(DIAS_SEMANA[cursor.getDay()]);
    cursor.setDate(cursor.getDate() + 1);
    iteraciones++;
  }
  return Array.from(dias);
};

// Cuenta los días en los que el pase realmente se puede usar dentro del rango
// (inclusivo: mismo día = 1). Si se limitaron los días de la semana, solo
// cuenta los que caen en alguno de esos días.
const contarDiasDeAccesoEnRango = (
  desdeStr?: string,
  hastaStr?: string,
  diasPermitidos: string[] = [],
) => {
  if (!desdeStr || !hastaStr) return 0;
  const desde = new Date(desdeStr + "T00:00:00");
  const hasta = new Date(hastaStr + "T00:00:00");
  if (isNaN(desde.getTime()) || isNaN(hasta.getTime()) || desde > hasta) {
    return 0;
  }
  let total = 0;
  const cursor = new Date(desde);
  let iteraciones = 0;
  while (cursor <= hasta && iteraciones < 3660) {
    const dia = DIAS_SEMANA[cursor.getDay()];
    if (!diasPermitidos.length || diasPermitidos.includes(dia)) {
      total++;
    }
    cursor.setDate(cursor.getDate() + 1);
    iteraciones++;
  }
  return total;
};

const formSchema = z
  .object({
    selected_visita_a: z.string().optional(),
    nombre: z.string().min(2, {
      message: "Por favor, ingresa un tu nombre completo",
    }),
    empresa: z.string().optional(),
    email: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (
            val &&
            !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)
          ) {
            return false;
          }
          return true;
        },
        {
          message: "Por favor, ingresa un correo electrónico válido.",
        },
      ),
    telefono: z.string().optional(),
    ubicaciones: z
      .array(z.string())
      .min(1, "Selecciona al menos una ubicación"),
    tema_cita: z.string().optional(),
    descripcion: z.string().optional(),
    perfil_pase: z.string().min(1),
    status_pase: z.string().min(1),
    visita_a: z.string().nullable().optional(),
    custom: z.boolean().optional(),
    link: z.object({
      link: z.string().optional(),
      docs: z.array(z.string()).optional(),
      creado_por_id: z
        .number()
        .int({ message: "El ID debe ser un número entero." })
        .optional(),
      creado_por_email: z.string().optional(),
    }),
    enviar_correo_pre_registro: z.array(z.string()).optional(),

    tipo_visita_pase: z.enum(["fecha_fija", "rango_de_fechas"], {
      required_error: "Seleccione un tipo de fecha.",
    }),
    fechaFija: z.string().optional(),
    fecha_desde_visita: z.string().optional(),
    fecha_desde_hasta: z.string().optional(),
    config_dia_de_acceso: z.enum(["cualquier_día", "limitar_días_de_acceso"], {
      required_error: "Seleccione un tipo de acceso.",
    }),
    config_dias_acceso: z.array(z.string()).optional(),
    config_limitar_acceso: z
      .number()
      .optional()
      .refine((val) => (val ? !isNaN(Number(val)) && Number(val) > 0 : true), {
        message:
          "Ingrese un número válido mayor a 0 para el límite de accesos.",
      }),
    areas: z.array(
      z.object({
        nombre_area: z.string().optional(),
        comentario_area: z.string().optional(),
      }),
    ),
    comentarios: z.array(
      z.object({
        tipo_comentario: z.string().optional(),
        comentario_pase: z.string().optional(),
      }),
    ),
    enviar_pre_sms: z.object({
      from: z
        .string()
        .min(1, { message: "El campo 'from' no puede estar vacío." }),
      mensaje: z
        .string()
        .min(1, { message: "El mensaje no puede estar vacío." }),
      numero: z.string().optional(),
    }),
    todas_las_areas: z.boolean().optional(),
    habilitar_vehiculo: z.string(),
    habilitar_fotografia: z.string(),
    habilitar_identificacion: z.string(),
    acompanantes: z
      .number()
      .min(0)
      .max(15, { message: "Solo puedes ingresar un máximo de 15 acompañantes." })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.tipo_visita_pase === "rango_de_fechas") {
        const fechaDesdeValida =
          data.fecha_desde_visita && data.fecha_desde_hasta;
        if (!fechaDesdeValida) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Ambas fechas (Desde y Hasta) son requeridas cuando el tipo de pase es 'rango de fechas'.",
      path: ["fecha_desde_visita"],
    },
  )
  .refine(
    (data) => {
      if (data.tipo_visita_pase === "rango_de_fechas") {
        const fechaDesdeValida =
          data.fecha_desde_visita && data.fecha_desde_hasta;
        if (!fechaDesdeValida) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Ambas fechas (Desde y Hasta) son requeridas cuando el tipo de pase es 'rango de fechas'.",
      path: ["fecha_desde_hasta"],
    },
  )
  .refine(
    (data) => {
      if (!data.email && !data.telefono) {
        return false;
      }
      return true;
    },
    {
      message: "Se requiere un email o teléfono.",
      path: ["email"],
    },
  );

const PaseEntradaPage = () => {
  const [tipoVisita, setTipoVisita] = useState("rango_de_fechas");
  const { excludes, grupoRequisitos } = useMenuStore();
  const [config_dias_acceso, set_config_dias_acceso] = useState<string[]>([]);
  const [config_dia_de_acceso, set_config_dia_de_acceso] =
    useState("cualquier_día");
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [defaultCountry, setDefaultCountry] = useState<any>("MX");
  const [habilitarVehiculo, setHabilitarVehiculo] = useState(true);
  const [habilitarFoto, setHabilitarFoto] = useState(true);
  const [habilitarIdentificacion, setHabilitarIdentificacion] = useState(true);
  const [toleranciaEntrada, setToleranciaEntrada] = useState<number>(0);
  const [toleranciaPrevia, setToleranciaPrevia] = useState<number>(15);

  const {
    locations: ubicacionesStore,
    defaultLocations,
    areas: areasStore,
    fetchLocations,
    fetchAreas,
    loading: loadingUbicaciones,
    locationDetails,
    roles,
  } = useAreasLocationStore();
  // Las opciones "Habilitar foto"/"Habilitar identificación" solo se
  // muestran a usuarios con el rol Admin (roles trae los del usuario actual).
  const esAdmin = (roles ?? []).includes("Admin");
  console.log("----------------------------areas", areasStore);
  const pickerRef = useRef<any>(null);

  
  // Formatear ubicaciones del store como { id, name }
  const ubicacionesFormatteadoStore = ubicacionesStore
    .filter((u: string) => u !== null && u !== undefined)
    .map((u: string) => ({ id: u, name: u }));

  const ubicacionesDefaultFormatted = defaultLocations
    .filter((u: string) => u !== null && u !== undefined)
    .map((u: string) => ({ id: u, name: u }));

  const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<
    any[]
  >([]);
  const {
    visitas,
    perfiles,
    isLoading: assetsLoading,
  } = useAssetsByLocations(
    ubicacionesSeleccionadas?.length ? ubicacionesSeleccionadas : [],
  );
  const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>([
    { name: "Usuario Actual", label: "Usuario Actual" },
  ]);

  // Cargar ubicaciones al montar — el store evita la petición si locations ya existe
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Cargar areas cuando cambien las ubicaciones seleccionadas
  useEffect(() => {
    if (ubicacionesSeleccionadas?.length) {
      const ubicacion =
        ubicacionesSeleccionadas[0]?.id ??
        ubicacionesSeleccionadas[0]?.name ??
        "";
      if (ubicacion) fetchAreas(ubicacion);
    }
  }, [fetchAreas, ubicacionesSeleccionadas]);
  
  useEffect(() => {
    if (!ubicacionesSeleccionadas?.length || !grupoRequisitos?.length) return;
  
    const ubicacionNombre = ubicacionesSeleccionadas[0]?.name ?? ubicacionesSeleccionadas[0]?.id ?? "";
  
    const requisito = grupoRequisitos.find(
      (r) => r.ubicacion?.toLowerCase() === ubicacionNombre?.toLowerCase()
    );
  
    if (requisito?.prefijo_telefonico) {
      const country = prefijoToCountry[String(requisito.prefijo_telefonico)] ?? "MX";
      setDefaultCountry(country);
    } else {
      setDefaultCountry("MX");
    }
  }, [ubicacionesSeleccionadas, grupoRequisitos]);

  // Preseleccionar ubicación cuando cargue el store
  useEffect(() => {
    if (!ubicacionesFormatteadoStore.length) return;
    if (ubicacionesSeleccionadas.length) return;

    if (ubicacionesDefaultFormatted.length) {
      const defaultsValidas = ubicacionesDefaultFormatted.filter((d: any) =>
        ubicacionesFormatteadoStore.some((u: any) => u.id === d.id),
      );
      if (defaultsValidas.length) {
        setUbicacionesSeleccionadas(defaultsValidas);
        return;
      }
    }

    setUbicacionesSeleccionadas([ubicacionesFormatteadoStore[0]]);
  }, [
    ubicacionesFormatteadoStore.length,
    ubicacionesDefaultFormatted.length,
    ubicacionesSeleccionadas.length,
    ubicacionesFormatteadoStore,
    ubicacionesDefaultFormatted,
  ]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) {
      const handleChange = (e: any) => {
        setDate(new Date(formatFecha(e.target.value + ":00")));
      };
      picker.addEventListener("value-changed", handleChange);
      return () => picker.removeEventListener("value-changed", handleChange);
    }
  }, []);

  const [userIdSoter, setUserIdSoter] = useState<number | null>(null);
  const [userNameSoter, setUserNameSoter] = useState<string | null>("");
  const [userEmailSoter, setUserEmailSoter] = useState<string | null>("");

  useEffect(() => {
    setUserIdSoter(Number(localStorage.getItem("userId_soter")) || 0);
    setUserNameSoter(localStorage.getItem("userName_soter") || "");
    setUserEmailSoter(localStorage.getItem("userEmail_soter") || "");
  }, []);
  const [host, setHost] = useState<string>();
  const [protocol, setProtocol] = useState<string>();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window?.location !== "undefined"
    ) {
      setHost(window?.location.host);
      setProtocol(window?.location.protocol);
    }
  }, []);


  useEffect(() => {
    if (!ubicacionesSeleccionadas?.length || !grupoRequisitos?.length) return;

    const ubicacionNombre = ubicacionesSeleccionadas[0]?.name ?? ubicacionesSeleccionadas[0]?.id ?? "";

    const requisito = grupoRequisitos.find(
      (r) => r.ubicacion?.toLowerCase() === ubicacionNombre?.toLowerCase()
    );

    setToleranciaEntrada(requisito?.tolerancia_de_entrada_posterior ?? 0);
    setToleranciaPrevia(requisito?.tolerancia_de_entrada_previa ?? 15);
  }, [ubicacionesSeleccionadas, grupoRequisitos]);

  const ubicacionesSeleccionadasLista = ubicacionesSeleccionadas?.map(
    (u: any) => u.name,
  );
  const { dataConfigLocation, isLoadingConfigLocation } = usePaseEntrada(
    ubicacionesSeleccionadasLista ?? [],
  );

  // TEMP: probando getAreasByLocations para ver si trae el catálogo completo
  // de áreas (vs. catalogos_pase_location, que solo trae 1).
  const { data: dataAreasByLocations } = useGetAreasByLocations(
    (ubicacionesSeleccionadasLista?.length ?? 0) > 0,
    ubicacionesSeleccionadasLista ?? [],
  );
  useEffect(() => {
    console.log("TEMP getAreasByLocations ->", dataAreasByLocations);
  }, [dataAreasByLocations]);
  // Foto/Identificación solo se pueden ofrecer si vienen dentro de los
  // requerimientos de la config del módulo de seguridad de la ubicación;
  // el rol Admin únicamente decide si se muestran cuando SÍ vienen.
  const requiereFotoModulo =
    dataConfigLocation?.requerimientos?.includes("fotografia") ?? false;
  const requiereIdentificacionModulo =
    dataConfigLocation?.requerimientos?.includes("identificacion") ?? false;

  // Cada vez que el toggle (re)aparece debe arrancar activado — si no, al
  // cambiar de ubicación podría arrastrar un "no" que el admin dejó puesto
  // en una ubicación anterior donde el toggle ni se mostraba.
  useEffect(() => {
    if (requiereFotoModulo) setHabilitarFoto(true);
  }, [requiereFotoModulo]);
  useEffect(() => {
    if (requiereIdentificacionModulo) setHabilitarIdentificacion(true);
  }, [requiereIdentificacionModulo]);

  const [enviar_correo_pre_registro] = useState<string[]>([]);
  const [formatedDocs, setFormatedDocs] = useState<string[]>([]);
  const [formatedEnvio, setFormatedEnvio] = useState<string[]>([]);
  const [areasList, setAreasList] = useState<Areas[]>([]);
  const [isActiveFechaFija, setIsActiveFechaFija] = useState(false);
  const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(true);
  const [isActivelimitarDias, setIsActiveLimitarDias] = useState(true);
  const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(true);
  const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] =
    useState(false);
  const [isActiveAdvancedOptions, setIsActiveAdvancedOptions] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>();
  const [selected, setSelected] = useState<Contacto | null>(null);
  const [isOpenModal, setOpenModal] = useState(false);
  const [todasAreas, setTodasAreas] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const [miembrosAcompanantes, setMiembrosAcompanantes] = useState<Miembro[]>([]);
  const [acompanantesError, setAcompanantesError] = useState(false);
  const [diasVigenciaError, setDiasVigenciaError] = useState(false);
  const [areasError, setAreasError] = useState(false);
  const [miembrosRowErrors, setMiembrosRowErrors] = useState<Record<string, { email: boolean; telefono: boolean }>>({});


    // Áreas que pertenecen a las ubicaciones seleccionadas, sin duplicados
  const areasDisponiblesPorUbicacion = React.useMemo(() => {
    if (!locationDetails?.length || !ubicacionesSeleccionadas?.length) return [];

    const nombresSeleccionados = ubicacionesSeleccionadas
      .map((u: any) => String(u?.name ?? u?.id ?? "").toLowerCase())
      .filter(Boolean);

    const detallesFiltrados = locationDetails.filter((ld: any) =>
      nombresSeleccionados.includes(String(ld?.ubicacion ?? "").toLowerCase()),
    );

    const nombresSet = new Set<string>();
    detallesFiltrados.forEach((ld: any) => {
      (ld?.areas ?? []).forEach((area: any) => {
        const nombre = area?.nombre_area?.trim();
        if (nombre) nombresSet.add(nombre);
      });
    });

    return Array.from(nombresSet); 
  }, [locationDetails, ubicacionesSeleccionadas]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selected_visita_a: "",
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      ubicaciones: [],
      tema_cita: "",
      descripcion: "",
      perfil_pase: "Visita General",
      status_pase: "Proceso",
      visita_a: userNameSoter ?? "",
      custom: true,
      link: {
        link: `${protocol}//${host}/dashboard/pase-update`,
        docs: formatedDocs,
        creado_por_id: userIdSoter || 0,
        creado_por_email: userEmailSoter ?? "",
      },
      enviar_correo_pre_registro: enviar_correo_pre_registro ?? [],
      tipo_visita_pase: "fecha_fija",
      fechaFija: "",
      fecha_desde_visita: today,
      fecha_desde_hasta: "",
      config_dia_de_acceso: "cualquier_día",
      config_dias_acceso: config_dias_acceso ?? [],
      config_limitar_acceso: 1,
      areas: [],
      comentarios: [],
      enviar_pre_sms: {
        from: "enviar_pre_sms",
        mensaje: "SOY UN MENSAJE",
        numero: "528120084370",
      },
      todas_las_areas: todasAreas,
      habilitar_vehiculo:"sí",
      habilitar_fotografia: "sí",
      habilitar_identificacion: "sí",
      acompanantes: 0,
    },
  });

  const toggleDia = (dia: string) => {
    set_config_dias_acceso((prev) => {
      const updatedDias = prev.includes(dia)
        ? prev.filter((d) => d !== dia)
        : [...prev, dia];
      return updatedDias;
    });
  };

  const fechaDesdeVisitaWatch = useWatch({
    control: form.control,
    name: "fecha_desde_visita",
  });
  const fechaDesdeHastaWatch = useWatch({
    control: form.control,
    name: "fecha_desde_hasta",
  });

  // Si el rango de fechas no contiene ningún día de la semana permitido en
  // "limitar días de acceso", el pase nunca podría usarse: se resetean las
  // fechas para forzar a elegir un rango que sí incluya un día válido.
  useEffect(() => {
    const restriccionActiva =
      tipoVisita === "rango_de_fechas" &&
      config_dia_de_acceso === "limitar_días_de_acceso" &&
      config_dias_acceso.length > 0;

    if (!restriccionActiva) {
      setDiasVigenciaError(false);
      return;
    }

    if (!fechaDesdeVisitaWatch || !fechaDesdeHastaWatch) {
      // Fechas vacías (puede ser por nuestro propio reset abajo): no
      // limpiamos el error para que el mensaje siga visible hasta que
      // se elija un rango válido.
      return;
    }

    const diasEnRango = getDiasSemanaEnRango(
      fechaDesdeVisitaWatch,
      fechaDesdeHastaWatch,
    );
    const hayCoincidencia = config_dias_acceso.some((dia) =>
      diasEnRango.includes(dia),
    );
    if (!hayCoincidencia) {
      form.setValue("fecha_desde_visita", "");
      form.setValue("fecha_desde_hasta", "");
      setDiasVigenciaError(true);
    } else {
      setDiasVigenciaError(false);
    }
  }, [
    tipoVisita,
    config_dia_de_acceso,
    config_dias_acceso,
    fechaDesdeVisitaWatch,
    fechaDesdeHastaWatch,
    form,
  ]);

  // El número máximo de accesos se calcula solo a partir de la vigencia: un
  // acceso por cada día que el pase puede usarse (descontando los días de la
  // semana no permitidos cuando se limitaron). Se recalcula al cambiar las
  // fechas o los días permitidos; si después el usuario lo edita a mano, su
  // valor se respeta hasta el siguiente cambio de vigencia.
  const diasDeAcceso = useMemo(
    () =>
      tipoVisita === "rango_de_fechas"
        ? contarDiasDeAccesoEnRango(
            fechaDesdeVisitaWatch,
            fechaDesdeHastaWatch,
            config_dia_de_acceso === "limitar_días_de_acceso"
              ? config_dias_acceso
              : [],
          )
        : 0,
    [
      tipoVisita,
      fechaDesdeVisitaWatch,
      fechaDesdeHastaWatch,
      config_dia_de_acceso,
      config_dias_acceso,
    ],
  );

  useEffect(() => {
    if (diasDeAcceso > 0) {
      form.setValue("config_limitar_acceso", diasDeAcceso);
    }
  }, [diasDeAcceso, form]);

  useEffect(() => {
    if (todasAreas || areasList.length > 0) {
      setAreasError(false);
    }
  }, [todasAreas, areasList]);

  useEffect(() => {
    if (!ubicacionesSeleccionadas) return;
    form.reset({
      ...form.getValues(),
      ubicaciones: ubicacionesSeleccionadas.map((u) => u.id),
    });
  }, [form, ubicacionesSeleccionadas]);

  useEffect(() => {
    if (selected) {
      form.setValue("nombre", selected?.nombre || "");
      form.setValue("email", selected?.email || "");
      form.setValue("telefono", selected?.telefono || "");
      form.setValue("empresa", selected?.empresa || "");
      setOpenModal(false);
    }
  }, [selected, form]);

  useEffect(() => {
    if (dataConfigLocation) {
      const docs: string[] = [];
      dataConfigLocation?.requerimientos?.map((value: string) => {
        if (value == "identificacion") {
          docs.push("agregarIdentificacion");
        }
        if (value == "fotografia") {
          docs.push("agregarFoto");
        }
      });
      setFormatedDocs(docs);
      const envioCS: string[] = [];
      dataConfigLocation?.envios?.map((envio: string) => {
        if (envio == "correo") {
          envioCS.push("enviar_correo_pre_registro");
        }
        if (envio == "sms") {
          envioCS.push("enviar_sms_pre_registro");
        }
      });
      setFormatedEnvio(envioCS);
    }
  }, [dataConfigLocation]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!data.ubicaciones?.length) {
      form.setError("ubicaciones", {
        message: "Selecciona al menos una ubicación",
      });
    }
    console.log( tipoVisita === "fecha_fija"
          ? date
            ? (() => {
                const d = new Date(date);
                d.setMinutes(d.getMinutes() + toleranciaEntrada);
                return formatDateToString(d);
              })()
            : ""
          : data.fecha_desde_hasta !== ""
            ? formatFecha(data.fecha_desde_hasta) + ` 23:59:00`
            : "")
    const formattedData = {
      created_from: "web",
      selected_visita_a: data.selected_visita_a,
      nombre: data.nombre,
      empresa: data.empresa,
      email: data.email,
      telefono: data.telefono,
      ubicaciones: ubicacionesSeleccionadas?.map((u) => u.id) ?? [],
      tema_cita: data.tema_cita,
      descripcion: data.descripcion,
      perfil_pase: data.perfil_pase,
      status_pase: "Proceso",
      visita_a:
        visitaASeleccionadas?.map((u) => {
          const val = typeof u === "string" ? u : u?.id || u?.name || "";
          return String(val).split(" - ")[0].trim();
        }) ?? [],
      custom: true,
      link: {
        link: `${protocol}//${host}/dashboard/pase-update`,
        docs: formatedDocs,
        creado_por_id: userIdSoter,
        creado_por_email: userEmailSoter,
      },
      enviar_correo_pre_registro: formatedEnvio,
      tipo_visita_pase: tipoVisita,
      fechaFija: date ? formatDateToString(date) : "",
      fecha_desde_visita:
        tipoVisita === "fecha_fija"
          ? date
            ? formatDateToString(date)
            : ""
          : data.fecha_desde_visita !== ""
            ? formatFecha(data.fecha_desde_visita) + ` 00:00:00`
            : "",
      fecha_desde_hasta:
        tipoVisita === "fecha_fija"
          ? date
            ? (() => {
                const d = new Date(date);
                d.setMinutes(d.getMinutes() + toleranciaEntrada);
                return formatDateToString(d);
              })()
            : ""
          : data.fecha_desde_hasta !== ""
            ? formatFecha(data.fecha_desde_hasta) + ` 23:59:00`
            : "",
      config_dia_de_acceso:
        config_dia_de_acceso === "limitar_días_de_acceso"
          ? config_dia_de_acceso
          : "cualquier_día",
      config_dias_acceso: config_dias_acceso,
      config_limitar_acceso: Number(data.config_limitar_acceso) || 0,
      areas: areasList,
      comentarios: [
        { tipo_comentario: "pase", comentario_pase: data.descripcion },
      ],
      enviar_pre_sms: {
        from: "enviar_pre_sms",
        mensaje: "SOY UN MENSAJE",
        numero: data.telefono,
      },
      todas_las_areas: todasAreas,
      habilitar_vehiculo: habilitarVehiculo ? "sí" : "no",
      // Si el módulo de seguridad no pide fotografia/identificacion, el
      // toggle ni se muestra (ver esAdmin && requiereFotoModulo en el JSX) —
      // en ese caso no se manda la llave al back. Si sí la pide, se manda
      // "sí"/"no" según el toggle (que el admin puede apagar).
      ...(requiereFotoModulo && {
        habilitar_fotografia: habilitarFoto ? "sí" : "no",
      }),
      ...(requiereIdentificacionModulo && {
        habilitar_identificacion: habilitarIdentificacion ? "sí" : "no",
      }),
      acompanantes: Number(data.acompanantes) || 0,
      acompanantes_grupo:miembrosAcompanantes|| []
    };

    if (tipoVisita == "fecha_fija" && !date) {
      form.setError("fechaFija", {
        type: "manual",
        message:
          "Fecha Fija es requerida cuando el tipo de pase es 'fecha fija'.",
      });
    } else if (
      tipoVisita == "rango_de_fechas" &&
      (formattedData.fecha_desde_visita == "" ||
        formattedData.fecha_desde_hasta == "")
    ) {
      form.setError("fecha_desde_hasta", {
        type: "manual",
        message: "Ambas fechas son requeridas",
      });
    } else if (!todasAreas && areasList.length === 0) {
      setAreasError(true);
    } else {
      // const miembrosFinales = [...miembros];
      if (data.nombre?.trim()) {
        // const visitantePrincipal: import("@/components/miembros-del-pase").Miembro = {
        // 	id: crypto.randomUUID(),
        // 	nombre: data.nombre.trim(),
        // 	email: data.email?.trim() || "",
        // 	telefono: data.telefono?.trim() || "",
        // };
        // const yaExiste = miembrosFinales.some(
        // 	(m) => m.nombre === visitantePrincipal.nombre && m.email === visitantePrincipal.email
        // );
        // if (!yaExiste) {
        // 	miembrosFinales = [visitantePrincipal, ...miembrosFinales];
        // 	setMiembros(miembrosFinales);
        // }
      }
      setModalData({ ...formattedData });
      setIsSuccess(true);
    }
  };

  const handleToggleAdvancedOptions = () => {
    setIsActiveAdvancedOptions(!isActiveAdvancedOptions);
  };
  const acompanantesValue = useWatch({ control: form.control, name: "acompanantes" });

  useEffect(() => {
      const target = acompanantesValue || 0;

      setMiembrosAcompanantes((prev) => {
        if (target === prev.length) return prev;

        if (target > prev.length) {
          const nuevasFilas: Miembro[] = Array.from(
            { length: target - prev.length },
            () => ({
              id: crypto.randomUUID(),
              nombre: "",
              email: "",
              telefono: "",
            }),
          );
          return [...prev, ...nuevasFilas];
        }
        return prev.slice(0, target);
      });
  }, [acompanantesValue]);

  const handleToggleTipoVisitaPase = (tipo: string) => {
    if (tipo == "fecha_fija") {
      form.setValue("fecha_desde_hasta", "");
      form.setValue("fecha_desde_visita", "");
      setDate(new Date());
      setIsActiveFechaFija(true);
      setIsActiveRangoFecha(false);
    } else {
      form.setValue("fechaFija", "");
      form.setValue("fecha_desde_visita", formatDateToLocalISO(new Date())); 
      setDate(undefined);
      setIsActiveFechaFija(false);
      setIsActiveRangoFecha(true);
    }
    setTipoVisita(tipo);
  };

  const handleToggleDiasAcceso = (tipo: string) => {
    if (tipo == "cualquier_día") {
      setIsActiveCualquierDia(true);
      setIsActiveLimitarDiasSemana(false);
    } else {
      setIsActiveCualquierDia(false);
      setIsActiveLimitarDiasSemana(true);
    }
    set_config_dia_de_acceso(tipo);
  };

  const handleToggleLimitarDias = () => {
    setIsActiveLimitarDias(!isActivelimitarDias);
  };

  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    form.setValue("fecha_desde_hasta", "");
  };

  const formatDateToLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };
  return (
    <div className="min-h-screen bg-gray-100 py-5 px-4">
      <EntryPassModal
        title={"Pase de Entrada"}
        dataPass={modalData}
        isSuccess={isSuccess}
        setIsSuccess={setIsSuccess}
        onClose={() => setIsSuccess(false)}
        from={"pase"}
      />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col space-y-5 max-w-3xl mx-auto pt-4">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <div className="text-center mb-6">
                <h1 className="font-bold text-2xl text-gray-800">
                  Crear pase de entrada
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Completa la información para registrar la visita
                </p>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-700">
                  Detalle de la visita
                </p>
              </div>
              <p className="text-xs text-gray-400 mb-4 mt-1">
                Indica el propósito de la visita, las ubicaciones y el
                responsable que recibirá al visitante.
              </p>

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="ubicaciones"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="text-red-400">*</span> Ubicaciones de
                        la visita
                      </FormLabel>
                      <Multiselect
                        options={ubicacionesFormatteadoStore ?? []}
                        selectedValues={ubicacionesSeleccionadas}
                        onSelect={setUbicacionesSeleccionadas}
                        onRemove={setUbicacionesSeleccionadas}
                        displayValue="name"
                        style={{
                          chips: {
                            background: "#2563eb",
                            borderRadius: "20px",
                          },
                          searchBox: {
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                          },
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Selecciona las ubicaciones a las que tendrá acceso el
                        visitante.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="visita_a"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-red-400">*</span> Responsable
                          (Visita a)
                        </FormLabel>
                        <Multiselect
                          options={visitas ?? []}
                          selectedValues={visitaASeleccionadas}
                          onSelect={setVisitaASeleccionadas}
                          onRemove={setVisitaASeleccionadas}
                          displayValue="name"
                          style={{
                            chips: {
                              background: "#2563eb",
                              borderRadius: "20px",
                            },
                            searchBox: {
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                              background: "#f9fafb",
                            },
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tema_cita"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Motivo de visita
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder=""
                            className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 2: Datos del visitante con tabs internos ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <Tabs defaultValue="datos-visita">
                <TabsList className="w-auto justify-start bg-transparent border-b border-gray-200 rounded-none p-0 mb-5 gap-0">
                  <TabsTrigger
                    value="datos-visita"
                    className="bg-transparent rounded-none px-4 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:hover:text-gray-700 shadow-none">
                    Datos del visitante
                  </TabsTrigger>
                  <TabsTrigger
                    value="miembros-grupo"
                    className="bg-transparent rounded-none px-4 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:hover:text-gray-700 shadow-none">
                    Acompañantes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="datos-visita">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <UserRound className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-700">
                      Datos del visitante
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 mt-1">
                    Ingresa los datos de contacto de la persona que realizará la
                    visita.
                  </p>
                  <MisContactosModal
                    title="Mis Contactos"
                    setSelected={setSelected}
                    isOpenModal={isOpenModal}
                    setOpenModal={setOpenModal}
                  />
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              <span className="text-red-400">*</span> Nombre
                              Completo
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre Completo"
                                className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600 rounded-full px-4 py-2 text-sm flex items-center gap-2 w-full justify-center"
                          variant="outline"
                          onClick={() => setOpenModal(true)}>
                          <List size={16} />
                          Mis contactos
                        </Button>
                      </div>
                    </div>

                    {selected && (
                      <Image
                        className="dark:invert h-14 w-14 object-cover rounded-full bg-gray-200 border-2 border-blue-100"
                        src={
                          selected?.fotografia &&
                          Array.isArray(selected.fotografia) &&
                          selected.fotografia[0]?.file_url?.trim()
                            ? selected.fotografia[0].file_url
                            : "/nouser.svg"
                        }
                        alt="foto"
                        width={56}
                        height={56}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="empresa"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Empresa
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Empresa"
                                className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              <span className="text-red-400">*</span> Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="example@example.com"
                                className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Teléfono
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                limitMaxLength={10}
                                {...field}
                                onChange={(value: string) => {
                                  form.setValue("telefono", value || "");
                                }}
                                placeholder="Teléfono"
                                defaultCountry={defaultCountry} 
                                containerComponentProps={{
                                  className:
                                    "flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 py-0 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                }}
                                numberInputProps={{
                                  className: "pl-3 bg-transparent",
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {assetsLoading ? (
                        <div className="flex items-center gap-2 py-3">
                          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                          <span className="text-sm text-gray-400">
                            Cargando perfiles...
                          </span>
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="perfil_pase"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Tipo de visita
                              </FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}>
                                  <SelectTrigger className="w-full rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300">
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {perfiles?.map((item: any) => (
                                      <SelectItem
                                        key={item.id + item.name}
                                        value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="acompanantes"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Acompañantes
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0"
                                type="number"
                                step={1}
                                min={0}
                                max={15}
                                className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                                {...field}
                                value={field.value === 0 || field.value === undefined ? "" : field.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const num = val === "" ? 0 : Number(val);
                                  if (num > 15) {
                                    setAcompanantesError(true);
                                    return;
                                  }
                                  setAcompanantesError(false);
                                  field.onChange(num);
                                }}
                                onFocus={(e) => e.target.select()}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">
                              Número de personas adicionales que acompañan al visitante. Ve a la tab{" "}
                              <span className="font-semibold text-gray-500">Acompañantes</span> para completar sus datos.
                            </p>
                            {acompanantesError && (
                              <p className="text-sm font-medium text-red-500">
                                Solo puedes ingresar un máximo de 15 acompañantes.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="miembros-grupo">
                  <MiembrosPase
                    miembros={miembrosAcompanantes}
                    setMiembros={setMiembrosAcompanantes}
                    rowErrors={miembrosRowErrors}
                    setRowErrors={setMiembrosRowErrors}
                    title="Acompañantes"
                    useIA
                    acompantes={acompanantesValue || 0}
                    defaultCountry={defaultCountry}
                    showFotoColumn={false}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="font-semibold text-gray-700">Vigencia de Ingreso</h1>
              </div>
              <p className="text-xs text-gray-400 mb-5 mt-1">
                Selecciona si el pase es para un día específico o define un
                rango de fechas de validez.
              </p>

              <div className="flex items-center flex-wrap gap-3 mb-6">
                <Controller
                  control={form.control}
                  name="tipo_visita_pase"
                  render={() => (
                    <FormItem>
                      <Button
                        type="button"
                        onClick={() =>
                          handleToggleTipoVisitaPase("rango_de_fechas")
                        }
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveRangoFecha ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"} mr-2`}>
                        Rango de fechas
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleToggleTipoVisitaPase("fecha_fija")}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveFechaFija ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"} mr-2`}>
                        Un solo día
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {tipoVisita === "fecha_fija" && (
                <FormField
                  control={form.control}
                  name="fechaFija"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="text-red-400">*</span> Fecha y Hora de
                        Visita
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={date}
                          setDate={setDate}
                          allowPast={false}
                          toleranceMinutes={toleranciaPrevia}
                          use12Hour
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {tipoVisita === "rango_de_fechas" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="fecha_desde_visita"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-red-400">*</span> Fecha de
                          visita
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker
                            showTime={false}
                            allowPast={false}
                            placeholder="Selecciona fecha desde"
                            date={
                              field.value
                                ? new Date(field.value + "T00:00:00")
                                : undefined
                            }
                            setDate={(date) => {
                              const formattedDate = date
                                ? formatDateToLocalISO(date)
                                : "";
                              field.onChange(formattedDate);
                              handleFechaDesdeChange({
                                target: { value: formattedDate },
                              } as any);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha_desde_hasta"
                    render={({ field }: any) => {
                      const fechaDesde = form.watch("fecha_desde_visita");
                      const minDate = fechaDesde
                        ? new Date(fechaDesde + "T00:00:00")
                        : undefined;
                      return (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <span className="text-red-400">*</span> Vigencia
                            hasta
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              showTime={false}
                              allowPast={false}
                              minDate={minDate}
                              placeholder="Selecciona vigencia hasta"
                              date={
                                field.value
                                  ? new Date(field.value + "T00:00:00")
                                  : undefined
                              }
                              setDate={(date) => {
                                field.onChange(
                                  date ? formatDateToLocalISO(date) : "",
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              )}
            </div>

            {tipoVisita === "rango_de_fechas" && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                  </div>
                  <h1 className="font-semibold text-gray-700">
                    Días de acceso
                  </h1>
                </div>
                <p className="text-xs text-gray-400 mb-5 mt-1">
                  ¿Qué días de la semana podrá ingresar el visitante durante el
                  periodo de vigencia?
                </p>

                <FormField
                  control={form.control}
                  name="config_dia_de_acceso"
                  render={() => (
                    <FormItem>
                      <Controller
                        control={form.control}
                        name="config_dia_de_acceso"
                        render={() => (
                          <FormItem>
                            <Button
                              type="button"
                              onClick={() =>
                                handleToggleDiasAcceso("cualquier_día")
                              }
                              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveCualquierDia ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"} mr-2`}>
                              Cualquier día
                            </Button>
                            <Button
                              type="button"
                              onClick={() =>
                                handleToggleDiasAcceso("limitar_días_de_acceso")
                              }
                              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActivelimitarDiasSemana ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"} mr-2`}>
                              Limitar días
                            </Button>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {config_dia_de_acceso === "limitar_días_de_acceso" && (
                  <div className="mt-4">
                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Selecciona los días permitidos
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                        "Domingo",
                      ].map((dia) => (
                        <FormItem
                          key={dia?.toLowerCase()}
                          className="flex items-center space-x-3">
                          <FormControl>
                            <Button
                              type="button"
                              onClick={() =>
                                toggleDia(dia?.toLocaleLowerCase())
                              }
                              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${config_dias_acceso.includes(dia?.toLowerCase()) ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                              {dia}
                            </Button>
                          </FormControl>
                        </FormItem>
                      ))}
                    </div>
                  </div>
                )}

                {diasVigenciaError && (
                  <p className="text-sm font-medium text-red-500 mt-3">
                    El rango de fechas seleccionado no incluye ningún día
                    permitido. Se reiniciaron las fechas de vigencia: selecciona un nuevo
                    rango que incluya al menos un día permitido.
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="font-semibold text-gray-700">Restricciones</h1>
              </div>
              <p className="text-xs text-gray-400 mb-5 mt-1">
                Configura el límite de ingresos permitidos y las áreas a las que
                el visitante podrá acceder.
              </p>

              {tipoVisita === "rango_de_fechas" && (
                <div className="mb-6">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <Button
                      type="button"
                      onClick={() => handleToggleLimitarDias()}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActivelimitarDias ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                      Limitar accesos
                    </Button>
                  </div>
                  {isActivelimitarDias && (
                    <div className="w-1/3 mt-3">
                      <FormField
                        control={form.control}
                        name="config_limitar_acceso"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Número máximo de accesos
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ejemplo: 5"
                                type="number"
                                min={0}
                                step={1}
                                className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
                                {...field}
                                value={field.value ? Number(field.value) : 0}
                                onChange={(e) => {
                                  field.onChange(
                                    e.target.value ? Number(e.target.value) : 0,
                                  );
                                }}
                              />
                            </FormControl>
                            {diasDeAcceso > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Calculado por la vigencia: {diasDeAcceso}{" "}
                                {diasDeAcceso === 1 ? "día" : "días"} de acceso
                                {config_dia_de_acceso ===
                                  "limitar_días_de_acceso" &&
                                config_dias_acceso.length > 0
                                  ? " (solo los días permitidos)"
                                  : ""}
                                . Puedes ajustarlo a mano.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              {isExcluded("areas", excludes ?? undefined) && (
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                    <Button
                      disabled={todasAreas}
                      type="button"
                      onClick={handleToggleAdvancedOptions}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveAdvancedOptions ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                      Áreas de acceso
                    </Button>
                    <div className="flex items-center gap-3">
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Todas las áreas:
                      </FormLabel>
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        checked={todasAreas}
                        onCheckedChange={(checked) => setTodasAreas(checked)}
                        aria-readonly
                      />
                    </div>
                  </div>
                  {isActiveAdvancedOptions && (
                    <div className="mt-4">
                      <AreasList
                        areas={areasList}
                        setAreas={setAreasList}
                        catAreas={areasDisponiblesPorUbicacion}
                        loadingCatAreas={loadingUbicaciones}
                        existingAreas={false}
                      />
                    </div>
                  )}
                  {areasError && (
                    <p className="text-sm font-medium text-red-500 mt-3">
                      Selecciona al menos un área de acceso, o activa
                      &quot;Todas las áreas&quot;.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-md border border-blue-60 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Vehículo</p>
                      <p className="text-xs text-gray-400">Permitir acceso con vehículo</p>
                    </div>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-blue-600"
                    checked={habilitarVehiculo}
                    onCheckedChange={setHabilitarVehiculo}
                  />
                </div>
              </div>

              {esAdmin && requiereFotoModulo && (
                <div className="bg-white rounded-2xl shadow-md border border-blue-60 p-6 mt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <Camera className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Foto</p>
                        <p className="text-xs text-gray-400">Habilitar captura de fotografía</p>
                      </div>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-blue-600"
                      checked={habilitarFoto}
                      onCheckedChange={setHabilitarFoto}
                    />
                  </div>
                </div>
              )}

              {esAdmin && requiereIdentificacionModulo && (
                <div className="bg-white rounded-2xl shadow-md border border-blue-60 p-6 mt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <IdCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Identificación</p>
                        <p className="text-xs text-gray-400">Habilitar captura de identificación</p>
                      </div>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-blue-600"
                      checked={habilitarIdentificacion}
                      onCheckedChange={setHabilitarIdentificacion}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Comentarios
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe un comentario"
                        className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300 resize-none"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 justify-center pb-8 mt-2">
              <Button
                className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 w-full sm:w-1/3 md:w-1/4 rounded-full py-3 font-semibold transition-all"
                variant="outline"
                type="button"
                onClick={() => window.history.back()}>
                ← Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-1/3 md:w-1/4 rounded-full py-3 font-semibold shadow-sm shadow-blue-200 transition-all"
                variant="secondary"
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }}
                disabled={
                  assetsLoading || isLoadingConfigLocation || loadingUbicaciones
                }>
                {assetsLoading == false &&
                isLoadingConfigLocation == false &&
                loadingUbicaciones == false ? (
                  "Siguiente →"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cargando...
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PaseEntradaPage;
