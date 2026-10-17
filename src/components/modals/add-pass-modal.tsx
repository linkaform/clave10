/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import CalendarDays from "../calendar-days";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, Camera, CalendarClock, Car, IdCard, Laptop, Layers, Loader2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { GeneratedPassModal } from "./generated-pass-modal";
import { Access_pass, Areas, Comentarios, enviar_pre_sms, Link } from "@/hooks/useCreateAccessPass";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { usePaseEntrada } from "@/hooks/usePaseEntrada";
import useAuthStore from "@/store/useAuthStore";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { Badge } from "../ui/badge";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Miembro } from "../miembros-del-pase";
import Image from "next/image";
import ViewImage from "./view-image";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { Imagen } from "../upload-Image";

export type Visita={
  puesto: string;
  nombre: string;
  user_id: string;
  email: string;
  departamento:string;
}
interface EntryPassUpdateModalProps {
  title: string;
  dataPass: {
	selected_visita_a?: string,
    nombre: string;
	empresa:string;
    email: string;
    telefono: string;
    ubicacion: string;
	ubicaciones:string[];
    tema_cita: string;
    descripcion: string;
    perfil_pase: string,
    status_pase:string,
    visita_a: string,
    custom: boolean,
    link:Link,
    enviar_correo_pre_registro: string[],
    tipo_visita_pase:string;
    fechaFija:string;
    fecha_desde_visita: string;
    fecha_desde_hasta: string;
    config_dia_de_acceso:string;
    config_dias_acceso: string[];
    config_limitar_acceso: number;
    areas: Areas[];
    comentarios: Comentarios[];
    enviar_pre_sms: enviar_pre_sms;
	todas_las_areas:boolean;
	habilitar_vehiculo:string;
	/** "sí"/"no"; solo viene si la ubicación ofrece el toggle "Activar pase por defecto". */
	auto_activacion?:string;
	habilitar_fotografia:string;
	habilitar_identificacion:string;
	acompanantes:number;
	acompanantes_grupo:Miembro[];
	/** Solo vienen con "Activar pase por defecto" encendido y con algo capturado. */
	grupo_vehiculos?:Vehiculo[];
	grupo_equipos?:Equipo[];
	foto?:Imagen[];
	identificacion?:Imagen[];
  };
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: ()=> void;
  from:string
}

