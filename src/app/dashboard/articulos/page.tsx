/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { Archive, CircleHelp, Package } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import PageTitle from "@/components/page-title";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import ArticulosPerdidosTable from "@/components/table/articulos/pendientes/table";
import { AddArticuloModal } from "@/components/modals/add-article-lost";
import ArticulosConTable from "@/components/table/articulos/concecionados/table";
import { useArticulosConcesionados } from "@/hooks/useArticulosConcesionados";
import PaqueteriaTable from "@/components/table/articulos/paqueteria/table";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import { useShiftStore } from "@/store/useShiftStore";
import { AddPaqueteriaModal } from "@/components/modals/add-paqueteria";
import { dateToString } from "@/lib/utils";
import { toast } from "sonner";
import ChangeLocation from "@/components/changeLocation";
import { useGetStats } from "@/hooks/useGetStats";
import { useBoothStore } from "@/store/useBoothStore";
import { AddArticuloConModal } from "@/components/modals/add-article.con";

const ArticulosPage = () => {

	const {location} = useBoothStore()

	const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location  || "Planta Monterrey");
	const [areaSeleccionada, setAreaSeleccionada] = useState("todas")

	const [date1, setDate1] = useState<Date|"">("")
	const [date2, setDate2] = useState<Date|"">("")
	const [dates, setDates] = useState<string[]>([])
	const [dateFilter, setDateFilter] = useState<string>("")	
	const [status, setStatus] = useState<string>("")

	const { data: stats } = useGetStats(
		true,
		ubicacionSeleccionada,
		areaSeleccionada == "todas" ? "" : areaSeleccionada,
		'Articulos'
	)

	const { listArticulosPerdidos, isLoadingListArticulosPerdidos } =
		useArticulosPerdidos(
			ubicacionSeleccionada,
			areaSeleccionada == "todas" ? "" : areaSeleccionada,
			"",
			true,
			dates[0],
			dates[1],
			dateFilter
		);

	const { listArticulosCon, isLoadingListArticulosCon } =
		useArticulosConcesionados(
			ubicacionSeleccionada,
			areaSeleccionada == "todas" ? "" : areaSeleccionada,
			status,
			true,
			dates[0],
			dates[1],
			dateFilter
		);

	const { listPaqueteria, isLoadingListPaqueteria } =
		usePaqueteria(
			ubicacionSeleccionada,
			areaSeleccionada == "todas" ? "" : areaSeleccionada,
			"",
			true,
			dates[0],
			dates[1],
			dateFilter
		);

	const { tab, setTab } = useShiftStore()

	const [selectedTab, setSelectedTab] = useState<string>(tab ? tab:'Paqueteria'); 

	const [isSuccess, setIsSuccess] = useState(false);
	const [isSuccessCon, setIsSuccessCon] = useState(false);
	const [isSuccessPaq, setIsSuccessPaq] = useState(false);

	const [modalData] = useState<any>(null);
	const [selectedArticulos, setSelectedArticulos]= useState<string[]>([]);
		console.log(selectedArticulos)
	useEffect(()=>{
		if(tab){
			setTab("")
		}
	},[])

	useEffect(()=>{
		setUbicacionSeleccionada(location || "Planta Monterrey")
		setAreaSeleccionada("todas")
	},[])

	const openModal = () => setIsSuccess(true);
	const closeModal = () => setIsSuccess(false);

	const openModalCon = () => setIsSuccessCon(true);

	const openModalPaq = () => setIsSuccessPaq(true);
	const closeModalPaq = () => setIsSuccessPaq(false);

	const Filter = () => {

		if(date1 && date2){

			const f1= dateToString(new Date(date1)) 
			const f2= dateToString(new Date(date2)) 

			setDates([f1,f2])

		}else{

			toast.error("Escoge un rango de fechas.")

		}

	};

	const handleTabChangeTab = (newTab: any) => {

		setSelectedTab(newTab);

	};

	const resetTableFilters = ()=>{

		setDate1("")
		setDate2("")
		setDateFilter("")
		setStatus("")

	};

	const handleTabChange = (tab:string, option:string, estado:string) => {

		setDateFilter(option)
		setStatus(estado)
		setSelectedTab(tab)

	};

	return (

	<div>

		<div className="p-6 space-y-1 pt-3 w-full mx-auto">

			<div className="flex justify-between">

				<div>
				<PageTitle title="Registro y Seguimiento de Artículos" />
				</div>

				<div className="flex items-center gap-5">
				<div className="w-1/2">
					<ChangeLocation
				ubicacionSeleccionada={ubicacionSeleccionada}
				areaSeleccionada={areaSeleccionada}
				setUbicacionSeleccionada={setUbicacionSeleccionada}
				setAreaSeleccionada={setAreaSeleccionada}
				/>

				</div>
				
				{selectedTab === "Concecionados" ? (

				<>

				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				status === "abierto" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Concecionados","", "abierto")}
				>
						<div className="flex gap-6">
							<Archive className="text-primary w-10 h-10"/>
							<span className="flex items-center font-bold text-4xl">
							{stats?.articulos_abiertos||0}
							</span>
						</div>
						<div className="flex items-center">
							<div className="h-1 w-1/2 bg-cyan-100"/>
							<div className="h-1 w-1/2 bg-blue-500"/>
						</div>
						<span className="text-md">Artículos Abiertos</span>
				</div>


				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				status === "parcial" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Concecionados","", "parcial")}
				>
					<div className="flex gap-6">
						<Archive className="text-primary w-10 h-10"/>
						<span className="flex items-center font-bold text-4xl">
						{stats?.articulos_parciales||0}
						</span>
					</div>

					<div className="flex items-center">
						<div className="h-1 w-1/2 bg-cyan-100"/>
						<div className="h-1 w-1/2 bg-blue-500"/>
					</div>
				<span className="text-md">Artículos Parciales</span>
				</div>


				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				status === "devuelto" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Concecionados","", "devuelto")}
				>

					<div className="flex gap-6">
					<Archive className="text-primary w-10 h-10"/>
					<span className="flex items-center font-bold text-4xl">
					{stats?.articulos_devueltos||0}
					</span>
					</div>

					<div className="flex items-center">
					<div className="h-1 w-1/2 bg-cyan-100"/>
					<div className="h-1 w-1/2 bg-blue-500"/>
					</div>

					<span className="text-md">Artículos Devueltos</span>
				</div>
				</>

				) : (

				<>

				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				selectedTab == "Paqueteria" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Paqueteria","today","")}
				>
					<div className="flex gap-6">
						<Package className="text-primary w-10 h-10"/>
						<span className="flex items-center font-bold text-4xl">
						{stats?.paquetes_recibidos}
						</span>
					</div>

					<div className="flex items-center">
						<div className="h-1 w-1/2 bg-cyan-100"/>
						<div className="h-1 w-1/2 bg-blue-500"/>
					</div>

				<span className="text-md">Paquetería</span>

				</div>


				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				selectedTab=="Concecionados" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Concecionados","","")}
				>

					<div className="flex gap-6">
						<Archive className="text-primary w-10 h-10"/>
						<span className="flex items-center font-bold text-4xl">
						{stats?.articulos_concesionados_pendientes}
						</span>
					</div>

					<div className="flex items-center">
						<div className="h-1 w-1/2 bg-cyan-100"/>
						<div className="h-1 w-1/2 bg-blue-500"/>
					</div>

				<span className="text-md">Artículos Concesionados</span>

				</div>


				<div
				className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
				selectedTab=="Perdidos" ? "bg-blue-100" : "hover:bg-gray-100"
				}`}
				onClick={() => handleTabChange("Perdidos","","")}
				>

					<div className="flex gap-6">
						<CircleHelp className="text-primary w-10 h-10"/>
						<span className="flex items-center font-bold text-4xl">
						{stats?.articulos_perdidos}
						</span>
					</div>

					<div className="flex items-center">
						<div className="h-1 w-1/2 bg-cyan-100"/>
						<div className="h-1 w-1/2 bg-blue-500"/>
					</div>

				<span className="text-md">Artículos Perdidos</span>

				</div>

				</>

				)}

				</div>

			</div>

		<Tabs value={selectedTab} onValueChange={handleTabChangeTab}>

		<TabsContent value="Paqueteria">

		<PaqueteriaTable
		data={listPaqueteria}
		isLoadingListPaqueteria={isLoadingListPaqueteria}
		openModal={openModalPaq}
		setSelectedArticulos={setSelectedArticulos}
		date1={date1}
		date2={date2}
		setDate1={setDate1}
		setDate2={setDate2}
		dateFilter={dateFilter}
		setDateFilter={setDateFilter}
		Filter={Filter}
		resetTableFilters={resetTableFilters}
		/>

		</TabsContent>


		<TabsContent value="Concecionados">

		<ArticulosConTable
		data={listArticulosCon}
		isLoadingListArticulosCon={isLoadingListArticulosCon}
		openModal={openModalCon}
		setSelectedArticulos={setSelectedArticulos}
		date1={date1}
		date2={date2}
		setDate1={setDate1}
		setDate2={setDate2}
		dateFilter={dateFilter}
		setDateFilter={setDateFilter}
		Filter={Filter}
		resetTableFilters={resetTableFilters}
		/>

		</TabsContent>


		<TabsContent value="Perdidos">

		<ArticulosPerdidosTable
		data={listArticulosPerdidos}
		isLoadingListArticulosPerdidos={isLoadingListArticulosPerdidos}
		openModal={openModal}
		setSelectedArticulos={setSelectedArticulos}
		date1={date1}
		date2={date2}
		setDate1={setDate1}
		setDate2={setDate2}
		dateFilter={dateFilter}
		setDateFilter={setDateFilter}
		Filter={Filter}
		resetTableFilters={resetTableFilters}
		/>

		</TabsContent>

		</Tabs>

		<AddArticuloModal
		title={"Crear Artículo Perdido"}
		data={modalData}
		isSuccess={isSuccess}
		setIsSuccess={setIsSuccess}
		onClose={closeModal}
		/>

		<AddArticuloConModal
			isSuccess={isSuccessCon}
			setIsSuccess={setIsSuccessCon}
			initialData={{}}>
			<div></div>
		</AddArticuloConModal>

		<AddPaqueteriaModal
		title={"Crear Paquetería"}
		isSuccess={isSuccessPaq}
		setIsSuccess={setIsSuccessPaq}
		onClose={closeModalPaq}
		/>

		</div>

	</div>

	);

};

export default ArticulosPage;