/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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

import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { formatDateToString, uniqueArray } from "@/lib/utils";
import { useGetConfSeguridad } from "@/hooks/useGetConfSeguridad";
import AreasList from "@/components/areas-list";
import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
import ComentariosList from "@/components/comentarios-list";
import DateTime from "@/components/dateTime";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { EntryPassModalUpdate } from "./add-pass-modal-update";
import { useBoothStore } from "@/store/useBoothStore";
import { useSearchPass } from "@/hooks/useSearchPass";
import { Switch } from "../ui/switch";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";

const linkSchema = z.object({
	link: z.string().url({ message: "Por favor, ingresa una URL válida." }),
	docs: z.array(z.string()).optional(),
	creado_por_id: z.number().int({ message: "El ID debe ser un número entero." }),
	creado_por_email: z.string().email({ message: "Por favor, ingresa un correo electrónico válido." }),
});

const enviarPreSmsSchema = z.object({
	from: z.string().min(1, { message: "El campo 'from' no puede estar vacío." }),
	mensaje: z.string().min(1, { message: "El mensaje no puede estar vacío." }),
	numero: z.string().optional()
});

const comentariosSchema = z.array(
	z.object({
		tipo_comentario: z.string().optional(),
		comentario_pase: z.string().optional(),
	})
);

const areasSchema = z.array(
	z.object({
		nombre_area: z.string().optional(),
		commentario_area: z.string().optional(),
	})
);

const formSchema = z
	.object({
		created_from:z.string().optional(),
		nombre: z.string().min(2, {
			message: "Por favor, ingresa un tu nombre completo",
		}),
		email: z.string().optional().refine((val) => {
			if (val && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)) {
				return false;
			}
			return true;
		}, {
			message: "Por favor, ingresa un correo electrónico válido.",
		}),
		telefono: z.string().optional(),
		empresa: z.string().optional(),
		ubicacion: z.array(z.string()).optional(),
		tema_cita: z.string().optional(),
		descripcion: z.string().optional(),
		perfil_pase: z.string().min(1),
		status_pase: z.string().min(1),
		visita_a: z.array(z.any()).optional(),
		custom: z.boolean().optional(),
		link: linkSchema,
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
		config_limitar_acceso: z.number().optional().refine((val) => (val ? !isNaN(Number(val)) && Number(val) > 0 : true), {
			message:
				"Ingrese un número válido mayor a 0 para el límite de accesos.",
		}),
		areas: areasSchema,
		comentarios: comentariosSchema,
		enviar_pre_sms: enviarPreSmsSchema,
		qr_pase: z.array(z.unknown()).optional(),
		todas_las_areas: z.boolean().optional()
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
		path: ['email']
	});

interface updatedFullPassModalProps {
	dataPass: any;
	setModalEditarAbierto: Dispatch<SetStateAction<boolean>>;
	modalEditarAbierto: boolean;
}

interface AreaAcceso {
	incidente_area: string;
	commentario_area: string;
}