export const EntryPassModal: React.FC<EntryPassUpdateModalProps> = ({
  title,
  dataPass,
  isSuccess,
  setIsSuccess,
  onClose,
  from
}) => {
  const items =
  dataPass?.tipo_visita_pase === "fecha_fija"
      ? [
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha y Hora de Visita",
            date: dataPass?.fecha_desde_visita,
          },
        ]
      : [
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha Inicio",
            date: dataPass?.fecha_desde_visita,
          },
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha Hasta",
            date: dataPass?.fecha_desde_hasta,
          },
        ];

  const [sendData, setSendData] = useState<Access_pass|null>(null)
  const [sendPreSms, setSendPreSms] = useState<enviar_pre_sms|null>(null)
  const {userIdSoter, userParentId}= useAuthStore()
  const { roles } = useAreasLocationStore()
  const esAdmin = (roles ?? []).includes("Admin")
  const { createPaseEntradaMutation , responseCreatePase} = usePaseEntrada([])
  const isLoading = createPaseEntradaMutation.isPending
  const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
  const [link, setLink] = useState("");
  const[ account_id, setAccount_id] = useState<number|null>(null)
  console.log(account_id)
  const [hostPro, setHostPro] = useState({ protocol: '', host: '' });

  const onSubmit = async () => {
    const accessPassData: Access_pass = {
		created_from:"web",
	selected_visita_a: dataPass.selected_visita_a,
      nombre: dataPass.nombre,
	  empresa: dataPass.empresa||"",
      email: dataPass.email,
      telefono: dataPass.telefono,
      ubicacion: dataPass.ubicacion,
	  ubicaciones: dataPass.ubicaciones,
      tema_cita: dataPass.tema_cita,
      descripcion: dataPass.descripcion,
      perfil_pase: dataPass.perfil_pase,
      status_pase: dataPass.status_pase,
      visita_a: dataPass.visita_a,
      custom: dataPass.custom,
      link: {
        link: dataPass.link.link,
        docs: dataPass.link.docs,
        creado_por_id: dataPass.link.creado_por_id,
        creado_por_email: dataPass.link.creado_por_email,
      },
      enviar_correo_pre_registro: dataPass.enviar_correo_pre_registro,
      tipo_visita_pase: dataPass.tipo_visita_pase,
      fechaFija: dataPass.fechaFija,
      fecha_desde_visita: dataPass.fecha_desde_visita,
      fecha_desde_hasta: dataPass.fecha_desde_hasta,
      config_dia_de_acceso: dataPass.config_dia_de_acceso,
      config_dias_acceso: dataPass.config_dias_acceso,
      config_limitar_acceso: dataPass.config_limitar_acceso,
      areas: dataPass.areas,
      comentarios: dataPass.comentarios,
      enviar_pre_sms: {
        from: dataPass.enviar_pre_sms.from,
        mensaje: dataPass.enviar_pre_sms.mensaje,
        numero: dataPass.enviar_pre_sms.numero,
      },
	  todas_las_areas:dataPass.todas_las_areas,
	  habilitar_vehiculo:dataPass.habilitar_vehiculo,
	  ...(dataPass.auto_activacion !== undefined && { auto_activacion: dataPass.auto_activacion }),
	  habilitar_fotografia:dataPass.habilitar_fotografia,
	  habilitar_identificacion:dataPass.habilitar_identificacion,
	  acompanantes:dataPass.acompanantes,
	  acompanantes_grupo: dataPass.acompanantes_grupo ?? [],
	  ...(dataPass.grupo_vehiculos?.length && { grupo_vehiculos: dataPass.grupo_vehiculos }),
	  ...(dataPass.grupo_equipos?.length && { grupo_equipos: dataPass.grupo_equipos }),
	  ...(dataPass.foto?.length && { foto: dataPass.foto }),
	  ...(dataPass.identificacion?.length && { identificacion: dataPass.identificacion }),
    };
    const enviarPreSms : enviar_pre_sms= {
      from: dataPass.enviar_pre_sms.from,
      mensaje: dataPass.enviar_pre_sms.mensaje,
      numero: dataPass.enviar_pre_sms.numero,
    };
    setSendPreSms(enviarPreSms)
    setSendData(accessPassData)
  };

	useEffect(() => {
		if (typeof window !== "undefined") {
		  const protocol = window.location.protocol;
		  const host = window.location.host;
		  setHostPro({ protocol, host });
		  setAccount_id(userIdSoter);
		}
	  }, []);

  useEffect(()=>{
    if(sendPreSms && sendData ){
      createPaseEntradaMutation.mutate({ access_pass:sendData,  enviar_pre_sms: sendPreSms })
    }
  },[ sendData, sendPreSms])


  useEffect(()=>{
    if(responseCreatePase?.status_code == 201){
    }
      let docs=""
      sendData?.link.docs.map((d, index)=>{
        if(d == "agregarIdentificacion"){
          docs+="iden"
        }
        else if(d == "agregarFoto"){
          docs+="foto"
        }
        if (index==0){
          docs+="-"
        }
      })
      const backendLink = responseCreatePase?.json?.link
      setLink(backendLink || `${hostPro.protocol}//${hostPro.host}/dashboard/pase-update?id=${responseCreatePase?.json.id}&user=${userParentId}&docs=${docs}`)
      setOpenGeneratedPass(true)
  },[responseCreatePase])

	const handleClose = () => {
		setIsSuccess(false); 
		onClose(); 
	};

	// Aviso de auto activación en Acompañantes: el back solo activa a los que
	// ya traen nombre. Si aparece, el modal abre desplazado hasta ahí.
	const acompanantesConNombre = (dataPass?.acompanantes_grupo ?? []).filter((m) => m.nombre?.trim()).length;
	const acompanantesSinNombre = Math.max((dataPass?.acompanantes ?? 0) - acompanantesConNombre, 0);
	const mostrarAvisoAutoActivacion = dataPass?.auto_activacion === "sí" && (dataPass?.acompanantes ?? 0) > 0;
	const avisarAcompanantesEnProceso = mostrarAvisoAutoActivacion && acompanantesSinNombre > 0;
	// Foto que se muestra de cada acompañante: la suya o, si no tiene, la de su
	// identificación (igual que en la lista de acompañantes del formulario).
	const fotoAcompanante = (m: Miembro) => m.foto?.[0]?.file_url || m.identificacion?.[0]?.file_url || "";
	const acompanantesConDatos = (dataPass?.acompanantes_grupo ?? []).filter((m) => m.nombre?.trim() || fotoAcompanante(m));
	const avisoAutoActivacionRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!isSuccess || !mostrarAvisoAutoActivacion) return;
		// Espera a que termine la animación de apertura del Dialog.
		const timer = setTimeout(
			() => avisoAutoActivacionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
			300,
		);
		return () => clearTimeout(timer);
	}, [isSuccess, mostrarAvisoAutoActivacion]);

  	return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal >
		<DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col p-0 border-none rounded-3xl" aria-describedby="" onInteractOutside={(e) => e.preventDefault()}>
			<div className="bg-blue-600 p-6 text-white text-center flex-shrink-0">
				<DialogTitle className="text-xl font-bold tracking-tight uppercase">
					{title}
				</DialogTitle>
				<p className="text-xs text-blue-100 mt-1 opacity-80 uppercase tracking-widest">Confirma los detalles del pase</p>
			</div>

			<div className="flex-grow overflow-y-auto px-8 py-6 space-y-6 bg-gray-50/50">

				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<UserRound size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Datos Personales</span>
					</div>
					
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-1">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Nombre Completo</p>
							<p className="text-lg font-bold text-gray-800">{dataPass?.nombre}</p>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
								<p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.email}</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</p>
								<p className="text-sm font-semibold text-gray-600">{dataPass?.telefono}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Empresa</p>
								<p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.empresa || "N/A"}</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Estatus</p>
								<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black px-2 py-0">
									{capitalizeFirstLetter(dataPass?.status_pase ??"")}
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<ShieldCheck size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalles de Visita</span>
					</div>
					
					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Tema de la cita</p>
							<p className="text-sm text-gray-700 font-medium">{dataPass?.tema_cita}</p>
						</div>
						<div className="space-y-1 pt-2 border-t border-gray-50">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Descripción</p>
							<p className="text-sm text-gray-700 break-words">{dataPass?.descripcion}</p>
						</div>
					</div>
				</div>

				{/* Vigencia */}
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<CalendarClock size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vigencia y Accesos</span>
					</div>

					<div className="grid grid-cols-2 gap-4 mb-4">
						{items.map((item, index) => (
							<div key={index} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
								<p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{item?.title}</p>
								<p className="text-xs font-bold text-gray-800 tabular-nums">
									{item?.date?.replace("T", " ").slice(0, 16)} hrs
								</p>
							</div>
						))}
					</div>

					{dataPass?.config_limitar_acceso > 0 && (
						<div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
							<p className="text-xs font-bold text-blue-800 uppercase tracking-tight">Límite de accesos</p>
							<Badge className="bg-blue-600 text-white font-bold">{dataPass?.config_limitar_acceso}</Badge>
						</div>
					)}
				</div>

				{dataPass?.config_dias_acceso.length > 0 && (
					<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
						<CalendarDays diasDisponibles={dataPass?.config_dias_acceso}/>
					</div>
				)}
				{/* Vehículo */}
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
					<div className="bg-blue-50 p-1.5 rounded-lg">
						<Car size={16} className="text-blue-600" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Acceso con vehículo </span>
					</div>
					<Badge
					className={
						dataPass?.habilitar_vehiculo === "sí"
						? "bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px]"
						: "bg-red-100 text-red-700 hover:bg-red-100 border-none font-black text-[10px]"
					}
					>
					{dataPass?.habilitar_vehiculo === "sí" ? "Permitido" : "No permitido"}
					</Badge>
				</div>
				</div>
				{/* Auto activación: solo si la ubicación ofreció el toggle */}
				{dataPass?.auto_activacion !== undefined && (
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
					<div className="bg-blue-50 p-1.5 rounded-lg">
						<BadgeCheck size={16} className="text-blue-600" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activar pase por defecto</span>
					</div>
					<Badge
					className={
						dataPass?.auto_activacion === "sí"
						? "bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px]"
						: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-black text-[10px]"
					}
					>
					{dataPass?.auto_activacion === "sí" ? "Se crea activo" : "No"}
					</Badge>
				</div>
				</div>
				)}
				{/* Vehículos y equipos capturados junto con la auto activación */}
				{(!!dataPass?.grupo_vehiculos?.length || !!dataPass?.grupo_equipos?.length ||
					!!dataPass?.foto?.length || !!dataPass?.identificacion?.length) && (
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
					{(!!dataPass?.foto?.length || !!dataPass?.identificacion?.length) && (
					<div className="flex gap-4">
						{[
						{ label: "Fotografía", img: dataPass?.foto?.[0] },
						{ label: "Identificación", img: dataPass?.identificacion?.[0] },
						].filter((x) => x.img?.file_url).map((x) => (
						<div key={x.label} className="flex flex-col items-center gap-1.5">
							<Image
							src={x.img!.file_url!}
							alt={x.label}
							width={96}
							height={96}
							className="h-24 w-24 rounded-xl object-cover border border-gray-100"
							/>
							<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{x.label}</span>
						</div>
						))}
					</div>
					)}
					{!!dataPass?.grupo_vehiculos?.length && (
					<ListaArticulosPase
						icon={<Car size={16} className="text-blue-600" />}
						titulo="Vehículos"
						items={dataPass.grupo_vehiculos.map((v) => ({
						nombre: v.tipo || "Vehículo",
						clave: v.placas ? { label: "Placas", value: v.placas } : undefined,
						campos: [
							{ label: "Marca", value: v.marca },
							{ label: "Modelo", value: v.modelo },
							{ label: "Color", value: v.color },
							{ label: "Estado", value: v.estado },
						],
						}))}
					/>
					)}
					{!!dataPass?.grupo_equipos?.length && (
					<ListaArticulosPase
						icon={<Laptop size={16} className="text-blue-600" />}
						titulo="Equipos"
						items={dataPass.grupo_equipos.map((e) => ({
						nombre: e.tipo || "Equipo",
						clave: e.serie ? { label: "Serie", value: e.serie } : undefined,
						campos: [
							{ label: "Nombre", value: e.nombre },
							{ label: "Marca", value: e.marca },
							{ label: "Modelo", value: e.modelo },
							{ label: "Color", value: e.color },
						],
						}))}
					/>
					)}
				</div>
				)}
				{/* Fotografía e Identificación (solo Admin) */}
				{esAdmin && (
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<Camera size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Habilitar fotografía</span>
						</div>
						<Badge
						className={
							dataPass?.habilitar_fotografia === "sí"
							? "bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px]"
							: "bg-red-100 text-red-700 hover:bg-red-100 border-none font-black text-[10px]"
						}
						>
						{dataPass?.habilitar_fotografia === "sí" ? "Habilitada" : "Deshabilitada"}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<IdCard size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Habilitar identificación</span>
						</div>
						<Badge
						className={
							dataPass?.habilitar_identificacion === "sí"
							? "bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px]"
							: "bg-red-100 text-red-700 hover:bg-red-100 border-none font-black text-[10px]"
						}
						>
						{dataPass?.habilitar_identificacion === "sí" ? "Habilitada" : "Deshabilitada"}
						</Badge>
					</div>
				</div>
				)}
				{/* Acompañantes */}
				{(dataPass?.acompanantes ?? 0) > 0 && (
					<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
						<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<div className="bg-blue-50 p-1.5 rounded-lg">
							<UserRound size={16} className="text-blue-600" />
							</div>
							<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
							Acompañantes
							</span>
						</div>
						<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px]">
							{dataPass.acompanantes} {dataPass.acompanantes === 1 ? "persona" : "personas"}
						</Badge>
						</div>

						{/* Auto activación: el back activa a los acompañantes solo si ya traen nombre */}
						{mostrarAvisoAutoActivacion && (
							<div
							ref={avisoAutoActivacionRef}
							className={`flex gap-3 p-3 mb-3 rounded-xl border ${
								acompanantesSinNombre > 0 ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"
							}`}
							>
							<AlertTriangle
								size={18}
								className={`flex-shrink-0 mt-0.5 ${acompanantesSinNombre > 0 ? "text-amber-600" : "text-blue-600"}`}
							/>
							<div className={`text-xs space-y-1 ${acompanantesSinNombre > 0 ? "text-amber-800" : "text-blue-800"}`}>
								<p className="font-bold">
								{acompanantesSinNombre > 0
									? `${acompanantesSinNombre} ${acompanantesSinNombre === 1 ? "acompañante sin nombre no se activará" : "acompañantes sin nombre no se activarán"}`
									: "Los acompañantes también se crearán activos"}
								</p>
								<p>
								Con &quot;Activar pase por defecto&quot; el titular se crea activo. Cada acompañante se activa
								solo si <span className="font-semibold">tiene nombre</span>; los que no, quedan{" "}
								<span className="font-semibold">en proceso</span> hasta que se complete su información.
								</p>
							</div>
							</div>
						)}

						{acompanantesConDatos.length > 0 && (
						<div className="space-y-2 pt-3 border-t border-gray-50">
							{acompanantesConDatos.map((m, index) => {
								const foto = fotoAcompanante(m);
								return (
								<div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
								{foto ? (
									<div className="flex-shrink-0">
									<ViewImage imageUrl={{ file_url: foto, file_name: "foto" }} size="sm" />
									</div>
								) : (
									<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
									<UserRound size={14} className="text-blue-500" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className={`text-sm font-semibold truncate ${m.nombre?.trim() ? "text-gray-700" : "italic text-gray-400"}`}>{m.nombre?.trim() || "Sin nombre"}</p>
									<div className="flex gap-3 mt-0.5">
									{m.email && <p className="text-[11px] text-gray-400 truncate">{m.email}</p>}
									{m.telefono && <p className="text-[11px] text-gray-400">{m.telefono}</p>}
									</div>
								</div>
								</div>
								);
							})}
						</div>
						)}
					</div>
					)}
				{(dataPass?.areas.length > 0 || dataPass?.comentarios.length > 0) && (
					<div className="space-y-3">
						{dataPass?.areas.length > 0 && (
							<Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
								<AccordionItem value="areas" className="border-none">
									<AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
										<div className="flex items-center gap-3">
											<Layers size={14} className="text-blue-600" />
											Áreas Autorizadas ({dataPass.areas.length})
										</div>
									</AccordionTrigger>
									<AccordionContent className="px-5 pb-4">
										<div className="space-y-2">
											{dataPass?.areas.map((area, index) => (
												<div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
													<p className="text-xs font-bold text-gray-800 mb-1">{area.nombre_area}</p>
													<p className="text-[11px] text-gray-500 italic">{area.commentario_area || "Sin comentarios"}</p>
												</div>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}

						{dataPass?.comentarios.length > 0 && (
							<Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
								<AccordionItem value="comments" className="border-none">
									<AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
										<div className="flex items-center gap-3">
											<MessageSquare size={14} className="text-blue-600" />
											Instrucciones de Pase ({dataPass.comentarios.length})
										</div>
									</AccordionTrigger>
									<AccordionContent className="px-5 pb-4">
										<div className="space-y-2">
											{dataPass?.comentarios.map((com, index) => (
												<div key={index} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
													<p className="text-[11px] text-gray-700 font-medium leading-relaxed italic">&quot;{com.comentario_pase}&quot;</p>
												</div>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}
					</div>
				)}
			</div>

			<div className="p-6 bg-white border-t border-gray-100 flex gap-4 flex-shrink-0">
				<DialogClose asChild disabled={isLoading}>
					<Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest border-none h-auto" onClick={handleClose}>
						Cancelar
					</Button>
				</DialogClose>

				{/* Con auto activación y acompañantes sin nombre, el botón lo dice para que no pase desapercibido */}
				<Button
					className={`flex-1 text-white rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest h-auto whitespace-normal ${
						avisarAcompanantesEnProceso
							? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-100"
							: "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
					}`}
					onClick={onSubmit}
					disabled={isLoading}
				>
					{isLoading ? (
						<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando... </>
					) : avisarAcompanantesEnProceso ? (
						`Crear pase (${acompanantesSinNombre} ${acompanantesSinNombre === 1 ? "acompañante" : "acompañantes"} en proceso)`
					) : (
						"Crear pase"
					)}
				</Button>

				{responseCreatePase?.status_code == 201 && (
					<GeneratedPassModal
						title="Pase de Entrada Generado"
						description="El pase de entrada se ha generado correctamente."
						link={link}
						openGeneratedPass={openGeneratedPass}
						setOpenGeneratedPass={setOpenGeneratedPass} 
						from={from}
						recordId={dataPass?.auto_activacion === "sí" ? responseCreatePase?.json?.id : undefined}
						accountId={userParentId ?? undefined}
					/>
				)}
			</div>
      	</DialogContent>
    </Dialog>
  );
};

type ArticuloPase = {
	nombre: string;
	/** Dato que identifica al artículo (placas/serie), resaltado a la derecha. */
	clave?: { label: string; value: string };
	campos: { label: string; value?: string }[];
};

// Resumen de vehículos/equipos en la confirmación: listado de renglones
// colapsados (tipo + placas/serie); al abrir uno se ven sus campos capturados.
const ListaArticulosPase = ({ icon, titulo, items }: { icon: React.ReactNode; titulo: string; items: ArticuloPase[] }) => (
	<div>
		<div className="flex items-center justify-between mb-2">
			<div className="flex items-center gap-2">
				<div className="bg-blue-50 p-1.5 rounded-lg">{icon}</div>
				<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{titulo}</span>
			</div>
			<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px]">
				{items.length}
			</Badge>
		</div>
		<Accordion type="multiple" className="w-full">
			{items.map((item, i) => {
				const campos = item.campos.filter((c) => c.value?.trim());
				return (
					<AccordionItem key={i} value={`${titulo}-${i}`} className="border-b border-gray-100 last:border-b-0">
						<AccordionTrigger className="py-2.5 hover:no-underline">
							<div className="flex flex-1 items-center justify-between gap-3 pr-3 min-w-0">
								<span className="text-sm font-medium text-slate-700 truncate">{item.nombre}</span>
								{item.clave && (
									<span className="shrink-0 text-xs text-gray-500">
										{item.clave.label}: <span className="font-mono font-semibold text-slate-700">{item.clave.value}</span>
									</span>
								)}
							</div>
						</AccordionTrigger>
						<AccordionContent className="pb-3">
							{campos.length > 0 ? (
								<ul className="space-y-1 pl-1">
									{campos.map((c) => (
										<li key={c.label} className="flex justify-between gap-3 text-xs">
											<span className="text-gray-400">{c.label}</span>
											<span className="font-medium text-slate-700 text-right">{c.value}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-xs text-gray-400 pl-1">Sin más datos capturados.</p>
							)}
						</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	</div>
);
