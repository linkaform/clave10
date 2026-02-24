//eslint-disable react-hooks/exhaustive-deps
'use client'; 

import React, { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { List } from "lucide-react";
import { formatDateToString, formatFecha, uniqueArray } from "@/lib/utils";
import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
// import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
import { MisContactosModal } from "@/components/modals/user-contacts";
import Image from "next/image";
import { Contacto } from "@/lib/get-user-contacts";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { usePaseEntrada } from "@/hooks/usePaseEntrada";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSearchPass } from "@/hooks/useSearchPass";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";
import AreasList from "@/components/areas-list";
import { useMenuStore } from "@/store/useGetMenuStore";
import ComentariosList from "@/components/comentarios-list";
import { useBoothStore } from "@/store/useBoothStore";
import DateTimePicker from "@/components/dateTimePicker";


 const formSchema = z
	.object({
	selected_visita_a: z.string().optional(),
	nombre: z.string().min(2, {
	  	message: "Por favor, ingresa un tu nombre completo",
	}),
	empresa: z.string().optional(),
	email: z.string().optional().refine((val) => {
		if (val && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)) {
			return false;
		}
		return true;
	}, {
		  message: "Por favor, ingresa un correo electrónico válido.",
	}),
	telefono: z.string().optional(),
	ubicaciones: z
  .array(z.string())
  .min(1, "Selecciona al menos una ubicación"),
	tema_cita: z.string().optional(),
	descripcion: z.string().optional(),
	perfil_pase: z.string().min(1),
	status_pase:z.string().min(1),
	visita_a: z.string().nullable().optional(),
	custom: z.boolean().optional(),
	link: z.object({
		link: z.string().optional(), 
		docs: z.array(z.string()).optional(),
		creado_por_id: z.number().int({ message: "El ID debe ser un número entero." }).optional(),  
		creado_por_email: z.string().optional(), 
	}),
	enviar_correo_pre_registro:z.array(z.string()).optional(),
	
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
	config_limitar_acceso: z.number().optional().refine((val) => (val ? !isNaN(Number(val)) && Number(val) > 0 : true), {
		message:
		  "Ingrese un número válido mayor a 0 para el límite de accesos.",
	}),
	areas: z.array(z.string()),
	comentarios:z.array(
		z.object({
			tipo_comentario: z.string().optional(),      
			comentario_pase: z.string().optional(),      
		})
	),
	enviar_pre_sms: z.object({
		from: z.string().min(1, { message: "El campo 'from' no puede estar vacío." }),  
		mensaje: z.string().min(1, { message: "El mensaje no puede estar vacío." }),  
		numero: z.string().optional()
	}),
	todas_las_areas: z.boolean().optional(),
	sala: z.string().optional()
  }) 
  .refine((data) => {
		if (data.tipo_visita_pase === 'rango_de_fechas') {
		const fechaDesdeValida = data.fecha_desde_visita && data.fecha_desde_hasta;
		if (!fechaDesdeValida) {
			return false;
		}
	}
	return true;
  }, {
		message: "Ambas fechas (Desde y Hasta) son requeridas cuando el tipo de pase es 'rango de fechas'.",
		path: ['fecha_desde_visita'],
  })
  .refine((data) => {
		if (data.tipo_visita_pase === 'rango_de_fechas') {
		const fechaDesdeValida = data.fecha_desde_visita && data.fecha_desde_hasta;
		if (!fechaDesdeValida) {
			return false;
		}
	}
	return true;
  }, {
		message: "Ambas fechas (Desde y Hasta) son requeridas cuando el tipo de pase es 'rango de fechas'.",
		path: ['fecha_desde_hasta'], 
  })
  .refine((data) => {
		if (!data.email && !data.telefono) {
		return false;
		}
		return true;
  }, {
		message: "Se requiere un email o teléfono.", 
		path:['email']
  });

  const PaseEntradaPage = () =>  {
	const [tipoVisita, setTipoVisita] = useState("fecha_fija");
	const { location } = useBoothStore();
	
	const { excludes , includes}= useMenuStore()
	const [config_dias_acceso,set_config_dias_acceso] = useState<string[]>([]);
	const [config_dia_de_acceso,set_config_dia_de_acceso] = useState("cualquier_día");
	const [isSuccess, setIsSuccess] = useState(false);
	const [modalData, setModalData] = useState<any>(null);
	const [ubicacionSeleccionada,setUbicacionSeleccionada] = useState("")
	const { dataLocations:ubicaciones, ubicacionesDefaultFormatted, isLoadingAreas:loadingCatAreas, isLoadingLocations:loadingUbicaciones} = useCatalogoPaseAreaLocation(ubicacionSeleccionada, true);
	const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<any[]>(ubicacionesDefaultFormatted??[]);
	const pickerRef = useRef<any>(null);
	const { assets,assetsLoading} = useSearchPass(true);
	const assetsUnique= uniqueArray(assets?.Visita_a)
	assetsUnique.unshift("Usuario Actual");
	const [areasTodas, setAreasTodas] = useState<any[]>([]);
	const [salasTodas, setSalasTodas] = useState<any[]>([]);
	const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>([{name:"Usuario Actual",label:"Usuario Actual"}]);
	const [areasSeleccionadas,setAreasSeleccionadas]  = useState<any[]>([])
	const [salasSeleccionadas,setSalasSeleccionadas]  = useState<any[]>([])

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
	

	const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);

	useEffect(() => {
	setAreasDisponibles(
		areasTodas.map((area) => ({
		value: `${area.nombre}`,
		label: `${area.nombre} — ${area.locationId}`,
		areaId: area.nombre,
		}))
	);
	}, [areasTodas]);


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

	const ubicacionesFormatted = (ubicaciones || [])
	.filter((u: any) => u !== null && u !== undefined)
	.map((u: any) => ({ id: u, name: u }));
	
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
	const [areasList, setAreasList] = useState<Areas[]>([]);
	// const [isActive, setIsActive] = useState(false);
	// const [isActiveSMS, setIsActiveSMS] = useState(false);
	const [isActiveFechaFija, setIsActiveFechaFija] = useState(true);
	const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(false);
	const [isActivelimitarDias, setIsActiveLimitarDias] = useState(false);
	const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(true);
	const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] = useState(false);
	const [isActiveAdvancedOptions] = useState(false);
	const [date, setDate] = React.useState<Date| "">("");
	const [ fechaDesde,setFechaDesde] = useState<string>('');
	console.log(fechaDesde)
	const [selected, setSelected] = useState<Contacto |null>(null);
	const [isOpenModal, setOpenModal] = useState(false);
	const [todasAreas,setTodasAreas] = useState(false)
	const today = new Date().toISOString().split("T")[0];

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
			fecha_desde_visita:today ,
			fecha_desde_hasta: "",
			config_dia_de_acceso: "cualquier_día",
			config_dias_acceso: config_dias_acceso??[],
			config_limitar_acceso: 1,
			areas: [],
			comentarios: [],
			enviar_pre_sms:{
				from: "enviar_pre_sms",
				mensaje: "SOY UN MENSAJE",
				numero: "528120084370",
			},
			todas_las_areas:todasAreas,
			sala:""
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
		if (!data.ubicaciones?.length) {
			form.setError("ubicaciones", {
			message: "Selecciona al menos una ubicación"
			});
		}
		const formattedData = {
			created_from:"web",
			selected_visita_a: data.selected_visita_a,
			nombre: data.nombre,
			empresa:data.empresa,
			email: data.email,
			telefono: data.telefono,
			ubicacion: ubicacionesSeleccionadas[0]?.id || "",
			ubicaciones:ubicacionesSeleccionadas?.map(u => u.id) ?? [],
			tema_cita: data.tema_cita,
			descripcion: data.descripcion,
			perfil_pase: data.perfil_pase|| "",
			status_pase:"Proceso",
			visita_a: visitaASeleccionadas?.map(u => u.name) ?? [],
			custom:true,
			link:{
				link : `${protocol}//${host}/dashboard/pase-update`,
				docs : formatedDocs,
				creado_por_id: userIdSoter ,// userIdSoter,
				creado_por_email: userEmailSoter,// userEmailSoter
			},
			enviar_correo_pre_registro: formatedEnvio, 
			tipo_visita_pase: tipoVisita,
			fechaFija: date !=="" ? formatDateToString(date):"",
			fecha_desde_visita: tipoVisita === "fecha_fija"? 
				(date !=="" ? formatDateToString(date): "") : 
				(data.fecha_desde_visita !== "" ? formatFecha(data.fecha_desde_visita)+` 00:00:00`: ""),
			fecha_desde_hasta: data.fecha_desde_hasta !=="" ? formatFecha(data.fecha_desde_hasta)+` 23:59:00` : "",
			config_dia_de_acceso: config_dia_de_acceso === "limitar_días_de_acceso" ? config_dia_de_acceso : "cualquier_día",
			config_dias_acceso: config_dias_acceso,
			config_limitar_acceso: Number(data.config_limitar_acceso) || 0,
			areas:areasSeleccionadas?.map(u => u.value) ?? [],
			comentarios: comentariosList,
			enviar_pre_sms:{
				from: "enviar_pre_sms",
				mensaje: "SOY UN MENSAJE",
				numero: data.telefono,
			},
			todas_las_areas:todasAreas,
			sala: salasSeleccionadas.length>0 ? salasSeleccionadas[0].value :""
		};
	
			setModalData(formattedData);
			setIsSuccess(true);
		
	};

	console.log("ERRORES",form.formState.errors)
	// const handleToggleAdvancedOptions = () => {
	// 	setIsActiveAdvancedOptions(!isActiveAdvancedOptions);
	// };

	const handleToggleTipoVisitaPase = (tipo:string) => {
		if ( tipo == "fecha_fija" ){
			form.setValue('fecha_desde_hasta', '')
			form.setValue('fecha_desde_visita', '')
			setIsActiveFechaFija(true)
			setIsActiveRangoFecha(false)
		} else {
			form.setValue('fechaFija', '')
			setDate("")
			setIsActiveFechaFija(false)
			setIsActiveRangoFecha(true)
		}
		setTipoVisita(tipo)
	};
	const handleToggleDiasAcceso = (tipo:string) => {
		if (tipo == "cualquier_día") {
			setIsActiveCualquierDia(true)
			setIsActiveLimitarDiasSemana(false)
		} else {
			setIsActiveCualquierDia(false)
			setIsActiveLimitarDiasSemana(true)
		}
		set_config_dia_de_acceso(tipo)
	};

	const handleToggleLimitarDias = () => {
		setIsActiveLimitarDias(!isActivelimitarDias);
	};
	const handleFechaDesdeChange = (d: Date | undefined) => {
		setFechaDesde(d ? d.toISOString().split("T")[0] : "");
		form.setValue("fecha_desde_hasta", "");
	  };

	// function getNextDay(date: string | number | Date) {
	// 	const currentDate = new Date(date);
	// 	currentDate.setDate(currentDate.getDate() + 1); 
	// 	return currentDate.toISOString().split('T')[0]; 
	// }

	const closeModal = () => {
		setIsSuccess(false); 
	};

