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
import { toast } from "sonner";
import { useGetCatalogoPaseNoJwt } from "@/hooks/useGetCatologoPaseNoJwt";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { EntryPassModal2 } from "@/components/modals/add-pass-modal-2";
import LoadImage from "@/components/upload-Image";
import { Car, Laptop, Loader2, X } from "lucide-react";
import { useGetPdf } from "@/hooks/usetGetPdf";
import { descargarPdfPase } from "@/lib/download-pdf";
import Image from "next/image";
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo";
import { formatEquipos, formatVehiculos } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AvisoPrivacidad from "@/components/modals/aviso-priv-eng";
// import { API_ENDPOINTS } from "@/config/api";
import { getGoogleWalletPassUrl, getImgPassUrl } from "@/lib/endpoints";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
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
	const[account_id, setAccount_id] = useState<number|null>(null)
	const [enablePdf, setEnablePdf] = useState(false)
	const [enableInfo, setEnableInfo] = useState(false)
	const { data: responsePdf} = useGetPdf(account_id, id, enablePdf);
	const { data: dataCatalogos, isLoading: loadingDataCatalogos, error} = useGetCatalogoPaseNoJwt(account_id, id, enableInfo );
	const [agregarEquiposActive, setAgregarEquiposActive] = useState(false);
	const [agregarVehiculosActive, setAgregarVehiculosActive] = useState(false);
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

	const [isActualizarOpen, setIsActualizarOpen] = useState<string|boolean>(false);
	const [equipos, setEquipos] = useState<Equipo[]>( []);
	const [vehicles, setVehiculos] = useState<Vehiculo[]>([]);

	const [mostrarAviso, setMostrarAviso] = useState(false);
	const [radioSelected, setRadioSelected] = useState("3 meses");	

	const formSchema = useMemo(
		() => createSchema(requireFoto, requireIden),
		[requireFoto, requireIden]
	  );
	  
	useEffect(()=>{
		if(dataCatalogos){
			setEquipos(dataCatalogos.pass_selected?.grupo_equipos ??[])
			setVehiculos(dataCatalogos.pass_selected?.grupo_vehiculos ??[])
		}
	},[dataCatalogos])

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
			ubicacion:"",
			email:"",
			telefono:"",
			acepto_aviso_privacidad:false,
	}
	});
	  
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
			const data = await getImgPassUrl(record_id);
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
			const data = await getGoogleWalletPassUrl(record_id);
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
				nombre: dataCatalogos?.pass_selected?.nombre||"",
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
		const formattedData = {
			grupo_vehiculos: vehicles,
			grupo_equipos: equipos,
			walkin_fotografia: dataCatalogos?.pass_selected?.foto??[],
			walkin_identificacion:dataCatalogos?.pass_selected?.identificacion??[],
			folio: id,
			account_id: account_id,
			email: dataCatalogos?.pass_selected?.email||"",
			telefono:dataCatalogos?.pass_selected?.telefono||"",
			nombre: dataCatalogos?.pass_selected?.nombre||"",
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


	const handleCheckboxChange = (name:string) => {
	if (name === "agregar-equipos") {
			setAgregarEquiposActive(!agregarEquiposActive);
	} else if (name === "agregar-vehiculos") {
			setAgregarVehiculosActive(!agregarVehiculosActive);
	}
	};

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

  const handleRemove = (index: number) => {
	setVehiculos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveEq = (index: number) => {
	setEquipos((prev) => prev.filter((_, i) => i !== index))
  }


  	if (mostrarAviso) {
		return (
			<AvisoPrivacidad setMostrarAviso={setMostrarAviso} radioSelected={radioSelected} setRadioSelected={setRadioSelected}/>
		)
	}


return (
	<div className="p-8">
		<EntryPassModal2
				title={"Confirmación"}
				data={modalData}
				isSuccess={isSuccess}
				setIsSuccess={setIsSuccess}
				onClose={closeModal}
				passData={dataCatalogos}
			/>
		{dataCatalogos?.pass_selected?.estatus == "proceso" ? (
		<div className="max-w-xl mx-auto px-4 py-6 space-y-6 pt-0">

			<h1 className="font-bold text-2xl text-center text-slate-800">Pase De Entrada</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
			<div className="flex gap-2">
				<p className="font-bold text-slate-800 whitespace-nowrap">Nombre:</p>
				<p className="text-slate-800">{dataCatalogos?.pass_selected?.nombre}</p>
			</div>

			<div className="flex gap-2">
				<p className="font-bold text-slate-800 whitespace-nowrap">Email:</p>
				<p className="text-slate-800 break-words">{dataCatalogos?.pass_selected?.email}</p>
			</div>

			{dataCatalogos?.pass_selected?.telefono && (
				<div className="flex gap-2">
				<p className="font-bold text-slate-800 whitespace-nowrap">Teléfono:</p>
				<p className="text-slate-800">{dataCatalogos?.pass_selected?.telefono}</p>
				</div>
			)}

			<div className="flex gap-2">
				<p className="font-bold text-slate-800 whitespace-nowrap">Visita a:</p>
				<p className="text-slate-800 break-words">
				{dataCatalogos?.pass_selected?.visita_a?.[0]?.nombre || ""}
				</p>
			</div>

			<div className="flex gap-2">
				<p className="font-bold text-slate-800 whitespace-nowrap">Ubicación:</p>
				<div className="relative group break-words text-slate-800">
				{dataCatalogos?.pass_selected?.ubicacion[0]}
				{dataCatalogos?.pass_selected?.ubicacion.length > 1 && (
					<span className="text-blue-600 cursor-pointer ml-1 underline relative">
					+{dataCatalogos?.pass_selected?.ubicacion.length - 1}
					<div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg group-hover:block">
						{dataCatalogos?.pass_selected?.ubicacion.slice(1).map((ubic: string, idx: number) => (
						<div key={idx}>{ubic}</div>
						))}
					</div>
					</span>
				)}
				</div>
			</div>
			</div>

			<div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
			{showIneIden?.includes("foto") && (
				<Controller
				control={form.control}
				name="walkin_fotografia"
				render={({ field, fieldState }) => (
					<div className="flex gap-1">
					<span className="text-red-500 mt-1">*</span>
					<div className="w-full">
						<LoadImage
						id="fotografia"
						titulo={"Fotografía"}
						showWebcamOption={true}
						imgArray={field.value || []}
						setImg={field.onChange}
						facingMode="user"
						showArray={true}
						limit={1}
						/>
						{fieldState.error && (
						<span className="text-red-500 text-xs mt-1 block">{fieldState.error.message}</span>
						)}
					</div>
					</div>
				)}
				/>
			)}

			{showIneIden?.includes("iden") && (
				<Controller
				control={form.control}
				name="walkin_identificacion"
				render={({ field, fieldState }) => (
					<div className="flex gap-1">
					<span className="text-red-500 mt-1">*</span>
					<div className="w-full">
						<LoadImage
						id="identificacion"
						titulo={"Identificación"}
						imgArray={field.value || []}
						setImg={field.onChange}
						showWebcamOption={true}
						facingMode="environment"
						showArray={true}
						limit={1}
						/>
						{fieldState.error && (
						<span className="text-red-500 text-xs mt-1 block">{fieldState.error.message}</span>
						)}
					</div>
					</div>
				)}
				/>
			)}
			</div>

			<div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />


			<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="font-semibold text-slate-700">Vehículos</span>
				<VehicleLocalPassModal title="Nuevo Vehiculo" vehicles={vehicles} setVehiculos={setVehiculos} isAccesos={false} fetch={false}>
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

			<Accordion type="multiple" className="w-full">
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
						onClick={() => handleRemove(index)}
						className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
						title="Eliminar"
					>
						<X size={11} className="text-red-600" />
					</button>
					</div>

					<AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
					<div className="grid grid-cols-2 gap-2 px-3 pt-1 pb-3 text-xs text-slate-600">
						<p><strong>Tipo:</strong> {vehiculo.tipo}</p>
						<p><strong>Marca:</strong> {vehiculo.marca}</p>
						<p><strong>Modelo:</strong> {vehiculo.modelo}</p>
						<p><strong>Placas:</strong> {vehiculo.placas}</p>
						<p><strong>Estado:</strong> {vehiculo.estado}</p>
						<p><strong>Color:</strong> {vehiculo.color}</p>
					</div>
					</AccordionPrimitive.Content>
				</AccordionPrimitive.Item>
				))}

				{vehicles.length === 0 && (
				<p className="text-xs text-gray-400 py-2">No se han agregado vehículos.</p>
				)}
			</Accordion>
			</div>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-slate-700">Equipos</span>
					<EqipmentLocalPassModal title="Nuevo Equipo" equipos={equipos} setEquipos={setEquipos} isAccesos={false}>
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
				<Accordion type="multiple" className="w-full ">
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
						onClick={() => handleRemoveEq(index)}
						className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
						title="Eliminar"
						>
						<X size={11} className="text-red-600" />
						</button>
					</div>

					<AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
						<div className="grid grid-cols-2 gap-2 px-3 pt-1 pb-3 text-xs text-slate-600">
						<p><strong>Tipo:</strong> {equipo.tipo}</p>
						<p><strong>Nombre:</strong> {equipo.nombre}</p>
						<p><strong>Marca:</strong> {equipo.marca}</p>
						<p><strong>Modelo:</strong> {equipo.modelo}</p>
						<p><strong>No. Serie:</strong> {equipo.serie}</p>
						<p><strong>Color:</strong> {equipo.color}</p>
						</div>
					</AccordionPrimitive.Content>

					</AccordionPrimitive.Item>
				))}

				{equipos.length === 0 && (
					<p className="text-xs text-gray-400 py-2">No se han agregado equipos.</p>
				)}
				</Accordion>
			</div>

			<div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

			<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
				control={form.control}
				name="acepto_aviso_privacidad"
				render={({ field }) => (
					<FormItem>
					<FormControl>
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
							onClick={() => setMostrarAviso(true)}
							className="text-blue-600 underline hover:text-blue-800"
							>
							aviso de privacidad
							</button>
						</Label>
						</div>
					</FormControl>
					<FormMessage />
					</FormItem>
				)}
				/>

				<div className="flex justify-center">
				<Button
					className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-1/2"
					variant="secondary"
					type="submit"
				>
					Siguiente
				</Button>
				</div>
			</form>
			</Form>

		</div>
		) : (<>
		{dataCatalogos?.pass_selected?.estatus =="activo" || dataCatalogos?.pass_selected?.estatus =="vencido" ?(<>
			<div className="flex flex-col items-center justify-start  space-y-3 max-w-2xl mx-auto h-screen">
					<span className="font-bold text-3xl text-slate-800">{dataCatalogos?.pass_selected?.nombre}</span>
					<div>
						<p className="font-bold whitespace-nowrap">Visita General </p>
					</div>
					<div className="flex flex-col gap-2">
						<div className="w-full flex sm:flex-row gap-2">
							<p className="font-bold whitespace-nowrap">Visita a: </p>
							<p className="w-full break-words">{dataCatalogos?.pass_selected?.visita_a[0] ? dataCatalogos?.pass_selected?.visita_a[0]?.nombre:""}</p>
						</div>
					
						<div className="w-full flex gap-2">
						<p className="font-bold whitespace-nowrap">Ubicación:</p>
						<div className="relative group w-full break-words">
							{dataCatalogos?.pass_selected?.ubicacion[0]}
							{dataCatalogos?.pass_selected?.ubicacion.length > 1 && (
							<span className="text-blue-600 cursor-pointer ml-1 underline relative">
								+{dataCatalogos?.pass_selected?.ubicacion.length - 1}
								{/* Tooltip container */}
								<div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg group-hover:block">
								{Array.isArray(dataCatalogos?.pass_selected?.ubicacion) && dataCatalogos?.pass_selected?.ubicacion.length > 1 && (
									dataCatalogos?.pass_selected?.ubicacion.slice(1).map((ubic:string, idx:number) => (
										<div key={idx}>{ubic}</div>
									))
									)}
								</div>
							</span>
							)}
						</div>
						</div>

						<div className="w-full flex  gap-2">
							<p className="font-bold whitespace-nowrap">Fecha : </p>
							<p className="text-sm">{dataCatalogos?.pass_selected?.fecha_de_expedicion}</p>
						</div>
					</div>
					<div className="w-full flex-col">
						{dataCatalogos?.pass_selected?.qr_pase[0]?.file_url ?
							<>
							<div className="w-full flex justify-center">
								<Image
									width={280}
									height={280}
									src={dataCatalogos?.pass_selected?.qr_pase[0]?.file_url ?? "/nouser.svg" } 
									alt="Imagen"
									className="w-42 h-42 object-contain bg-gray-200 rounded-lg" 
								/>
							</div>
							</>
						:<>
						<div className="w-full flex justify-center">
							<Image
								width={280}
								height={280}
								src={"/nouser.svg" } 
								alt="Imagen"
								className="w-42 h-42 object-contain bg-gray-200 rounded-lg" 
							/>
						</div>
						</>}
					</div>

					<div className="flex flex-row gap-3 items-center">
						<button type="button" onClick={handleClickGoogleButton}>
							<Image src="/esES_add_to_google_wallet_add-wallet-badge.png" alt="Add to Google Wallet" width={150} height={150} />
						</button>

						{/* <button type="button" onClick={handleClickAppleButton}>
							<Image src="/ESMX_Add_to_Apple_Wallet_RGB_101821.svg" alt="Add to Apple Wallet" width={150} height={150} className="mt-2" />
						</button> */}
						<div className="flex flex-col gap-2">
							<Button
								className="w-40 m-0 bg-yellow-400 hover:bg-yellow-600 text-black font-bold rounded-2xl"
								type="button"
								onClick={() => handleClickImgButton()}
								disabled={loadingImgPass}
							>
								{!loadingImgPass ? ("Descargar Pase") : (<><Loader2 className="animate-spin" />Descargando...</>)}
							</Button>

							<Button
								className={`hidden w-40 m-0 ${isActualizarOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
									}`}
								type="button"
								onClick={() => {
									setIsActualizarOpen(!isActualizarOpen);
								}}
								disabled={loadingDataCatalogos}
							>
								{isActualizarOpen ? "Cerrar" : "Actualizar información"}
							</Button>
						</div>
					</div>
				
					

					{loadingDataCatalogos ?(
							<div className="flex justify-center items-center h-screen">
								<div className="w-24 h-24 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
					  		</div>
					):(
						<>
							{isActualizarOpen==true?(
							<><div className="flex flex-col items-center justify-start gap-5">
								<div className="flex flex-col sm:flex-row gap-2 ">
									<div className="flex flex-col">
										<p>Fotografia actual: </p>
										<Image
											width={180}
											height={180}
											src={dataCatalogos?.pass_selected?.foto ? dataCatalogos?.pass_selected?.foto[0]?.file_url?? "/nouser.svg":"/nouser.svg"}
											alt="Imagen"
											className="w-42 h-42 object-cover bg-gray-200 rounded-lg" />
									</div>
									<div >
										<p>Identificacion actual: </p>
										<Image
											width={180}
											height={180}
											src={dataCatalogos?.pass_selected?.identificacion ? dataCatalogos?.pass_selected?.identificacion[0]?.file_url : "/nouser.svg"}
											alt="Imagen"
											className="w-42 h-42  object-cover bg-gray-200 rounded-lg mb-2" />
									</div>
								</div>

								<div className="flex flex-col gap-y-6">
									<div>
										<div className="flex items-center gap-x-10">
										<span className="font-bold text-xl">Lista de Vehículos</span>
										<VehicleLocalPassModal title="Nuevo Vehiculo" vehicles={vehicles} setVehiculos={setVehiculos} isAccesos={false} fetch={false}>
											<button
											type="button"
											onClick={() => handleCheckboxChange("agregar-vehiculos")}
											className="px-4 py-2 rounded-md transition-all duration-300 border-2 border-blue-400 bg-transparent hover:bg-slate-100"
											>
											<div className="flex items-center gap-2">
												<div className="text-blue-600 sm:hidden text-xl font-bold">+</div>
												<Car className="text-blue-600" />
												<div className="text-blue-600 hidden sm:block">Agregar Vehículos</div>
											</div>
											</button>
										</VehicleLocalPassModal>
										</div>
										<div className="mt-2 text-gray-600">
											
										<Accordion type="multiple" className="w-full">
											{vehicles.map((vehiculo, index) => (
												<AccordionItem key={index} value={`vehiculo-${index}`}>
												<AccordionTrigger>
													{vehiculo.tipo}
												</AccordionTrigger>
												<AccordionContent>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm">
													<p><strong>Tipo:</strong> {vehiculo.tipo}</p>
													<p><strong>Marca:</strong> {vehiculo.marca}</p>
													<p><strong>Modelo:</strong> {vehiculo.modelo}</p>
													<p><strong>Placas:</strong> {vehiculo.placas}</p>
													<p><strong>Estado:</strong> {vehiculo.estado}</p>
													<p><strong>Color:</strong> {vehiculo.color}</p>
													</div>
										
													<div className="flex justify-end px-4 pb-4">
													<Button variant="destructive" size="sm" onClick={() => handleRemove(index)}>
														Eliminar
													</Button>
													</div>
												</AccordionContent>
												</AccordionItem>
											))}
											{vehicles.length==0?(
											<div>No se han agregado vehiculos.</div>):null}
										</Accordion>
										</div>
									</div>

									<div>
										<div className="flex items-center gap-x-10">
										<span className="font-bold text-xl">Lista de Equipos</span>
										<EqipmentLocalPassModal title="Nuevo Equipo" equipos={equipos} setEquipos={setEquipos} isAccesos={false} fetch={false}>
											<button
											type="button"
											onClick={() => handleCheckboxChange("agregar-equipos")}
											className="px-4 py-2 rounded-md transition-all duration-300 border-2 border-blue-400 bg-transparent hover:bg-slate-100"
											>
											<div className="flex items-center gap-2">
												<div className="text-blue-600 sm:hidden text-xl font-bold">+</div>
												<Laptop className="text-blue-600" />
												<div className="text-blue-600 hidden sm:block">Agregar Equipos</div>
											</div>
											</button>
										</EqipmentLocalPassModal>
										</div>
										<div className="mt-2 text-gray-600">
										<Accordion type="multiple" className="w-full">
											{equipos.map((equipo, index) => (
												<AccordionItem key={index} value={`equipo-${index}`}>
												<AccordionTrigger>
													{equipo.tipo}
												</AccordionTrigger>
												<AccordionContent>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm">
													<p><strong>Tipo:</strong> {equipo.tipo}</p>
													<p><strong>Nombre:</strong> {equipo.nombre}</p>
													<p><strong>Marca:</strong> {equipo.marca}</p>
													<p><strong>Modelo:</strong> {equipo.modelo}</p>
													<p><strong>No. Serie:</strong> {equipo.serie}</p>
													<p><strong>Color:</strong> {equipo.color}</p>
													</div>
										
													<div className="flex justify-end px-4 pb-4">
													<Button variant="destructive" size="sm" onClick={() => handleRemoveEq(index)}>
														Eliminar
													</Button>
													</div>
												</AccordionContent>
												</AccordionItem>
											))}
											{equipos.length==0?(
											<div>No se han agregado equipos.</div>):null}
										</Accordion>
										</div>
									</div>
								</div>

							
								{/* <Button className="w-1/2  bg-blue-500 hover:bg-blue-600 my-2" type="submit" onClick={SendUpdate} disabled={isLoading}>
								{!isLoading ? ("Actualizar"):(<><Loader2 className="animate-spin"/>Actualizando...</>)}
								</Button> */}

								<Button className="w-1/2  bg-blue-500 hover:bg-blue-600 my-2" type="submit" onClick={updateInfoActivePass} >
								Actualizar
								</Button>
							</div>
							
							</>
							):null}
						</>
					)}
					
			</div>
		</>):null}
		</>)}
	</div>
);
};
export default PaseUpdate;

