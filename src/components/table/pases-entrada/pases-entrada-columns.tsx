/* eslint-disable @typescript-eslint/no-explicit-any */
import { ViewPassModal } from "@/components/modals/view-pass-modal";
import { Areas, Comentarios, enviar_pre_sms, Link } from "@/hooks/useCreateAccessPass";
import { replaceNullsInArrayDynamic } from "@/lib/utils";
import { Edit, Eye} from "lucide-react";

type Imagen = {
  file_name: string;
  file_url: string;
};

export interface PaseEntrada {
  _id: string;
  folio: string;
  nombre: string;
  email:string;
  telefono: string;
  ubicacion:string[];
  tema_cita:string;
  descripcion:string;
  perfil_pase:string;
  status_pase:string;
  visita_a: unknown;
  custom:boolean;
  link: Link;
  qr_pase: string[];
  limitado_a_dias : string[]; 
  foto: Imagen[];
  identificacion: Imagen[];
  enviar_correo_pre_registro: string[];
  tipo_visita_pase:string;
  fechaFija:string;
  fecha_desde_visita:string;
  fecha_desde_hasta:string;
  config_dia_de_acceso: string;
  config_dias_acceso: string;
  config_limitar_acceso:string;
  motivo_visita: string;
  estatus:string;
  areas:Areas[]
  comentarios:Comentarios[]
  enviar_pre_sms:enviar_pre_sms[]
  grupo_vehiculos: string[];  
  grupo_equipos: string[]; 
  total_entradas?: number;
  limite_de_acceso?: number;
   pdf_to_img: Imagen[];
}

export const OptionsCell: React.FC<{ row: any,onEditarClick: (pase: any) => void }> = ({ row, onEditarClick }) => {
  const rowData = row.original;
  const dataFull= {
    _id:rowData._id,
    folio:rowData.folio,
    nombre: rowData.nombre,
    email: rowData.email,
    empresa:rowData.empresa,
    telefono: rowData.telefono,
    ubicacion: rowData.ubicacion,
    tema_cita: rowData.tema_cita,
    descripcion: rowData.descripcion,
    perfil_pase: rowData.tipo_de_pase,
    status_pase: rowData.estatus,
    visita_a: rowData.visita_a||[],
    custom: false,
    link: {
      link: rowData.link,
      docs: rowData.docs,
      creado_por_id: rowData.visita_a.lenght>0 ? rowData.visita_a[0].user_id:null,
      creado_por_email:rowData.visita_a.lenght>0  ? rowData.visita_a[0].email:null
    },
    qr_pase	:rowData.qr_pase,
    limitado_a_dias	: rowData.limitado_a_dias	,
    foto:rowData.foto || [],
    identificacion:rowData.identificacion || [],
    enviar_correo_pre_registro: rowData.enviar_correo_pre_registro||[],
    tipo_visita_pase: rowData.tipo_fechas_pase,
    fechaFija: rowData.fechaFija || rowData.fecha_desde_visita,
    fecha_desde_visita: rowData.fecha_desde_visita,
    fecha_desde_hasta: rowData.fecha_desde_hasta,
    config_dia_de_acceso: rowData.config_dia_de_acceso,
    config_dias_acceso: rowData.limitado_a_dias,
    config_limitar_acceso: rowData.limite_de_acceso,
    areas: replaceNullsInArrayDynamic(rowData.grupo_areas_acceso),
    comentarios: rowData.comentarios||[],
    enviar_pre_sms: {
      from: rowData.from || "",
      mensaje: rowData.mensaje || "",
      numero: rowData.numero || "",
    },
    grupo_equipos: rowData.grupo_equipos||[],
    grupo_vehiculos: rowData.grupo_vehiculos||[],
    pdf_to_img: rowData.pdf_to_img || [],
  }
  return (
    <div className="flex space-x-2">
      <ViewPassModal 
        title="Pase De Entrada"
        data={dataFull} 
        isSuccess={false} 
        >
          <div className="cursor-pointer">
            <Eye /> 
          </div>
      </ViewPassModal>
      
        <div
          className="cursor-pointer"
          onClick={() => onEditarClick(dataFull)}
          title="Editar Pase"
        >
          <Edit />
        </div>

    </div>
  );
};