const UpdateFullPassModal: React.FC<updatedFullPassModalProps> = ({ dataPass, setModalEditarAbierto, modalEditarAbierto }) => {
	const { location } = useBoothStore()
	const [tipoVisita, setTipoVisita] = useState(dataPass.tipo_visita_pase || "fecha_fija");
	const [config_dias_acceso, set_config_dias_acceso] = useState<string[]>(dataPass.config_dias_acceso || []);
	const [config_dia_de_acceso, set_config_dia_de_acceso] = useState(dataPass.config_dia_de_acceso);
	const [isSuccess, setIsSuccess] = useState(false);
	const [modalData, setModalData] = useState<any>(null);
	const { ubicacionesDefaultFormatted, dataLocations: ubicaciones, isLoadingAreas: loadingCatAreas } = useCatalogoPaseAreaLocation(location ?? "", true, location ? true : false)
	const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<any[]>(ubicacionesDefaultFormatted ?? []);
	const ubicacionesFormattedUpdate = ubicacionesSeleccionadas?.map((u: any) => (u.name));
	const userEmailSoter = localStorage.getItem("userEmail_soter") || "";
	const userIdSoter = parseInt(localStorage.getItem("userId_soter") || "0", 10);

	const { data: dataConfigLocation, isLoading: loadingConfigLocation } = useGetConfSeguridad(ubicacionesSeleccionadas?.[0]?.id ?? [])
	const ubicacionesFormatted = ubicaciones?.map((u: any) => ({ id: u, name: u }));

	const [formatedDocs, setFormatedDocs] = useState<string[]>([])
	const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(dataPass.tipo_visita_pase || "rango_de_fechas");
	const [comentariosList, setComentariosList] = useState<Comentarios[]>(dataPass.comentarios);

	const areasFormateadas = dataPass?.areas?.map(
		({ incidente_area, commentario_area }: AreaAcceso) => ({
			nombre_area: incidente_area,
			commentario_area,
		})
	);

	const [areasList, setAreasList] = useState<Areas[]>(areasFormateadas);
	const [isActiveFechaFija, setIsActiveFechaFija] = useState(dataPass.tipo_visita_pase == "fecha_fija");
	const [isActivelimitarDias, setIsActiveLimitarDias] = useState(dataPass.config_limitar_acceso > 0 ? true : false);
	const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(true);
	const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] = useState(false);
	const [formatedEnvio, setFormatedEnvio] = useState<string[]>([])
	const [isActiveAdvancedOptions, setIsActiveAdvancedOptions] = useState(dataPass.areas.length > 0);
	const [date, setDate] = React.useState<Date | "">(dataPass.tipo_visita_pase == "fecha_fija" ?
		new Date(dataPass.fecha_desde_visita) : new Date(dataPass.fecha_desde_visita));
	const [todasAreas, setTodasAreas] = useState(dataPass?.todas_las_areas || false)
	const { assets } = useSearchPass(true);
	const assetsUnique = uniqueArray(assets?.Visita_a)
	assetsUnique.unshift("Usuario Actual");
	const visitaAFormatted = (assetsUnique || [])
	.filter((u: any) => u !== null && u !== undefined)
	.map((u: any) => ({ id: u, name: u }));
	const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>(dataPass?.visita_a);
	const multiRef = useRef<any>(null);
	const [fechaDesde, setFechaDesde] = useState<string>('');
	useEffect(() => {
		if (modalEditarAbierto && multiRef.current) {
		  multiRef.current.toggleOptionsList(false);
		}
	  }, [modalEditarAbierto]);
	// Estados para áreas dinámicas
	const [areasTodas, setAreasTodas] = useState<any[]>([]);
	const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);

	useEffect(() => {
		if (!dataPass?.visita_a) {
		  setVisitaASeleccionadas([]);
		  return;
		}
		setVisitaASeleccionadas(dataPass?.visita_a);
	  
	  }, [dataPass]);

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
					return areas.map((area: string) => ({
						nombre: area,
						locationId: ubicacion.id,
						nombreUbicacion: ubicacion.nombre,
					}));
				})
			);

			setAreasTodas(resultados.flat());
		};

		fetchAreasTodas();
	}, [ubicacionesSeleccionadas]);

	useEffect(() => {
		setAreasDisponibles(
			areasTodas.map((area) => ({
				value: `${area.nombre}`,
				label: `${area.nombre} — ${area.locationId}`,
				areaId: area.nombre,
			}))
		);
	}, [areasTodas]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			created_from:"web",
			nombre: dataPass.nombre,
			email: dataPass.email || "",
			telefono: dataPass.telefono || "",
			empresa: dataPass.empresa || "",
			ubicacion: dataPass.ubicacion || [],
			tema_cita: dataPass.tema_cita || "",
			descripcion: dataPass.descripcion || "",
			perfil_pase: dataPass.perfil_pase || "",
			status_pase: dataPass.status_pase || "",
			visita_a: Array.isArray(dataPass?.visita_a)
				? dataPass.visita_a.map((v: any) => v?.nombre || v)
				: [dataPass?.visita_a?.nombre || dataPass?.visita_a || ""],
			custom: true,
			link: {
				link: dataPass.link.link,
				docs: formatedDocs,
				creado_por_id: userIdSoter,
				creado_por_email: userEmailSoter
			},
			qr_pase: dataPass.qr_pase || [],
			enviar_correo_pre_registro: formatedEnvio,
			tipo_visita_pase: tipoVisita || "",
			fechaFija: dataPass.tipo_visita_pase == "fecha_fija" ?
				dataPass.fechaFija : dataPass.fecha_desde_visita,
			fecha_desde_visita: dataPass.tipo_visita_pase === "fecha_fija" ?
				(dataPass.fechaFija || dataPass.fecha_desde_visita) : (dataPass.fecha_desde_visita),
			fecha_desde_hasta: dataPass.fecha_desde_hasta !== "" ? dataPass.fecha_desde_hasta : "",
			config_dia_de_acceso: config_dia_de_acceso === "limitar_días_de_acceso" ? config_dia_de_acceso : "cualquier_día",
			config_dias_acceso: config_dias_acceso,
			config_limitar_acceso: Number(dataPass.config_limitar_acceso) || 1,
			areas: areasList,
			comentarios: comentariosList,
			enviar_pre_sms: {
				from: "enviar_pre_sms",
				mensaje: "prueba",
				numero: dataPass.telefono,
			},
			todas_las_areas: todasAreas
		},
	});

	useEffect(() => {
		if (dataPass) {
			setAreasList(areasFormateadas)
			form.setValue("email", dataPass?.email);
		}
	}, [dataPass])


	const toggleDia = (dia: string) => {
		set_config_dias_acceso((prev) => {
			const updatedDias = prev.includes(dia)
				? prev.filter((d) => d !== dia)
				: [...prev, dia];
			return updatedDias;
		});
	};

	useEffect(() => {
		if (ubicacionesDefaultFormatted) {
			setUbicacionesSeleccionadas(ubicacionesDefaultFormatted)
		}
	}, [ubicacionesDefaultFormatted]);

	useEffect(() => {
		if (modalEditarAbierto) {
			form.setValue("fecha_desde_visita", dataPass.fecha_desde_visita.split(" ")[0])
			form.setValue("fecha_desde_hasta", dataPass.fecha_desde_hasta.split(" ")[0])
			setUbicacionesSeleccionadas(dataPass.ubicacion)
		}
	}, [modalEditarAbierto])

	useEffect(() => {
		if (form.formState.errors) {
			console.log("errores", form.formState.errors)
		}
	}, [form.formState.errors])

	useEffect(() => {
		if (dataConfigLocation) {
			const docs: string[] = []
			dataConfigLocation?.requerimientos?.map((value: string) => {
				if (value == "identificacion") {
					docs.push("agregarIdentificacion")
				}
				if (value == "fotografia") {
					docs.push("agregarFoto")
				}
			})
			setFormatedDocs(docs)

			const envioCS: string[] = []
			dataConfigLocation?.envios?.map((envio: string) => {
				if (envio == "correo") {
					envioCS.push("enviar_correo_pre_registro")
				}
				if (envio == "sms") {
					envioCS.push("enviar_sms_pre_registro")
				}
			})
			setFormatedEnvio(envioCS)
		}
	}, [dataConfigLocation])


	const onSubmit = (data: z.infer<typeof formSchema>) => {
		const formattedData = {
			_id: dataPass._id,
			folio: dataPass.folio,
			nombre: data.nombre,
			email: data.email || "",
			telefono: data.telefono || "",
			empresa: data.empresa || "",
			ubicacion: ubicacionesFormattedUpdate,
			tema_cita: data.tema_cita || "",
			descripcion: data.descripcion || "",
			perfil_pase: dataPass.perfil_pase || "",
			status_pase: data.status_pase || "",
			visita_a: visitaASeleccionadas?.map(u => u.name) ?? [],
			custom: true,
			link: {
				link: dataPass.link.link,
				docs: formatedDocs,
				creado_por_id: userIdSoter,
				creado_por_email: userEmailSoter
			},
			qr_pase: dataPass.qr_pase || [],
			limitado_a_dias: dataPass.limitado_a_dias || [],
			enviar_correo_pre_registro: formatedEnvio,
			tipo_visita_pase: tipoVisita || "",
			config_dia_de_acceso: config_dia_de_acceso === "limitar_días_de_acceso" ? config_dia_de_acceso : "cualquier_día",
			config_dias_acceso: config_dias_acceso,
			config_limitar_acceso: Number(data.config_limitar_acceso) || 1,
			areas: areasList,
			comentarios: comentariosList,
			enviar_pre_sms: {
				from: "enviar_pre_sms",
				mensaje: "prueba",
				numero: dataPass.telefono,
			},

			fechaFija: date !== "" ? formatDateToString(date) : "",
			fecha_desde_visita: tipoVisita === "fecha_fija" ? (date !== "" ? formatDateToString(date) : "") :
				(data.fecha_desde_visita !== "" ? data.fecha_desde_visita : ""),
			fecha_desde_hasta: data.fecha_desde_hasta ? data?.fecha_desde_hasta.split(" ")[0] : "",
			grupo_equipos: dataPass.grupo_equipos,
			grupo_vehiculos: dataPass.grupo_vehiculos,
			foto: dataPass.foto || [],
			identificacion: dataPass.identificacion || [],
			todas_las_areas: todasAreas
		};

		if (tipoVisita == "fecha_fija" && date == "") {
			form.setError("fechaFija", { type: "manual", message: "Fecha Fija es requerida cuando el tipo de pase es 'fecha fija'." });
		} else if (tipoVisita == "rango_de_fechas" && (formattedData.fecha_desde_visita == "" || formattedData.fecha_desde_hasta == "")) {
			form.setError("fecha_desde_hasta", { type: "manual", message: "Ambas fechas son requeridas" });
		} else {
			setModalData(formattedData);
			setIsSuccess(true);
		}

	};

	const handleToggleAdvancedOptions = () => {
		setIsActiveAdvancedOptions(!isActiveAdvancedOptions);
	};

	const handleToggleTipoVisitaPase = (tipo: string) => {
		if (tipo == "fecha_fija") {
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

	const handleToggleDiasAcceso = (tipo: string) => {
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

	const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFechaDesde(e.target.value);
		form.setValue('fecha_desde_hasta', '');
	};

	function getNextDay(date: string | number | Date) {
		const currentDate = new Date(date);
		currentDate.setDate(currentDate.getDate() + 1);
		return currentDate.toISOString().split('T')[0];
	}

	const closeModal = () => {
		setIsSuccess(false);
	};



	return (
		<Dialog open={modalEditarAbierto} onOpenChange={setModalEditarAbierto} modal >
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-scroll">
				<DialogHeader>
					<DialogTitle className="text-2xl text-center  font-bold">
						Editar pase
					</DialogTitle>
				</DialogHeader>


				<div className="p-8 pt-0">
					<EntryPassModalUpdate
						title={"Confirmación"}
						dataPass={modalData}
						isSuccess={isSuccess}
						setIsSuccess={setIsSuccess}
						onClose={closeModal}
						id={dataPass._id}
						folio={dataPass.folio}
					/>

					<div className="flex flex-col space-y-5 max-w-3xl mx-auto">

						<div className="">
							<p className="font-bold">Tipo de pase : <span className="font-normal" > {dataPass?.perfil_pase}</span></p>
						</div>

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

									<FormField
										control={form.control}
										name="visita_a"
										render={() => (
											<FormItem>
												<FormLabel>
													<span className="text-red-500">*</span> Visita a:
												</FormLabel>

												<Multiselect ref={multiRef}
													options={visitaAFormatted ?? []}
													selectedValues={visitaASeleccionadas}
													onSelect={setVisitaASeleccionadas}
													onRemove={setVisitaASeleccionadas}
													displayValue="name"   
													closeOnSelect={true}
													avoidHighlightFirstOption
												/>

												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="nombre"
										render={({ field }: any) => (
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
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<FormField
										control={form.control}
										name="empresa"
										render={({ field }: any) => (
											<FormItem>
												<FormLabel>Empresa:</FormLabel>
												<FormControl>
													<Input placeholder="Empresa" {...field} />
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
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									

									<FormField
										control={form.control}
										name="telefono"
										render={({ field }: any) => (
											<FormItem>
												<FormLabel>
													<span className="text-red-500">*</span> Teléfono
												</FormLabel>
												<FormControl>
													<PhoneInput
														{...field}
														onChange={(value: string) => {
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

									<div className="mt-0">
										<div className="text-sm mb-2">Ubicaciones del pase: </div>
										<Multiselect
											options={ubicacionesFormatted}
											selectedValues={ubicacionesDefaultFormatted}
											onSelect={(selectedList) => {
												setUbicacionesSeleccionadas(selectedList);
											}}
											onRemove={(selectedList) => {
												setUbicacionesSeleccionadas(selectedList);
											}}
											displayValue="name"
										/>
									</div>



									<FormField
										control={form.control}
										name="tema_cita"
										render={({ field }: any) => (
											<FormItem>
												<FormLabel className="">
													Motivo de visita:
												</FormLabel>{" "}
												<FormControl>
													<Input placeholder="" {...field}
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
										render={({ field }: any) => (
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
												<Button
													type="button"
													onClick={() => { handleToggleTipoVisitaPase("rango_de_fechas") }}
													className={`px-4 py-2 rounded-md transition-all duration-300 ${isActiveRangoFecha ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
														} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]  mr-2`}
												>
													<div className="flex flex-wrap items-center">
														{isActiveRangoFecha ? (
															<><div className="">Vigencia</div></>
														) : (
															<><div className="text-blue-600">Vigencia</div></>
														)}

													</div>
												</Button>
												<Button
													type="button"
													onClick={() => { handleToggleTipoVisitaPase("fecha_fija") }}
													className={`px-4 py-2 rounded-md transition-all duration-300 ${isActiveFechaFija ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
														} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] mr-2`}
												>
													<div className="flex flex-wrap items-center">
														{isActiveFechaFija ? (
															<><div className="">Fecha Fija</div></>
														) : (
															<><div className="text-blue-600">Fecha Fija</div></>
														)}

													</div>
												</Button>

												{tipoVisita === "rango_de_fechas" && (
													<Button
														type="button"
														onClick={() => { handleToggleLimitarDias() }}
														className={`px-4 py-2 rounded-md transition-all duration-300 ${isActivelimitarDias ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
															} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
													>
														<div className="flex flex-wrap items-center">
															{isActivelimitarDias ? (
																<><div className="">Limitar Accesos</div></>
															) : (
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
											<FormField
												control={form.control}
												name="fechaFija"
												render={() => (
													<FormItem>
														<FormLabel>
															<span className="text-red-500">*</span> Fecha y Hora de Visita:
														</FormLabel>
														<FormControl>

															<DateTime date={date} setDate={setDate} />

														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
										{tipoVisita === "rango_de_fechas" && (
											<><div className="grid grid-cols-1 md:grid-cols-1 gap-2">
												<FormField
													control={form.control}
													name="fecha_desde_visita"
													render={({ field }: any) => (
														<FormItem>
															<FormLabel>
																<span className="text-red-500">*</span> Fecha desde:
															</FormLabel>
															<FormControl>
																<Input
																	type="date"
																	{...field}
																	min={new Date().toISOString().split('T')[0]}
																	onChange={(e) => {
																		field.onChange(e);
																		handleFechaDesdeChange(e);

																	}}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)} />
												<FormField
													control={form.control}
													name="fecha_desde_hasta"
													render={({ field }: any) => (
														<FormItem>
															<FormLabel>
																<span className="text-red-500">*</span> Vigencia:
															</FormLabel>
															<FormControl>
																<Input
																	type="date"
																	{...field}
																	min={fechaDesde ? getNextDay(fechaDesde) : new Date().toISOString().split('T')[0]}
																	onChange={(e) => {
																		field.onChange(e);

																	}}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)} />
											</div>
											</>
										)}
									</div>


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
															render={() => (
																<FormItem>
																	<Button
																		type="button"
																		onClick={() => { handleToggleDiasAcceso("cualquier_día") }}
																		className={`px-4 py-2 rounded-md transition-all duration-300 ${isActiveCualquierDia ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
																			} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] mr-2`}
																	>
																		<div className="flex flex-wrap items-center">
																			{isActiveCualquierDia ? (
																				<><div className="">Cualquier Día</div></>
																			) : (
																				<><div className="text-blue-600">Cualquier Día</div></>
																			)}

																		</div>
																	</Button>
																	<Button
																		type="button"
																		onClick={() => { handleToggleDiasAcceso("limitar_días_de_acceso") }}
																		className={`px-4 py-2 rounded-md transition-all duration-300 ${isActivelimitarDiasSemana ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
																			} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]  mr-2`}
																	>
																		<div className="flex flex-wrap items-center">
																			{isActivelimitarDiasSemana ? (
																				<><div className="">Limitar Días de Acceso</div></>
																			) : (
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
												)} />


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

											{isActivelimitarDias && (
												<div className="w-1/3 mt-3">
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
																		}} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)} />
												</div>
											)}
										</>
									)}


								</div>

								<div className="flex gap-2">
									<Button
										disabled={todasAreas}
										type="button"
										onClick={handleToggleAdvancedOptions}
										className={`px-4 py-2 rounded-md transition-all duration-300 ${isActiveAdvancedOptions ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
											} hover:bg-trasparent hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
									>
										<div className="flex flex-wrap">
											{isActiveAdvancedOptions ? (
												<><div className="">Áreas de acceso</div></>
											) : (
												<><div className="text-blue-600">Áreas de acceso</div></>
											)}

										</div>
									</Button>

									<div className="flex items-center flex-wrap gap-5">
										<FormLabel>Todas las áreas: {`(no / si)`}: </FormLabel>
										<Switch
											className="data-[state=checked]:bg-blue-600"
											checked={todasAreas}
											onCheckedChange={(checked) => setTodasAreas(checked)}
										/>
									</div>
								</div>

							</form>
						</Form>

						{isActiveAdvancedOptions && (
							<><div className="font-bold text-xl">Areas de acceso</div>
								<AreasList
									areas={areasList}
									setAreas={setAreasList}
									catAreas={areasDisponibles}
									loadingCatAreas={loadingCatAreas}
									existingAreas={true} />
							</> )}
						<div className="font-bold text-xl">Comentarios / Instrucciones:</div>
						<ComentariosList
							comentarios={comentariosList}
							setComentarios={setComentariosList}
							tipo={"pase"}
						/>

						{loadingCatAreas == false && loadingConfigLocation == false ? (<>
							<div className="text-center">
								<Button
									className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-2/3 md:w-1/2 lg:w-1/2"
									variant="secondary"
									type="submit"
									onClick={form.handleSubmit(onSubmit)}>
									Guardar Cambios
								</Button>
							</div>
						</>) : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateFullPassModal;