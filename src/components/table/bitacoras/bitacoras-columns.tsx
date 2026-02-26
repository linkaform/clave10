import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo";
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule";
import { ViewListBitacoraModal } from "@/components/modals/view-bitacora";
import { Badge } from "@/components/ui/badge";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { capitalizeFirstLetter } from "@/lib/utils";
import {
	ColumnDef,
} from "@tanstack/react-table";
import { Car, Eye, Forward, Hammer, IdCard, Printer } from "lucide-react";
import { useState } from "react";

export interface Bitacora_record {
	equipos: Equipo_bitacora[]
	file_name: string
	fecha_entrada: string
	caseta_salida: string
	caseta_entrada: string
	nombre_area_salida: string
	updated_at: string
	motivo_visita: string
	folio: string
	contratista: unknown[]
	fotografia: { file_url: string, file_name: string }[]
	identificacion: { file_url: string, file_name: string }[]
	id_locker: string
	id_gafet: string
	ubicacion: string
	perfil_visita: string
	documento: string
	nombre_visitante: string
	visita_a: VisitaA[]
	vehiculos: Vehiculo_bitacora[]
	codigo_qr: string
	status_visita: string
	created_at: string
	file_url: string
	grupo_areas_acceso: Areas_bitacora[]
	fecha_salida: string
	status_gafete: string
	_id: string
	comentarios: Comentarios_bitacoras[]
	formated_comentarios?: string
	formated_visita?: string
	pase_id: string
}

export type Comentarios_bitacoras = {
	tipo_comentario: string;
	comentario: string;
}

export interface Equipo_bitacora {
	color_articulo: string
	numero_serie: string
	modelo_articulo: string
	marca_articulo: string
	tipo_equipo: string
	nombre_articulo: string
}

export interface VisitaA {
	posicion: string
	nombre: string
	user_id: number
	email: string
	departamento: string
}

export interface Vehiculo_bitacora {
	tipo: string
	modelo_vehiculo: string
	color: string
	placas: string
	marca_vehiculo: string
	nombre_estado: string
}
export interface Areas_bitacora {
	note_booth: string
	commentario_area: string
}

const OptionsCell: React.FC<{
	row: any, onReturnGafete: (bitacora: Bitacora_record) => void,
	onAddBadgeClick: (bitacora: Bitacora_record) => void, onDoOutClick: (bitacora: Bitacora_record) => void,
	onPrintPaseFn: (id: string) => void
}> =
	({ row, onReturnGafete, onAddBadgeClick, onDoOutClick, onPrintPaseFn }) => {
		const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
		const [equipos, setEquipos] = useState<Equipo[]>([]);

		if (!row?.original) return null;
		const bitacora = row.original;
		bitacora.formated_visita = Array.isArray(bitacora.visita_a)
			? bitacora.visita_a.map((item: VisitaA) => item.nombre).join(', ')
			: '';

		bitacora.formated_comentarios = Array.isArray(bitacora.comentarios)
			? bitacora.comentarios.map((item: Comentarios_bitacoras) => item.comentario).join(', ')
			: '';

		const isSalida = bitacora.status_visita?.toLowerCase() === "salida";
		const isEntrada = bitacora.status_visita?.toLowerCase() === "entrada";
		const isAsignado = bitacora.status_gafete?.toLowerCase() === "asignado";

		const iconClass = (disabled: boolean) =>
			`p-1 rounded transition-colors ${disabled ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-300 text-black hover:text-blue-600'}`;

		return (
			<div className="flex space-x-0.5 items-center">
				<ViewListBitacoraModal title="Información de visita" data={bitacora}>
					<div className={iconClass(false)} title="Ver Bitacora">
						<Eye className="w-5 h-5" />
					</div>
				</ViewListBitacoraModal>

				{isSalida ? (
					<div className={iconClass(true)} title="Agregar vehículo (No disponible)">
						<Car className="w-5 h-5" />
					</div>
				) : (
					<VehicleLocalPassModal title="Agregar vehículo" vehicles={vehiculos} setVehiculos={setVehiculos} isAccesos={false} id={bitacora._id} fetch={true}>
						<div className={iconClass(false)} title="Agregar vehículo">
							<Car className="w-5 h-5" />
						</div>
					</VehicleLocalPassModal>
				)}

				{isSalida ? (
					<div className={iconClass(true)} title="Agregar equipo (No disponible)">
						<Hammer className="w-5 h-5" />
					</div>
				) : (
					<EqipmentLocalPassModal title="Agregar equipo" id={bitacora._id} equipos={equipos} setEquipos={setEquipos} isAccesos={false}>
						<div className={iconClass(false)} title="Agregar equipo">
							<Hammer className="w-5 h-5" />
						</div>
					</EqipmentLocalPassModal>
				)}

				{isEntrada && isAsignado ? (
					<div className={iconClass(false)} title="Regresar gafete" onClick={() => onReturnGafete(bitacora)}>
						<IdCard className="w-5 h-5 text-rose-500" />
					</div>
				) : (
					!isSalida ? (
						<div className={iconClass(false)} title="Agregar gafete" onClick={() => onAddBadgeClick(bitacora)}>
							<IdCard className="w-5 h-5" />
						</div>
					) : (
						<div className={iconClass(true)} title="Gafete (No disponible)">
							<IdCard className="w-5 h-5" />
						</div>
					)
				)}

				{isSalida ? (
					<div className={iconClass(true)} title="Imprimir Pase (No disponible)">
						<Printer className="w-5 h-5" />
					</div>
				) : (
					<div className={iconClass(false)} title="Imprimir Pase" onClick={() => onPrintPaseFn(bitacora.pase_id)}>
						<Printer className="w-5 h-5" />
					</div>
				)}

				{!bitacora?.fecha_salida ? (
					<div className={iconClass(false)} title="Registrar salida" onClick={() => onDoOutClick(bitacora)}>
						<Forward className="w-5 h-5 text-emerald-500" />
					</div>
				) : (
					<div className={iconClass(true)} title="Salida ya registrada">
						<Forward className="w-5 h-5" />
					</div>
				)}
			</div>
		);
	};

