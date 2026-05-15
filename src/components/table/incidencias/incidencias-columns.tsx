import { LoadingModal } from "@/components/modals/loading-modal";
import { AccionesTomadas, AfectacionPatrimonial, Depositos, PersonasInvolucradas } from "@/lib/incidencias";
import { Check, Edit, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { ColumnDef, Row, Table as TanstackTable } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import ViewImage from "@/components/modals/view-image";

export type Incidencia = {
  id: string;
  nombre: string;
  articulo: string;
  fotografia: string;
  color: string;
  categoria: string;
  fechaHallazgo: string;
  areaResguardo: string;
  reporta: string;
  fechaDevolucion: string;
  comentarios: string[];
};

export interface Incidencia_record {
  incidencia: string;
  folio: string;
  reporta_incidencia: string;
  prioridad_incidencia: string;
  area_incidencia: string;
  fecha_hora_incidencia: string;
  seguimientos_incidencia: any[];
  afectacion_patrimonial_incidencia: AfectacionPatrimonial[];
  acciones_tomadas_incidencia: AccionesTomadas[];
  personas_involucradas_incidencia: PersonasInvolucradas[];
  notificacion_incidencia: string;
  ubicacion_incidencia: string;
  comentario_incidencia: string;
  total_deposito_incidencia?: number;
  datos_deposito_incidencia: Depositos[];
  _id: string;
  evidencia_incidencia?: EvidenciaIncidencum[];
  documento_incidencia?: DocumentoIncidencum[];
  dano_incidencia?: string;
  tipo_dano_incidencia?: string[];
  grupo_seguimiento_incidencia: [];
  tags: string[];
  estatus: string;
  categoria: string;
  sub_categoria: string;
  incidente: string;
  nombre_completo_persona_extraviada: string;
  edad: string;
  color_piel: string;
  color_cabello: string;
  estatura_aproximada: string;
  descripcion_fisica_vestimenta: string;
  nombre_completo_responsable: string;
  parentesco: string;
  num_doc_identidad: string;
  telefono: string;
  info_coincide_con_videos: string;
  responsable_que_entrega: string;
  responsable_que_recibe: string;
  valor_estimado: string;
  pertenencias_sustraidas: string;
  placas: string;
  tipo: string;
  marca: string;
  modelo: string;
  color: string;
}

export interface EvidenciaIncidencum {
  file_name: string;
  file_url: string;
}

export interface DocumentoIncidencum {
  file_name: string;
  file_url: string;
}

export const OptionsCell: React.FC<{
  row: any;
  onEditarClick: (incidencia: Incidencia_record) => void;
  onSeguimientoClick: (seguimiento: Incidencia_record) => void;
  onEliminarClick: (incidencia: Incidencia_record) => void;
  onView: (incidencia: Incidencia_record) => void;
}> = ({ row, onEditarClick, onEliminarClick, onSeguimientoClick, onView }) => {
  const incidencia = row.original;
  const [showLoadingModal] = useState(false);
  return (
    <div className="flex space-x-2">
      <div className="cursor-pointer" title="Información de la Incidencia" onClick={() => onView(incidencia)}>
        <Eye className="w-5 h-5" />
      </div>
      <LoadingModal isOpen={showLoadingModal} text="Cargando..." />
      <div className="cursor-pointer" onClick={() => onEditarClick(incidencia)} title="Editar Incidencia">
        <Edit className="w-5 h-5" />
      </div>
      <div className="cursor-pointer" onClick={() => onSeguimientoClick(incidencia)} title="Seguimiento Incidencia">
        <Check className="w-5 h-5" />
      </div>
      <div className="cursor-pointer" title="Eliminar Incidencia" onClick={() => onEliminarClick(incidencia)}>
        <Trash2 className="w-5 h-5" />
      </div>
    </div>
  );
};

export const getIncidenciasColumns = (
  handleEditar: (incidencia: Incidencia_record) => void,
  handleEliminar: (incidencia: Incidencia_record) => void,
  handleSeguimiento: (incidencia: Incidencia_record) => void,
  handleVer: (incidencia: Incidencia_record) => void,
): ColumnDef<Incidencia_record>[] => [
  {
    id: "select",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <div className="flex space-x-3 items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
        <OptionsCell
          row={row}
          onEditarClick={handleEditar}
          onEliminarClick={handleEliminar}
          onSeguimientoClick={handleSeguimiento}
          onView={() => handleVer(row.original)}
        />
      </div>
    ),
    header: ({ table }: { table: TanstackTable<Incidencia_record> }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "folio",
    header: "Folio",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
        {row.getValue("folio")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "estatus",
    header: "Estatus",
    cell: ({ row }: { row: Row<Incidencia_record> }) => {
      const estatus = row.getValue("estatus") as string;
      const statusMap: Record<string, string> = {
        cerrado: "bg-green-100 text-green-600 border border-green-200",
        abierto: "bg-red-100 text-red-600 border border-red-200",
      };
      const cls = statusMap[estatus?.toLowerCase()] ?? "bg-slate-100 text-slate-600 border border-slate-200";
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${cls}`}>
          {estatus || "-"}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "area_incidencia",
    header: "Lugar del incidente",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <span className="block max-w-[150px] truncate capitalize" title={row.getValue("area_incidencia")}>
        {row.getValue("area_incidencia")}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "incidencia",
    header: "Incidencia",
    accessorFn: (row: Incidencia_record) => `${row.categoria} / ${row.sub_categoria} / ${row.incidencia}`,
    cell: ({ row }: { row: Row<Incidencia_record> }) => {
      const { categoria, sub_categoria, incidencia } = row.original;
      return (
        <span className="block max-w-[200px] truncate capitalize" title={`${categoria} / ${sub_categoria} / ${incidencia}`}>
          {`${categoria} / ${sub_categoria} / ${incidencia}`}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "comentario_incidencia",
    header: "Descripción",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <span className="block max-w-[200px] truncate" title={row.getValue("comentario_incidencia") || "-"}>
        {row.getValue("comentario_incidencia") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "evidencia_incidencia",
    header: "Evidencia",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <ViewImage imageUrl={row.original.evidencia_incidencia ?? []} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "fecha_hora_incidencia",
    header: "Fecha",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <span className="whitespace-nowrap text-xs">{row.getValue("fecha_hora_incidencia")}</span>
    ),
    enableSorting: true,
  },
  {
    id: "tags",
    header: "Tags",
    accessorFn: (row: Incidencia_record) => Array.isArray(row.tags) ? row.tags.join(", ") : "",
    cell: ({ getValue }: { getValue: () => unknown }) => {
      const value = getValue() as string;
      const tagsArray = value ? value.split(",").map(tag => tag.trim()) : [];
      return (
        <div className="flex flex-wrap gap-1">
          {tagsArray.map((tag, idx) => (
            <span key={idx} className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded capitalize">
              {tag}
            </span>
          ))}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "reporta_incidencia",
    header: "Reporta",
    cell: ({ row }: { row: Row<Incidencia_record> }) => (
      <span className="block max-w-[150px] truncate" title={row.getValue("reporta_incidencia")}>
        {row.getValue("reporta_incidencia")}
      </span>
    ),
    enableSorting: true,
  },
];