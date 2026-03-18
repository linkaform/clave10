/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import CalendarDays from "../calendar-days";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CalendarClock, Layers, Loader2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { GeneratedPassModal } from "./generated-pass-modal";
import { Access_pass, Areas, Comentarios, enviar_pre_sms, Link } from "@/hooks/useCreateAccessPass";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { usePaseEntrada } from "@/hooks/usePaseEntrada";
import useAuthStore from "@/store/useAuthStore";
import { Badge } from "../ui/badge";
import { capitalizeFirstLetter } from "@/lib/utils";


export type Visita={
  puesto: string;
  nombre: string;
  user_id: string;
  email: string;
  departamento:string;
}
interface EntryPassUpdateModalProps {
  title: string;
  dataPass: {
	selected_visita_a?: string,
    nombre: string;
	empresa:string;
    email: string;
    telefono: string;
    ubicacion: string;
	ubicaciones:string[];
    tema_cita: string;
    descripcion: string;
    perfil_pase: string,
    status_pase:string,
    visita_a: string,
    custom: boolean,
    link:Link,
    enviar_correo_pre_registro: string[],
    tipo_visita_pase:string;
    fechaFija:string;
    fecha_desde_visita: string;
    fecha_desde_hasta: string;
    config_dia_de_acceso:string;
    config_dias_acceso: string[];
    config_limitar_acceso: number;
    areas: Areas[];
    comentarios: Comentarios[];
    enviar_pre_sms: enviar_pre_sms;
	todas_las_areas:boolean;
  };
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: ()=> void;
  from:string
}

