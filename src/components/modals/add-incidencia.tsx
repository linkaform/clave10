/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  CircleDollarSign,
  VenetianMask,
  Car,
  TriangleAlert,
  HeartPulse,
  Cctv,
  Drill,
  UserRoundMinus,
  Boxes,
  CircleHelp,
  BrickWall,
  SprayCan,
  Grab,
  UserX,
  LockKeyholeOpen,
  DoorOpen,
  Siren,
  MegaphoneOff,
  PackageMinus,
  Skull,
  Shield,
  Edit,
  Trash2,
  List,
  Eye,
  Tag,
  KeyRound,
  Forklift,
  Building2,
  UserCheck,
  HardHat,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  AccionesTomadas,
  AfectacionPatrimonial,
  Depositos,
  PersonasInvolucradas,
} from "@/lib/incidencias";
import { useInciencias } from "@/hooks/Incidencias/useIncidencias";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { PersonaExtraviadaFields } from "./persona-extraviada";
import { RoboDeCableado } from "./robo-de-cableado";
import { RoboDeVehiculo } from "./robo-de-vehiculo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SeguimientoIncidenciaLista } from "./add-seguimientos";
import { toast } from "sonner";
import SeccionPersonasInvolucradas from "../personas-involucradas";
import SeccionAccionesTomadas from "../acciones-tomadas";
import { AfectacionPatrimonialModal } from "./add-afectacion-patrimonial";
import {
  convertirDateToISO,
  formatCurrency,
} from "@/lib/utils";
import { SeccionDepositos } from "../depositos-section";
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from "../ui/select";
import { Plus, Wrench } from "lucide-react";
import { EvidenciaCaptura } from "../incidencias/evidencia-captura";
import { AccionCorrectiva, AccionCorrectivaModal } from "./add-accion-correctiva";
import {
  CATEGORIA_OTRO,
  SelectorTipoIncidencia,
  TipoIncidencia,
} from "../incidencias/selector-tipo-incidencia";
import { SeguimientoDetalleModal } from "../incidencias/seguimiento-detalle-modal";
import { useBoothStore } from "@/store/useBoothStore";
import { generarComprobanteIncidencia } from "@/lib/generar-comprobante";
import { Imagen } from "../upload-Image";

interface AddIncidenciaModalProps {
  title: string;
  isSuccess: boolean;
  setIsSuccess: (value: boolean) => void;
  onClose: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  /** Con incidencia el modal edita: se llena con sus datos y guarda con update_incidence. */
  incidencia?: any;
  /** Tab controlado (opcional), p. ej. para abrir editar directo en un tab. */
  tab?: string;
  setTab?: (tab: string) => void;
}

