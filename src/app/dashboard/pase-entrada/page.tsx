//eslint-disable react-hooks/exhaustive-deps
'use client'; 

import React, { useEffect, useRef, useState } from "react";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Multiselect from 'multiselect-react-dropdown';
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
import { Calendar, ClipboardList, MapPin, User, Users } from "lucide-react";
import { formatFecha, uniqueArray } from "@/lib/utils";
import { Comentarios } from "@/hooks/useCreateAccessPass";
// import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
import { MisContactosModal } from "@/components/modals/user-contacts";
import Image from "next/image";
import { Contacto } from "@/lib/get-user-contacts";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { usePaseEntrada } from "@/hooks/usePaseEntrada";
import { useSearchPass } from "@/hooks/useSearchPass";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useBoothStore } from "@/store/useBoothStore";
import DateTimePicker from "@/components/dateTimePicker";
import { useFieldArray } from "react-hook-form";
import { Plus, X } from "lucide-react";


 const formSchema = z
	.object({
	selected_visita_a: z.string().optional(),
	nombre: z.string().min(2, {
	  	message: "Por favor, ingresa un tu nombre completo",
	}),
	empresa: z.string().optional(),
	email: z.string().optional().refine((val) => {
		if (!val) return true;
		const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(val);
	}, {
		  message: "Por favor, ingresa un correo electrónico válido.",
	}),
	invitados: z.array(z.object({
		nombre: z.string().min(2, "Nombre requerido"),
		email: z.string().email("Correo inválido").or(z.literal("")),
	})).optional(),
	telefono: z.string().optional(),
	ubicaciones: z.array(z.string()).optional(),
	tema_cita: z.string().optional(),
	descripcion: z.string().optional(),
	perfil_pase: z.string().optional(),
	status_pase: z.string().optional(),
	visita_a: z.any().optional(),
	custom: z.boolean().optional(),
	link: z.any().optional(),
	enviar_correo_pre_registro: z.any().optional(),
	
	tipo_visita_pase: z.string().optional(),
	fechaFija: z.string().optional(),
	fecha_desde_visita: z.string().optional(),
	fecha_desde_hasta: z.string().optional(),
	config_dia_de_acceso: z.string().optional(),
	config_dias_acceso: z.array(z.string()).optional(),
	config_limitar_acceso: z.any().optional(),
	areas: z.array(z.any()).optional(),
	comentarios: z.array(z.any()).optional(),
	enviar_pre_sms: z.any().optional(),
	todas_las_areas: z.boolean().optional(),
	sala: z.string().optional()
  })
  .refine((data) => {
		if (data.tipo_visita_pase === 'rango_de_fechas') {
			return !!(data.fecha_desde_visita && data.fecha_desde_hasta);
		}
		return true;
  }, {
		message: "Ambas fechas son requeridas para rango de fechas.",
		path: ['fecha_desde_visita'],
  });

  const PaseEntradaPage = () =>  {
	const [tipoVisita, setTipoVisita] = useState("fecha_fija");
	const { location } = useBoothStore();
	
	const { excludes , includes}= useMenuStore()
	const [isSuccess, setIsSuccess] = useState(false);
	const [modalData, setModalData] = useState<any>(null);
	const [ubicacionSeleccionada,setUbicacionSeleccionada] = useState("")
	const { ubicacionesDefaultFormatted, isLoadingAreas:loadingCatAreas, isLoadingLocations:loadingUbicaciones} = useCatalogoPaseAreaLocation(ubicacionSeleccionada, true);
	const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<any[]>(ubicacionesDefaultFormatted??[]);
	const pickerRef = useRef<any>(null);
	const { assets } = useSearchPass(true);
	const assetsUnique= uniqueArray(assets?.Visita_a)
	assetsUnique.unshift("Usuario Actual");
	const [areasTodas, setAreasTodas] = useState<any[]>([]);
	const [salasTodas, setSalasTodas] = useState<any[]>([]);
	const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>([{name:"Usuario Actual",label:"Usuario Actual"}]);
	const [areasSeleccionadas,setAreasSeleccionadas]  = useState<any[]>([])
	const [salasSeleccionadas,setSalasSeleccionadas]  = useState<any[]>([])
	const [customVisitaA, setCustomVisitaA] = useState("");
	const multiselectRef = useRef<any>(null);

	const isExcluded = (key: string) =>
		Array.isArray(excludes?.pases) &&
		excludes.pases.includes(key);
	
	const isIncluded = (key: string) => 
		Array.isArray(includes?.pases_incluir) &&
		includes.pases_incluir.includes(key);


	useEffect(()=>{
		if(location)
			setUbicacionSeleccionada(location)
	},[location])

	useEffect(() => {
	  if (!ubicacionesSeleccionadas?.length) {
		setAreasTodas([]);
		return;
	  }
	
	  const fetchAreasTodas = async () => {
		const resultados = await Promise.all(
			ubicacionesSeleccionadas.map(async (ubicacion) => {
			  const res = await getCatalogoPasesAreaNoApi(ubicacion.id);
			  const areas = res?.response?.data?.areas_by_location ?? [];
			  const salas = res?.response?.data?.salas_by_location ?? [];
		  
			  const areasFormatted = areas.map((area: string) => ({
				nombre: area,
				locationId: ubicacion.id,
				nombreUbicacion: ubicacion.nombre,
				tipo: "area",
			  }));
		  
			  const salasFormatted = salas.map((sala: string) => ({
				nombre: sala,
				locationId: ubicacion.id,
				nombreUbicacion: ubicacion.nombre,
				tipo: "sala",
			  }));
			  console.log(salasFormatted, ubicacion)
		  
			  return [...areasFormatted, ...salasFormatted];
			})
		  );
		  
		  const flat = resultados.flat();
		  
		  const areasFormatted = flat
			.filter((item) => item.tipo === "area")
			.map((area) => ({
			  value: area.nombre,
			  name: area.nombre,
			  label: `${area.nombre} — ${area.locationId}`,
			}));
		  const salasFormatted = flat
			.filter((item) => item.tipo === "sala")
			.map((sala) => ({
			  value: sala.nombre,
			  name: sala.nombre,
			  label: `${sala.nombre} — ${sala.locationId}`,
			}));
			
		  setAreasTodas(areasFormatted);
		  setSalasTodas(salasFormatted);
	  };
	
	  fetchAreasTodas();
	}, [setAreasTodas, ubicacionesSeleccionadas]);

	useEffect(() => {
	  const picker = pickerRef.current;
	  if (picker) {
		const handleChange = (e: any) => {
		  setDate(new Date( formatFecha(e.target.value+":00")))
		};
  
		picker.addEventListener('value-changed', handleChange);
		return () => picker.removeEventListener('value-changed', handleChange);
	  }
	}, []);
	
	const visitaAFormatted = (assetsUnique || [])
	.filter((u: any) => u !== null && u !== undefined)
	.map((u: any) => ({ id: u, name: u }));

	const [userIdSoter] = useState<number|null>(()=>{
		return Number(typeof window !== "undefined"? window?.localStorage.getItem("userId_soter"):0) 
	});

	const[userNameSoter] = useState<string|null>(()=>{
		return typeof window !== "undefined"? window?.localStorage.getItem("userName_soter"):""
	})
	const [userEmailSoter] = useState<string|null>(()=>{
		return typeof window !== "undefined"? window?.localStorage.getItem("userEmail_soter"):""
	})


	const [host, setHost] = useState<string>();
	const [protocol,setProtocol] = useState<string>();


	useEffect(() => {
		if (typeof window !== "undefined" && typeof window?.location !== "undefined") {
			setHost(window?.location.host);
			setProtocol(window?.location.protocol);
		}
	}, []); 

	useEffect(() => {
		if (ubicacionesDefaultFormatted) {
			setUbicacionesSeleccionadas(ubicacionesDefaultFormatted)
		}
	}, [ubicacionesDefaultFormatted]); 


	const ubicacionesSeleccionadasLista = ubicacionesSeleccionadas?.map((u: any) => (u.name));
	const { dataConfigLocation, isLoadingConfigLocation } = usePaseEntrada(ubicacionesSeleccionadasLista ?? [])

	const [enviar_correo_pre_registro] = useState<string[]>([]);
	const [formatedDocs, setFormatedDocs] = useState<string[]>([])
	const [formatedEnvio, setFormatedEnvio] = useState<string[]>([])
	const [comentariosList, setComentariosList] = useState<Comentarios[]>([]);
	// const [isActive, setIsActive] = useState(false);
	// const [isActiveSMS, setIsActiveSMS] = useState(false);
	const [date, setDate] = React.useState<Date| "">("");
	console.log(date)
	const [selected, setSelected] = useState<Contacto |null>(null);
	const [isOpenModal, setOpenModal] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			selected_visita_a: "",
			nombre: "",
			empresa:"",
			email: "",
			telefono: "",
			// ubicacion:"",
			ubicaciones:[],
			tema_cita:"",
			descripcion:"",
			perfil_pase: "Visita General",
			status_pase:"Proceso",
			visita_a: userNameSoter ?? "",
			custom: true,
			link:{
				link :`${protocol}//${host}/dashboard/pase-update`,
				docs : formatedDocs,
				creado_por_id: userIdSoter || 0,
				creado_por_email: userEmailSoter ??""
			},
			enviar_correo_pre_registro:enviar_correo_pre_registro??[], 
			tipo_visita_pase: "fecha_fija",
			fechaFija: "",
			fecha_desde_visita: "",
			fecha_desde_hasta: "",
			config_dia_de_acceso: "cualquier_día",
			config_dias_acceso: [],
			config_limitar_acceso: 1,
			areas: [],
			comentarios: [],
			enviar_pre_sms:{
				from: "enviar_pre_sms",
				mensaje: "SOY UN MENSAJE",
				numero: "528120084370",
			},
			todas_las_areas:false,
			sala:"",
			invitados: []
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "invitados",
	});

	useEffect(() => {
		if (!ubicacionesSeleccionadas) return;
	  
		form.reset({
		  ...form.getValues(),
		  ubicaciones: ubicacionesSeleccionadas.map(u => u.id),
		});
	  }, [form, ubicacionesSeleccionadas]);
	  

	useEffect(()=>{
		if ( selected ) {
			form.setValue("nombre", selected?.nombre || "");
			form.setValue("email", selected?.email || "");
			form.setValue("telefono", selected?.telefono || "");
			setOpenModal(false)
		}
	}, [selected, form])

	useEffect(()=>{
		if(dataConfigLocation){
			const docs: string[] = []
			dataConfigLocation?.requerimientos?.map((value:string)=>{
				if(value=="identificacion") {
					docs.push("agregarIdentificacion")}
				if(value=="fotografia") {
					docs.push("agregarFoto")}
			})
			setFormatedDocs(docs)

			const envioCS: string[] = []
			dataConfigLocation?.envios?.map((envio: string) => {
				if(envio == "correo") {
					envioCS.push("enviar_correo_pre_registro")
				}
				if(envio == "sms") {
					envioCS.push("enviar_sms_pre_registro")
				}
			})
			setFormatedEnvio(envioCS)
		}
	},[dataConfigLocation])

	const onSubmit = (data: z.infer<typeof formSchema>) => {
		const finalUbicaciones = (ubicacionesSeleccionadas?.length > 0 
			? ubicacionesSeleccionadas.map(u => u.id) 
			: (ubicacionesDefaultFormatted?.map((u: any) => u.id) || []));

		if (!finalUbicaciones.length) {
			form.setError("ubicaciones", {
				message: "Selecciona al menos una ubicación"
			});
			return;
		}

		const formattedData = {
			created_from: "web",
			selected_visita_a: data.selected_visita_a,
			nombre: data.nombre,
			empresa: data.empresa,
			email: data.email,
			telefono: data.telefono,
			ubicacion: finalUbicaciones[0] || "",
			ubicaciones: finalUbicaciones,
			tema_cita: data.tema_cita,
			descripcion: data.descripcion,
			perfil_pase: data.perfil_pase || "Visita General",
			status_pase: "Proceso",
			visita_a: visitaASeleccionadas?.map(u => u.name) ?? [],
			custom: true,
			link: {
				link: `${protocol}//${host}/dashboard/pase-update`,
				docs: formatedDocs,
				creado_por_id: userIdSoter,
				creado_por_email: userEmailSoter,
			},
			enviar_correo_pre_registro: formatedEnvio,
			tipo_visita_pase: tipoVisita,
			fechaFija: tipoVisita === "fecha_fija" ? (data.fechaFija !== "" ? data.fechaFija : "") : "",
			fecha_desde_visita: tipoVisita === "fecha_fija" ?
				(data.fechaFija !== "" ? data.fechaFija : "") :
				(data.fecha_desde_visita !== "" ? formatFecha(data.fecha_desde_visita) + ` 00:00:00` : ""),
			fecha_desde_hasta: tipoVisita === "fecha_fija" ? "" :
				(data.fecha_desde_hasta !== "" ? formatFecha(data.fecha_desde_hasta) + ` 23:59:00` : ""),
			config_dia_de_acceso: "cualquier_día",
			config_dias_acceso: [],
			config_limitar_acceso: Number(data.config_limitar_acceso) || 1,
			areas: areasSeleccionadas?.map(u => u.value) ?? [],
			comentarios: comentariosList,
			enviar_pre_sms: {
				from: "enviar_pre_sms",
				mensaje: "SOY UN MENSAJE",
				numero: data.telefono,
			},
			invitados: [
				{ nombre: data.nombre, email: data.email || "" },
				...(data.invitados || [])
			],
			todas_las_areas: false,
			sala: salasSeleccionadas.length > 0 ? salasSeleccionadas[0].value : ""
		};

		setModalData(formattedData);
		setIsSuccess(true);
	};

	// const handleToggleAdvancedOptions = () => {
	// 	setIsActiveAdvancedOptions(!isActiveAdvancedOptions);
	// };

	// function getNextDay(date: string | number | Date) {
	// 	const currentDate = new Date(date);
	// 	currentDate.setDate(currentDate.getDate() + 1); 
	// 	return currentDate.toISOString().split('T')[0]; 
	// }

	const closeModal = () => {
		setIsSuccess(false); 
	};