export const EntryPassModal: React.FC<EntryPassUpdateModalProps> = ({
  title,
  dataPass,
  isSuccess,
  setIsSuccess,
  onClose,
  from
}) => {
  const items =
  dataPass?.tipo_visita_pase === "fecha_fija"
      ? [
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha y Hora de Visita",
            date: dataPass?.fecha_desde_visita,
          },
        ]
      : [
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha Inicio",
            date: dataPass?.fecha_desde_visita,
          },
          {
            icon: <CalendarClock className="w-6 h-6 text-gray-500" />,
            title: "Fecha Hasta",
            date: dataPass?.fecha_desde_hasta,
          },
        ];

  const [sendData, setSendData] = useState<Access_pass|null>(null)
  const [sendPreSms, setSendPreSms] = useState<enviar_pre_sms|null>(null)
  const {userIdSoter, userParentId}= useAuthStore()
  const { createPaseEntradaMutation , responseCreatePase, isLoading} = usePaseEntrada([])
  const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
  const [link, setLink] = useState("");
  const[ account_id, setAccount_id] = useState<number|null>(null)
  console.log(account_id)
  const [hostPro, setHostPro] = useState({ protocol: '', host: '' });

  const onSubmit = async () => {
    const accessPassData: Access_pass = {
		created_from:"web",
	selected_visita_a: dataPass.selected_visita_a,
      nombre: dataPass.nombre,
	  empresa: dataPass.empresa||"",
      email: dataPass.email,
      telefono: dataPass.telefono,
      ubicacion: dataPass.ubicacion,
	  ubicaciones: dataPass.ubicaciones,
      tema_cita: dataPass.tema_cita,
      descripcion: dataPass.descripcion,
      perfil_pase: dataPass.perfil_pase,
      status_pase: dataPass.status_pase,
      visita_a: dataPass.visita_a,
      custom: dataPass.custom,
      link: {
        link: dataPass.link.link,
        docs: dataPass.link.docs,
        creado_por_id: dataPass.link.creado_por_id,
        creado_por_email: dataPass.link.creado_por_email,
      },
      enviar_correo_pre_registro: dataPass.enviar_correo_pre_registro,
      tipo_visita_pase: dataPass.tipo_visita_pase,
      fechaFija: dataPass.fechaFija,
      fecha_desde_visita: dataPass.fecha_desde_visita,
      fecha_desde_hasta: dataPass.fecha_desde_hasta,
      config_dia_de_acceso: dataPass.config_dia_de_acceso,
      config_dias_acceso: dataPass.config_dias_acceso,
      config_limitar_acceso: dataPass.config_limitar_acceso,
      areas: dataPass.areas,
      comentarios: dataPass.comentarios,
      enviar_pre_sms: {
        from: dataPass.enviar_pre_sms.from,
        mensaje: dataPass.enviar_pre_sms.mensaje,
        numero: dataPass.enviar_pre_sms.numero,
      },
	  todas_las_areas:dataPass.todas_las_areas
    };
    const enviarPreSms : enviar_pre_sms= {
      from: dataPass.enviar_pre_sms.from,
      mensaje: dataPass.enviar_pre_sms.mensaje,
      numero: dataPass.enviar_pre_sms.numero,
    };
    setSendPreSms(enviarPreSms)
    setSendData(accessPassData)
  };

	useEffect(() => {
		if (typeof window !== "undefined") {
		  const protocol = window.location.protocol;
		  const host = window.location.host;
		  setHostPro({ protocol, host });
		  setAccount_id(userIdSoter);
		}
	  }, []);

  useEffect(()=>{
    if(sendPreSms && sendData ){
      createPaseEntradaMutation.mutate({ access_pass:sendData, location:dataPass?.ubicacion??"", enviar_pre_sms: sendPreSms })
    }
  },[ sendData, sendPreSms])


  useEffect(()=>{
    if(responseCreatePase?.status_code == 201){
    }
      let docs=""
      sendData?.link.docs.map((d, index)=>{
        if(d == "agregarIdentificacion"){
          docs+="iden"
        }
        else if(d == "agregarFoto"){
          docs+="foto"
        }
        if (index==0){
          docs+="-"
        }
      })
      setLink(`${hostPro.protocol}//${hostPro.host}/dashboard/pase-update?id=${responseCreatePase?.json.id}&user=${userParentId}&docs=${docs}`)
      setOpenGeneratedPass(true)
  },[responseCreatePase])

  const handleClose = () => {
    setIsSuccess(false); 
    onClose(); 
};

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal >
		<DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col p-0 border-none rounded-3xl" aria-describedby="" onInteractOutside={(e) => e.preventDefault()}>
			<div className="bg-blue-600 p-6 text-white text-center flex-shrink-0">
				<DialogTitle className="text-xl font-bold tracking-tight uppercase">
					{title}
				</DialogTitle>
				<p className="text-xs text-blue-100 mt-1 opacity-80 uppercase tracking-widest">Confirma los detalles del pase</p>
			</div>

			<div className="flex-grow overflow-y-auto px-8 py-6 space-y-6 bg-gray-50/50">

				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<UserRound size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Datos Personales</span>
					</div>
					
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-1">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Nombre Completo</p>
							<p className="text-lg font-bold text-gray-800">{dataPass?.nombre}</p>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
								<p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.email}</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</p>
								<p className="text-sm font-semibold text-gray-600">{dataPass?.telefono}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Empresa</p>
								<p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.empresa || "N/A"}</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] font-bold text-gray-400 uppercase">Estatus</p>
								<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black px-2 py-0">
									{capitalizeFirstLetter(dataPass?.status_pase ??"")}
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<ShieldCheck size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalles de Visita</span>
					</div>
					
					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Tema de la cita</p>
							<p className="text-sm text-gray-700 font-medium">{dataPass?.tema_cita}</p>
						</div>
						<div className="space-y-1 pt-2 border-t border-gray-50">
							<p className="text-[10px] font-bold text-gray-400 uppercase">Descripción</p>
							<p className="text-sm text-gray-700 break-words">{dataPass?.descripcion}</p>
						</div>
					</div>
				</div>

				{/* Vigencia */}
				<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<div className="bg-blue-50 p-1.5 rounded-lg">
							<CalendarClock size={16} className="text-blue-600" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vigencia y Accesos</span>
					</div>

					<div className="grid grid-cols-2 gap-4 mb-4">
						{items.map((item, index) => (
							<div key={index} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
								<p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{item?.title}</p>
								<p className="text-xs font-bold text-gray-800 tabular-nums">
									{item?.date?.replace("T", " ").slice(0, 16)} hrs
								</p>
							</div>
						))}
					</div>

					{dataPass?.config_limitar_acceso > 0 && (
						<div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
							<p className="text-xs font-bold text-blue-800 uppercase tracking-tight">Límite de accesos</p>
							<Badge className="bg-blue-600 text-white font-bold">{dataPass?.config_limitar_acceso}</Badge>
						</div>
					)}
				</div>

				{dataPass?.config_dias_acceso.length > 0 && (
					<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
						<CalendarDays diasDisponibles={dataPass?.config_dias_acceso}/>
					</div>
				)}

				{(dataPass?.areas.length > 0 || dataPass?.comentarios.length > 0) && (
					<div className="space-y-3">
						{dataPass?.areas.length > 0 && (
							<Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
								<AccordionItem value="areas" className="border-none">
									<AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
										<div className="flex items-center gap-3">
											<Layers size={14} className="text-blue-600" />
											Áreas Autorizadas ({dataPass.areas.length})
										</div>
									</AccordionTrigger>
									<AccordionContent className="px-5 pb-4">
										<div className="space-y-2">
											{dataPass?.areas.map((area, index) => (
												<div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
													<p className="text-xs font-bold text-gray-800 mb-1">{area.nombre_area}</p>
													<p className="text-[11px] text-gray-500 italic">{area.commentario_area || "Sin comentarios"}</p>
												</div>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}

						{dataPass?.comentarios.length > 0 && (
							<Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
								<AccordionItem value="comments" className="border-none">
									<AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
										<div className="flex items-center gap-3">
											<MessageSquare size={14} className="text-blue-600" />
											Instrucciones de Pase ({dataPass.comentarios.length})
										</div>
									</AccordionTrigger>
									<AccordionContent className="px-5 pb-4">
										<div className="space-y-2">
											{dataPass?.comentarios.map((com, index) => (
												<div key={index} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
													<p className="text-[11px] text-gray-700 font-medium leading-relaxed italic">&quot;{com.comentario_pase}&quot;</p>
												</div>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}
					</div>
				)}
			</div>

			<div className="p-6 bg-white border-t border-gray-100 flex gap-4 flex-shrink-0">
				<DialogClose asChild disabled={isLoading}>
					<Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest border-none h-auto" onClick={handleClose}>
						Cancelar
					</Button>
				</DialogClose>

				<Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-100" onClick={onSubmit} disabled={isLoading}>
					{!isLoading ? ("Crear pase") : (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando... </>)}
				</Button>

				{responseCreatePase?.status_code == 201 && (
					<GeneratedPassModal
						title="Pase de Entrada Generado"
						description="El pase de entrada se ha generado correctamente."
						link={link}
						openGeneratedPass={openGeneratedPass}
						setOpenGeneratedPass={setOpenGeneratedPass} 
						from={from}
					/>
				)}
			</div>
      	</DialogContent>
    </Dialog>
  );
};
