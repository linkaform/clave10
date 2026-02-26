import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Bitacora_record } from "../table/bitacoras/bitacoras-columns";
import { Badge } from "../ui/badge";
import {
	User,
	Clock,
	ClipboardList,
	Briefcase,
	Monitor,
	Car,
	MessageSquare,
	MapPin,
	ShieldCheck,
	Fingerprint
} from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";

interface ViewListBitacoraModalProps {
	title: string;
	data: Bitacora_record;
	children: React.ReactNode;
}

export const ViewListBitacoraModal: React.FC<ViewListBitacoraModalProps> = ({
	title,
	data,
	children,
}) => {
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				className="max-w-3xl w-[95vw] flex flex-col p-0 overflow-hidden max-h-[90vh] md:max-h-[85vh] border-none shadow-2xl rounded-2xl [&>button]:hidden"
				onInteractOutside={(e) => e.preventDefault()}
				aria-describedby=""
			>
				{/* Modern Header */}
				<DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
					<div className="flex items-center gap-3 text-left">
						<div className="p-2 bg-white/10 rounded-lg">
							<ShieldCheck className="w-6 h-6 text-blue-400" />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold tracking-tight">
								{title}
							</DialogTitle>
							<p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
								Folio: {data?.folio}
							</p>
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1 w-full h-full overflow-y-auto px-6 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					<div className="space-y-6">
						{/* Visitor Card */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<div className="flex items-start gap-3">
										<div className="mt-1 p-1.5 bg-blue-100 text-blue-600 rounded-md">
											<User className="w-4 h-4" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre completo</p>
											<p className="text-base font-bold text-slate-900 leading-tight mt-0.5">{data?.nombre_visitante || "---"}</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="mt-1 p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
											<Clock className="w-4 h-4" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estatus de visita</p>
											<p className={`text-sm font-bold mt-0.5 uppercase tracking-wide ${data?.status_visita?.toLowerCase() === "entrada"
												? "text-emerald-600"
												: data?.status_visita?.toLowerCase() === "salida"
													? "text-rose-600"
													: "text-slate-700"
												}`}>
												{data?.status_visita}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="mt-1 p-1.5 bg-amber-100 text-amber-600 rounded-md">
											<MapPin className="w-4 h-4" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visita a</p>
											<p className="text-sm font-bold text-slate-800 mt-0.5">
												{data?.visita_a?.length > 0 ? data.visita_a[0].nombre : "---"}
											</p>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-start gap-3">
										<div className="mt-1 p-1.5 bg-purple-100 text-purple-600 rounded-md">
											<ClipboardList className="w-4 h-4" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de pase</p>
											<p className="text-sm font-semibold text-slate-700 mt-0.5">Visita General</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="mt-1 p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
											<Briefcase className="w-4 h-4" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Motivo de visita</p>
											<p className="text-xs text-slate-500 italic mt-0.5 leading-snug">{data?.motivo_visita || "No especificado"}</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Media Section */}
						{(data?.fotografia?.length > 0 || data?.identificacion?.length > 0) && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								{data?.fotografia?.length > 0 && (
									<div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-shadow">
										<div className="flex items-center gap-2 mb-4 self-start">
											<Fingerprint className="w-5 h-5 text-blue-500" />
											<p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Fotografía</p>
										</div>
										<div className="relative group overflow-hidden rounded-xl bg-slate-100 border-2 border-slate-100 shadow-inner">
											<Image
												width={400}
												height={400}
												src={data.fotografia[0].file_url || "/nouser.svg"}
												alt="Fotografía"
												className="w-64 h-64 object-cover transition-transform duration-500 group-hover:scale-110"
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
										</div>
									</div>
								)}

								{data?.identificacion?.length > 0 && (
									<div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-shadow">
										<div className="flex items-center gap-2 mb-4 self-start">
											<Briefcase className="w-5 h-5 text-purple-500" />
											<p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Identificación</p>
										</div>
										<div className="relative group overflow-hidden rounded-xl bg-slate-100 border-2 border-slate-100 shadow-inner">
											<Image
												width={400}
												height={400}
												src={data.identificacion[0].file_url || "/nouser.svg"}
												alt="Identificación"
												className="w-64 h-64 object-cover transition-transform duration-500 group-hover:scale-110"
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
										</div>
									</div>
								)}
							</div>
						)}

						{/* Detail Sections */}
						<div className="space-y-4 pb-4">
							{data?.equipos.length > 0 && (
								<section>
									<div className="flex items-center gap-2 mb-2 px-1">
										<Monitor className="w-4 h-4 text-slate-500" />
										<h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Equipos Registrados</h3>
									</div>
									<Accordion type="single" collapsible className="bg-white border border-slate-200 rounded-xl overflow-hidden px-4 shadow-sm">
										{data?.equipos.map((equipo, index) => (
											<AccordionItem key={index} value={`equipo-${index}`} className={index === data.equipos.length - 1 ? "border-b-0" : ""}>
												<AccordionTrigger className="hover:no-underline py-3">
													<span className="text-sm font-semibold text-slate-700">{equipo.tipo_equipo}</span>
												</AccordionTrigger>
												<AccordionContent>
													<div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-3 text-sm">
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Marca</p>
															<p className="font-medium text-slate-800 leading-tight">{equipo.marca_articulo || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modelo</p>
															<p className="font-medium text-slate-800 leading-tight">{equipo.modelo_articulo || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">S/N</p>
															<p className="font-medium text-slate-800 leading-tight">{equipo.numero_serie || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Color</p>
															<p className="font-medium text-slate-800 leading-tight">{equipo.color_articulo || "N/A"}</p>
														</div>
													</div>
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								</section>
							)}

							{data?.vehiculos.length > 0 && (
								<section>
									<div className="flex items-center gap-2 mb-2 px-1">
										<Car className="w-4 h-4 text-slate-500" />
										<h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Vehículos Registrados</h3>
									</div>
									<Accordion type="single" collapsible className="bg-white border border-slate-200 rounded-xl overflow-hidden px-4 shadow-sm">
										{data?.vehiculos.map((vehiculo, index) => (
											<AccordionItem key={index} value={`vehiculo-${index}`} className={index === data.vehiculos.length - 1 ? "border-b-0" : ""}>
												<AccordionTrigger className="hover:no-underline py-3">
													<div className="flex items-center gap-2">
														<span className="text-sm font-semibold text-slate-700">{vehiculo.tipo || "Vehículo"}</span>
														<Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-mono bg-slate-100 text-slate-600 border-none shadow-none">
															{vehiculo.placas}
														</Badge>
													</div>
												</AccordionTrigger>
												<AccordionContent>
													<div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-3 text-sm">
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Marca</p>
															<p className="font-medium text-slate-800 leading-tight">{vehiculo.marca_vehiculo || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modelo</p>
															<p className="font-medium text-slate-800 leading-tight">{vehiculo.modelo_vehiculo || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Estado</p>
															<p className="font-medium text-slate-800 leading-tight">{vehiculo.nombre_estado || "N/A"}</p>
														</div>
														<div>
															<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Color</p>
															<p className="font-medium text-slate-800 leading-tight">{vehiculo.color || "N/A"}</p>
														</div>
													</div>
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								</section>
							)}

							{data?.comentarios.length > 0 && (
								<section>
									<div className="flex items-center gap-2 mb-2 px-1">
										<MessageSquare className="w-4 h-4 text-slate-500" />
										<h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Comentarios</h3>
									</div>
									<div className="space-y-3">
										{data.comentarios.map((comentario, index) => (
											<div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
												<div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-slate-400 transition-colors" />
												<div className="flex justify-between items-center mb-1.5">
													<Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200 font-bold uppercase tracking-tight">
														{comentario.tipo_comentario || "General"}
													</Badge>
												</div>
												<p className="text-sm text-slate-700 leading-relaxed font-medium italic">
													&quot;{comentario.comentario}&quot;
												</p>
											</div>
										))}
									</div>
								</section>
							)}

							{data?.grupo_areas_acceso.length > 0 && (
								<section>
									<div className="flex items-center gap-2 mb-2 px-1">
										<MapPin className="w-4 h-4 text-slate-500" />
										<h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Áreas de Acceso</h3>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{data.grupo_areas_acceso.map((area, index) => (
											<div key={index} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors">
												<div className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
													<MapPin className="w-4 h-4" />
												</div>
												<div className="overflow-hidden">
													<p className="text-sm font-bold text-slate-800 truncate">{area.note_booth}</p>
													{area.commentario_area && (
														<p className="text-[10px] text-slate-400 font-medium truncate uppercase mt-0.5">{area.commentario_area}</p>
													)}
												</div>
											</div>
										))}
									</div>
								</section>
							)}
						</div>
					</div>
				</ScrollArea>

				<div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
					<DialogClose asChild>
						<Button className="min-w-[120px] bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95 font-bold uppercase tracking-wider text-xs h-10 px-6">
							Cerrar
						</Button>
					</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
};