return (
	<div className="min-h-screen bg-slate-50/30 pb-20">
		<EntryPassModal
			title={"Confirmación"}
			dataPass={modalData}
			isSuccess={isSuccess}
			setIsSuccess={setIsSuccess}
			onClose={closeModal}
			from={"pase"}
		/>

		<div className="max-w-4xl mx-auto px-4 pt-10">
			{/* Encabezado Compacto */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">
						Crear pase de entrada
					</h1>
					<p className="text-slate-500 text-sm">Registro de nueva visita</p>
				</div>
				<Button
					className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 h-10 px-6 rounded-xl transition-all active:scale-95 flex items-center gap-2"
					variant="default"
					onClick={()=>{setOpenModal(true)}}
				>
					<Users size={18} />
					<span>Mis contactos</span>
				</Button>
				<MisContactosModal title="Mis Contactos" setSelected={setSelected} isOpenModal={isOpenModal} setOpenModal={setOpenModal} />
			</div>

			<div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
				<Form {...form}>
					<form className="p-6 md:p-8 space-y-8">
						{/* Sección: Sobre la visita */}
						<div className="space-y-6">
							<div className="flex items-center gap-2 pb-2 border-b border-slate-100 uppercase">
								<div className="p-1 bg-blue-50 rounded-md text-blue-600">
									<Calendar size={14} />
								</div>
								<h2 className="text-xs font-bold tracking-widest text-slate-400">Sobre la visita</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
								<FormField
									control={form.control}
									name="visita_a"
									render={() => (
										<FormItem className="space-y-1.5">
											<FormLabel className="text-[13px] font-semibold text-slate-700">
												<span className="text-red-500">*</span> Visita a:
											</FormLabel>
											<Multiselect
												ref={multiselectRef}
												options={visitaAFormatted ?? []}
												selectedValues={visitaASeleccionadas}
												onSelect={setVisitaASeleccionadas}
												onRemove={setVisitaASeleccionadas}
												onSearch={(value: string) => value.length <= 70 ? setCustomVisitaA(value) : null}
												onKeyPressFn={(e: any) => {
													if (e.key === 'Enter' && customVisitaA.trim()) {
														e.preventDefault();
														const baseName = customVisitaA.trim().substring(0, 50);
														const finalValue = `${baseName}(No Registrado)`;
														if (!visitaASeleccionadas.find(item => item.name === finalValue)) {
															setVisitaASeleccionadas([...visitaASeleccionadas, { id: finalValue, name: finalValue }]);
														}
														setCustomVisitaA("");
													}
												}}
												displayValue="name"
												placeholder="Buscar anfitrión..."
												style={{
													searchBox: { border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', minHeight: '42px' },
													chips: { background: '#2563eb', borderRadius: '4px' }
												}}
											/>
											<FormMessage className="text-[11px]" />
										</FormItem>
									)}
								/>

								<FormItem className="space-y-1.5">
									<div className="flex items-center justify-between">
										<FormLabel className="text-[13px] font-semibold text-slate-700">
											<span className="text-red-500">*</span> {tipoVisita === "fecha_fija" ? "Fecha de reunión:" : "Rango de fechas:"}
										</FormLabel>
										<div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
											<button
												type="button"
												onClick={() => {
													setTipoVisita("fecha_fija");
													form.setValue("tipo_visita_pase", "fecha_fija");
												}}
												className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
													tipoVisita === "fecha_fija" 
														? "bg-white text-blue-600 shadow-sm" 
														: "text-slate-500 hover:text-slate-700"
												}`}
											>
												ÚNICA
											</button>
											<button
												type="button"
												onClick={() => {
													setTipoVisita("rango_de_fechas");
													form.setValue("tipo_visita_pase", "rango_de_fechas");
												}}
												className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
													tipoVisita === "rango_de_fechas" 
														? "bg-white text-blue-600 shadow-sm" 
														: "text-slate-500 hover:text-slate-700"
												}`}
											>
												RANGO
											</button>
										</div>
									</div>

									{tipoVisita === "fecha_fija" ? (
										<FormField
											control={form.control}
											name="fechaFija"
											render={({ field }) => (
												<FormControl>
													<div className="flex items-center">
														<DateTimePicker 
															date={field.value ? new Date(field.value + 'T12:00:00') : undefined} 
															setDate={(d: Date | undefined) => {
																if (d) {
																	const year = d.getFullYear();
																	const month = String(d.getMonth() + 1).padStart(2, '0');
																	const day = String(d.getDate()).padStart(2, '0');
																	field.onChange(`${year}-${month}-${day}`);
																} else {
																	field.onChange("");
																}
															}} 
															showTime={false} 
															placeholder="Elegir fecha"
														/>
													</div>
												</FormControl>
											)} 
										/>
									) : (
										<div className="grid grid-cols-2 gap-4">
											<div className="flex flex-col gap-1">
												<div className="flex items-center">
													<FormField
														control={form.control}
														name="fecha_desde_visita"
														render={({ field }) => (
															<DateTimePicker 
																	date={field.value ? new Date(field.value + 'T12:00:00') : undefined} 
																setDate={(d: Date | undefined) => {
																	if (d) {
																		const year = d.getFullYear();
																		const month = String(d.getMonth() + 1).padStart(2, '0');
																		const day = String(d.getDate()).padStart(2, '0');
																		field.onChange(`${year}-${month}-${day}`);
																	} else {
																		field.onChange("");
																	}
																}} 
																showTime={false} 
																placeholder="Fecha Inicio"
															/>
														)}
													/>
												</div>
												<p className="text-[9px] text-slate-400 font-medium px-1 uppercase">Desde</p>
											</div>
											<div className="flex flex-col gap-1">
												<div className="flex items-center">
													<FormField
														control={form.control}
														name="fecha_desde_hasta"
														render={({ field }) => (
															<DateTimePicker 
																	date={field.value ? new Date(field.value + 'T12:00:00') : undefined} 
																setDate={(d: Date | undefined) => {
																	if (d) {
																		const year = d.getFullYear();
																		const month = String(d.getMonth() + 1).padStart(2, '0');
																		const day = String(d.getDate()).padStart(2, '0');
																		field.onChange(`${year}-${month}-${day}`);
																	} else {
																		field.onChange("");
																	}
																}} 
																showTime={false} 
																placeholder="Fecha Fin"
															/>
														)}
													/>
												</div>
												<p className="text-[9px] text-slate-400 font-medium px-1 uppercase">Hasta</p>
											</div>
										</div>
									)}
									<FormMessage className="text-[11px]" />
								</FormItem>

								<FormField
									control={form.control}
									name="tema_cita"
									render={({ field }: any) => (
										<FormItem className="space-y-1.5">
											<FormLabel className="text-[13px] font-semibold text-slate-700">
												Asunto:
											</FormLabel>
											<FormControl>
												<Input placeholder="Motivo de la visita" {...field} />
											</FormControl>
											<FormMessage className="text-[11px]" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="empresa"
									render={({ field }: any) => (
										<FormItem className="space-y-1.5">
											<FormLabel className="text-[13px] font-semibold text-slate-700">
												Empresa:
											</FormLabel>
											<FormControl>
												<Input placeholder="Nombre de la empresa" {...field} />
											</FormControl>
											<FormMessage className="text-[11px]" />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Sección: Datos del Invitado */}
						<div className="space-y-6 pt-4">
							<div className="flex items-center gap-2 pb-2 border-b border-slate-100">
								<div className="p-1 bg-indigo-50 rounded-md text-indigo-600">
									<User size={14} />
								</div>
								<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Datos del Invitado</h2>
							</div>

							<div className="flex flex-col md:flex-row gap-8 items-start">
								{selected && (
									<div className="shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2">
										<Image
											className="h-24 w-24 object-cover rounded-full border-4 border-white shadow-md bg-white"
											src={
												selected?.fotografia && Array.isArray(selected.fotografia) && selected.fotografia[0]?.file_url?.trim()
													? selected.fotografia[0].file_url
													: "/nouser.svg"
											}
											alt="foto"
											width={96}
											height={96}
										/>
										<div className="text-center">
											<p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{selected?.nombre?.split(' ')[0]}</p>
											<p className="text-[9px] text-slate-400 font-medium">Seleccionado</p>
										</div>
									</div>
								)}

								<div className="flex-1 space-y-4 w-full">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-end">
										<FormField
											control={form.control}
											name="nombre"
											render={({ field }: any) => (
												<FormItem className="space-y-1.5 font-sans">
													<FormLabel className="text-[13px] font-semibold text-slate-700">
														<span className="text-red-500">*</span> Nombre Completo:
													</FormLabel>
													<FormControl>
														<Input placeholder="Nombre del visitante" {...field} />
													</FormControl>
													<FormMessage className="text-[11px]" />
												</FormItem>
											)}
										/>

										<div className="flex items-end gap-3">
											<FormField
												control={form.control}
												name="email"
												render={({ field }: any) => (
													<FormItem className="flex-1 space-y-1.5 font-sans">
														<FormLabel className="text-[13px] font-semibold text-slate-700">
															<span className="text-red-500">*</span> Email:
														</FormLabel>
														<FormControl>
															<Input placeholder="correo@ejemplo.com" {...field} />
														</FormControl>
														<FormMessage className="text-[11px]" />
													</FormItem>
												)}
											/>
											{fields.length === 0 && (
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={() => append({ nombre: "", email: "" })}
													className="h-10 w-10 border-blue-100 text-blue-600 hover:bg-blue-50 shrink-0"
													title="Agregar otro invitado"
												>
													<Plus size={18} />
												</Button>
											)}
											{fields.length > 0 && <div className="w-10 shrink-0" />}
										</div>
									</div>

									{fields.map((field, index) => (
										<div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 items-end animate-in fade-in slide-in-from-top-2 border-t border-slate-50 pt-3">
											<FormField
												control={form.control}
												name={`invitados.${index}.nombre`}
												render={({ field }) => (
													<FormItem className="space-y-1.5 font-sans">
														<FormControl>
															<Input {...field} placeholder="Nombre del visitante" className="h-10 border-slate-200" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<div className="flex items-end gap-3">
												<FormField
													control={form.control}
													name={`invitados.${index}.email`}
													render={({ field }) => (
														<FormItem className="flex-1 space-y-1.5 font-sans">
															<FormControl>
																<Input {...field} placeholder="correo@ejemplo.com" className="h-10 border-slate-200" />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<div className="flex gap-2 shrink-0">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => remove(index)}
														className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50"
													>
														<X size={18} />
													</Button>
													{index === fields.length - 1 && (
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => append({ nombre: "", email: "" })}
															className="h-10 w-10 border-blue-100 text-blue-600 hover:bg-blue-50"
															title="Agregar otro invitado"
														>
															<Plus size={18} />
														</Button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Sección: Áreas y Acceso */}
						{(isIncluded("salas") || !isExcluded("areas")) && (
							<div className="space-y-6 pt-4">
								<div className="flex items-center gap-2 pb-2 border-b border-slate-100">
									<div className="p-1 bg-emerald-50 rounded-md text-emerald-600">
										<MapPin size={14} />
									</div>
									<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sala y Área</h2>
								</div>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
									{isIncluded("salas") && 
										<FormField
											control={form.control}
											name="visita_a"
											render={() => (
												<FormItem className="space-y-1.5">
													<FormLabel className="text-[13px] font-semibold text-slate-700">Sala:</FormLabel>
													<Multiselect
														selectionLimit={1}
														options={salasTodas ?? []}
														selectedValues={salasSeleccionadas}
														onSelect={setSalasSeleccionadas}
														onRemove={setSalasSeleccionadas}
														displayValue="label"
														placeholder="Elegir sala..."
														style={{
															searchBox: { border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', minHeight: '42px' }
														}}
													/>
													<FormMessage />
												</FormItem>
											)}
										/>
									}
									{!isExcluded("areas") &&
										<FormField
											control={form.control}
											name="visita_a"
											render={() => (
												<FormItem className="space-y-1.5">
													<FormLabel className="text-[13px] font-semibold text-slate-700">Área:</FormLabel>
													<Multiselect
														selectionLimit={1}
														options={areasTodas ?? []}
														selectedValues={areasSeleccionadas}
														onSelect={(selected: any[]) => {
															setAreasSeleccionadas(selected);
														}}
														onRemove={(selected: any[]) => {
															setAreasSeleccionadas(selected);
														}}
														displayValue="label"
														placeholder="Seleccionar área..."
														style={{
															searchBox: { border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', minHeight: '42px' },
															chips: { background: '#10b981', borderRadius: '4px' }
														}}
													/>
													<FormMessage />
												</FormItem>
											)}
										/>
									}
								</div>
							</div>
						)}

						{/* Sección: Comentarios */}
						{!isExcluded("comentarios") && (
							<div className="space-y-4 pt-4">
								<div className="flex items-center gap-2 pb-2">
									<div className="p-1 bg-amber-50 rounded-md text-amber-600">
										<ClipboardList size={14} />
									</div>
									<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Instrucciones Adicionales</h2>
								</div>
								<Textarea
									placeholder="Escribe comentarios o instrucciones especiales para el acceso..."
									rows={3}
									onChange={(e) => {
										const value = e.target.value;
										setComentariosList([{ tipo_comentario: "Pase", comentario_pase: value }]);
									}}
								/>
							</div>
						)}

						<div className="pt-6 flex justify-center border-t border-slate-100">
							<Button
								className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-[300px] h-12 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
								variant="default"
								type="submit"
								onClick={(e) => {
									e.preventDefault();
									form.handleSubmit((data) => onSubmit(data))();
								}}
								disabled={loadingCatAreas || isLoadingConfigLocation || loadingUbicaciones}
							>
								{loadingCatAreas || isLoadingConfigLocation || loadingUbicaciones ? "Cargando..." : "Siguiente"}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	</div>
);
};

export default PaseEntradaPage;