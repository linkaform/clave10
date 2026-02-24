import React from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
	MessageSquare,
	Phone,
	MapPin,
	Building2,
	FileText,
	Calendar,
	Clock,
	Hash,
	User,
	CheckCircle2,
	XCircle,
	AlertCircle
} from "lucide-react";

import { MakeCallModal } from "@/components/modals/make-call-modal";
import { SendMessageModal } from "@/components/modals/send-message-modal";
import { SearchAccessPass } from "@/hooks/useSearchPass";
import { toast } from "sonner";
import CalendarDays from "@/components/calendar-days";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

import { Tooltip } from "@/components/ui/tooltip";

interface Props {
	searchPass: SearchAccessPass | undefined;
}

const Credentials: React.FC<Props> = ({ searchPass }) => {
	const getStatusIcon = (status: string | undefined) => {
		switch (status?.toLowerCase()) {
			case "vencido": return <XCircle className="w-4 h-4 mr-1" />;
			case "activo": return <CheckCircle2 className="w-4 h-4 mr-1" />;
			case "proceso": return <AlertCircle className="w-4 h-4 mr-1" />;
			default: return null;
		}
	};

	return (
		<div className="h-fit overflow-y-auto w-full">
			<Card className="w-full max-w-xl mx-auto border-none shadow-lg bg-white overflow-hidden">
				<CardHeader className="bg-slate-50 border p-6">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2 text-slate-500">
							<Hash className="w-4 h-4" />
							<span className="text-sm font-medium">Folio: <span className="text-slate-900">{searchPass?.folio}</span></span>
						</div>
						<Badge
							className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border-none ${searchPass?.tipo_movimiento === "Salida"
								? "bg-rose-100 text-rose-700 hover:bg-rose-200"
								: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
								}`}
						>
							{searchPass?.tipo_movimiento ?? "Entrada"}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-0 border">
					{/* Identity Section */}
					<div className="p-6 flex flex-col items-center gap-4 bg-white pb-8">
						<div className="flex items-center justify-center gap-6">
							<div className="relative group">
								<div className="w-32 h-32 rounded-2xl overflow-hidden shadow-sm border-2 border-slate-100 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:shadow-xl group-hover:border-indigo-100">
									<Image
										src={searchPass?.identificacion?.[0]?.file_url || "/noiden.svg"}
										alt="Identificación"
										fill
										className="object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-110"
									/>
								</div>
								<div className="absolute -bottom-2 -right-2 bg-white rounded-lg px-2 py-0.5 shadow-sm border text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID</div>
							</div>

							<div className="relative group">
								<div className="w-32 h-32 rounded-2xl overflow-hidden shadow-sm border-2 border-slate-100 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:shadow-xl group-hover:border-indigo-100">
									<Image
										src={searchPass?.foto?.[0]?.file_url || "/nouser.svg"}
										alt="Foto"
										fill
										className="object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-110"
									/>
								</div>
								<div className="absolute -bottom-2 -right-2 bg-white rounded-lg px-2 py-0.5 shadow-sm border text-[10px] font-bold text-slate-400 uppercase tracking-tighter">FOTO</div>
							</div>
						</div>

						<div className="text-center space-y-1">
							<h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
								{searchPass?.nombre}
							</h2>
							<p className="text-slate-500 font-medium flex items-center justify-center gap-1.5 uppercase text-xs tracking-widest bg-slate-100 px-3 py-1 rounded-full w-fit mx-auto">
								<User className="w-3 h-3" />
								{searchPass?.tipo_de_pase}
							</p>
						</div>
					</div>

					<Separator />

					{/* Details Section */}
					<div className="p-6 space-y-5">
						<div className="grid grid-cols-1 gap-4">
							{/* Ubicación */}
							<div className="flex items-start gap-3 group">
								<div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
									<MapPin className="w-4 h-4" />
								</div>
								<div className="space-y-0.5 flex-1 overflow-hidden">
									<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ubicación</p>
									<div className="relative group/tooltip flex items-center flex-wrap gap-1">
										<span className="text-slate-900 font-medium truncate max-w-full">
											{searchPass?.ubicacion[0]}
										</span>
										{searchPass?.ubicacion && searchPass?.ubicacion.length > 1 && (
											<Tooltip
												content={
													<div className="space-y-1.5 px-1 py-0.5">
														<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Otras Ubicaciones</p>
														{searchPass.ubicacion.slice(1).map((ubic: string, idx: number) => (
															<div key={idx} className="flex items-center gap-2">
																<div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
																<span className="text-xs font-semibold text-slate-700">{ubic}</span>
															</div>
														))}
													</div>
												}
												contentClassName="min-w-[180px] shadow-2xl border-indigo-50 rounded-xl"
											>
												<span className="text-indigo-600 cursor-pointer text-sm font-bold bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors">
													+{searchPass?.ubicacion.length - 1}
												</span>
											</Tooltip>
										)}
									</div>
								</div>
							</div>

							{/* Empresa y Motivo */}
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-start gap-3 group">
									<div className="p-2 rounded-lg bg-orange-50 text-orange-600">
										<Building2 className="w-4 h-4" />
									</div>
									<div className="space-y-0.5">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</p>
										<p className="text-slate-900 font-medium truncate">{searchPass?.empresa || "N/A"}</p>
									</div>
								</div>
								<div className="flex items-start gap-3 group">
									<div className="p-2 rounded-lg bg-amber-50 text-amber-600">
										<FileText className="w-4 h-4" />
									</div>
									<div className="space-y-0.5">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivo</p>
										<p className="text-slate-900 font-medium truncate">{searchPass?.motivo_visita || "N/A"}</p>
									</div>
								</div>
							</div>

							{/* Estatus y Vigencia */}
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-start gap-3 group">
									<div className="p-2 rounded-lg bg-slate-50 text-slate-600">
										<Clock className="w-4 h-4" />
									</div>
									<div className="space-y-1">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estatus</p>
										<Badge
											className={`flex items-center w-fit px-2 py-0.5 text-xs font-bold border-none ${searchPass?.estatus?.toLowerCase() === "vencido"
												? "bg-rose-100 text-rose-700"
												: searchPass?.estatus?.toLowerCase() === "activo"
													? "bg-emerald-100 text-emerald-700"
													: searchPass?.estatus?.toLowerCase() === "proceso"
														? "bg-sky-100 text-sky-700"
														: "bg-slate-100 text-slate-700"
												}`}
										>
											{getStatusIcon(searchPass?.estatus)}
											{capitalizeFirstLetter(searchPass?.estatus ?? "")}
										</Badge>
									</div>
								</div>
								<div className="flex items-start gap-3 group">
									<div className="p-2 rounded-lg bg-purple-50 text-purple-600">
										<Calendar className="w-4 h-4" />
									</div>
									<div className="space-y-0.5">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vigencia</p>
										<p className="text-slate-900 font-medium text-sm">
											{searchPass?.fecha_de_caducidad?.toString() || "No expira"}
										</p>
									</div>
								</div>
							</div>
						</div>

						<Separator className="opacity-50" />

						{/* Visit Section */}
						<div className="space-y-3">
							<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visita a:</p>
							<div className="space-y-2">
								{searchPass?.visita_a?.map((visita, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md hover:border-indigo-100"
									>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
												{visita.nombre?.charAt(0)}
											</div>
											<span className="font-semibold text-slate-700">{visita.nombre}</span>
										</div>
										<div className="flex gap-2 opacity-80 group-hover:opacity-100">
											<MakeCallModal
												title="¿Realizar llamada?"
												description="Al realizar la llamada, se contactará al número de la persona seleccionada."
											>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 rounded-lg bg-white border shadow-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
													onClick={() => {
														if (!visita.telefono) {
															toast.error("¡El teléfono no ha sido configurado!");
															return;
														}
													}}
												>
													<Phone className="h-4 w-4" />
												</Button>
											</MakeCallModal>

											<SendMessageModal title="Enviar Mensaje">
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 rounded-lg bg-white border shadow-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50"
													onClick={() => {
														if (!visita.email) {
															toast.error("¡El email no ha sido configurado!");
															return;
														}
													}}
												>
													<MessageSquare className="h-4 w-4" />
												</Button>
											</SendMessageModal>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Extras Section (Badge/Locker/Calendar) */}
						{(searchPass?.limite_de_acceso != null || searchPass?.gafete_id || searchPass?.locker_id || searchPass?.limitado_a_dias) && (
							<div className="pt-2">
								<div className="grid grid-cols-2 gap-4 mb-4">
									{searchPass?.gafete_id && (
										<div className="bg-slate-50 p-2.5 rounded-lg border border-dashed flex flex-col">
											<span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Gafete</span>
											<span className="text-slate-700 font-bold">{searchPass.gafete_id}</span>
										</div>
									)}
									{searchPass?.locker_id && (
										<div className="bg-slate-50 p-2.5 rounded-lg border border-dashed flex flex-col">
											<span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Locker</span>
											<span className="text-slate-700 font-bold">{searchPass.locker_id}</span>
										</div>
									)}
								</div>

								{searchPass?.limite_de_acceso != null && (
									<div className="flex flex-col gap-1.5 mb-4">
										<div className="flex justify-between items-end">
											<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Límite de accesos</span>
											<span className="text-sm font-bold text-slate-900">
												{searchPass?.total_entradas ?? 0} / {searchPass?.limite_de_acceso}
											</span>
										</div>
										<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
											<div
												className={`h-full transition-all duration-500 rounded-full ${(Number(searchPass?.total_entradas) / Number(searchPass?.limite_de_acceso)) > 0.9
													? "bg-rose-500"
													: "bg-indigo-500"
													}`}
												style={{ width: `${Math.min(100, (Number(searchPass?.total_entradas) / Number(searchPass?.limite_de_acceso)) * 100)}%` }}
											/>
										</div>
									</div>
								)}

								{searchPass?.limitado_a_dias && (
									<div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Días Autorizados</p>
										<CalendarDays diasDisponibles={searchPass?.limitado_a_dias} />
									</div>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Credentials;