"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGetCatalogoPaseNoJwt } from "@/hooks/useGetCatologoPaseNoJwt";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { EntryPassModal2 } from "@/components/modals/add-pass-modal-2";
import LoadImage from "@/components/upload-Image";
import { Loader2, X } from "lucide-react";
import { useGetPdf } from "@/hooks/usetGetPdf";
import { descargarPdfPase } from "@/lib/download-pdf";
import Image from "next/image";
import { formatEquipos, formatVehiculos } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Briefcase, Calendar, MapPin, Building2, Camera, IdCard, CheckCircle2, Download } from "lucide-react";
import AvisoPrivacidad from "@/components/modals/aviso-priv-eng";
// import { API_ENDPOINTS } from "@/config/api";
import { getGoogleWalletPassUrl, getImgPassUrl } from "@/lib/endpoints";
	const grupoEquipos = z.array(
		z.object({
			nombre: z.string().optional(),
			modelo: z.string().optional(),
			marca: z.string().optional(),
			color: z.string().optional(),
			tipo: z.string().optional(),
			serie: z.string().optional() ,
		})
	).optional();

 	const grupoVehiculos = z.array(
		z.object({
			tipo: z.string().optional(),
			marca: z.string().optional(),
			modelo: z.string().optional(),
			estado: z.string().optional(),
			placas: z.string().optional(),
			color: z.string().optional()
		})
	).optional();

	const createSchema = (requireFoto: boolean, requireIden: boolean) =>
		z
		  .object({
			grupo_equipos: grupoEquipos,
			grupo_vehiculos: grupoVehiculos,
	  
			walkin_fotografia: z
			  .array(
				z.object({
				  file_url: z.string(),
				  file_name: z.string(),
				})
			  )
			  .default([]),
	  
			walkin_identificacion: z
			  .array(
				z.object({
				  file_url: z.string(),
				  file_name: z.string(),
				})
			  ).default([]),
	  
			status_pase: z.string().optional(),
			folio: z.string().optional(),
			account_id: z.number().optional(),
	  
			nombre: z.string().nullable().optional(),
			empresa: z.string().optional(),
			ubicacion: z.string().nullable().optional(),
			email: z.string().nullable().optional(),
			telefono: z.string().nullable().optional(),
	  
			acepto_aviso_privacidad: z.boolean().refine(val => val === true, {
			  message: "Debes aceptar el aviso de privacidad",
			}),
		  })
		  .superRefine((data, ctx) => {
			if (requireFoto && (!data.walkin_fotografia || data.walkin_fotografia.length === 0)) {
			  ctx.addIssue({
				path: ["walkin_fotografia"],
				message: "La fotografía es obligatoria",
				code: z.ZodIssueCode.custom,
			  });
			}
	  
			if (requireIden && (!data.walkin_identificacion || data.walkin_identificacion.length === 0)) {
			  ctx.addIssue({
				path: ["walkin_identificacion"],
				message: "La identificación es obligatoria",
				code: z.ZodIssueCode.custom,
			  });
			}
		  });


		  
// export type formatData = {
// 	grupo_equipos:Equipo[],
// 	grupo_vehiculos:Vehiculo[],
// 	walkin_fotografia: Imagen[] ,
// 	walkin_identificacion: Imagen[] ,
// 	status_pase: string ,
// 	folio: string,
// 	account_id: number,
// 	nombre:string,
// 	ubicacion:string,
// 	email:string,
// 	telefono:string,
// 	acepto_aviso_privacidad:boolean
// 	acepto_aviso_datos_personales:boolean
// 	conservar_datos_por:string
// }
export type formatData = z.infer<ReturnType<typeof createSchema>>;

