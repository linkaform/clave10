import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { Loader2 } from "lucide-react";
import { UpdatedPassModal } from "./updated-pass-modal";
import { data_correo } from "@/lib/send_correo";
import Image from "next/image";
// import { Checkbox } from "../ui/checkbox";
// import { Label } from "../ui/label";
// import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useUpdateAccessPass } from "@/hooks/useUpdatePass";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Mail, Phone, Calendar, Briefcase, User, Info } from "lucide-react";

interface EntryPassModal2Props {
	title: string;
	data: any
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
	onClose: ()=> void;
	passData: any;
	parentUserId: number;
	fechaDeReunion: string | null;
}

export const EntryPassModal2: React.FC<EntryPassModal2Props> = ({
	title,
	data,
	isSuccess,
	passData,
	setIsSuccess,onClose, parentUserId,
	fechaDeReunion
}) => {
	const [response,setResponse] = useState<any>(null);
	const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
	const [responseformated, setResponseFormated] = useState<data_correo|null>(null);
	const{ updatePassMutation , isLoadingUpdate} = useUpdateAccessPass();

	const onSubmit = async () => {
			updatePassMutation.mutate({access_pass:{
				grupo_vehiculos: data.grupo_vehiculos,
				grupo_equipos: data.grupo_equipos,
				status_pase: data.status_pase,
				walkin_fotografia: data?.walkin_fotografia,
				walkin_identificacion: data?.walkin_identificacion,
				acepto_aviso_privacidad: data?.acepto_aviso_privacidad ? "sí":"no",
				conservar_datos_por: data?.conservar_datos_por,
				empresa_pase: data?.empresa,
			},id: data.folio, account_id: data.account_id},{
				onSuccess: (response) => {
					setResponseFormated({
						email_to: data.email,
						asunto: response?.response?.data?.json?.asunto,
						email_from: response?.response?.data?.enviar_de_correo,
						nombre: response?.response?.data?.json?.enviar_a,
						nombre_organizador: response?.response?.data?.json?.enviar_de,
						ubicacion: response?.response?.data?.json?.ubicacion,
						fecha: {desde: response?.response?.data?.json?.fecha_desde, hasta:response?.response?.data?.json?.fecha_hasta },
						descripcion: response?.response?.data?.json?.descripcion,
					})
					setResponse(response); 
					setIsSuccess(true); 
					setOpenGeneratedPass(true)
				},
			})
	};

	const handleClose = () => {
		onClose(); 
	};

	return (
		<Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
			<DialogContent className="max-w-3xl overflow-y-auto max-h-[95vh] flex flex-col p-0 gap-0 border-none sm:rounded-2xl shadow-2xl" aria-describedby="" onInteractOutside={(e) => e.preventDefault()} >
				<div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
					<DialogHeader>
						<DialogTitle className="text-3xl text-center font-extrabold tracking-tight">
							{title}
						</DialogTitle>
						<p className="text-blue-100 text-center mt-2 font-medium">Verifica la información antes de completar tu pase</p>
					</DialogHeader>
				</div>

				<div className="flex-grow overflow-y-auto bg-gray-50/50">
					<div className="max-w-4xl mx-auto p-6 lg:p-8">
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
							{/* Columna Izquierda: Foto */}
							<div className="lg:col-span-4 self-stretch">
								<div className="relative group h-full">
									<div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
									<div className="relative h-full flex flex-col items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
										<p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Fotografía</p>
										<div className="relative flex-grow w-full overflow-hidden rounded-xl border border-gray-100">
											{data && data?.walkin_fotografia.length > 0 ? (
												<Image 
													src={data?.walkin_fotografia[0].file_url} 
													alt="Fotografía del visitante"
													fill
													className="object-cover" 
												/>
											) : (
												<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
													<User size={48} className="mb-2 opacity-20" />
													<span className="text-xs italic">Sin fotografía</span>
												</div>
											)}
										</div>
										<p className="mt-4 text-[10px] font-bold text-blue-600 uppercase tracking-tight bg-blue-50 px-3 py-1 rounded-full">Visitante Registrado</p>
									</div>
								</div>
							</div>

							{/* Columna Derecha: Información */}
							<div className="lg:col-span-8">
								<div className="space-y-6">
									{/* Sección: Identidad */}
									<div>
										<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos del Visitante</h3>
										<div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
											<div className="flex items-center gap-4">
												<div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
													<User size={20} />
												</div>
												<div className="flex-grow">
													<p className="text-xs text-gray-400 font-medium uppercase">Nombre Completo</p>
													<p className="font-bold text-gray-800 text-lg leading-tight">{data?.nombre}</p>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
												<div className="flex items-center gap-3">
													<Mail className="text-gray-400" size={18} />
													<div>
														<p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
														<p className="text-sm text-gray-700 font-medium truncate max-w-[180px]">{data?.email}</p>
													</div>
												</div>
												{data?.telefono && (
													<div className="flex items-center gap-3">
														<Phone className="text-gray-400" size={18} />
														<div>
															<p className="text-[10px] text-gray-400 uppercase font-bold">Teléfono</p>
															<p className="text-sm text-gray-700 font-medium">{data?.telefono}</p>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Sección: Detalles del Pase */}
									<div>
										<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Información del Acceso</h3>
										<div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-4">
													<div className="flex items-center gap-3">
														<div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
															<Briefcase size={16} />
														</div>
														<div>
															<p className="text-[10px] text-gray-400 uppercase font-bold">Tipo de Pase</p>
															<p className="text-sm font-semibold text-gray-700">Visita General</p>
														</div>
													</div>
													
													<div className="flex items-center gap-3">
														<div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
															<Info size={16} />
														</div>
														<div>
															<p className="text-[10px] text-gray-400 uppercase font-bold">Estatus</p>
															<Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] uppercase font-bold h-5 px-2">
																{capitalizeFirstLetter("En Proceso")}
															</Badge>
														</div>
													</div>
												</div>

												<div className="space-y-4">
													{fechaDeReunion && (
														<div className="flex items-center gap-3">
															<div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
																<Calendar size={16} />
															</div>
															<div>
																<p className="text-[10px] text-gray-400 uppercase font-bold">Fecha de reunión</p>
																<p className="text-sm font-semibold text-gray-700">{fechaDeReunion.slice(0, 10)}</p>
															</div>
														</div>
													)}
													
													{data?.empresa && (
														<div className="flex items-center gap-3">
															<div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
																<Briefcase size={16} />
															</div>
															<div>
																<p className="text-[10px] text-gray-400 uppercase font-bold">Empresa</p>
																<p className="text-sm font-semibold text-gray-700">{data.empresa}</p>
															</div>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="p-6 bg-white border-t border-gray-100 mt-auto">
					<div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
						<DialogClose asChild >
							<Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold border-gray-200 text-gray-500 hover:bg-gray-50" onClick={handleClose}>
								Regresar
							</Button>
						</DialogClose>
						
						<div className="flex-1 flex gap-2">
							<UpdatedPassModal
								title="Pase de Entrada Completado"
								description={""}
								openGeneratedPass={openGeneratedPass}
								hasEmail={data?.email ? true: false}
								hasTelefono={data?.telefono ? true: false}
								setOpenGeneratedPass={setOpenGeneratedPass} 
								qr={response?.json?.qr_pase[0].file_url ?? "/nouser.svg"}
								dataPass={responseformated}
								account_id={data?.account_id??0}
								folio={response?.json?.id}
								closePadre={handleClose}
								passData={passData}
								updateResponse={response}
								parentUserId={parentUserId}
							/>
						
							<Button 
								className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" 
								type="submit" 
								onClick={onSubmit} 
								disabled={isLoadingUpdate}
							>
								{!isLoadingUpdate ? (
									"Confirmar"
								) : (
									<><Loader2 className="animate-spin mr-2"/>Procesando...</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