export const getBitacorasColumns = (onReturnGafete: (bitacora: Bitacora_record) => void,
	onAddBadgeClick: (bitacora: Bitacora_record) => void, onDoOutClick: (bitacora: Bitacora_record) => void,
	printPaseFn: (id: string) => void): ColumnDef<Bitacora_record>[] => [
		{
			id: "options",
			header: "Opciones",
			cell: ({ row }) => {

				return <OptionsCell row={row} key={row.original._id}
					onReturnGafete={() => { onReturnGafete(row.original) }} onAddBadgeClick={() => { onAddBadgeClick(row.original) }} onDoOutClick={() => {
						onDoOutClick(row.original)
					}} onPrintPaseFn={() => { printPaseFn(row.original.pase_id) }} />;
			},
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "folio",
			header: "Folio",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 whitespace-nowrap">{row.getValue("folio") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "nombre_visitante",
			header: "Visitante",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[120px]">{row.getValue("nombre_visitante") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "status_visita",
			header: "Estatus",
			cell: ({ row }) => {
				const isAbierto = row.getValue("status_visita") === "Entrada";

				return (
					<Badge
						className={`text-white w-full justify-center px-2 py-0.5 min-h-[16px] text-[10px] font-bold tracking-wider border-none shadow-none ${!isAbierto
							? "bg-rose-600 hover:bg-rose-700"
							: "bg-emerald-600 hover:bg-emerald-700"
							}`}
					>
						{capitalizeFirstLetter(row.getValue("status_visita") ?? "")}
					</Badge>
				);
			},
			enableSorting: true,
		},
		{
			accessorKey: "fecha_entrada",
			header: "Entrada",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 leading-tight min-w-[80px]">{row.getValue("fecha_entrada") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "fecha_salida",
			header: "Salida",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 leading-tight min-w-[80px]">{row.getValue("fecha_salida") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "perfil_visita",
			header: "Tipo",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 capitalize leading-tight">{row.getValue("perfil_visita") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "contratista",
			header: "Empresa",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[100px]">{row.getValue("contratista") ?? ""}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "visita_a",
			header: "Visita a",
			cell: ({ row }) => {
				const visita_a = (row.getValue("visita_a") ?? []) as VisitaA[];
				return (
					<div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[100px]">{visita_a.length > 0 ? visita_a[0]?.nombre : ""}</div>
				)
			},
			enableSorting: true,
			enableGlobalFilter: true
		},
		{
			accessorKey: "caseta_entrada",
			header: "Caseta entrada",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[100px]">{row.getValue("caseta_entrada")}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "nombre_area_salida",
			header: "Caseta salida",
			cell: ({ row }) => (
				<div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[100px]">{row.getValue("nombre_area_salida")}</div>
			),
			enableSorting: true,
		},
		{
			accessorKey: "id_gafet",
			header: "Gafete",
			cell: ({ row }) => {
				const statusGafete = row.original?.status_gafete !== "" ? row.original?.status_gafete?.toLowerCase() : "";
				const isEntregado = statusGafete === "entregado";
				const isAsignado = statusGafete === "asignado";
				return (
					<div className="text-xs font-medium whitespace-nowrap">
						<span className={isEntregado ? "text-rose-600" : isAsignado ? "text-emerald-600" : "text-slate-400"}>
							{row.getValue("id_gafet") || "---"}
						</span>
					</div>
				);
			},

		},
		{
			accessorKey: "id_locker",
			header: "Locker",
			cell: ({ row }) => {
				const statusLocker = row.original?.status_gafete !== "" ? row.original?.status_gafete?.toLowerCase() : "";
				const isLockerEntregado = statusLocker === "entregado";
				const isLockerAsignado = statusLocker === "asignado";
				return (
					<div className="text-xs font-medium whitespace-nowrap">
						<span className={isLockerEntregado ? "text-rose-600" : isLockerAsignado ? "text-emerald-600" : "text-slate-400"}>
							{row.getValue("id_locker") || "---"}
						</span>
					</div>
				);
			},
			enableSorting: true,
		},
		{
			accessorKey: "comentarios",
			header: "Comentarios",
			cell: ({ row }) => {
				const comentarios = row.getValue("comentarios") as Comentarios_bitacoras[] ?? []
				return (
					<div className="text-[11px] font-normal text-slate-600 leading-relaxed py-1 max-w-[250px] whitespace-normal">
						{Array.isArray(comentarios) && comentarios.length > 0 ? (
							<ul className="list-disc list-inside space-y-1">
								{comentarios.map((com, idx) => (
									<li key={idx} className="break-words">
										{com?.comentario}
									</li>
								))}
							</ul>
						) : (
							<span className="text-slate-400 italic">---</span>
						)}
					</div>
				);
			},
			enableSorting: true,
		}
	];