const PaseUpdate = () =>{
	const [id, setId] = useState("")
	const [showIneIden, setShowIneIden] = useState<string[]|undefined>([])
	const[account_id, setAccount_id] = useState<number>(0)
	const [enablePdf, setEnablePdf] = useState(false)
	const [enableInfo, setEnableInfo] = useState(false)
	const { data: responsePdf} = useGetPdf(account_id, id, enablePdf);
	const { data: dataCatalogos, isLoading: loadingDataCatalogos, error} = useGetCatalogoPaseNoJwt(account_id, id, enableInfo );
	const [isSuccess, setIsSuccess] = useState(false);
	const [modalData, setModalData] = useState<any>(null);
	const [urlImgPass, setUrlImgPass] = useState<string>("");
	const [urlGooglePass, setUrlGooglePass] = useState<string>("");
	const [loadingImgPass, setLoadingImgPass] = useState(false);
	const downloadUrl=responsePdf?.response?.data?.data?.download_url
	const requireFoto = showIneIden?.includes("foto") ?? false;
	const requireIden = showIneIden?.includes("iden") ?? false;

	const [errorFotografia, setErrorFotografia] = useState("")
	const [errorIdentificacion, setErrorIdentificacion] = useState("")

	const isActualizarOpen = false
	const [equipos, setEquipos] = useState<Equipo[]>( []);
	const [vehicles, setVehiculos] = useState<Vehiculo[]>([]);

	const [mostrarAviso, setMostrarAviso] = useState(false);
	const [radioSelected, setRadioSelected] = useState("3 meses");	

	const formSchema = useMemo(
		() => createSchema(requireFoto, requireIden),
		[requireFoto, requireIden]
	  );
	  
	const form = useForm<z.infer<typeof formSchema>>({
			resolver: zodResolver(formSchema),
			defaultValues: {
			grupo_vehiculos:[],
			grupo_equipos:[],
			status_pase:'Activo',
			walkin_fotografia:[],
			walkin_identificacion:[],
			folio: "",
			account_id: 0,
			nombre:"",
			empresa:"",
			ubicacion:"",
			email:"",
			telefono:"",
			acepto_aviso_privacidad:false,
	}
	});

	useEffect(()=>{
		if(dataCatalogos){
			setEquipos(dataCatalogos.pass_selected?.grupo_equipos ??[])
			setVehiculos(dataCatalogos.pass_selected?.grupo_vehiculos ??[])
			
			// Rellenar formulario con datos del pase
			form.setValue("nombre", dataCatalogos.pass_selected?.nombre || "");
			form.setValue("empresa", dataCatalogos.pass_selected?.empresa || "");
			form.setValue("email", dataCatalogos.pass_selected?.email || "");
			form.setValue("telefono", dataCatalogos.pass_selected?.telefono || "");
			form.setValue("ubicacion", dataCatalogos.pass_selected?.ubicacion?.[0] || "");
			form.setValue("account_id", account_id);
			form.setValue("folio", id);
		}
	},[dataCatalogos, form, account_id, id])
	  
	  useEffect(() => {
		form.trigger();
	  }, [form, requireFoto, requireIden]);
	  
	const onDescargarPNG = async (imgUrl: string) => {
		try {
			const response = await fetch(imgUrl);
			if (!response.ok) throw new Error("No se pudo obtener la imagen");
		
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
		
			const a = document.createElement("a");
			a.href = url;
			a.download = "pase.png";
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			toast.success("¡Pase descargado correctamente!");
		} catch (error) {
			toast.error("Error al descargar la imagen: " + error);
		}
	};

	const handleClickImgButton = async () => {
		const record_id = dataCatalogos?.pass_selected?._id;
		const passImg = dataCatalogos?.pass_selected?.pdf_to_img;
		if (urlImgPass) {
			onDescargarPNG(urlImgPass);
			return;
		} else if (passImg) {
			onDescargarPNG(passImg[0].file_url);
			return;
		}
		if (!record_id) {
			toast.error('No hay pase disponible', {
				style: {
					background: "#dc2626",
					color: "#fff",
					border: 'none'
				},
			});
			return;
		}
		try {
			setLoadingImgPass(true);
			toast.loading("Obteniendo tu pase...", {
				style: {
					background: "#000",
					color: "#fff",
					border: 'none'
				},
			});
			const data = await getImgPassUrl(account_id, record_id);
			const url = data?.response?.data || "";
			if (url) {
				setUrlImgPass(url);
				onDescargarPNG(url);
				setLoadingImgPass(false);
			} else {
				toast.error('No hay pase disponible', {
					style: {
						background: "#dc2626",
						color: "#fff",
						border: 'none'
					},
				});
			}
			toast.dismiss();
			setLoadingImgPass(false);
		} catch (error) {
			console.log(error)
			toast.error("Error al obtener pase", {
				style: {
					background: "#dc2626",
					color: "#fff",
					border: 'none'
				},
			});
			toast.dismiss();
			setLoadingImgPass(false);
		}
	}

	useEffect(() => {
		if (error) {
		  toast.error(error.message,{
            style: {
                background: "#dc2626",
                color: "#fff",
                border: 'none'
            },
        }) 
		}
	  }, [error]);

	const handleClickGoogleButton = async () => {
		const record_id = dataCatalogos?.pass_selected?._id;
		const google_pass_url = dataCatalogos?.pass_selected?.google_wallet_pass_url;

		if(google_pass_url || urlGooglePass){
			window.open(google_pass_url || urlGooglePass, '_blank');
			return;
		}

		if (!record_id) {
			toast.error('No hay pase disponible', {
                style: {
                    background: "#dc2626",
                    color: "#fff",
                    border: 'none'
                },
            });
			return;
		}
		try {
			toast.loading("Obteniendo tu pase...", {
				style: {
					background: "#000",
					color: "#fff",
					border: 'none'
				},
			});
			const data = await getGoogleWalletPassUrl(account_id, record_id);
			const url = data?.response?.data?.google_wallet_url || "";
			if (url) {
				setUrlGooglePass(url);
				window.open(url, '_blank');
			} else {
				toast.error('No hay pase disponible', {
					style: {
						background: "#dc2626",
						color: "#fff",
						border: 'none'
					},
				});
			}	
			toast.dismiss();
		} catch (error) {
			console.log(error)
			toast.error("Error al obtener pase", {
                style: {
                    background: "#dc2626",
                    color: "#fff",
                    border: 'none'
                },
            });
			toast.dismiss();
		}
	}

	// const handleClickAppleButton = async () => {
	// 	const record_id = dataCatalogos?.pass_selected?._id;
	// 	const userJwt = localStorage.getItem("access_token");

	// 	toast.info("En mantenimiento...", {
	// 		style: {
	// 			background: "#000",
	// 			color: "#fff",
	// 			border: 'none'
	// 		},
	// 	});
	// 	toast.dismiss();
	// 	return;

	// 	toast.loading("Obteniendo tu pase...", {
	// 		style: {
	// 			background: "#000",
	// 			color: "#fff",
	// 			border: 'none'
	// 		},
	// 	});

	// 	try {
	// 		const response = await fetch(API_ENDPOINTS.runScript, {
	// 			method: 'POST',
	// 			body: JSON.stringify({
	// 				script_name: 'create_pass_apple_wallet.py',
	// 				record_id
	// 			}),
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 				'Authorization': 'Bearer ' + userJwt
	// 			},
	// 		});
	// 		const data = await response.json();
	// 		const file_url = data?.response?.file_url;

	// 		toast.dismiss();
	// 		toast.success("Pase obtenido correctamente.", {
	// 			style: {
	// 				background: "#000",
	// 				color: "#fff",
	// 				border: 'none'
	// 			},
	// 		});

	// 		const fileResponse = await fetch(file_url);
	// 		const blob = await fileResponse.blob();
	// 		const pkpassBlob = new Blob([blob], { type: 'application/vnd.apple.pkpass' });
	// 		const url = window.URL.createObjectURL(pkpassBlob);

	// 		const a = document.createElement('a');
	// 		a.href = url;
	// 		a.download = 'pass.pkpass';
	// 		document.body.appendChild(a);
	// 		a.click();
	// 		a.remove();
	// 		window.URL.revokeObjectURL(url);
	// 	} catch (error) {
	// 		toast.dismiss();
	// 		toast.error(`${error}` || "Hubo un error al obtener su pase.", {
	// 			style: {
	// 				background: "#000",
	// 				color: "#fff",
	// 				border: 'none'
	// 			},
	// 		});
	// 	}
	// }



	const onSubmit = (data: z.infer<typeof formSchema>) => {
			const formattedData = {
				grupo_vehiculos: vehicles,
				grupo_equipos: equipos,
				status_pase: data.status_pase||"",
				walkin_fotografia:data.walkin_fotografia??[],
				walkin_identificacion:data.walkin_identificacion??[],
				folio: id,
				account_id: account_id,
				nombre: data.nombre || dataCatalogos?.pass_selected?.nombre || "",
				empresa: data.empresa || "",
				ubicacion: dataCatalogos?.pass_selected?.ubicacion||[],
				email: dataCatalogos?.pass_selected?.email||"",
				telefono:dataCatalogos?.pass_selected?.telefono||"",
				acepto_aviso_privacidad:data.acepto_aviso_privacidad,
				conservar_datos_por: radioSelected
			};
			
			setModalData(formattedData);
			setIsSuccess(true)
	};

	const updateInfoActivePass= () => {
		const data = form.getValues();
		const formattedData = {
			grupo_vehiculos: vehicles,
			grupo_equipos: equipos,
			walkin_fotografia: dataCatalogos?.pass_selected?.foto??[],
			walkin_identificacion:dataCatalogos?.pass_selected?.identificacion??[],
			folio: id,
			account_id: account_id,
			email: dataCatalogos?.pass_selected?.email||"",
			telefono:dataCatalogos?.pass_selected?.telefono||"",
			nombre: data.nombre || dataCatalogos?.pass_selected?.nombre || "",
			empresa: data.empresa || "",
		};
		setIsSuccess(true)
		setModalData(formattedData);
	}


	useEffect(()=>{
		if(form.formState.errors){
			console.log("error",form.formState.errors)
		}
	}, [form.formState.errors])


	useEffect(() => {
		if (typeof window !== "undefined") {
		  const valores = window.location.search
		  const urlParams = new URLSearchParams(valores);
		  const docs= urlParams.get('docs') !== null ? urlParams.get('docs') :''
		  setShowIneIden(docs?.split("-"))
		  setId(urlParams.get('id') ?? '')
		  
		  let acc = parseInt(urlParams.get('user') ?? '') || 0
		  if(!acc){
		  		acc = Number(window.localStorage.getItem("userId_soter"))
		  }
		  setAccount_id(acc);
		  setEnableInfo(true)
		}
	  }, []);

	useEffect(()=>{
		if(id && account_id && enableInfo){
			setEnableInfo(false)
		}
	},[id, account_id, enableInfo])

	useEffect(()=>{
		if(isActualizarOpen && dataCatalogos?.pass_selected?.grupo_equipos){
			 setEquipos( formatEquipos(dataCatalogos?.pass_selected?.grupo_equipos))
		}
		if(isActualizarOpen && dataCatalogos?.pass_selected?.grupo_vehiculos){
			setVehiculos(formatVehiculos(dataCatalogos?.pass_selected?.grupo_vehiculos))
		}
	},[isActualizarOpen, dataCatalogos?.pass_selected ])

	useEffect(()=>{
		if (errorFotografia === "-" && errorIdentificacion === "-") {
			setIsSuccess(true); 
	} else {
			setIsSuccess(false); 
	}
	},[errorFotografia,errorIdentificacion ])

	useEffect(()=>{
		if(downloadUrl){
			onDescargarPDF(downloadUrl)
			setEnablePdf(false)
			toast.success("¡PDF descargado correctamente!");
		}
	},[downloadUrl])

	async function onDescargarPDF(download_url: string) {
		try {
		  await descargarPdfPase(download_url);
		} catch (error) {
		  toast.error("Error al descargar el PDF: " + error);
		}
	  }


	if(loadingDataCatalogos){
		return(
			<div className="flex justify-center items-center mt-10">
				<div role="status" className="flex flex-col items-center text-center">
					<span className="font-bold text-3xl text-slate-800">Cargando tu pase de entrada...</span>
						<div className="flex justify-center items-center">
						<svg aria-hidden="true" className="mt-10 w-20 h-20 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
								<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
						</svg>
						</div>
				</div>
			</div>
		)
	}

	const closeModal = () => {
		setErrorFotografia("")
		setErrorIdentificacion("")
		setIsSuccess(false);  // Reinicia el estado para que el modal no se quede abierto.
	};

  	if (mostrarAviso) {
		return (
			<AvisoPrivacidad setMostrarAviso={setMostrarAviso} radioSelected={radioSelected} setRadioSelected={setRadioSelected}/>
		)
	}

return (
	<div className="min-h-screen bg-gray-50/50 pb-12">
		<EntryPassModal2
			title={"Confirmación de Pase de Entrada"}
			data={modalData}
			fechaDeReunion={dataCatalogos?.pass_selected?.fecha_de_caducidad ?? ""}
			isSuccess={isSuccess}
			setIsSuccess={setIsSuccess}
			onClose={closeModal}
			passData={dataCatalogos}
			parentUserId={account_id}
		/>

		{dataCatalogos?.pass_selected?.estatus == "proceso" ? (
			<div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
				{/* Encabezado */}
				<div className="text-center space-y-1">
					<h1 className="font-bold text-2xl text-slate-900 tracking-tight">Registro de Entrada</h1>
					<p className="text-slate-500 text-sm">Completa los datos para generar tu pase de acceso</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Columna de Información Actual */}
					<div className="lg:col-span-12">
						<Card className="border-none shadow-sm bg-white overflow-hidden">
							<div className="h-2 bg-red-600 w-full" />
							<CardHeader className="pb-4">
								<CardTitle className="text-lg font-bold flex items-center gap-2">
									<User className="w-5 h-5 text-blue-600" />
									Información de la Invitación
								</CardTitle>
								<CardDescription>Datos registrados previamente en tu invitación</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div className="space-y-4">
										<div className="flex items-start gap-3">
											<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
												<User size={18} />
											</div>
											<div>
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre</p>
												<p className="text-sm font-semibold text-slate-700">{dataCatalogos?.pass_selected?.nombre}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
												<Mail size={18} />
											</div>
											<div className="overflow-hidden">
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</p>
												<p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{dataCatalogos?.pass_selected?.email}</p>
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<div className="flex items-start gap-3">
											<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
												<Building2 size={18} />
											</div>
											<div>
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Visita a</p>
												<p className="text-sm font-semibold text-slate-700">{dataCatalogos?.pass_selected?.visita_a?.[0]?.nombre || "N/A"}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
												<MapPin size={18} />
											</div>
											<div>
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ubicación</p>
												<div className="flex flex-wrap items-center gap-1">
													<p className="text-sm font-semibold text-slate-700 leading-tight">{dataCatalogos?.pass_selected?.ubicacion[0]}</p>
													{dataCatalogos?.pass_selected?.ubicacion.length > 1 && (
														<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
															+{dataCatalogos?.pass_selected?.ubicacion.length - 1} más
														</span>
													)}
												</div>
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<div className="flex items-start gap-3">
											<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
												<Calendar size={18} />
											</div>
											<div>
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fecha de reunión</p>
												<p className="text-sm font-semibold text-slate-700">
													{dataCatalogos?.pass_selected?.fecha_de_caducidad ? dataCatalogos.pass_selected.fecha_de_caducidad.slice(0, 10) : "N/A"}
												</p>
											</div>
										</div>
										{dataCatalogos?.pass_selected?.empresa && (
											<div className="flex items-start gap-3">
												<div className="p-2 bg-gray-50 rounded-lg text-gray-500">
													<Briefcase size={18} />
												</div>
												<div>
													<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Empresa</p>
													<p className="text-sm font-semibold text-slate-700">{dataCatalogos?.pass_selected?.empresa}</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Formulario de Registro */}
					<div className="lg:col-span-12">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									{/* Sección Foto */}
									<Card className="md:col-span-2 border-none shadow-sm">
										<CardHeader className="pb-2">
											<CardTitle className="text-base font-bold flex items-center gap-2">
												<Camera className="w-4 h-4 text-blue-600" />
												* Fotografía
											</CardTitle>
											<CardDescription className="text-xs">Captura los documentos necesarios para tu ingreso</CardDescription>
										</CardHeader>
										<CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
											{showIneIden?.includes("foto") && (
												<div className="space-y-2">
													<Controller
														control={form.control}
														name="walkin_fotografia"
														render={({ field, fieldState }) => (
															<div className="relative group">
																<div className={`p-4 rounded-2xl border-2 border-dashed transition-all ${fieldState.error ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 hover:border-blue-400'}`}>
																	<LoadImage
																		id="fotografia"
																		titulo={"Capturar Fotografía"}
																		showWebcamOption={true}
																		imgArray={field.value || []}
																		setImg={field.onChange}
																		facingMode="user"
																		limit={1}
																	/>
																</div>
																{fieldState.error && (
																	<p className="text-xs font-medium text-red-500 mt-2 flex items-center gap-1">
																		<X size={12} /> {fieldState.error.message}
																	</p>
																)}
															</div>
														)}
													/>
												</div>
											)}

											{showIneIden?.includes("iden") && (
												<div className="space-y-2">
													<Controller
														control={form.control}
														name="walkin_identificacion"
														render={({ field, fieldState }) => (
															<div className="relative group">
																<div className={`p-4 rounded-2xl border-2 border-dashed transition-all ${fieldState.error ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 hover:border-blue-400'}`}>
																	<LoadImage
																		id="identificacion"
																		titulo={"Escanear Identificación"}
																		imgArray={field.value || []}
																		setImg={field.onChange}
																		showWebcamOption={true}
																		facingMode="environment"
																		limit={1}
																	/>
																</div>
																{fieldState.error && (
																	<p className="text-xs font-medium text-red-500 mt-2 flex items-center gap-1">
																		<X size={12} /> {fieldState.error.message}
																	</p>
																)}
															</div>
														)}
													/>
												</div>
											)}
										</CardContent>
									</Card>

									{/* Otros datos adicionales */}
									{!dataCatalogos?.pass_selected?.empresa && (
										<Card className="md:col-span-2 border-none shadow-sm">
											<CardContent className="pt-6">
												<FormField
													control={form.control}
													name="empresa"
													render={({ field }) => (
														<FormItem className="space-y-2">
															<Label className="font-bold text-slate-700 flex items-center gap-2">
																<Building2 size={16} className="text-blue-500" />
																Empresa
															</Label>
															<FormControl>
																<Input 
																	{...field} 
																	className="h-12 rounded-xl border-gray-200 focus:ring-blue-500" 
																	placeholder="Ingresa el nombre de tu empresa" 
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</CardContent>
										</Card>
									)}
								</div>

								{/* Aviso Privacidad y Botón */}
								<div className="flex flex-col items-center gap-6 pt-4">
									<FormField
										control={form.control}
										name="acepto_aviso_privacidad"
										render={({ field }) => (
											<div className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${field.value ? 'bg-blue-50/50' : 'bg-gray-100/50'}`}>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
													id="aviso"
													className="mt-1 data-[state=checked]:bg-blue-600"
												/>
												<Label htmlFor="aviso" className="text-sm text-slate-600 leading-snug cursor-pointer">
													He leído y acepto los términos del{" "}
													<button
														type="button"
														onClick={() => setMostrarAviso(true)}
														className="text-blue-600 font-bold hover:underline"
													>
														aviso de privacidad
													</button> para el manejo de mis datos personales.
												</Label>
											</div>
										)}
									/>

									<Button
										className="h-14 px-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all active:scale-[0.98] w-full sm:w-auto"
										type="submit"
									>
										Generar Pase
									</Button>
								</div>
							</form>
						</Form>
					</div>
				</div>
			</div>
		) : (
			<div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
				{dataCatalogos?.pass_selected?.estatus == "activo" || dataCatalogos?.pass_selected?.estatus == "vencido" ? (
					<div className="flex flex-col items-center gap-8">
						<div className="text-center space-y-2">
							<h1 className="font-extrabold text-3xl text-slate-900 tracking-tight">{dataCatalogos?.pass_selected?.nombre}</h1>
							<div className="inline-flex items-center px-4 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100">
								<CheckCircle2 size={14} className="mr-1.5" /> Pase Autorizado
							</div>
						</div>

						<Card className="w-full max-w-md border-none shadow-2xl relative overflow-hidden bg-white rounded-3xl">
							<div className="absolute top-0 left-0 right-0 h-4 bg-red-600" />
							<CardContent className="p-8 pt-10 flex flex-col items-center">
								{/* Info del Pase */}
								<div className="w-full grid grid-cols-2 gap-4 mb-8 text-center sm:text-left">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Tipo de Acceso</p>
										<p className="text-sm font-bold text-slate-700 mt-1">Visita General</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Expedición</p>
										<p className="text-sm font-bold text-slate-700 mt-1">{dataCatalogos?.pass_selected?.fecha_de_expedicion?.slice(0, 10)}</p>
									</div>
								</div>

								<div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 mb-8">
									<div className="flex justify-between items-center text-xs">
										<span className="text-gray-400 font-medium">Lugar:</span>
										<span className="text-slate-700 font-bold truncate max-w-[200px]">{dataCatalogos?.pass_selected?.ubicacion[0]}</span>
									</div>
									<div className="flex justify-between items-center text-xs">
										<span className="text-gray-400 font-medium">Anfitrión:</span>
										<span className="text-slate-700 font-bold">{dataCatalogos?.pass_selected?.visita_a?.[0]?.nombre || "N/A"}</span>
									</div>
								</div>

								{/* QR Section */}
								<div className="relative group p-4 border-2 border-dashed border-gray-200 rounded-3xl bg-white shadow-inner">
									<Image
										width={240}
										height={240}
										src={dataCatalogos?.pass_selected?.qr_pase[0]?.file_url ?? "/nouser.svg"}
										alt="Código QR de Acceso"
										className="rounded-xl"
									/>
									<div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
								</div>
								
								<p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-6 bg-blue-50 px-3 py-1 rounded-full">Presenta este QR al ingresar</p>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
							<button 
								className="h-14 flex items-center justify-center hover:scale-[1.02] transition-transform"
								onClick={handleClickGoogleButton}
							>
								<Image src="/esES_add_to_google_wallet_add-wallet-badge.png" alt="Añadir a Google Wallet" width={200} height={56} className="h-full w-auto object-contain" />
							</button>

							<Button
								className="h-14 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-2xl shadow-lg shadow-yellow-100 flex gap-2"
								onClick={() => handleClickImgButton()}
								disabled={loadingImgPass}
							>
								{loadingImgPass ? <Loader2 className="animate-spin" /> : <Download size={20} />}
								Descargar Imagen
							</Button>
						</div>

						{isActualizarOpen && (
							<Card className="w-full max-w-2xl border-none shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
								<CardContent className="p-8">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
										<div className="space-y-3">
											<p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
												<Camera size={14} /> Fotografía Registrada
											</p>
											<div className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
												<Image
													src={dataCatalogos?.pass_selected?.foto?.[0]?.file_url ?? "/nouser.svg"}
													alt="Foto registrada"
													fill
													className="object-cover"
												/>
											</div>
										</div>
										<div className="space-y-3">
											<p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
												<IdCard size={14} /> Identificación
											</p>
											<div className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
												<Image
													src={dataCatalogos?.pass_selected?.identificacion?.[0]?.file_url ?? "/nouser.svg"}
													alt="ID registrada"
													fill
													className="object-cover"
												/>
											</div>
										</div>
										<div className="sm:col-span-2 flex justify-center pt-4">
											<Button className="bg-blue-500 hover:bg-blue-600 rounded-xl px-8" onClick={updateInfoActivePass}>
												Actualizar Documentos
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				) : null}
			</div>
		)}
	</div>
);
};
export default PaseUpdate;

