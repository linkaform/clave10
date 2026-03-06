import {
  ColumnDef, 
} from "@tanstack/react-table";
import {  ArrowLeftRight, Eye } from "lucide-react";
import { DetalleDeLaConcesion } from "@/components/modals/concesionados-detalle-de-la-concesion";
import { Imagen } from "@/components/upload-Image";
import { DetalleDelSeguimiento } from "@/components/modals/concesionados-detalle-del-seguimiento";

export interface Articulo_con_record {
    _id:string,
    folio:string,
    ubicacion_concesion:string, 
    fecha_concesion:string,
    caseta_concesion:string,
    area_concesion:string, 
    solicita_concesion: string,
    observacion_concesion:string, 
    nombre_concesion:string,
    fecha_devolucion_concesion:string,
    status_concesion:string,
    persona_nombre_concesion:string,
    evidencia:Imagen[],
    persona_text:string,
    persona_nombre_otro:string
}


const OptionsCell: React.FC<{ row: any }> = ({ row}) => {
  const articulo = row.original;

  return (
    <><div className="flex space-x-2">
      <DetalleDeLaConcesion
        data={articulo} isSuccess={false}>
        <div className="cursor-pointer" title="Ver Artículo">
          <Eye />
        </div>
      </DetalleDeLaConcesion>

    
      <DetalleDelSeguimiento data={articulo} isSuccess={false}>
      <div><ArrowLeftRight /> </div>
      </DetalleDelSeguimiento>

    </div>
    </>
  );
};


export const conColumns: ColumnDef<Articulo_con_record>[] = [
    {
      id: "options",
      header: "Opciones",
      cell: ({ row }) => {
        
        return <OptionsCell row={row} key={row.original._id} />;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "folio",
      header: "Folio",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("folio")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status_concesion",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status_concesion") as string;
        const styles: Record<string, string> = {
          abierto:  "bg-red-100 text-red-700 border-red-300",
          parcial:  "bg-yellow-100 text-yellow-700 border-yellow-300",
          devuelto: "bg-green-100 text-green-700 border-green-300",
        };
        const style = styles[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
        return (
          <div className={`inline-flex items-center justify-center px-2 text-sm font-semibold rounded-md border capitalize ${style}`}>
            {status}
          </div>
        );
      },
      enableSorting: true,
    },   
    {
      accessorKey: "persona_nombre_concesion",
      header: "Empleado",
      cell: ({ row }) => {
        const nombreConcesion = row.getValue("persona_nombre_concesion");
        const nombreOtro = row.original.persona_nombre_otro;
        const nombre = nombreConcesion || nombreOtro || "";
        
        return (
          <div className="capitalize">{String(nombre)}</div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "caseta_concesion",
      header: "Departamento",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("caseta_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "equipos",
      header: "Equipos",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("equipos")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "fecha_concesion",
      header: "Fecha y hora de entrega",
      cell: ({ row }) => (
        <div>{row.getValue("fecha_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "fecha_devolucion_concesion",
      header: "Fecha de devolucion",
      cell: ({ row }) => (
        <div>{row.getValue("fecha_devolucion_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "entrego",
      header: "Entrego",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("entrego")}</div>
      ),
      enableSorting: true,
    },
 
  ];
  