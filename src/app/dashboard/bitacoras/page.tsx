"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LockerTable } from "@/components/table/bitacoras/locker/table";
import PageTitle from "@/components/page-title";
import BitacorasTable from "@/components/table/bitacoras/table";
import { Wrench, CarFront, UsersRound, Sun, DoorOpen } from "lucide-react";
import { useShiftStore } from "@/store/useShiftStore";
import VehiculosTable from "@/components/table/bitacoras/vehiculos/table";
import EquiposTable from "@/components/table/bitacoras/equipos/table";
import ChangeLocation from "@/components/changeLocation";
import { Comentarios_bitacoras, VisitaA } from "@/components/table/bitacoras/equipos/equipos-columns";
import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns";
import { arraysIguales, dateToString, imprimirYDescargarPDF } from "@/lib/utils";
import { useBitacoras } from "@/hooks/Bitacora/useBitacoras";
import { toast } from "sonner";
import { useGetStats } from "@/hooks/useGetStats";
import { useBoothStore } from "@/store/useBoothStore";
import Swal from "sweetalert2";
import useAuthStore from "@/store/useAuthStore";
import { getPdf } from "@/lib/get-pdf";

const BitacorasPage = () => {
	const { tab, filter, option, from, setFrom } = useShiftStore()
	const { location } = useBoothStore();
	const { userParentId } = useAuthStore()
	const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
	const [areaSeleccionada, setAreaSeleccionada] = useState("todas");
	const [equiposData, setEquiposData] = useState<Bitacora_record[]>([]);
	const [vehiculosData, setVehiculosData] = useState<Bitacora_record[]>([]);
	const [isPersonasDentro, setIsPersonasDentro] = useState(false);
	console.log("isPersonasDentro", isPersonasDentro)

	const [date1, setDate1] = useState<Date | "">("")
	const [date2, setDate2] = useState<Date | "">("")
	const [selectedOption, setSelectedOption] = useState<string[]>(option);

	const [dates, setDates] = useState<string[]>([])
	const [dateFilter, setDateFilter] = useState<string>(filter)
	const { listBitacoras, isLoadingListBitacoras, refetchBitacoras } = useBitacoras(
		ubicacionSeleccionada, areaSeleccionada == "todas" ? "" : areaSeleccionada, selectedOption, ubicacionSeleccionada && areaSeleccionada ? true : false, dates[0], dates[1], dateFilter)
	const { data: stats, refetch: refetchStats } = useGetStats(ubicacionSeleccionada && areaSeleccionada ? true : false, ubicacionSeleccionada, areaSeleccionada == "todas" ? "" : areaSeleccionada, 'Bitacoras')

	const refreshData = async () => {
		await Promise.all([
			refetchBitacoras(),
			refetchStats()
		]);
	};
	const [selectedTab, setSelectedTab] = useState<string>(tab ? tab : "Personal");
	const [paseIdSeleccionado, setPaseIdSeleccionado] = useState("")
	console.log(paseIdSeleccionado)
	useEffect(() => {
		if (location) {
			setUbicacionSeleccionada(location);
		}
	}, [location]);

	useEffect(() => {
		if (Array.isArray(listBitacoras) && listBitacoras.length > 0 && from === "turnos") {
			setDateFilter(filter);
			setSelectedTab(tab)
			setFrom("");
		}
	}, [filter, from, listBitacoras, selectedTab, setFrom, tab]);


	const processBitacorasE = (bitacoras: Bitacora_record[]) => {
		return bitacoras.flatMap(bitacora => {
			if (
				!bitacora.equipos ||
				!Array.isArray(bitacora.equipos) ||
				bitacora.equipos.length === 0
			) {
				return [];
			}

			const hasValidVehicle = bitacora.equipos.some((eq: any) => {
				return eq.tipo_equipo && eq.tipo_equipo.trim() !== '';
			});

			if (!hasValidVehicle) {
				return [];
			}

			return bitacora.equipos.map((eq: any) => ({
				...bitacora,
				equipos: [eq],
				formated_visita: bitacora.visita_a
					?.map((item: VisitaA) => item.nombre)
					.join(', ') || '',
				formated_comentarios: bitacora.comentarios
					?.map((item: Comentarios_bitacoras) => item.comentario)
					.join(', ') || '',
			}));
		});
	};

	const processBitacorasV = (bitacoras: Bitacora_record[]) => {
		return bitacoras?.flatMap(bitacora => {
			if (!bitacora.vehiculos || !Array.isArray(bitacora.vehiculos) || bitacora.vehiculos.length === 0) {
				return [];
			}
			const hasValidVehicle = bitacora.vehiculos.some((eq: any) => {
				return eq.tipo && eq.tipo.trim() !== '';
			});

			if (!hasValidVehicle) {
				return [];
			}

			return bitacora.vehiculos.map((eq: any) => {
				return {
					...bitacora,
					vehiculos: [eq],
					formated_visita: bitacora.visita_a.map((item: VisitaA) => item.nombre).join(', '),
					formated_comentarios: bitacora.comentarios.map((item: Comentarios_bitacoras) => item.comentario).join(', '),
				};
			});
		});
	};

	useEffect(() => {
		if (listBitacoras) {
			if (Array.isArray(listBitacoras)) {
				setEquiposData(processBitacorasE(listBitacoras))
				setVehiculosData(processBitacorasV(listBitacoras))
			} else {
				setEquiposData(processBitacorasE([]))
				setVehiculosData(processBitacorasV([]))
			}
		}
	}, [listBitacoras])

	const handleTabChange = (tab: string, option: string[], filter = "") => {
		if (tab == selectedTab && arraysIguales(option, selectedOption) && filter == dateFilter) {
			setSelectedOption([]);
			setSelectedTab(selectedTab)
			if (selectedTab === "Equipos") {
				setSelectedOption([])
				setSelectedTab("Personal")
			}
			setDateFilter("")
			setIsPersonasDentro(false)
		} else {
			setDateFilter(filter == "today" ? filter : "")
			setSelectedOption(option);
			setSelectedTab(tab)
			setIsPersonasDentro(true)
		}
	};

	const handleTabChangeE = (newTab: any) => {
		setSelectedTab(newTab);
	};

	const Filter = () => {
		if (date1 && date2) {
			const f1 = dateToString(new Date(date1))
			const f2 = dateToString(new Date(date2))
			setDates([f1, f2])
		} else {
			toast.error("Escoge un rango de fechas.")
		}
	};
	const printPase = async (paseId: string) => {
		console.log("Imprimiendo pase ID:", paseId);

		Swal.fire({
			title: 'Preparando documento',
			html: 'Cargando PDF para imprimir...',
			allowOutsideClick: false,
			allowEscapeKey: false,
			didOpen: () => {
				Swal.showLoading();
			}
		});

		try {
			const result = await getPdf(userParentId, paseId);

			const data = result?.response?.data;

			if (!data || data.status_code !== 200) {
				const errorMsg = data?.json?.error || "Error desconocido del servidor";

				toast.error(`Error del servidor: ${errorMsg}`, {
					style: {
						backgroundColor: "#f44336",
						color: "#fff",
					},
				});
				Swal.close();
				return;
			}

			const downloadUrl = data?.json?.download_url || data?.data?.download_url;

			if (downloadUrl) {
				imprimirYDescargarPDF(downloadUrl);
				Swal.close();
			} else {
				toast.warning("No se encontró URL de descarga");
				Swal.close();
			}
		} catch (err) {
			console.error("Error al obtener PDF:", err);
			toast.error(`Error inesperado: ${err}`, {
				style: {
					backgroundColor: "#f44336",
					color: "#fff",
				},
			});
			Swal.close();
		}
	};
	return (
		<div className="">
			<div className="p-6 space-y-1 pt-3 w-full mx-auto ">

				<div className="flex justify-between">
					<div>
						<PageTitle title="Registro De Entradas y Salidas" />
					</div>
					<div className="flex items-center gap-5">
						<div>
							<ChangeLocation
								ubicacionSeleccionada={ubicacionSeleccionada}
								areaSeleccionada={areaSeleccionada}
								setUbicacionSeleccionada={setUbicacionSeleccionada}
								setAreaSeleccionada={setAreaSeleccionada}
							/>
						</div>

						<div className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition duration-100 ${dateFilter == "today" && selectedTab === 'Personal' && selectedOption[0] == "entrada" ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
							onClick={() => { handleTabChange("Personal", ["entrada"], "today"); }}>
							<div className="flex gap-6">
								<Sun className="text-primary w-10 h-10" />
								<span className="flex items-center font-bold text-4xl">
									{stats?.visitas_en_dia}
								</span>
							</div>
							<div className="flex items-center space-x-0">
								<div className="h-1 w-1/2 bg-cyan-100"></div>
								<div className="h-1 w-1/2 bg-blue-500"></div>
							</div>
							<span className="text-md">Visitas En El Día</span>
						</div>

						<div className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition duration-100 ${selectedOption[0] === 'entrada' && selectedTab === 'Personal' && dateFilter == "" ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => { handleTabChange("Personal", ["entrada"], ""); }}>
							<div className="flex gap-6">
								<UsersRound className="text-primary w-10 h-10" />
								<span className="flex items-center font-bold text-4xl">
									{stats?.personas_dentro}
								</span>
							</div>
							<div className="flex items-center space-x-0">
								<div className="h-1 w-1/2 bg-cyan-100"></div>
								<div className="h-1 w-1/2 bg-blue-500"></div>
							</div>
							<span className="text-md">Personas Dentro</span>
						</div>

						<div className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition duration-100 ${selectedTab === 'Vehiculos' && selectedOption[0] == "entrada" && dateFilter == "" ? 'bg-blue-100' : 'hover:bg-gray-100'
							}`}
							onClick={() => handleTabChange("Vehiculos", ["entrada"], "")}>
							<div className="flex gap-6">
								<CarFront className="text-primary w-10 h-10" />
								<span className="flex items-center font-bold text-4xl">
									{stats?.total_vehiculos_dentro}
								</span>
							</div>
							<div className="flex items-center space-x-0">
								<div className="h-1 w-1/2 bg-cyan-100"></div>
								<div className="h-1 w-1/2 bg-blue-500"></div>
							</div>
							<span className="text-md">Vehículos Dentro</span>
						</div>

						<div className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition duration-100 ${selectedTab === 'Equipos' && dateFilter == "" ? 'bg-blue-100' : 'hover:bg-gray-100'
							}`}
							onClick={() => handleTabChange("Equipos", ["entrada"])} >
							<div className="flex gap-6">
								<Wrench className="text-primary w-10 h-10" />
								<span className="flex items-center font-bold text-4xl">
									{stats?.total_equipos_dentro}
								</span>
							</div>
							<div className="flex items-center space-x-0">
								<div className="h-1 w-1/2 bg-cyan-100"></div>
								<div className="h-1 w-1/2 bg-blue-500"></div>
							</div>
							<span className="text-md">Equipos Dentro</span>
						</div>

						<div className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition duration-100 ${selectedOption[0] === 'salida' && dateFilter == "today" ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleTabChange("Personal", ["salida"], "today")}>
							<div className="flex gap-6">
								<DoorOpen className="text-primary w-10 h-10" />
								<span className="flex items-center font-bold text-4xl">
									{stats?.salidas_registradas}
								</span>
							</div>
							<div className="flex items-center space-x-0">
								<div className="h-1 w-1/2 bg-cyan-100"></div>
								<div className="h-1 w-1/2 bg-blue-500"></div>
							</div>
							<span className="text-md">Salidas Del Día</span>
						</div>
					</div>
				</div>

				<Tabs defaultValue="Personal" className="w-full" value={selectedTab} onValueChange={handleTabChangeE}>
					<TabsContent value="Personal">
						<div className="">
							<BitacorasTable data={listBitacoras} isLoading={isLoadingListBitacoras}
								date1={date1} date2={date2} setDate1={setDate1} setDate2={setDate2} dateFilter={dateFilter} setDateFilter={setDateFilter} Filter={Filter}
								isPersonasDentro={isPersonasDentro} ubicacionSeleccionada={ubicacionSeleccionada}
								printPase={printPase} setPaseIdSeleccionado={setPaseIdSeleccionado}
								personasDentro={stats?.personas_dentro}
								refreshData={refreshData}
							/>
						</div>
					</TabsContent>

					<TabsContent value="Vehiculos">
						<div className="">
							<VehiculosTable data={vehiculosData} isLoading={isLoadingListBitacoras}
								date1={date1} date2={date2} setDate1={setDate1} setDate2={setDate2} dateFilter={dateFilter} setDateFilter={setDateFilter} Filter={Filter}
							/>
						</div>
					</TabsContent>

					<TabsContent value="Equipos">
						<div className="">
							<EquiposTable data={equiposData} isLoading={isLoadingListBitacoras}
								date1={date1} date2={date2} setDate1={setDate1} setDate2={setDate2} dateFilter={dateFilter} setDateFilter={setDateFilter} Filter={Filter}
							/>
						</div>
					</TabsContent>

					<TabsContent value="Locker">
						<div className="">
							<LockerTable />
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default BitacorasPage;
