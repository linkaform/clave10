import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

import { z } from "zod";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useGetLockers } from "@/hooks/useGetLockers";
import { useGetGafetes } from "@/hooks/useGetGafetes";

import { IdCard, Loader2, Printer } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useAsignarGafete } from "@/hooks/useAsignarGafete";
import { useShiftStore } from "@/store/useShiftStore";
import Swal from "sweetalert2";
import { useGetPdf } from "@/hooks/usetGetPdf";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "sonner";
import { imprimirYDescargarPDF } from "@/lib/utils";

interface AddBadgeModalProps {
	title: string;
	status:string;
	id_bitacora:string;
	tipo_movimiento:string;
	ubicacion:string;
	area:string;
	setModalAgregarBadgeAbierto:Dispatch<SetStateAction<boolean>>; 
	modalAgregarBadgeAbierto:boolean;
	pase_id:string
}

export interface locker {
	status: string
	area: string
	locker_id: string
	ubicacion: string
	tipo_locker: string
	_id: string
}
export interface gafete {
	ubicacion: string
	status: string
	gafete_id: string
	_id: string
	area: string
}


const FormSchema = z.object({
	gafete: z.string().min(2, {
		message: "Campo requerido.",
	}),

	locker: z.string().min(2, {
		message: "Campo requerido.",
	}),
	documentos: z.string().min(1, {
		message: "Selecciona al menos un documento.",
	}),
});

export const AddBadgeModal: React.FC<AddBadgeModalProps> = ({
	title,
	status,
	id_bitacora,
	tipo_movimiento,
	ubicacion,
	modalAgregarBadgeAbierto,
	setModalAgregarBadgeAbierto,
	pase_id
}) => {
	const {area, location,downloadPass} = useShiftStore()
	const { userIdSoter } = useAuthStore();
	const { data:responseGetLockers, isLoading:loadingGetLockers, refetch: refetchLockers } = useGetLockers(location, area, status, modalAgregarBadgeAbierto);
	const { data:responseGetGafetes, isLoading:loadingGetGafetes, refetch: refetchGafetes } = useGetGafetes(location, area, status, modalAgregarBadgeAbierto);
	const { asignarGafeteMutation,isLoading} = useAsignarGafete();
	const {
	  refetch,
	} = useGetPdf(userIdSoter, pase_id, false);
	
const[showOptions, setShowOptions] = useState(true)
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			gafete: "",
			locker: "",
			documentos:"",
		},
	});

	useEffect(()=>{
		if(modalAgregarBadgeAbierto){
			refetchLockers()
			refetchGafetes()
		}
	},[modalAgregarBadgeAbierto, refetchGafetes, refetchLockers])


	function onSubmit(data: z.infer<typeof FormSchema>) {
		asignarGafeteMutation.mutate({ data_gafete:{locker_id:data.locker, gafete_id:data.gafete, documento:data.documentos, status_gafete:"asignado" , ubicacion:ubicacion, area:area} 
			,id_bitacora, tipo_movimiento })
	}
	

	const handleOpenModal = async () => {
		setModalAgregarBadgeAbierto(true); 
	}
	const handleGetPdf = async () => {
		try {
		  const result = await refetch();
	  
		  if (result.error) {
			toast.error(`Error de red: ${result.error}`, {
			  style: {
				backgroundColor: "#f44336",
				color: "#fff",
			  },
			});
			Swal.close();
			return;
		  }
	  
		  const data = result.data?.response?.data;
	  
		  if (!data || data.status_code !== 200) {
			const errorMsg =
			  data?.json?.error ||
			  result.data?.error ||
			  "Error desconocido del servidor";
	  
			toast.error(`Error de red: ${errorMsg}`, {
			  style: {
				backgroundColor: "#f44336",
				color: "#fff",
			  },
			});
			Swal.close();
			return;
		  }
	  
		  const downloadUrl = data?.json?.download_url;
	  
		  if (downloadUrl) {
			imprimirYDescargarPDF(downloadUrl); 
		  } else {
			toast.warning("No se encontró URL de descarga");
		  }
		} catch (err) {
		  toast.error(`Error inesperado: ${err}`, {
			style: {
			  backgroundColor: "#f44336",
			  color: "#fff",
			},
		  });
		  Swal.close();
		}
	  };

	  
	const printPase = () => {
			Swal.fire({
				title: 'Preparando documento',
				html: 'Cargando PDF para imprimir...',
				allowOutsideClick: false,
				allowEscapeKey: false,
				didOpen: () => {
				  Swal.showLoading();
				}
			  });
			  handleGetPdf();
	}
