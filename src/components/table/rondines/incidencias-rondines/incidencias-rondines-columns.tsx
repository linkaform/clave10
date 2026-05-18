import { LoadingModal } from "@/components/modals/loading-modal";
import { AccionesTomadas, AfectacionPatrimonial, Depositos, PersonasInvolucradas } from "@/lib/incidencias";
import { ColumnDef, Row, Table as TanstackTable } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useState } from "react";
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
  // campos de rondines
  nombre_del_recorrido?: string;
  subcategoria?: string;
  comentarios?: string;
  accion_tomada?: string;
  evidencias?: { file_name: string; file_url: string }[];
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
  onSeguimientoClick: (seguimiento: Incidencia_record) => void;
  onEliminarClick: (incidencia: Incidencia_record) => void;
  onView: (incidencia: Incidencia_record) => void;
}> = ({ row, onView }) => {
  const incidencia = row.original;
  const [showLoadingModal] = useState(false);
  return (
    <div className="flex space-x-2">
      <div className="cursor-pointer" title="Información de la Incidencia" onClick={() => onView(incidencia)}>
        <Eye className="w-5 h-5" />
      </div>
      <LoadingModal isOpen={showLoadingModal} text="Cargando..." />
    </div>
  );
};

export const getIncidenciasRondinesColumns = (
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
    id: "incidente",
    header: "Incidencia",
    accessorFn: (row: any) => `${row.categoria} / ${row.subcategoria} / ${row.incidente}`,
    cell: ({ row }: { row: Row<any> }) => {
      const { categoria, subcategoria, incidente } = row.original;
      return (
        <div className="capitalize text-xs">{`${categoria} / ${subcategoria} / ${incidente}`}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "nombre_del_recorrido",
    header: "Recorrido",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="block max-w-xs truncate text-xs" title={row.getValue("nombre_del_recorrido") || "-"}>
        {row.getValue("nombre_del_recorrido") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "comentarios",
    header: "Comentarios",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="block max-w-xs truncate text-xs" title={row.getValue("comentarios") || "-"}>
        {row.getValue("comentarios") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "accion_tomada",
    header: "Acción",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="block max-w-xs truncate text-xs" title={row.getValue("accion_tomada") || "-"}>
        {row.getValue("accion_tomada") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "evidencias",
    header: "Evidencia",
    cell: ({ row }: { row: Row<any> }) => {
      const foto = row.original.evidencias;
      return <ViewImage imageUrl={foto ?? []} />;
    },
    enableSorting: false,
  },
];