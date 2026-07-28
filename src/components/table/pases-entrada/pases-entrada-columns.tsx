/* eslint-disable @typescript-eslint/no-explicit-any */
import { ViewPassModal } from "@/components/modals/view-pass-modal";
import { Areas, Comentarios, enviar_pre_sms, Link } from "@/hooks/useCreateAccessPass";
import { capitalizeFirstLetter, formatTo12Hour, replaceNullsInArrayDynamic } from "@/lib/utils";
import { Edit, Eye, UserRound, UsersRound } from "lucide-react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Imagen = {
  file_name: string;
  file_url: string;
};

export interface PaseEntrada {
  _id: string;
  folio: string;
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string[];
  tema_cita: string;
  descripcion: string;
  perfil_pase: string;
  status_pase: string;
  visita_a: unknown;
  custom: boolean;
  link: Link;
  qr_pase: string[];
  limitado_a_dias: string[];
  foto: Imagen[];
  identificacion: Imagen[];
  enviar_correo_pre_registro: string[];
  tipo_visita_pase: string;
  fechaFija: string;
  fecha_desde_visita: string;
  fecha_desde_hasta: string;
  config_dia_de_acceso: string;
  config_dias_acceso: string;
  config_limitar_acceso: string;
  motivo_visita: string;
  estatus: string;
  areas: Areas[];
  comentarios: Comentarios[];
  enviar_pre_sms: enviar_pre_sms[];
  grupo_vehiculos: string[];
  grupo_equipos: string[];
  total_entradas?: number;
  limite_de_acceso?: number;
  pdf_to_img: Imagen[];
}

// ---------------------------------------------------------------------------
// Helpers de rol (titular / acompañante)
// ---------------------------------------------------------------------------
export const getRolPase = (rowOriginal: any) => {
  const esTitular =
    Array.isArray(rowOriginal?.acompanantes_grupo) &&
    rowOriginal.acompanantes_grupo.length > 0;
  const esAcompanante =
    typeof rowOriginal?.url_padre === "string" &&
    rowOriginal.url_padre.trim() !== "";

  return { esTitular, esAcompanante };
};

// ---------------------------------------------------------------------------
// Celda: Nombre (avatar + nombre + estatus)
// ---------------------------------------------------------------------------
export const NombreCell: React.FC<{ row: Row<any> }> = ({ row }) => {
  const foto = row.original.foto;
  const nombre = row.original.nombre;
  const estatus = row.original.estatus;
  const primeraImagen = foto && foto.length > 0 ? foto[0].file_url : "/nouser.svg";

  return (
    <div className="flex items-center space-x-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={primeraImagen} alt="Avatar" className="object-cover" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        {nombre ? (
          <span className="font-bold leading-tight">{nombre}</span>
        ) : (
          <span className="italic text-gray-400 leading-tight">Sin nombre</span>
        )}
        <Badge
          className={`w-fit text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full font-bold ${
            estatus?.toLowerCase() == "vencido"
              ? "bg-red-600 hover:bg-red-600"
              : estatus?.toLowerCase() == "activo"
                ? "bg-green-600 hover:bg-green-600"
                : estatus?.toLowerCase() == "proceso"
                  ? "bg-blue-600 hover:bg-blue-600"
                  : "bg-gray-400"
          }`}>
          {capitalizeFirstLetter(estatus)}
        </Badge>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Celda: Tipo (Titular / Acompañante) — pill pequeño y elegante