// prioridad_incidencia puede venir en minúsculas o con acento.
const normalizarGravedad = (valor?: string) => {
  const v = (valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (v.startsWith("lev")) return "Leve";
  if (v.startsWith("crit")) return "Critica";
  return "Moderada";
};

export const categoriasConIconos = [
  {
    nombre: "Fraude y extorsión",
    icon: <CircleDollarSign />,
    id: 1,
  },
  {
    nombre: "Intrusión y seguridad",
    icon: <VenetianMask />,
    id: 2,
  },
  {
    nombre: "Incidentes de tránsito",
    icon: <Car />,
    id: 3,
  },
  {
    nombre: "Accidentes",
    icon: <TriangleAlert />,
    id: 4,
  },
  {
    nombre: "Emergencias médicas",
    icon: <HeartPulse />,
    id: 5,
  },
  {
    nombre: "Delitos contra la propiedad",
    icon: <Cctv />,
    id: 6,
  },
  {
    nombre: "Daños y fallas operativas",
    icon: <Drill />,
    id: 7,
  },
  {
    nombre: "Delitos contra las personas",
    icon: <UserRoundMinus />,
    id: 8,
  },
  {
    nombre: "Emergencias e incendios",
    icon: <BrickWall />,
    id: 9,
  },
  {
    nombre: "Operaciones Internas y Logística",
    icon: <Boxes />,
    id: 10,
  },
  {
    nombre: "Otros",
    icon: <CircleHelp />,
    id: 11,
  },
  {
    nombre: "Borrar",
    icon: <Cctv />,
    id: 12,
  },
  {
    nombre: "Acceso y control",
    icon: <KeyRound />,
    id: 13,
  },
  {
    nombre: "Carga y descarga",
    icon: <Forklift />,
    id: 14,
  },
  {
    nombre: "CCTV y tecnología",
    icon: <Cctv />,
    id: 15,
  },
  {
    nombre: "Emergencias",
    icon: <Siren />,
    id: 16,
  },
  {
    nombre: "Instalaciones",
    icon: <Building2 />,
    id: 17,
  },
  {
    nombre: "Personal y cumplimiento",
    icon: <UserCheck />,
    id: 18,
  },
  {
    nombre: "Seguridad e higiene operativa",
    icon: <HardHat />,
    id: 19,
  },
  {
    nombre: "Seguridad patrimonial",
    icon: <ShieldCheck />,
    id: 20,
  },
  {
    nombre: "Unidades y transporte",
    icon: <Truck />,
    id: 21,
  },
];
export const subCategoriasConIconos = [
  {
    nombre: "General",
    icon: <List />,
    id: 2,
  },
  {
    nombre: "Vandalismo",
    icon: <SprayCan />,
    id: 2,
  },
  {
    nombre: "Asalto",
    icon: <Grab />,
    id: 3,
  },
  {
    nombre: "Agresiones y altercados",
    icon: <UserX />,
    id: 4,
  },
  {
    nombre: "Seguridad",
    icon: <LockKeyholeOpen />,
    id: 5,
  },
  {
    nombre: "Intrusión",
    icon: <DoorOpen />,
    id: 6,
  },
  {
    nombre: "Sospechosos",
    icon: <Siren />,
    id: 7,
  },
  {
    nombre: "Alteración del orden",
    icon: <MegaphoneOff />,
    id: 8,
  },
  {
    nombre: "Robo",
    icon: <PackageMinus />,
    id: 9,
  },
  {
    nombre: "Acoso/discriminación",
    icon: <TriangleAlert />,
    id: 10,
  },
  {
    nombre: "Homicidio",
    icon: <Skull />,
    id: 11,
  },
  {
    nombre: "Operativos varios",
    icon: <Shield />,
    id: 12,
  },
];

// Normaliza para comparar nombres sin importar acentos, mayusculas o espacios.
const normalizarNombre = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// La lista la manda el back; el catalogo local solo aporta el icono.
// Si una categoria no esta en el catalogo, se muestra con un icono generico.
export const asignarIconos = (
  nombres: string[],
  catalogo: { nombre: string; icon: JSX.Element }[],
) =>
  nombres.map((nombre) => ({
    id: nombre,
    nombre,
    icon: catalogo.find(
      (cat) => normalizarNombre(cat.nombre) === normalizarNombre(nombre),
    )?.icon ?? <Tag />,
  }));

const etiqueta = "text-[11px] font-bold uppercase tracking-wide text-gray-600";
const thTab = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600";
const tdTab = "px-4 py-3 text-sm text-gray-700 align-top";

// Título + descripción + "Agregar" de los tabs con tabla. Sin onAgregar, el
// botón se ve deshabilitado (la captura todavía no existe).
const EncabezadoTab = ({
  titulo,
  descripcion,
  onAgregar,
}: {
  titulo: string;
  descripcion: string;
  onAgregar?: () => void;
}) => (
  <div className="mb-3 flex items-start justify-between gap-4">
    <div>
      <h3 className="text-base font-bold text-gray-900">{titulo}</h3>
      <p className="text-xs text-gray-500">{descripcion}</p>
    </div>
    <button
      type="button"
      onClick={onAgregar}
      disabled={!onAgregar}
      title={onAgregar ? undefined : "Próximamente"}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
      <Plus className="h-4 w-4" />
      Agregar
    </button>
  </div>
);

// Gravedad fija en el front; el value es el que ya se guardaba.
const GRAVEDADES = [
  { value: "Leve", label: "Leve", activo: "bg-emerald-600 text-white" },
  { value: "Moderada", label: "Moderada", activo: "bg-amber-600 text-white" },
  { value: "Critica", label: "Crítica", activo: "bg-red-600 text-white" },
];

export const formSchema = z.object({
  reporta_incidencia: z.string().optional(),
  fecha_hora_incidencia: z.string().optional(),
  ubicacion_incidencia: z.string().optional(),
  area_incidencia: z.string().min(1, { message: "Este campo es requerido" }),
  evidencia_incidencia: z
    .array(
      z.object({
        file_url: z.string().optional(),
        file_name: z.string().optional(),
      }),
    )
    .optional(),
  documento_incidencia: z
    .array(
      z.object({
        file_url: z.string().optional(),
        file_name: z.string().optional(),
      }),
    )
    .optional(),
  datos_deposito_incidencia: z
    .array(
      z.object({
        cantidad: z.number().optional(),
        tipo_deposito: z.string().optional(),
      }),
    )
    .optional(),
  notificacion_incidencia: z.string().optional(),
  prioridad_incidencia: z.string().optional(),
  dano_incidencia: z.string().optional(),
  tipo_dano_incidencia: z.string().optional(),
  comentario_incidencia: z
    .string()
    .min(1, { message: "Este campo es requerido" }),
  incidencia: z.string().optional(),
  tags: z.array(z.string()).optional(),

  categoria: z.string().optional(),
  sub_categoria: z.string().optional(),
  incidente: z.string().optional(),
  //PersonaExtraviado
  nombre_completo_persona_extraviada: z.string().optional(),
  edad: z.number().optional(),
  color_piel: z.string().optional(),
  color_cabello: z.string().optional(),
  estatura_aproximada: z.number().optional(),
  descripcion_fisica_vestimenta: z.string().optional(),
  nombre_completo_responsable: z.string().optional(),
  parentesco: z.string().optional(),
  num_doc_identidad: z.string().optional(),
  telefono: z.string().optional(),
  info_coincide_con_videos: z.string().optional(),
  // responsable_que_entrega: z.string().optional(),
  // responsable_que_recibe: z.string().optional(),

  //Robo de cableado
  valor_estimado: z.string().optional(),
  pertenencias_sustraidas: z.string().optional(),
  //robo de vehiculo
  placas: z.string().optional(),
  tipo: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  color: z.string().optional(),

  afectacion_patrimonial_incidencia: z.array(z.any()).optional(),
  personas_involucradas_incidencia: z.array(z.any()).optional(),
  acciones_tomadas_incidencia: z.array(z.any()).optional(),
  seguimientos_incidencia: z.array(z.any()).optional(),
});

export const AddIncidenciaModal: React.FC<AddIncidenciaModalProps> = ({
  title,
  isSuccess,
  setIsSuccess,
  externalOpen,
  onExternalOpenChange,
  incidencia,
  tab,
  setTab,
}) => {
  const editando = !!incidencia;
  const isOpen = externalOpen !== undefined ? externalOpen : isSuccess;
  const setOpen = onExternalOpenChange || setIsSuccess;

  const { location } = useBoothStore();
  const [evidencia, setEvidencia] = useState<Imagen[]>([]);
  const [documento, setDocumento] = useState<Imagen[]>([]);

  // const [evidenciaAP , setEvidenciaAP] = useState<Imagen[]>([]);
  // const [documentoAP , setDocumentoAP] = useState<Imagen[]>([]);
  const [date, setDate] = useState<Date | "">("");

  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(
    location ?? "",
  );
  const { dataAreas: areas, } =
    useCatalogoPaseAreaLocation(
      ubicacionSeleccionada,
      isSuccess,
      location ? true : false,
      { uso: "incidencias" },
    );
  const [personasInvolucradas, setPersonasInvolucradas] = useState<
    PersonasInvolucradas[]
  >([]);
  const [accionesTomadas, setAccionesTomadas] = useState<AccionesTomadas[]>([]);
  const [depositos, setDepositos] = useState<Depositos[]>([]);

  const [seguimientos, setSeguimientos] = useState<any>([]);
  const [openModal, setOpenModal] = useState(false);

  const { data: dataAreaEmpleado } = useCatalogoAreaEmpleado(
    isSuccess,
    location ?? "",
    "Incidencias",
  );
  const { createIncidenciaMutation, editarIncidenciaMutation, loading: isLoading } = useInciencias(
    "",
    "",
    [],
    "",
    "",
    "",
  );

  const [subCategoria, setSubCategoria] = useState("");
  const [categoria, setCategoria] = useState("");
  const [selectedIncidencia, setSelectedIncidencia] = useState("");

  const [selectedNotificacion, setSelectedNotification] = useState(false);
  // Gravedad fija en el front (mismos valores que guardaba el slider).
  const [gravedad, setGravedad] = useState("Moderada");
  // "Reportar como falla": por ahora solo visual, no se manda al back.
  const [reportarFalla, setReportarFalla] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  // Acciones correctivas (grupo "Acciones Correctivas" de la forma de incidencias).
  const [accionesCorrectivas, setAccionesCorrectivas] = useState<AccionCorrectiva[]>([]);
  const [openAccionCorrectiva, setOpenAccionCorrectiva] = useState(false);
  const [indiceAccionCorrectiva, setIndiceAccionCorrectiva] = useState<number | null>(null);
  const [tagsSeleccionados, setTagsSeleccionados] = useState<string[]>([]);

  const [indiceSeleccionado, setIndiceSeleccionado] = useState<number | null>(
    null,
  );
  const [editarSeguimiento, setEditarSeguimiento] = useState(false);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState(null);

  const [
    afectacionPatrimonialSeleccionada,
    setAfectacionPatrimonialSeleccionada,
  ] = useState<AfectacionPatrimonial | null>(null);
  const [afectacionPatrimonial, setAfectacionPatrimonial] = useState<
    AfectacionPatrimonial[]
  >([]);
  const [openAfectacionPatrimonialModal, setOpenAfectacionPatrimonialModal] =
    useState(false);
  const [editarAfectacionPatrimonial, setEditarAfectacionPatrimonial] =
    useState(false);

  const [seguimientoVer, setSeguimientoVer] = useState<any | null>(null);

  const seguimientosOrdenados = [...seguimientos].sort((a, b) => {
    return (
      new Date(a.fecha_inicio_seg).getTime() -
      new Date(b.fecha_inicio_seg).getTime()
    );
  });

  const resetStates = () => {
    setSubCategoria("");
    setCategoria("");
    setSelectedIncidencia("");
    setEditarSeguimiento(false);
    setSeguimientos([]);
    setSeguimientoSeleccionado(null);

    setAfectacionPatrimonial([]);
    setEditarAfectacionPatrimonial(false);
    setAfectacionPatrimonialSeleccionada(null);

    setPersonasInvolucradas([]);
    setAccionesTomadas([]);

    setIndiceSeleccionado(null);
    setDepositos([]);
    setTagsSeleccionados([]);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporta_incidencia: "",
      fecha_hora_incidencia: "",
      ubicacion_incidencia: "",
      area_incidencia: "",
      incidencia: "",
      comentario_incidencia: "",
      tipo_dano_incidencia: "",
      dano_incidencia: "",
      evidencia_incidencia: evidencia,
      documento_incidencia: documento,
      prioridad_incidencia: "",
      notificacion_incidencia: "",
      datos_deposito_incidencia: depositos,
      tags: [],
      categoria: "",
      sub_categoria: "",
      incidente: "",

      nombre_completo_persona_extraviada: "",
      edad: 0,
      color_piel: "",
      color_cabello: "",
      estatura_aproximada: 0,
      descripcion_fisica_vestimenta: "",
      nombre_completo_responsable: "",
      parentesco: "",
      num_doc_identidad: "",
      telefono: "",
      info_coincide_con_videos: "",
      // responsable_que_entrega:"",
      // responsable_que_recibe:"",

      //Grupos repetitivos
      afectacion_patrimonial_incidencia: [],
      personas_involucradas_incidencia: [],
      acciones_tomadas_incidencia: [],
      seguimientos_incidencia: [],

      //Robo de cableado
      valor_estimado: "",
      pertenencias_sustraidas: "",
      //robo de vehiculo
      placas: "",
      tipo: "",
      marca: "",
      modelo: "",
      color: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (!isSuccess) resetStates();
    reset();
    setDate(new Date());
    setEvidencia([]);
    setDocumento([]);
    setSeguimientoSeleccionado(null);
    setEditarSeguimiento(false);
    setIndiceSeleccionado(null);
    setSeguimientos([]);
    setUbicacionSeleccionada(location ?? "");
    setGravedad("Moderada");
    setReportarFalla(false);
    setIntentoGuardar(false);
    setAccionesCorrectivas([]);

    // Modo edición: todo se llena con la incidencia.
    if (isSuccess && incidencia) {
      const d = incidencia;
      setCategoria(d.categoria || "");
      setSubCategoria(d.sub_categoria || "");
      setSelectedIncidencia(d.incidencia || d.incidente || "");
      setUbicacionSeleccionada(d.ubicacion_incidencia || location || "");
      const fecha = d.fecha_hora_incidencia ? new Date(d.fecha_hora_incidencia) : null;
      setDate(fecha && !isNaN(fecha.getTime()) ? fecha : new Date());
      setGravedad(normalizarGravedad(d.prioridad_incidencia));
      setEvidencia(d.evidencia_incidencia || []);
      setDocumento(d.documento_incidencia || []);
      setTagsSeleccionados(d.tags || []);
      setSelectedNotification(d.notificacion_incidencia === "sí" || d.notificacion_incidencia === "si");
      setPersonasInvolucradas(d.personas_involucradas_incidencia || []);
      setAccionesTomadas(d.acciones_tomadas_incidencia || []);
      setSeguimientos(d.seguimientos_incidencia || []);
      setAfectacionPatrimonial(d.afectacion_patrimonial_incidencia || []);
      setAccionesCorrectivas(d.acciones_correctivas_incidencia || []);
      setDepositos(d.datos_deposito_incidencia || []);
      reset({
        ...form.getValues(),
        area_incidencia: d.area_incidencia || "",
        comentario_incidencia: d.comentario_incidencia || "",
        nombre_completo_persona_extraviada: d.nombre_completo_persona_extraviada || "",
        edad: d.edad || 0,
        color_piel: d.color_piel || "",
        color_cabello: d.color_cabello || "",
        estatura_aproximada: d.estatura_aproximada || 0,
        descripcion_fisica_vestimenta: d.descripcion_fisica_vestimenta || "",
        nombre_completo_responsable: d.nombre_completo_responsable || "",
        parentesco: d.parentesco || "",
        num_doc_identidad: d.num_doc_identidad || "",
        telefono: d.telefono || "",
        info_coincide_con_videos: d.info_coincide_con_videos || "",
        valor_estimado: d.valor_estimado || "",
        pertenencias_sustraidas: d.pertenencias_sustraidas || "",
        placas: d.placas || "",
        tipo: d.tipo || "",
        marca: d.marca || "",
        modelo: d.modelo || "",
        color: d.color || "",
      });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (form.formState.errors) {
      console.log("console log", form.formState.errors);
    }
  }, [form.formState.errors]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Fecha, ubicación y quién reporta no se capturan: se toman de la sesión
    // (fecha actual, ubicación del top-nav y la persona con sesión).
    setIntentoGuardar(true);
    if (!selectedIncidencia.trim()) return;
    if (!ubicacionSeleccionada) {
      toast.error("Selecciona una ubicación en la parte superior para crear la incidencia.");
      return;
    }
    {
      // Al editar se conservan la fecha y quién reportó originales.
      const formattedDate =
        editando && incidencia.fecha_hora_incidencia
          ? incidencia.fecha_hora_incidencia
          : format(new Date(), "yyyy-MM-dd HH:mm:ss");
      const formatData = {
        // Al crear lo llena el back con el empleado de la sesión (catálogo de
        // empleados); al editar se conserva el original.
        reporta_incidencia: editando ? incidencia.reporta_incidencia || "" : "",
        fecha_hora_incidencia: formattedDate || "",
        ubicacion_incidencia: ubicacionSeleccionada || "",
        area_incidencia: values.area_incidencia || "",
        incidencia: selectedIncidencia || "",
        comentario_incidencia: values.comentario_incidencia || "",
        tipo_dano_incidencia: values.tipo_dano_incidencia || "",
        dano_incidencia: values.dano_incidencia || "",
        evidencia_incidencia: evidencia || [],
        documento_incidencia: documento || [],
        prioridad_incidencia: gravedad,
        notificacion_incidencia: selectedNotificacion ? "sí" : "no",
        datos_deposito_incidencia: depositos,
        tags: tagsSeleccionados,
        categoria: categoria,
        sub_categoria: subCategoria,
        incidente: selectedIncidencia,

        //Grupos repetitivos
        afectacion_patrimonial_incidencia: afectacionPatrimonial,
        acciones_correctivas_incidencia: accionesCorrectivas,
        personas_involucradas_incidencia: personasInvolucradas || [],
        acciones_tomadas_incidencia: accionesTomadas || [],
        seguimientos_incidencia: seguimientos,

        //Perosona extraviada
        nombre_completo_persona_extraviada:
          values.nombre_completo_persona_extraviada,
        edad: values.edad,
        color_piel: values.color_piel,
        color_cabello: values.color_cabello,
        estatura_aproximada: values.estatura_aproximada,
        descripcion_fisica_vestimenta: values.descripcion_fisica_vestimenta,
        nombre_completo_responsable: values.nombre_completo_responsable,
        parentesco: values.parentesco,
        num_doc_identidad: values.num_doc_identidad,
        telefono: values.telefono,
        // info_coincide_con_videos: values.info_coincide_con_videos,
        // responsable_que_entrega: values.responsable_que_entrega,
        // responsable_que_recibe: values.responsable_que_recibe,

        //Robo de cableado
        valor_estimado: values.valor_estimado,
        pertenencias_sustraidas: values.pertenencias_sustraidas,
        //robo de vehiculo
        placas: values.placas,
        tipo: values.tipo,
        marca: values.marca,
        modelo: values.modelo,
        color: values.color,
      };
      if (editando) {
        // El estatus no se edita aquí: se manda el que ya tenía.
        const dataEdicion = { ...formatData, estatus: incidencia.estatus };
        editarIncidenciaMutation.mutate(
          { data_incidencia: dataEdicion, folio: incidencia.folio },
          { onSuccess: () => handleClose() },
        );
        return;
      }
      // "Reportar como falla": el back crea también la falla y liga ambas.
      const dataCrear: any = reportarFalla
        ? {
            ...formatData,
            reportar_falla: {},
          }
        : formatData;
      createIncidenciaMutation.mutate(
        { data_incidencia: dataCrear },
        {
          onSuccess: (data: any) => {
            if (reportarFalla) {
              if (data?.falla?.ok) toast.success("También se generó la falla.");
              else toast.warning("La incidencia se creó, pero no se pudo generar la falla. Créala desde Fallas.");
            }
            generarComprobanteIncidencia(formatData);
            handleClose();
          },
        },
      );
    }
  }

  const handleClose = () => {
    setIsSuccess(false);
  };


  const openModalAgregarSeg = () => {
    setOpenModal(true);
  };

  const handleEdit = (item: any, index: number) => {
    setEditarSeguimiento(true);
    setSeguimientoSeleccionado(item);
    setIndiceSeleccionado(index);
    setOpenModal(true); // abre el modal
  };

  const handleDelete = (index: number) => {
    const nuevosSeguimientos = [...seguimientos];
    nuevosSeguimientos.splice(index, 1); // elimina por índice
    setSeguimientos(nuevosSeguimientos);
    toast.success("Seguimiento eliminado correctamente.");
  };

  const handleEditAP = (item: any, index: number) => {
    setEditarAfectacionPatrimonial(true);
    setAfectacionPatrimonialSeleccionada(item);
    setIndiceSeleccionado(index);
    setOpenAfectacionPatrimonialModal(true); // abre el modal
  };

  const handleDeleteAP = (index: number) => {
    const nuevoAP = [...afectacionPatrimonial];
    nuevoAP.splice(index, 1);
    setAfectacionPatrimonial(nuevoAP);
    toast.success("Afectación patrimonial eliminada correctamente.");
  };

  const handleVerSeg = (item: any) => setSeguimientoVer(item);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen} modal>
      <DialogContent
        className="max-w-4xl w-full h-[90vh] overflow-y-auto p-6 gap-0 flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby="">
        <DialogHeader className="flex-shrink-0 mb-4">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

          <>
            <div className="flex-grow">
              <Tabs defaultValue="datos" {...(tab !== undefined && setTab ? { value: tab, onValueChange: setTab } : {})}>
                <TabsList className="h-auto w-full justify-start gap-1 rounded-lg bg-slate-100 p-1">
                  {[
                    { value: "datos", label: "Datos" },
                    { value: "afectacion", label: "Afectación patrimonial", n: afectacionPatrimonial.length },
                    { value: "seguimiento", label: "Seguimiento", n: seguimientos.length },
                    { value: "acciones-correctivas", label: "Acciones correctivas", n: accionesCorrectivas.length },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="rounded-md px-4 py-1.5 text-sm text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                      {t.label}
                      {!!t.n && ` (${t.n})`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="datos" className="mt-5">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <h3 className="mb-4 text-base font-bold text-gray-900">Datos generales</h3>

                      <p className={etiqueta}>
                        Tipo de incidencia <span className="text-red-500">*</span>
                      </p>
                      <div className="mt-1.5">
                        <SelectorTipoIncidencia
                          enabled={isOpen}
                          value={
                            // "Otro" se queda aunque todavía no tenga nombre.
                            selectedIncidencia || categoria === CATEGORIA_OTRO
                              ? { categoria, sub_categoria: subCategoria, incidente: selectedIncidencia }
                              : null
                          }
                          onChange={(tipo: TipoIncidencia | null) => {
                            setCategoria(tipo?.categoria ?? "");
                            setSubCategoria(tipo?.sub_categoria ?? "");
                            setSelectedIncidencia(tipo?.incidente ?? "");
                          }}
                        />
                      </div>
                      {intentoGuardar && !selectedIncidencia && (
                        <p className="mt-1.5 text-sm font-medium text-red-500">
                          {categoria === CATEGORIA_OTRO ? "Especifica el tipo de incidencia." : "Elige el tipo de incidencia."}
                        </p>
                      )}

                      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="area_incidencia"
                          render={({ field }: any) => (
                            <FormItem className="space-y-0">
                              <p className={etiqueta}>
                                Área <span className="text-red-500">*</span>
                              </p>
                              <UiSelect value={field.value || undefined} onValueChange={field.onChange}>
                                <UiSelectTrigger className="mt-1.5 h-11 w-full">
                                  <UiSelectValue
                                    placeholder={ubicacionSeleccionada ? "Selecciona el área" : "Selecciona una ubicación arriba"}
                                  />
                                </UiSelectTrigger>
                                <UiSelectContent className="max-h-72">
                                  {(areas ?? []).map((a: string) => (
                                    <UiSelectItem key={a} value={a}>
                                      {a}
                                    </UiSelectItem>
                                  ))}
                                </UiSelectContent>
                              </UiSelect>
                              <FormMessage className="mt-1.5" />
                            </FormItem>
                          )}
                        />
                        <div>
                          <p className={etiqueta}>
                            Gravedad <span className="text-red-500">*</span>
                          </p>
                          <div className="mt-1.5 grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-gray-200">
                            {GRAVEDADES.map((g) => (
                              <button
                                key={g.value}
                                type="button"
                                onClick={() => setGravedad(g.value)}
                                className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
                                  gravedad === g.value ? `${g.activo} font-semibold` : "text-gray-600 hover:bg-gray-50"
                                }`}>
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <hr className="my-6 border-gray-100" />

                      <h3 className="mb-4 text-base font-bold text-gray-900">Evidencia</h3>
                      <FormField
                        control={form.control}
                        name="comentario_incidencia"
                        render={({ field }: any) => (
                          <FormItem className="space-y-0">
                            <p className={etiqueta}>
                              Descripción <span className="text-red-500">*</span>
                            </p>
                            <FormControl>
                              <Textarea
                                placeholder="Describe qué ocurrió, cómo lo detectaste y el estado actual."
                                rows={5}
                                className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="mt-1.5" />
                          </FormItem>
                        )}
                      />

                      <p className={`${etiqueta} mt-5`}>Evidencia</p>
                      <div className="mt-1.5">
                        <EvidenciaCaptura id="incidencia" evidencia={evidencia} setEvidencia={setEvidencia} documento={documento} setDocumento={setDocumento} />
                      </div>

                      {/* Campos especiales según el tipo de incidencia */}
                      {selectedIncidencia == "Persona extraviada" && (
                        <div className="mt-6">
                          <PersonaExtraviadaFields control={form.control}></PersonaExtraviadaFields>
                        </div>
                      )}
                      {selectedIncidencia == "Robo de cableado" && (
                        <div className="mt-6 flex flex-col">
                          <RoboDeCableado control={form.control}></RoboDeCableado>
                        </div>
                      )}
                      {selectedIncidencia == "Robo de vehículo" && (
                        <div className="mt-6">
                          <RoboDeVehiculo control={form.control}></RoboDeVehiculo>
                        </div>
                      )}
                      {selectedIncidencia == "Depósitos y retiros de valores" && (
                        <div className="mt-6">
                          <SeccionDepositos depositos={depositos} setDepositos={setDepositos}></SeccionDepositos>
                        </div>
                      )}

                      {/* Tags y notificación por correo: ocultos por ahora. Al editar se
                          conservan los que ya tenía la incidencia (se mandan sin cambios).
                      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <p className={etiqueta}>Tags</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Input
                              className="h-11"
                              placeholder="Escribe un tag... (ej: #Urgente)"
                              value={inputTag}
                              onChange={(e) => setInputTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  agregarTag();
                                }
                              }}
                            />
                            <Button type="button" className="h-11 bg-blue-500 hover:bg-blue-600 text-white" onClick={agregarTag}>
                              Agregar
                            </Button>
                          </div>
                          {tagsSeleccionados.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {tagsSeleccionados.map((tag, index) => (
                                <div
                                  key={index}
                                  className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => quitarTag(tag)}
                                    className="ml-2 font-bold text-blue-500 hover:text-blue-700">
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={etiqueta}>Notificar por correo</p>
                          <div className="mt-1.5 flex h-11 items-center">
                            <Switch
                              checked={selectedNotificacion}
                              onCheckedChange={setSelectedNotification}
                            />
                          </div>
                        </div>
                      </div>
                      */}

                      {/* Reportar como falla: solo al crear; el back genera la falla y liga ambas */}
                      {!editando && (
                      <>
                      <hr className="my-6 border-gray-100" />
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            <Wrench className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Reportar como falla</p>
                            <p className="text-xs text-gray-500">Equipo o instalación que dejó de funcionar.</p>
                          </div>
                        </div>
                        <Switch checked={reportarFalla} onCheckedChange={setReportarFalla} />
                      </div>
                      {reportarFalla && (
                        <p className="mt-2 px-1 text-xs text-gray-500">
                          Se generará una falla con el área, la ubicación, la descripción y la evidencia de esta incidencia.
                        </p>
                      )}
                      </>
                      )}
                    </form>
                  </Form>

                  <hr className="my-6 border-gray-100" />
                  <SeccionPersonasInvolucradas
                    personasInvolucradas={personasInvolucradas}
                    setPersonasInvolucradas={setPersonasInvolucradas}
                  />
                  <hr className="my-6 border-gray-100" />
                  <SeccionAccionesTomadas
                    accionesTomadas={accionesTomadas}
                    setAccionesTomadas={setAccionesTomadas}
                  />
                </TabsContent>

                <TabsContent value="acciones-correctivas" className="mt-5">
                  <EncabezadoTab
                    titulo="Acciones correctivas"
                    descripcion="Medidas para eliminar la causa y evitar que la incidencia se repita."
                    onAgregar={() => {
                      setIndiceAccionCorrectiva(null);
                      setOpenAccionCorrectiva(true);
                    }}
                  />
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className={thTab}>Tipo</th>
                          <th className={thTab}>Acción correctiva</th>
                          <th className={thTab}>¿Qué la causó?</th>
                          <th className={thTab}>Responsable</th>
                          <th className={thTab}>Estatus</th>
                          <th className={thTab}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {accionesCorrectivas.length > 0 ? (
                          accionesCorrectivas.map((item, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className={tdTab}>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    item.tipo === "Correctiva" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                                  }`}>
                                  {item.tipo}
                                </span>
                              </td>
                              <td className={`${tdTab} max-w-[260px]`} title={item.accion}>
                                <div className="line-clamp-2 break-words">{item.accion}</div>
                              </td>
                              <td className={`${tdTab} max-w-[200px] truncate`} title={item.causa || "-"}>
                                {item.causa || "-"}
                              </td>
                              <td className={tdTab}>
                                <div>{item.responsable}</div>
                                <div className="text-xs text-gray-400">{item.responsable_tipo}</div>
                              </td>
                              <td className={tdTab}>
                                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                  {item.estatus}
                                </span>
                              </td>
                              <td className={tdTab}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    title="Editar"
                                    className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => {
                                      setIndiceAccionCorrectiva(index);
                                      setOpenAccionCorrectiva(true);
                                    }}>
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Borrar"
                                    className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => setAccionesCorrectivas((prev) => prev.filter((_, i) => i !== index))}>
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                              No se han agregado acciones correctivas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="seguimiento" className="mt-5">
                  <EncabezadoTab
                    titulo="Seguimiento"
                    descripcion="Acciones posteriores al reporte. El supervisor actualiza el estatus."
                    onAgregar={openModalAgregarSeg}
                  />
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className={thTab}>Fecha</th>
                          <th className={thTab}>Acción realizada</th>
                          <th className={thTab}>Personas</th>
                          <th className={thTab}>Evidencias</th>
                          <th className={thTab}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {seguimientosOrdenados.length > 0 ? (
                          seguimientosOrdenados.map((item: any, index: number) => {
                            const archivos =
                              (item?.incidencia_evidencia_solucion?.length ?? 0) +
                              (item?.incidencia_documento_solucion?.length ?? 0);
                            const fechaInvalida =
                              item?.tiempo_transcurrido == "La fecha es anterior a la fecha de la incidencia.";
                            return (
                              <tr key={index} className="border-t border-gray-100">
                                <td className={tdTab}>
                                  <div>{item?.fecha_inicio_seg || "-"}</div>
                                  {item?.tiempo_transcurrido && (
                                    <div className={`text-xs ${fechaInvalida ? "text-red-500" : "text-gray-400"}`}>
                                      {item.tiempo_transcurrido}
                                    </div>
                                  )}
                                </td>
                                <td className={`${tdTab} max-w-[320px]`} title={item?.accion_correctiva_incidencia || "-"}>
                                  <div className="line-clamp-2 break-words">{item?.accion_correctiva_incidencia || "-"}</div>
                                </td>
                                <td className={tdTab}>{item?.incidencia_personas_involucradas || "-"}</td>
                                <td className={tdTab}>{archivos > 0 ? `${archivos} archivo${archivos === 1 ? "" : "s"}` : "-"}</td>
                                <td className={tdTab}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button type="button" title="Ver" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleVerSeg(item)}>
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button type="button" title="Editar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEdit(item, index)}>
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button type="button" title="Borrar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(index)}>
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                              No se han agregado seguimientos.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="afectacion" className="mt-5">
                  <EncabezadoTab
                    titulo="Afectación patrimonial"
                    descripcion="Daños, suspensiones o paros derivados de la incidencia."
                    onAgregar={() => {
                      setEditarAfectacionPatrimonial(false);
                      setOpenAfectacionPatrimonialModal(true);
                    }}
                  />
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className={thTab}>Tipo</th>
                          <th className={thTab}>Descripción</th>
                          <th className={thTab}>Estatus</th>
                          <th className={thTab}>Monto</th>
                          <th className={thTab}>Duración</th>
                          <th className={thTab}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {afectacionPatrimonial.length > 0 ? (
                          afectacionPatrimonial.map((item: any, index: number) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className={tdTab}>{item?.tipo_afectacion || "-"}</td>
                              <td className={`${tdTab} max-w-[240px] truncate`} title={item?.descripcion_afectacion || "-"}>
                                {item?.descripcion_afectacion || "-"}
                              </td>
                              <td
                                className={`${tdTab} font-semibold ${
                                  item?.estatus_afectacion === "Perdido"
                                    ? "text-red-600"
                                    : item?.estatus_afectacion === "Recuperación total"
                                      ? "text-green-600"
                                      : item?.estatus_afectacion === "Recuperación parcial"
                                        ? "text-yellow-600"
                                        : ""
                                }`}>
                                {item?.estatus_afectacion || "-"}
                              </td>
                              <td className={tdTab}>{formatCurrency(item?.monto_estimado) || "-"}</td>
                              <td className={tdTab}>{item?.duracion_estimada || "-"}</td>
                              <td className={tdTab}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button type="button" title="Editar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEditAP(item, index)}>
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button type="button" title="Borrar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteAP(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                              No se han agregado afectaciones patrimoniales.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <SeguimientoDetalleModal seguimiento={seguimientoVer} onClose={() => setSeguimientoVer(null)} />

            {/* Botones: separados del contenido con espacio y una línea */}
            <div className="mt-8 flex gap-2 border-t border-gray-100 pt-5">
              <DialogClose asChild>
                <Button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 sm:w-2/3 md:w-1/2 lg:w-1/2 "
                  onClick={handleClose}>
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                type="submit"
                onClick={() => {
                  setIntentoGuardar(true);
                  form.handleSubmit(onSubmit)();
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white sm:w-2/3 md:w-1/2 lg:w-1/2"
                disabled={isLoading || editarIncidenciaMutation.isPending}>
                {isLoading || editarIncidenciaMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />{" "}
                    {editando ? "Guardando cambios..." : "Creando incidencia..."}
                  </>
                ) : editando ? (
                  "Guardar cambios"
                ) : (
                  "Crear incidencia"
                )}
              </Button>
            </div>

            {Object.keys(form.formState.errors).length > 0 && (
              <div className=" w-full text-red-600 text-sm">
                Completa todos los campos requeridos antes de continuar.
              </div>
            )}
          </>
        <SeguimientoIncidenciaLista
          title="Nuevo seguimiento"
          subtitulo={title}
          personasRegistradas={personasInvolucradas.map((p) => p.nombre_completo)}
          isSuccess={openModal}
          setIsSuccess={setOpenModal}
          seguimientoSeleccionado={seguimientoSeleccionado}
          setSeguimientos={setSeguimientos}
          setEditarSeguimiento={setEditarSeguimiento}
          editarSeguimiento={editarSeguimiento}
          indice={indiceSeleccionado}
          dateIncidencia={date ? convertirDateToISO(date) : ""}
          enviarSeguimiento={false}
          folioIncidencia={""}
          estatusIncidencia="">
          <div></div>
        </SeguimientoIncidenciaLista>

        <AccionCorrectivaModal
          open={openAccionCorrectiva}
          setOpen={setOpenAccionCorrectiva}
          setAcciones={setAccionesCorrectivas}
          indice={indiceAccionCorrectiva}
          seleccionada={indiceAccionCorrectiva !== null ? accionesCorrectivas[indiceAccionCorrectiva] : null}
          empleados={Array.isArray(dataAreaEmpleado) ? dataAreaEmpleado : []}
          areas={areas ?? []}
        />

        <AfectacionPatrimonialModal
          title="Afectación patrimonial"
          subtitulo={title}
          openAfectacionPatrimonialModal={openAfectacionPatrimonialModal}
          setOpenAfectacionPatrimonialModal={setOpenAfectacionPatrimonialModal}
          afectacionPatrimonialSeleccionada={afectacionPatrimonialSeleccionada}
          setAfectacionPatrimonial={setAfectacionPatrimonial}
          setEditarAfectacionPatrimonial={setEditarAfectacionPatrimonial}
          editarAfectacionPatrimonial={editarAfectacionPatrimonial}
          indice={indiceSeleccionado}>
          <div></div>
        </AfectacionPatrimonialModal>
      </DialogContent>
    </Dialog>
  );
};