return (
	<Dialog open={modalAgregarBadgeAbierto} onOpenChange={setModalAgregarBadgeAbierto}>
		<div className="cursor-pointer" onClick={handleOpenModal}>
			<IdCard />
		</div>
		{showOptions? (
			<DialogContent className="max-w-lg overflow-y-auto max-h-[80vh] flex flex-col" aria-describedby="">
				<DialogHeader className="flex-shrink-0">
			<DialogTitle className="text-2xl text-center font-bold">
				Selecciona una opción
			</DialogTitle>
			</DialogHeader>

		    <div className="flex flex-col gap-5">
				<div>
				<Button
					onClick={() =>{setModalAgregarBadgeAbierto(false);printPase();}}
					disabled={!downloadPass.includes("impresion_de_pase")}
					className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
				>
				 <Printer/>  Imprimir pase de entrada
				 
				</Button>
				{!downloadPass.includes("impresion_de_pase") && <div className="text-red-500 text-sm" >No tienes habilitada la descarga de pases de entrada.</div>}
				</div>

				<Button className="w-full  bg-blue-500 hover:bg-blue-600 text-white" type="submit" onClick={()=>{setShowOptions(false)}}>
				<IdCard/> {("Asignar gafete")}
				</Button>
			</div>
			</DialogContent>
		):
		<DialogContent className="max-w-xl overflow-y-auto max-h-[80vh] flex flex-col" aria-describedby="">
			<DialogHeader className="flex-shrink-0">
			<DialogTitle className="text-2xl text-center font-bold">
				{title}
			</DialogTitle>
			</DialogHeader>
			<div className="flex-grow overflow-y-auto p-4 py-2">
				<Form {...form}>
					<form className="grid md:grid-cols-2 gap-5 mb-3"
						onSubmit={form.handleSubmit(onSubmit)}
					>
							<FormField
								control={form.control}
								name="gafete"
								render={({ field }:any) => (
									<FormItem >
										<FormLabel>
											<div className="text-red-500 "> *<span className="text-black"> Gafete</span> </div> 
										</FormLabel>
										<Select 
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
												{loadingGetGafetes?(
														<>
														<SelectValue placeholder="Cargando gafetes..." />
														</>
													): (
														<>
														<SelectValue placeholder="Selecciona un gafete" />
														</>
													)}
												</SelectTrigger>
											</FormControl>
											<SelectContent >
											{responseGetGafetes?.map((gafete:gafete, index:string) => (
														<SelectItem key={`${index}-${gafete.area}`} value={gafete.gafete_id}>
															{gafete.gafete_id} - {gafete.area}
														</SelectItem>
													))}
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="locker"
								render={({ field }:any) => (
									<FormItem >
										<FormLabel>
										<div className="text-red-500"> *<span className="text-black"> Locker</span> </div> 
										</FormLabel>
										<Select 
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl >
												<SelectTrigger>
												{loadingGetLockers?(
														<>
														<SelectValue placeholder="Cargando lockers..." />
														</>
													): (
														<>
														<SelectValue placeholder="Selecciona un locker" />
														</>
													)}
												</SelectTrigger>
											</FormControl>
											<SelectContent>
											{responseGetLockers?.map((locker:locker, index:string) => (
														<SelectItem key={index} value={locker.locker_id	}>
															{locker.locker_id	}
														</SelectItem>
													))}
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>
						<div className="w-full">
							<FormField
								control={form.control}
								name="documentos"
								render={({ field }:any) => (
									<FormItem>
										<FormLabel>
											<span className="text-red-500">*</span> Documento de
											garantía
										</FormLabel>
										<div className="space-y-2 my-5">
												<FormControl >
														<RadioGroup className="flex flex-col align-middle justify-center"
															defaultValue={field.value}
															onValueChange={field.onChange}
														>
															<FormItem >
																	<FormControl className="mr-2">
																		<RadioGroupItem value="ine" />
																	</FormControl>
																	<FormLabel className="font-normal">
																		INE
																	</FormLabel>
															</FormItem>
															<FormItem>
																<FormControl className="mr-2">
																	<RadioGroupItem value="licencia de conducir" />
																</FormControl>
																<FormLabel className="font-normal">Licencia de conducir</FormLabel>
															</FormItem>

															<FormItem>
																<FormControl className="mr-2">
																	<RadioGroupItem value="pase de estacionamiento" />
																</FormControl>
																<FormLabel className="font-normal">Pase de Estacionamiento</FormLabel>
															</FormItem>
															<FormItem>
																<FormControl className="mr-2">
																	<RadioGroupItem value="otro" />
																</FormControl>
																<FormLabel className="font-normal">Otro</FormLabel>
															</FormItem>

														</RadioGroup>
												</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>
			</div>
			<div className="flex gap-5">
				<DialogClose asChild>
					<Button
						onClick={() => form.reset()}
						className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
					>
						Cancelar
					</Button>
				</DialogClose>

				<Button className="w-full  bg-blue-500 hover:bg-blue-600 text-white" type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
					{ !isLoading ? (<>
					{("Asignar gafete")}
					</>) :(<> <Loader2 className="animate-spin"/> {"Cargando..."} </>)}
				</Button>
			</div>
		</DialogContent>   
		}     
	</Dialog>
);
};