// ---------------------------------------------------------------------------
export const TipoCell: React.FC<{ row: Row<any> }> = ({ row }) => {
  const { esTitular, esAcompanante } = getRolPase(row.original);
  const estatus = (row.original?.estatus || "").toLowerCase();

  if (!esTitular && !esAcompanante) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-400 px-2 py-0.5 text-[10px] font-bold text-white">
        Individual
      </span>
    );
  }

  if (esTitular) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
        <UsersRound className="h-3 w-3" />
        Titular
      </span>
    );
  }

  // Acompañante: color según el estatus del pase
  const colorAcompanante =
    estatus === "activo"
      ? "bg-green-600"
      : estatus === "proceso"
        ? "bg-blue-600"
        : "bg-gray-400";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${colorAcompanante}`}>
      <UserRound className="h-3 w-3" />
      Acompañante
    </span>
  );
};

// ---------------------------------------------------------------------------
// Celda de opciones (ver / editar)
// ---------------------------------------------------------------------------
export const OptionsCell: React.FC<{ row: any; onEditarClick: (pase: any) => void }> = ({
  row,
  onEditarClick,
}) => {
  const rowData = row.original;
  const dataFull = {
    _id: rowData._id,
    folio: rowData.folio,
    nombre: rowData.nombre,
    email: rowData.email,
    empresa: rowData.empresa,
    telefono: rowData.telefono,
    ubicacion: rowData.ubicacion,
    tema_cita: rowData.tema_cita,
    descripcion: rowData.descripcion,
    perfil_pase: rowData.tipo_de_pase,
    status_pase: rowData.estatus,
    visita_a: rowData.visita_a || [],
    custom: false,
    link: {
      link: rowData.link,
      docs: rowData.docs,
      creado_por_id: rowData.visita_a.lenght > 0 ? rowData.visita_a[0].user_id : null,
      creado_por_email: rowData.visita_a.lenght > 0 ? rowData.visita_a[0].email : null,
    },
    qr_pase: rowData.qr_pase,
    limitado_a_dias: rowData.limitado_a_dias,
    foto: rowData.foto || [],
    identificacion: rowData.identificacion || [],
    enviar_correo_pre_registro: rowData.enviar_correo_pre_registro || [],
    tipo_visita_pase: rowData.tipo_fechas_pase,
    fechaFija: rowData.fechaFija || rowData.fecha_desde_visita,
    fecha_desde_visita: rowData.fecha_desde_visita,
    fecha_desde_hasta: rowData.fecha_desde_hasta,
    config_dia_de_acceso: rowData.config_dia_de_acceso,
    config_dias_acceso: rowData.limitado_a_dias,
    config_limitar_acceso: rowData.limite_de_acceso,
    areas: replaceNullsInArrayDynamic(rowData.grupo_areas_acceso),
    comentarios: rowData.comentarios || [],
    enviar_pre_sms: {
      from: rowData.from || "",
      mensaje: rowData.mensaje || "",
      numero: rowData.numero || "",
    },
    grupo_equipos: rowData.grupo_equipos || [],
    grupo_vehiculos: rowData.grupo_vehiculos || [],
    pdf_to_img: rowData.pdf_to_img || [],
    acompanantes: rowData.acompanantes ?? 0,
    acompanantes_grupo: rowData.acompanantes_grupo || [],
    habilitar_vehiculo: rowData.habilitar_vehiculo,
    url_padre: rowData.url_padre || "",
  };
  return (
    <div className="flex space-x-2">
      <ViewPassModal title="Pase De Entrada" data={dataFull} isSuccess={false}>
        <div className="cursor-pointer">
          <Eye className="w-5 h-5" />
        </div>
      </ViewPassModal>
      {dataFull?.status_pase?.toLowerCase() !== "cancelado" && (
        <div
          className="cursor-pointer"
          onClick={() => onEditarClick(dataFull)}
          title="Editar Pase">
          <Edit className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Definición completa de columnas de la tabla
// ---------------------------------------------------------------------------
export const getPasesEntradaColumns = (
  handleEditar: (pase: any) => void,
): ColumnDef<any, any>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <OptionsCell onEditarClick={handleEditar} row={row} key={row.original._id} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "pase",
    header: "Nombre",
    cell: ({ row }) => <NombreCell row={row} />,
    enableSorting: false,
  },
  {
    id: "tipo",
    header: "Tipo",
    cell: ({ row }) => <TipoCell row={row} />,
    enableSorting: false,
  },
  {
    accessorKey: "visita_a",
    header: "Visita a",
    cell: ({ row }) => {
      const visitaA = row.getValue("visita_a");
      let nombre = "-";

      if (Array.isArray(visitaA) && visitaA.length > 0) {
        nombre = (visitaA[0] as any)?.nombre || "-";
      } else if (typeof visitaA === "string") {
        nombre = visitaA;
      }

      return <div>{nombre}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "autorizado_por",
    header: "Autorizado Por",
    cell: ({ row }) => <div>{row.getValue("autorizado_por")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => {
      return (
        <div className="w-full flex gap-2">
          <div className="relative group w-full break-words">
            {Array.isArray(row.original?.ubicacion) && row.original.ubicacion.length > 0
              ? row.original.ubicacion[0]
              : ""}
            {Array.isArray(row.original?.ubicacion) && row.original.ubicacion.length > 1 && (
              <span className="text-blue-600 cursor-pointer ml-1 underline relative">
                +{row.original?.ubicacion.length - 1}
                <div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg group-hover:block">
                  {Array.isArray(row.original?.ubicacion) &&
                    row.original.ubicacion.length > 1 &&
                    row.original.ubicacion
                      .slice(1)
                      .map((ubic: string, idx: number) => <div key={idx}>{ubic}</div>)}
                </div>
              </span>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "folio",
    header: "Folio",
    cell: ({ row }) => <div>{row.getValue("folio")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "fecha_desde_visita",
    header: "Fecha de inicio",
    cell: ({ row }) => {
      const fecha = row.getValue("fecha_desde_visita");
      const fechaFormateada = typeof fecha === "string" ? formatTo12Hour(fecha) : "";
      return <div>{fechaFormateada}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "fecha_desde_hasta",
    header: "Vigencia del Pase",
    cell: ({ row }) => {
      const fecha = row.getValue("fecha_desde_hasta");
      const fechaFormateada = typeof fecha === "string" ? formatTo12Hour(fecha) : "";
      return <div>{fechaFormateada}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "limite_de_acceso",
    header: "Limite de Entradas",
    cell: ({ row }) => {
      const total_entradas = row.original.total_entradas;
      const limite_entradas = row.original.limite_de_acceso ?? 1;
      return (
        <div>
          {total_entradas} / {limite_entradas}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "limitado_a_dias",
    header: "Días de acceso",
    cell: ({ row }) => {
      const dias = row.original.limitado_a_dias;

      if (!dias || dias.length === 0) {
        return <span className="text-gray-400 italic">Todos los días</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {dias.map((dia: number, index: number) => (
            <Badge
              key={index}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {dia}
            </Badge>
          ))}
        </div>
      );
    },
  },
];