return (
	<div className="p-8">
		<EntryPassModal
			title={"Confirmación"}
			dataPass={modalData}
			isSuccess={isSuccess}
			setIsSuccess={setIsSuccess}
			onClose={closeModal}
			from={"pase"}
		/>

		<div className="flex flex-col space-y-5 max-w-3xl mx-auto">
			<div className="text-center">
				<h1 className="font-bold text-2xl">Crear pase de entrada</h1>
			</div>

			<div className="flex justify-between flex-col sm:flex-row">
				<p className="font-bold text-xl">Sobre la visita</p>
				<Button
					className="bg-blue-500 text-white hover:text-white hover:bg-blue-600 w-40"
					variant="outline"
					onClick={()=>{setOpenModal(true)}}
				>
					<List size={36} />
					Mis contactos
				</Button>
				<MisContactosModal title="Mis Contactos" setSelected={setSelected} isOpenModal={isOpenModal} setOpenModal={setOpenModal}>
				</MisContactosModal> 

			</div>

			{/* <div className="">
				<p className="font-bold">Tipo de pase : <span className="font-normal" > Visita General</span></p>
			</div> */}

			<Form {...form}>
				<form className="space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{assetsLoading ? (
						<div className="flex justify-start items-center py-4">
							 <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" /> <span className="ml-2 text-gray-500">Cargando perfiles...</span>
						</div>
						) : (
						
							<FormField
							control={form.control}
							name="perfil_pase"
							render={({ field }) => (
							  <FormItem className="w-full">
								<FormLabel>Tipo de pase:</FormLabel>
						  
								<FormControl>
								  <Select
									value={field.value}
									onValueChange={field.onChange}
								  >
									<SelectTrigger className="w-full" >
									  <SelectValue placeholder="Selecciona una opción" />
									</SelectTrigger>
						  
									<SelectContent>
									  {assets?.Perfiles?.map((item: string) => (
										<SelectItem key={item} value={item}>
										  {item}
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

						{/* <FormField
							control={form.control}
							name="selected_visita_a"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Visita a: </FormLabel>
									<Select onValueChange={(value) => field.onChange(value)}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Usuario actual" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{assetsUnique.map((item: string) => (
												<SelectItem key={item} value={item}>
													{item}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>	 */}

						<FormField
						control={form.control}
						name="visita_a"
						render={() => (
							<FormItem>
							<FormLabel>
								<span className="text-red-500">*</span> Visita a:
							</FormLabel>

							<Multiselect
								options={visitaAFormatted ?? []}
								selectedValues={visitaASeleccionadas}
								onSelect={setVisitaASeleccionadas}
								onRemove={setVisitaASeleccionadas}
								displayValue="name"
							/>

							<FormMessage />
							</FormItem>
						)}
						/>

						{selected && (
							<Image
								className="dark:invert h-32 w-32 object-cover rounded-full bg-gray-300"
								src={
								selected?.fotografia &&
								Array.isArray(selected.fotografia) &&
								selected.fotografia[0]?.file_url?.trim()
									? selected.fotografia[0].file_url
									: "/nouser.svg"
								}
								alt="foto"
								width={150}
								height={50}
							/>
						)}

						<FormField
							control={form.control}
							name="nombre"
							render={({ field}:any)=> (
								<FormItem>
									<FormLabel className="">
										<span className="text-red-500">*</span> Nombre Completo:
									</FormLabel>{" "}
									<FormControl>
										<Input placeholder="Nombre Completo" {...field} 
										/>
									</FormControl>
								<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="empresa"
							render={({ field}:any)=> (
								<FormItem>
									<FormLabel className="">
										Empresa:
									</FormLabel>{" "}
									<FormControl>
										<Input placeholder="Empresa" {...field} 
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
							name="email"
							render={({ field }: any) => (
							<FormItem>
								<FormLabel className="">
								<span className="text-red-500">*</span> Email:
								</FormLabel>{" "}
								<FormControl>
								<Input placeholder="example@example.com" {...field}
								onChange={(e) => {
									field.onChange(e);
								}}
								/>
								</FormControl>
								<FormMessage />
							</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="telefono"
							render={({ field }: any) => (
							<FormItem>
								<FormLabel>
								Teléfono: 
								</FormLabel>
								<FormControl>
								<PhoneInput
									{...field}
									// value={`${selected?.telefono||""}`}
									onChange={(value:string) => {
									form.setValue("telefono", value || "");
									}}
									placeholder="Teléfono"
									defaultCountry="MX"
									international={false}
									withCountryCallingCode={false}
									containerComponentProps={{
									className:
										"flex h-10 w-full rounded-md border border-input bg-background pl-3 py-0 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
									}}
									numberInputProps={{
									className: "pl-3",
									}}
								/>
								</FormControl>
								<FormMessage />
							</FormItem>
							)}
						/>

						<FormField
						control={form.control}
						name="ubicaciones"
						render={() => (
							<FormItem>
							<FormLabel>
								<span className="text-red-500">*</span> Ubicaciones del pase:
							</FormLabel>

							<Multiselect
								options={ubicacionesFormatted ?? []}
								selectedValues={ubicacionesSeleccionadas}
								onSelect={setUbicacionesSeleccionadas}
								onRemove={setUbicacionesSeleccionadas}
								displayValue="name"
							/>

							<FormMessage />
							</FormItem>
						)}
						/>
											
						<FormField
							control={form.control}
							name="tema_cita"
							render={({ field }:any) => (
							<FormItem>
								<FormLabel className="">
									Motivo de visita:
								</FormLabel>{" "}
								<FormControl>
								<Input placeholder="Motivo de la visita" {...field}
								/>
								</FormControl>
								<FormMessage />
							</FormItem>
							)}
						/>
					</div>
				

					<div className="grid gap-5">
						<FormField
						control={form.control}
						name="descripcion"
						render={({ field }:any) => (
							<FormItem>
							<FormLabel className="">
								Descripción/ Comentarios:
							</FormLabel>{" "}
							<FormControl>
							<Textarea
								placeholder="Escribe un comentario"
								{...field}
								rows={2}
								/>
							</FormControl>
							<FormMessage />
							</FormItem>
						)}
						/>         
					</div>
					

					<h1 className="font-bold text-xl">Sobre vigencia y acceso</h1>
					<div className="flex items-center flex-wrap gap-5">
						<FormLabel>Vigencia: </FormLabel>
						<Controller
							control={form.control}
							name="tipo_visita_pase"
							render={() => (
								<FormItem>
								{!isExcluded("vigencia") && 
									<Button
										type="button"
										onClick={() => { if (!isExcluded("vigencia")) handleToggleTipoVisitaPase("rango_de_fechas") }}
										disabled={isExcluded("vigencia")}
										className={`px-4 py-2 rounded-md transition-all duration-300 ${
											isActiveRangoFecha ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
										} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] mr-2
										${isExcluded("vigencia") ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
									>
										<div className="flex flex-wrap items-center">
											{isActiveRangoFecha ? (
												<><div className="">Vigencia</div></>
											) : (
												<><div className="text-blue-600">Vigencia</div></>
											)}
										</div>
									</Button>
								}
								<Button
									type="button"
									onClick={()=>{handleToggleTipoVisitaPase("fecha_fija")}}
									className={`px-4 py-2 rounded-md transition-all duration-300 ${
									isActiveFechaFija ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
									} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] mr-2`}
								>
									<div className="flex flex-wrap items-center">
									{isActiveFechaFija ? (
										<><div className="">Fecha Fija</div></>
									):(
										<><div className="text-blue-600">Fecha Fija</div></>
									)}
										
									</div>
								</Button>
						
								{tipoVisita === "rango_de_fechas" && (
									<Button
									type="button"
									onClick={()=>{handleToggleLimitarDias()}}
									className={`px-4 py-2 rounded-md transition-all duration-300 ${
										isActivelimitarDias ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
									} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
									>
									<div className="flex flex-wrap items-center">
										{isActivelimitarDias ? (
										<><div className="">Limitar Accesos</div></>
										):(
										<><div className="text-blue-600">Limitar Accesos</div></>
										)}
										
									</div>
									</Button>
								)}
								<FormMessage />
								</FormItem>
							)}
							/>
					</div>

					<div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{tipoVisita === "fecha_fija" && (
							<><FormField
									control={form.control}
									name="fechaFija"
									render={() => (
										<FormItem>
											<FormLabel>
												<span className="text-red-500">*</span> Fecha y Hora de
												Visita:
											</FormLabel>
											<FormControl>
												<DateTimePicker date={date ? new Date(date) : undefined} setDate={(d: Date | undefined) => setDate(d as Date)}
  															allowPast minuteStep={5} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)} />
									</>

						)} 

					

						{tipoVisita === "rango_de_fechas" && (
						<div className="grid grid-cols-1 md:grid-cols-1 gap-2">
							<FormField
							control={form.control}
							name="fecha_desde_visita"
							render={({ field }: any) => (
								<FormItem>
								<FormLabel>
									<span className="text-red-500">*</span> Fecha desde:
								</FormLabel>
								<FormControl>
								<DateTimePicker
									date={field.value ? new Date(field.value) : undefined}
									setDate={(d: Date | undefined) => {
										const str = d ? d.toISOString().split("T")[0] : "";
										field.onChange(str);
										handleFechaDesdeChange(d);
									}}
									showTime={false}
									/>

								</FormControl>
								<FormMessage />
								</FormItem>
							)}
							/>
							<FormField
							control={form.control}
							name="fecha_desde_hasta"
							render={({ field }: any) => (
								<FormItem>
								<FormLabel>
									<span className="text-red-500">*</span> Vigencia:
								</FormLabel>
								<FormControl>
								<DateTimePicker
								date={field.value ? new Date(field.value) : undefined}
								setDate={(d: Date | undefined) => {
									const str = d ? d.toISOString().split("T")[0] : "";
									field.onChange(str);
								}}
								showTime={false}
								/>
								</FormControl>
								<FormMessage />
								</FormItem>
							)}
							/>
						</div>
						)}
						</div>
						{(tipoVisita === "fecha_fija" || (tipoVisita === "rango_de_fechas" && isActivelimitarDias)) && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
							<FormField
								control={form.control}
								name="config_limitar_acceso"
								render={({ field }: any) => (
									<FormItem>
										<FormLabel>Limitar número de accesos:</FormLabel>
										<FormControl>
											<Input
												placeholder="Ejemplo: 5"
												type="number"
												min={0}
												step={1}
												{...field}
												value={field.value ? Number(field.value) : 0}
												onChange={(e) => {
													const newValue = e.target.value ? Number(e.target.value) : 0;
													field.onChange(newValue);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					)}
						{tipoVisita === "rango_de_fechas" && (
							<><div className="grid  gap-5 mt-3">
								<FormField
									control={form.control}
									name="config_dia_de_acceso"
									render={() => (
										<FormItem>
											<FormLabel>Días de acceso:</FormLabel>
											<Controller
												control={form.control}
												name="config_dia_de_acceso"
												render={({ }) => (
													<FormItem>
													<Button
														type="button"
														onClick={()=>{handleToggleDiasAcceso("cualquier_día")}}
														className={`px-4 py-2 rounded-md transition-all duration-300 ${
														isActiveCualquierDia ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
														} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] mr-2`}
													>
														<div className="flex flex-wrap items-center">
														{isActiveCualquierDia ? (
															<><div className="">Cualquier Día</div></>
														):(
															<><div className="text-blue-600">Cualquier Día</div></>
														)}
														</div>
													</Button>
													<Button
														type="button"
														onClick={()=>{handleToggleDiasAcceso("limitar_días_de_acceso")}}
														className={`px-4 py-2 rounded-md transition-all duration-300 ${
														isActivelimitarDiasSemana ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
														} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]  mr-2`}
													>
														<div className="flex flex-wrap items-center">
														{isActivelimitarDiasSemana ? (
															<><div className="">Limitar Días de Acceso</div></>
														):(
															<><div className="text-blue-600">Limitar Días de Acceso</div></>
														)}
														</div>
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
								<div>
									<FormLabel>Seleccione los días de acceso:</FormLabel>
										<div className="flex flex-wrap mt-2 mb-5">
											{[
											"Lunes",
											"Martes",
											"Miércoles",
											"Jueves",
											"Viernes",
											"Sábado",
											"Domingo"
											].map((dia) => {
											return (
												<FormItem key={dia?.toLowerCase()} className="flex items-center space-x-3">
													<FormControl>
														<Button
														type="button"
														onClick={() => toggleDia(dia?.toLocaleLowerCase())}
														className={`m-2 px-4 py-2 rounded-md transition-all duration-300 
														${config_dias_acceso.includes(dia?.toLowerCase()) ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-white"}
														hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
														>
															<div className="flex flex-wrap">
																{config_dias_acceso.includes(dia?.toLowerCase()) ? (
																	<><div className="">{dia}</div></>
																) : (
																	<><div className="text-blue-600">{dia}</div></>
																)}
															</div>
														</Button>
													</FormControl>
												</FormItem>
											);
											})}
										</div>
								</div>
								)}
							</div>
							</>
						)} 


							
					</div>
				{isIncluded("salas") && 
					<div className="grid grid-cols-1 md:grid-cols-2  gap-5 mt-3">
						<FormField
							control={form.control}
							name="visita_a"
							render={() => (
								<FormItem>
								<FormLabel>
									 Salas:
								</FormLabel>

								<Multiselect
									selectionLimit={1}
									options={salasTodas ?? []}
									selectedValues={salasSeleccionadas}
									onSelect={(selected: any[]) => {
										setSalasSeleccionadas(selected);
									}}
									onRemove={(selected: any[]) => {
										setSalasSeleccionadas(selected);
									}}
									displayValue="label"
								/>

								<FormMessage />
								</FormItem>
							)}
							/>
					</div>
				}
				{!isExcluded("areas") &&
					<div className="grid grid-cols-1 md:grid-cols-2  gap-5 mt-3">
						<FormField
						control={form.control}
						name="visita_a"
						render={() => (
							<FormItem>
							<FormLabel>
								 Áreas:
							</FormLabel>

							<Multiselect
								options={areasTodas ?? []}
								selectedValues={areasSeleccionadas}
								onSelect={(selected: any[]) => {
									setAreasSeleccionadas(selected);
									setAreasList(selected.map((a) => a.value));
								}}
								onRemove={(selected: any[]) => {
									setAreasSeleccionadas(selected);
									setAreasList(selected.map((a) => a.value));
								}}
								displayValue="label"
							/>

							<FormMessage />
							</FormItem>
						)}
						/>

						{/* <div className="flex gap-2 flex-wrap">
							<Button
							disabled={todasAreas}
							type="button"
							onClick={handleToggleAdvancedOptions}
							className={`px-4 py-2 rounded-md transition-all duration-300 ${
									isActiveAdvancedOptions ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
								} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
							>
							<div className="flex flex-wrap">
								{isActiveAdvancedOptions ? (
								<div>Áreas de acceso</div>
								) : (
								<div className="text-blue-600">Áreas de acceso</div>
								)}
							</div>
							</Button>
						</div> */}


						<div className="flex items-center flex-wrap gap- mt-7">
							<FormLabel>Todas las áreas: {`(no / si)`}:  </FormLabel>
							<div className="flex items-center flex-wrap gap-5">
							<Switch
							className="data-[state=checked]:bg-blue-600"
								checked={todasAreas}
								onCheckedChange={(checked) => setTodasAreas(checked)}
								aria-readonly
							/>
						</div>
						</div>

					</div>
					}
				</form>
			</Form>
			
			{isActiveAdvancedOptions&& (
				<><div className="font-bold text-xl">Areas de acceso:</div>
					<AreasList
						areas={areasList}
						setAreas={setAreasList}
						catAreas={areasDisponibles}
						loadingCatAreas={loadingCatAreas} existingAreas={false} 
					/>
				</> )
			}
			{!isExcluded("comentarios") &&
			<>
				<div className="font-bold text-xl">Comentarios/ Instrucciones:</div><ComentariosList
				comentarios={comentariosList}
				setComentarios={setComentariosList}
				tipo={"Pase"} />
			</>
		}
				<div className="text-center">
					<Button
						className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-2/3 md:w-1/2 lg:w-1/2"
						variant="secondary"
						type="submit"
						onClick={(e)=>{e.preventDefault()
							form.handleSubmit(onSubmit)()
						}}
						disabled= {loadingCatAreas || isLoadingConfigLocation || loadingUbicaciones  }
					>
						{loadingCatAreas == false && isLoadingConfigLocation == false && loadingUbicaciones == false  ? ("Siguiente") : ("Cargando...")} 
					</Button>
				</div>
		</div>
	</div>
);
};

export default PaseEntradaPage;