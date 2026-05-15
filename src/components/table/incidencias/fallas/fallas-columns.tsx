import {
    ColumnDef,   
  } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, Eye, Trash2 } from "lucide-react";
import ViewImage from "@/components/modals/view-image";
import { Imagen } from "@/components/upload-Image";

  export interface Fallas_record{
    falla_responsable_solucionar_nombre: string
    folio: string
    falla_documento: Imagen[]
    falla_reporta_departamento: any
    falla_estatus: string
    falla_caseta: string
    falla: string
    falla_objeto_afectado:string
    falla_responsable_solucionar_documento?: [string, any[]]
    falla_evidencia: Imagen[]
    falla_ubicacion: string
    falla_comentarios: string
    _id: string
    falla_fecha_hora: string
    falla_reporta_nombre: string
    falla_grupo_seguimiento_formated?: FallaGrupoSeguimiento[]
    falla_folio_accion_correctiva?: string
    falla_evidencia_solucion?: any[]
    falla_documento_solucion?: any[]
    falla_comentario_solucion?: string
  }

  export interface FallaGrupoSeguimiento {
    accion_correctiva: string
    comentario: string
    evidencia: Imagen[]
    documento: Imagen[]
    fecha_inicio: string
    fecha_fin: string
  }

  const OptionsCell: React.FC<{ row: any ,  onEliminarClick: (falla: Fallas_record) => void , onCerrarClick: (falla: Fallas_record) => void, onView: (falla: Fallas_record) => void}> = 
  ({ row ,onEliminarClick, onCerrarClick, onView}) => {
    const falla = row.original;
    return (
      <div className="flex space-x-2">
        <div
          className="cursor-pointer"
          title="Información de la Falla"
          onClick={() => {
            onView(falla)}}
        >
        	<Eye className="w-5 h-5" /> 
        </div>
  

       {falla?.falla_estatus !=="resuelto" ?
        <div
        className="cursor-pointer"
        title="Cerrar Falla"
        onClick={() => {
          onCerrarClick(falla)}}
        >
          <ClipboardCheck className="w-5 h-5"/>
        </div> : 
        <div
        
        title="Cerrar Falla"
        >
          <ClipboardCheck  className="text-gray-300 w-5 h-5"/>
        </div>
        }

        <div
          className="cursor-pointer w-5 h-5"
           title="Eliminar Falla"
          onClick={() => {
            onEliminarClick(falla)}}
        >
        	<Trash2 className="w-5 h-5" />
        </div>

       
     
      </div>
    );
  };

  export const getFallasColumns = (
 onEliminarClick: (falla: Fallas_record) => void, 
  onCerrarClick: (falla: Fallas_record) => void, onView:(falla:Fallas_record)=> void): ColumnDef<Fallas_record>[] => [
    {
      id: "select",
      cell: ({ row }) => {
        return (
          <>
          <div className="flex space-x-3 items-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row" />
            <OptionsCell row={row} key={row.original._id}  onEliminarClick={()=>{onEliminarClick(row.original)}}
              onCerrarClick={()=>{onCerrarClick(row.original)}} onView={()=>{onView(row.original)}}/>
          </div>
          </>
        )
      },
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {row.getValue("folio")}
        </span>
      ),
      enableSorting: true,
    },

    {
      accessorKey: "falla_estatus",
      header: "Estado",
      cell: ({ row }) => {
        const estatus = row.getValue("falla_estatus") as string;
        const statusMap: Record<string, string> = {
          abierto: "bg-red-100 text-red-600 border border-red-200",
          cerrado: "bg-green-100 text-green-600 border border-green-200",
          resuelto: "bg-green-100 text-green-600 border border-green-200",
        };
        const cls = statusMap[estatus?.toLowerCase()] ?? "bg-slate-100 text-slate-600 border border-slate-200";
        return (
          <span className={`inline-flex items-center px-2.5  rounded-full text-xs font-semibold capitalize ${cls}`}>
            {estatus || "-"}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "falla_caseta",
      header: "Lugar de la falla",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("falla_caseta")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "falla",
      header: "Falla",
      cell: ({ row }) => (
        <div className="block max-w-[150px] truncate capitalize" >{row.getValue("falla")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "falla_evidencia",
      header: "Evidencia",
      cell: ({ row }) => {
        const foto = row.original?.falla_evidencia;
        return(<ViewImage imageUrl={foto ?? []} /> )},
      enableSorting: false,
    },
    {
      accessorKey: "falla_comentarios",
      header: "Comentarios",
      cell: ({ row }) => {
        return (
          <div className="capitalize block max-w-[150px] truncate">
            {row.getValue("falla_comentarios")}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "falla_fecha_hora",
      header: "Fecha y hora",
      cell: ({ row }) => (
        <div>{row.getValue("falla_fecha_hora")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "falla_reporta_nombre",
      header: "Reporta",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("falla_reporta_nombre")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "falla_responsable_solucionar_nombre",
      header: "Responsable",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("falla_responsable_solucionar_nombre")}</div>
      ),
      enableSorting: true,
    },
  ];
  